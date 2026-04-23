import { useCallback, useEffect, useState } from 'react';
import {
  Video,
  CheckCircle,
  Users,
  LogIn,
  LogOut,
  AlertTriangle,
  AlertOctagon,
  Edit3,
  Play,
  Square,
  RotateCcw,
} from 'lucide-react';
import { message, Modal } from 'antd';
import { cn } from '@/utils';
import { useAuth, useSecurityAdminAccess } from '@/contexts';
import { useCameraFeed } from '@/hooks/useCameraFeed';
import {
  getAccessLogStats,
  getTodayAccessLogs,
  createManualLog,
} from '@/lib/actions/accessLog';
import {
  getCameras,
  startCamera,
  stopCamera,
  getCameraStatus as fetchCameraStatus,
  updateCameraSource,
  resetCameraSource,
} from '@/lib/actions/camera';
import type { IFaceRecognition } from '@/interfaces';

const CameraManagementPage = () => {
  const { user } = useAuth();
  const {
    isAdminAccessGranted,
    adminAccessToken,
  } = useSecurityAdminAccess();
  const isAdmin = user?.role === 'admin';
  const canManageSources = isAdmin || isAdminAccessGranted;
  const sourceAuthToken = user?.role === 'security' ? adminAccessToken || undefined : undefined;
  const feed = useCameraFeed();

  const [stats, setStats] = useState<IFaceRecognition.AccessLogStats>({
    todayCheckIns: 0,
    todayCheckOuts: 0,
    currentlyInside: 0,
  });
  const [todayLogs, setTodayLogs] = useState<IFaceRecognition.AccessLog[]>([]);
  const [cameras, setCameras] = useState<IFaceRecognition.CameraConfig[]>([]);
  const [loadingCameras, setLoadingCameras] = useState<Record<string, boolean>>({});
  const [initialStatuses, setInitialStatuses] = useState<Record<string, string>>({});
  const [sourceEditorOpen, setSourceEditorOpen] = useState(false);
  const [sourceEditorCamera, setSourceEditorCamera] = useState<IFaceRecognition.CameraConfig | null>(
    null
  );
  const [sourceEditorType, setSourceEditorType] = useState<'webcam' | 'rtsp'>('webcam');
  const [sourceEditorUrl, setSourceEditorUrl] = useState('');
  const [sourceEditorLoading, setSourceEditorLoading] = useState(false);

  // Manual override state
  const [manualName, setManualName] = useState('');
  const [manualIdCard, setManualIdCard] = useState('');
  const [manualType, setManualType] = useState<'check_in' | 'check_out'>('check_in');
  const [manualReason, setManualReason] = useState<'camera_failed' | 'other'>('camera_failed');
  const [manualLoading, setManualLoading] = useState(false);

  // ─── Load initial data ───
  const syncCameraStatuses = useCallback(async (camerasData: IFaceRecognition.CameraConfig[]) => {
    const statusEntries = await Promise.all(
      camerasData.map(async (cam) => {
        try {
          const s = await fetchCameraStatus(cam.camera_id);
          return [cam.camera_id, s?.status || 'offline'] as const;
        } catch {
          return [cam.camera_id, 'offline'] as const;
        }
      })
    );
    setInitialStatuses(Object.fromEntries(statusEntries));
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [statsData, logsData, camerasData] = await Promise.all([
        getAccessLogStats(),
        getTodayAccessLogs(),
        getCameras(),
      ]);
      if (statsData) setStats(statsData);
      if (Array.isArray(logsData)) setTodayLogs(logsData);
      if (Array.isArray(camerasData)) {
        setCameras(camerasData);
        await syncCameraStatuses(camerasData);
      }
    } catch {
      message.error('Failed to load dashboard data');
    }
  }, [syncCameraStatuses]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Merge socket logs with initial logs, deduplicating by id
  const allLogs = (() => {
    const seen = new Set<string>();
    const merged: IFaceRecognition.AccessLog[] = [];
    for (const log of [...feed.recentLogs, ...todayLogs]) {
      if (log.id && seen.has(log.id)) continue;
      if (log.id) seen.add(log.id);
      merged.push(log);
      if (merged.length >= 50) break;
    }
    return merged;
  })();

  // ─── Camera controls ───
  const handleStartCamera = async (cameraId: string) => {
    setLoadingCameras((prev) => ({ ...prev, [cameraId]: true }));
    try {
      await startCamera(cameraId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message || 'Failed to start camera';
      message.error(msg);
    } finally {
      setLoadingCameras((prev) => ({ ...prev, [cameraId]: false }));
    }
  };

  const handleStopCamera = async (cameraId: string) => {
    setLoadingCameras((prev) => ({ ...prev, [cameraId]: true }));
    try {
      await stopCamera(cameraId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message || 'Failed to stop camera';
      message.error(msg);
    } finally {
      setLoadingCameras((prev) => ({ ...prev, [cameraId]: false }));
    }
  };

  // ─── Source management ───
  const openSourceEditor = (camera: IFaceRecognition.CameraConfig) => {
    if (!canManageSources) return;
    setSourceEditorCamera(camera);
    setSourceEditorType(camera.source_type);
    setSourceEditorUrl(camera.source_type === 'rtsp' ? camera.source_url : '');
    setSourceEditorOpen(true);
  };

  const closeSourceEditor = () => {
    setSourceEditorOpen(false);
    setSourceEditorCamera(null);
    setSourceEditorType('webcam');
    setSourceEditorUrl('');
    setSourceEditorLoading(false);
  };

  const refreshCameraState = async () => {
    const camerasData = await getCameras();
    if (Array.isArray(camerasData)) {
      setCameras(camerasData);
      await syncCameraStatuses(camerasData);
    }
  };

  const upsertCameraState = useCallback(
    (updatedCamera: IFaceRecognition.CameraConfig) => {
      setCameras((prev) => {
        const exists = prev.some((camera) => camera.camera_id === updatedCamera.camera_id);
        if (!exists) {
          return [...prev, updatedCamera];
        }
        return prev.map((camera) =>
          camera.camera_id === updatedCamera.camera_id ? updatedCamera : camera
        );
      });
    },
    []
  );

  const handleSaveSource = async () => {
    if (!sourceEditorCamera || !canManageSources) return;

    const sourceUrl = sourceEditorType === 'webcam' ? '0' : sourceEditorUrl.trim();
    if (sourceEditorType === 'rtsp' && !sourceUrl) {
      message.error('RTSP URL is required');
      return;
    }

    setSourceEditorLoading(true);
    try {
      const updatedCamera = await updateCameraSource(sourceEditorCamera.camera_id, {
        source_type: sourceEditorType,
        source_url: sourceUrl,
      }, sourceAuthToken);
      upsertCameraState(updatedCamera);
      setSourceEditorCamera(updatedCamera);
      await refreshCameraState();
      message.success('Camera source updated');
      closeSourceEditor();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : (err as { message?: string })?.message || 'Failed to update camera source';
      message.error(msg);
    } finally {
      setSourceEditorLoading(false);
    }
  };

  const handleResetSource = async () => {
    if (!sourceEditorCamera || !canManageSources) return;

    setSourceEditorLoading(true);
    try {
      const updatedCamera = await resetCameraSource(sourceEditorCamera.camera_id, sourceAuthToken);
      upsertCameraState(updatedCamera);
      setSourceEditorCamera(updatedCamera);
      await refreshCameraState();
      message.success('Camera source reset to webcam');
      closeSourceEditor();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : (err as { message?: string })?.message || 'Failed to reset camera source';
      message.error(msg);
    } finally {
      setSourceEditorLoading(false);
    }
  };

  // ─── Manual override ───
  const handleManualOverride = async () => {
    if (!manualName.trim() || !manualIdCard.trim()) return;
    setManualLoading(true);
    try {
      await createManualLog({
        name: manualName,
        idCard: manualIdCard,
        type: manualType,
        reason: manualReason,
      });
      message.success('Manual override recorded');
      setManualName('');
      setManualIdCard('');
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message || 'Failed to create manual override';
      message.error(msg);
    } finally {
      setManualLoading(false);
    }
  };

  // ─── Helpers ───
  const getCheckinCamera = () => cameras.find((c) => c.type === 'checkin');
  const getCheckoutCamera = () => cameras.find((c) => c.type === 'checkout');

  const getCameraStatus = (cameraId: string) => {
    // Socket events take priority, then initial poll, then default offline
    return feed.cameraStatuses[cameraId]?.status || initialStatuses[cameraId] || 'offline';
  };

  const getLastDetection = (detections: IFaceRecognition.Detection[]) => {
    return detections.find((d) => d.is_match && !d.status_unchanged) || null;
  };

  const getUnchangedDetection = (detections: IFaceRecognition.Detection[]) => {
    return detections.find((d) => d.is_match && d.status_unchanged) || null;
  };

  const hasUnknownFace = (detections: IFaceRecognition.Detection[]) => {
    return detections.some((d) => !d.is_match && d.det_score > 0);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <Video className="w-6 h-6 text-[#F36F21]" />
        <h1 className="text-2xl font-bold text-gray-900">
          Camera Management
        </h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl p-6 border-2 bg-green-50 border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <LogIn className="w-5 h-5 text-green-600" />
            <p className="text-3xl font-bold text-green-600">{stats.todayCheckIns}</p>
          </div>
          <p className="text-sm text-gray-600">Today Check-ins</p>
        </div>
        <div className="rounded-xl p-6 border-2 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <LogOut className="w-5 h-5 text-blue-600" />
            <p className="text-3xl font-bold text-blue-600">{stats.todayCheckOuts}</p>
          </div>
          <p className="text-sm text-gray-600">Today Check-outs</p>
        </div>
        <div className="rounded-xl p-6 border-2 bg-orange-50 border-orange-200">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-orange-600" />
            <p className="text-3xl font-bold text-orange-600">{stats.currentlyInside}</p>
          </div>
          <p className="text-sm text-gray-600">Currently Inside</p>
        </div>
        <div className="rounded-xl p-6 border-2 bg-purple-50 border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <Video className="w-5 h-5 text-purple-600" />
            <p className="text-3xl font-bold text-purple-600">{cameras.length}</p>
          </div>
          <p className="text-sm text-gray-600">Cameras</p>
        </div>
      </div>

      {/* Camera Feeds - Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHECK-IN Camera */}
        <CameraPanel
          title="CHECK-IN"
          camera={getCheckinCamera()}
          frame={feed.checkinFrame}
          detections={feed.checkinDetections}
          status={getCheckinCamera() ? getCameraStatus(getCheckinCamera()!.camera_id) : 'offline'}
          lastDetection={getLastDetection(feed.checkinDetections)}
          unchangedDetection={getUnchangedDetection(feed.checkinDetections)}
          hasUnknown={hasUnknownFace(feed.checkinDetections)}
          loading={getCheckinCamera() ? loadingCameras[getCheckinCamera()!.camera_id] : false}
          onStart={() => getCheckinCamera() && handleStartCamera(getCheckinCamera()!.camera_id)}
          onStop={() => getCheckinCamera() && handleStopCamera(getCheckinCamera()!.camera_id)}
          canEditSource={canManageSources}
          onManageSource={() => getCheckinCamera() && openSourceEditor(getCheckinCamera()!)}
        />

        {/* CHECK-OUT Camera */}
        <CameraPanel
          title="CHECK-OUT"
          camera={getCheckoutCamera()}
          frame={feed.checkoutFrame}
          detections={feed.checkoutDetections}
          status={getCheckoutCamera() ? getCameraStatus(getCheckoutCamera()!.camera_id) : 'offline'}
          lastDetection={getLastDetection(feed.checkoutDetections)}
          unchangedDetection={getUnchangedDetection(feed.checkoutDetections)}
          hasUnknown={hasUnknownFace(feed.checkoutDetections)}
          loading={getCheckoutCamera() ? loadingCameras[getCheckoutCamera()!.camera_id] : false}
          onStart={() => getCheckoutCamera() && handleStartCamera(getCheckoutCamera()!.camera_id)}
          onStop={() => getCheckoutCamera() && handleStopCamera(getCheckoutCamera()!.camera_id)}
          canEditSource={canManageSources}
          onManageSource={() => getCheckoutCamera() && openSourceEditor(getCheckoutCamera()!)}
        />
      </div>

      <Modal
        open={sourceEditorOpen}
        onCancel={closeSourceEditor}
        footer={null}
        destroyOnClose
        centered
        title={sourceEditorCamera ? `Manage Camera Source - ${sourceEditorCamera.name}` : 'Manage Camera Source'}
      >
        {sourceEditorCamera && (
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-500">Camera</span>
                <span className="font-medium text-gray-900">{sourceEditorCamera.camera_id}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <span className="text-gray-500">Current type</span>
                <span className="font-medium text-gray-900">
                  {sourceEditorCamera.source_type === 'rtsp' ? 'IP Camera (RTSP)' : 'Webcam (Built-in)'}
                </span>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Source Type</label>
              <select
                value={sourceEditorType}
                onChange={(e) => {
                  const nextType = e.target.value as 'webcam' | 'rtsp';
                  setSourceEditorType(nextType);
                  if (nextType === 'webcam') {
                    setSourceEditorUrl('');
                  }
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#FF5C00]"
              >
                <option value="webcam">Webcam (Built-in)</option>
                <option value="rtsp">IP Camera (RTSP)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                RTSP URL
              </label>
              <input
                type="text"
                value={sourceEditorType === 'rtsp' ? sourceEditorUrl : '0'}
                onChange={(e) => setSourceEditorUrl(e.target.value)}
                disabled={sourceEditorType === 'webcam'}
                placeholder="rtsp://user:password@camera-ip:554/..."
                className={cn(
                  'w-full rounded-lg border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#FF5C00]',
                  sourceEditorType === 'webcam'
                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300'
                )}
              />
              <p className="mt-1 text-xs text-gray-400">
                Saving an active camera will stop the current FaceService session first.
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeSourceEditor}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              {sourceEditorCamera.source_type === 'rtsp' && (
                <button
                  type="button"
                  onClick={handleResetSource}
                  disabled={sourceEditorLoading}
                  className="inline-flex items-center gap-2 rounded-lg border border-orange-200 px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset to Webcam
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveSource}
                disabled={sourceEditorLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-[#FF5C00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e65300] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Edit3 className="w-4 h-4" />
                {sourceEditorLoading ? 'Saving...' : 'Save Source'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Manual Override (moved above Recent Activity) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <h2 className="text-xl font-bold text-gray-900">Manual Override</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Full name"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F36F21]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Card <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="ID card number"
              value={manualIdCard}
              onChange={(e) => setManualIdCard(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F36F21]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={manualType}
              onChange={(e) => setManualType(e.target.value as 'check_in' | 'check_out')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F36F21]"
            >
              <option value="check_in">Check In</option>
              <option value="check_out">Check Out</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <select
              value={manualReason}
              onChange={(e) => setManualReason(e.target.value as 'camera_failed' | 'other')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F36F21]"
            >
              <option value="camera_failed">Camera Failed</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button
            onClick={handleManualOverride}
            disabled={manualLoading || !manualName.trim() || !manualIdCard.trim()}
            className={cn(
              'px-6 py-2.5 rounded-lg font-semibold transition-colors',
              manualName.trim() && manualIdCard.trim()
                ? 'bg-[#F36F21] text-white hover:bg-[#D85F19]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            {manualLoading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-gray-500">Time</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">Snapshot</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">Code / ID</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">Method</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {allLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    No activity yet today
                  </td>
                </tr>
              ) : (
                allLogs.map((log, i) => (
                  <tr key={log.id || i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-2">
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2 px-2">
                      {log.face_snapshot_url ? (
                        <a href={log.face_snapshot_url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={log.face_snapshot_url}
                            alt="snapshot"
                            className="w-12 h-9 object-cover rounded border border-gray-200 hover:opacity-80 transition-opacity"
                          />
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-2 font-medium">
                      {log.student?.full_name || log.visitor_name || 'Unknown'}
                    </td>
                    <td className="py-3 px-2 text-gray-500">
                      {log.student?.student_code || log.id_card || '—'}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          log.type === 'check_in'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        )}
                      >
                        {log.type === 'check_in' ? 'Check In' : 'Check Out'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          log.method === 'face_recognition'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-orange-100 text-orange-700'
                        )}
                      >
                        {log.method === 'face_recognition' ? 'Face' : 'Manual'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {log.confidence ? `${(log.confidence * 100).toFixed(0)}%` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Camera Panel Component ───

interface CameraPanelProps {
  title: string;
  camera?: IFaceRecognition.CameraConfig;
  frame: string | null;
  detections: IFaceRecognition.Detection[];
  status: string;
  lastDetection: IFaceRecognition.Detection | null;
  unchangedDetection: IFaceRecognition.Detection | null;
  hasUnknown: boolean;
  loading?: boolean;
  onStart: () => void;
  onStop: () => void;
  canEditSource: boolean;
  onManageSource: () => void;
}

function CameraPanel({
  title,
  camera,
  frame,
  detections,
  status,
  lastDetection,
  unchangedDetection,
  hasUnknown,
  loading,
  onStart,
  onStop,
  canEditSource,
  onManageSource,
}: CameraPanelProps) {
  const isActive = status === 'active';

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-sm border-2 p-4',
        isActive ? 'border-green-200' : 'border-gray-200'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900">Camera: {title}</h3>
        <div className="flex items-center gap-2">
          {camera && canEditSource && (
            <button
              type="button"
              onClick={onManageSource}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-[#FF5C00] hover:text-[#FF5C00] transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Manage Source
            </button>
          )}
          <div
            className={cn(
              'w-2.5 h-2.5 rounded-full',
              isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            )}
          />
          <span className={cn('text-sm font-medium', isActive ? 'text-green-600' : 'text-gray-500')}>
            {isActive ? 'Active' : 'Offline'}
          </span>
        </div>
      </div>

      {camera && (
        <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-gray-500">Current source</span>
            <span className="font-semibold text-gray-800">
              {camera.source_type === 'rtsp' ? 'IP Camera (RTSP)' : 'Webcam (Built-in)'}
            </span>
          </div>
          {camera.source_type === 'rtsp' && (
            <div className="mt-1 break-all font-mono text-[11px] text-gray-500">
              {camera.source_url}
            </div>
          )}
        </div>
      )}

      {/* Video Feed */}
      <div className="bg-gray-900 rounded-lg overflow-hidden aspect-[16/10] mb-3 relative">
        {frame ? (
          <img
            src={`data:image/jpeg;base64,${frame}`}
            alt={`${title} feed`}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {camera ? 'Camera not started' : 'No camera configured'}
              </p>
            </div>
          </div>
        )}
        {/* Detection count overlay */}
        {isActive && detections.length > 0 && (
          <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
            {detections.length} face(s)
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-3">
        {camera ? (
          isActive ? (
            <button
              onClick={onStop}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          ) : (
            <button
              onClick={onStart}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
            >
              <Play className="w-4 h-4" />
              Start
            </button>
          )
        ) : (
          <p className="text-sm text-gray-400">
            Configure a {title.toLowerCase()} camera in admin settings
          </p>
        )}
      </div>

      {/* Detection Result — always rendered as placeholder to prevent layout shift */}
      <div
        className={cn(
          'p-3 rounded-lg border-2 transition-colors',
          lastDetection
            ? 'bg-green-50 border-green-300'
            : unchangedDetection
              ? 'bg-yellow-50 border-yellow-300'
              : hasUnknown
                ? 'bg-red-50 border-red-300'
                : 'bg-gray-50 border-gray-200'
        )}
      >
        <div className="flex items-center gap-3">
          {lastDetection ? (
            <>
              {lastDetection.avatar_url ? (
                <img
                  src={lastDetection.avatar_url}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{lastDetection.student_name}</p>
                <p className="text-sm text-gray-500">
                  {lastDetection.student_code} |{' '}
                  {lastDetection.confidence
                    ? `${(lastDetection.confidence * 100).toFixed(1)}%`
                    : '—'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-bold tracking-wide">PASS</span>
              </div>
            </>
          ) : unchangedDetection ? (
            <>
              {unchangedDetection.avatar_url ? (
                <img
                  src={unchangedDetection.avatar_url}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-yellow-200 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-900">{unchangedDetection.student_name}</p>
                <p className="text-sm text-gray-500">{unchangedDetection.student_code}</p>
              </div>
              <div className="flex items-center gap-1.5 bg-yellow-500 text-white px-3 py-1.5 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-bold tracking-wide">
                  Already {title === 'CHECK-IN' ? 'Checked-In' : 'Checked-Out'}
                </span>
              </div>
            </>
          ) : hasUnknown ? (
            <>
              <div className="w-10 h-10 rounded-full bg-red-200 flex items-center justify-center">
                <AlertOctagon className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Unknown Person</p>
                <p className="text-sm text-gray-500">Unregistered face detected</p>
              </div>
              <div className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg">
                <AlertOctagon className="w-4 h-4" />
                <span className="text-sm font-bold tracking-wide">UNKNOWN</span>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <Video className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-400">No detection</p>
                <p className="text-sm text-gray-300">Waiting for face recognition...</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CameraManagementPage;
