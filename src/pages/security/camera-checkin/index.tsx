import { useCallback, useEffect, useState } from 'react';
import {
  Video,
  CheckCircle,
  Users,
  LogIn,
  LogOut,
  AlertTriangle,
  Play,
  Square,
} from 'lucide-react';
import { message } from 'antd';
import { cn } from '@/utils';
import { useCameraFeed } from '@/hooks/useCameraFeed';
import {
  getAccessLogStats,
  getTodayAccessLogs,
  createManualLog,
} from '@/lib/actions/accessLog';
import { getCameras, startCamera, stopCamera } from '@/lib/actions/camera';
import type { IFaceRecognition } from '@/interfaces';

const CameraCheckinPage = () => {
  const feed = useCameraFeed();

  const [stats, setStats] = useState<IFaceRecognition.AccessLogStats>({
    todayCheckIns: 0,
    todayCheckOuts: 0,
    currentlyInside: 0,
  });
  const [todayLogs, setTodayLogs] = useState<IFaceRecognition.AccessLog[]>([]);
  const [cameras, setCameras] = useState<IFaceRecognition.CameraConfig[]>([]);
  const [loadingCameras, setLoadingCameras] = useState<Record<string, boolean>>({});

  // Manual override state
  const [manualName, setManualName] = useState('');
  const [manualIdCard, setManualIdCard] = useState('');
  const [manualType, setManualType] = useState<'check_in' | 'check_out'>('check_in');
  const [manualReason, setManualReason] = useState<'visitor' | 'other'>('visitor');
  const [manualLoading, setManualLoading] = useState(false);

  // ─── Load initial data ───
  const loadData = useCallback(async () => {
    try {
      const [statsData, logsData, camerasData] = await Promise.all([
        getAccessLogStats(),
        getTodayAccessLogs(),
        getCameras(),
      ]);
      if (statsData) setStats(statsData);
      if (Array.isArray(logsData)) setTodayLogs(logsData);
      if (Array.isArray(camerasData)) setCameras(camerasData);
    } catch {
      message.error('Failed to load dashboard data');
    }
  }, []);

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
    return feed.cameraStatuses[cameraId]?.status || 'offline';
  };

  const getLastDetection = (detections: IFaceRecognition.Detection[]) => {
    return detections.find((d) => d.is_match) || null;
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <Video className="w-6 h-6 text-[#FF5C00]" />
        <h1 className="text-2xl font-bold text-gray-900">
          Camera Check-In Management
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
          loading={getCheckinCamera() ? loadingCameras[getCheckinCamera()!.camera_id] : false}
          onStart={() => getCheckinCamera() && handleStartCamera(getCheckinCamera()!.camera_id)}
          onStop={() => getCheckinCamera() && handleStopCamera(getCheckinCamera()!.camera_id)}
        />

        {/* CHECK-OUT Camera */}
        <CameraPanel
          title="CHECK-OUT"
          camera={getCheckoutCamera()}
          frame={feed.checkoutFrame}
          detections={feed.checkoutDetections}
          status={getCheckoutCamera() ? getCameraStatus(getCheckoutCamera()!.camera_id) : 'offline'}
          lastDetection={getLastDetection(feed.checkoutDetections)}
          loading={getCheckoutCamera() ? loadingCameras[getCheckoutCamera()!.camera_id] : false}
          onStart={() => getCheckoutCamera() && handleStartCamera(getCheckoutCamera()!.camera_id)}
          onStop={() => getCheckoutCamera() && handleStopCamera(getCheckoutCamera()!.camera_id)}
        />
      </div>

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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5C00]"
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5C00]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={manualType}
              onChange={(e) => setManualType(e.target.value as 'check_in' | 'check_out')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5C00]"
            >
              <option value="check_in">Check In</option>
              <option value="check_out">Check Out</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <select
              value={manualReason}
              onChange={(e) => setManualReason(e.target.value as 'visitor' | 'other')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5C00]"
            >
              <option value="visitor">Visitor</option>
              <option value="other">Other</option>
            </select>
          </div>
          <button
            onClick={handleManualOverride}
            disabled={manualLoading || !manualName.trim() || !manualIdCard.trim()}
            className={cn(
              'px-6 py-2.5 rounded-lg font-semibold transition-colors',
              manualName.trim() && manualIdCard.trim()
                ? 'bg-[#FF5C00] text-white hover:bg-[#e65300]'
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
                  <td colSpan={6} className="text-center py-8 text-gray-400">
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
  loading?: boolean;
  onStart: () => void;
  onStop: () => void;
}

function CameraPanel({
  title,
  camera,
  frame,
  detections,
  status,
  lastDetection,
  loading,
  onStart,
  onStop,
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

      {/* Last Detection */}
      {lastDetection && (
        <div className="p-3 bg-green-50 rounded-lg border-2 border-green-300">
          <div className="flex items-center gap-3">
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
          </div>
        </div>
      )}
    </div>
  );
}

export default CameraCheckinPage;