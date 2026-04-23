import { useEffect, useRef, useState } from 'react';
import { connectSocket } from '@/lib/socket';
import type { IFaceRecognition } from '@/interfaces';

interface CameraFeedState {
  checkinFrame: string | null;
  checkoutFrame: string | null;
  checkinDetections: IFaceRecognition.Detection[];
  checkoutDetections: IFaceRecognition.Detection[];
  cameraStatuses: Record<string, IFaceRecognition.CameraStatusUpdate>;
  recentLogs: IFaceRecognition.AccessLog[];
}

export function useCameraFeed() {
  const [state, setState] = useState<CameraFeedState>({
    checkinFrame: null,
    checkoutFrame: null,
    checkinDetections: [],
    checkoutDetections: [],
    cameraStatuses: {},
    recentLogs: [],
  });

  const recentLogsRef = useRef<IFaceRecognition.AccessLog[]>([]);
  const listenersAttached = useRef(false);

  useEffect(() => {
    // Prevent double-attach in React Strict Mode
    if (listenersAttached.current) return;
    listenersAttached.current = true;

    const socket = connectSocket();

    socket.on('face_detection_result', (data: IFaceRecognition.FaceDetectionResult) => {
      const isCheckin = data.camera_type === 'checkin';
      setState((prev) => ({
        ...prev,
        ...(isCheckin
          ? { checkinFrame: data.frame_base64, checkinDetections: data.detections }
          : { checkoutFrame: data.frame_base64, checkoutDetections: data.detections }),
      }));
    });

    socket.on('camera_status_update', (data: IFaceRecognition.CameraStatusUpdate) => {
      setState((prev) => ({
        ...prev,
        cameraStatuses: { ...prev.cameraStatuses, [data.camera_id]: data },
      }));
    });

    socket.on('access_log_created', (data: IFaceRecognition.AccessLog) => {
      recentLogsRef.current = [data, ...recentLogsRef.current].slice(0, 50);
      setState((prev) => ({ ...prev, recentLogs: recentLogsRef.current }));
    });

    socket.on('access_log_updated', (data: { _id: string; face_snapshot_url: string }) => {
      // Patch the matching log with the new snapshot URL (emitted after Cloudinary upload)
      recentLogsRef.current = recentLogsRef.current.map((log) => {
        const rawId = (log as unknown as { _id?: string })._id;
        const matches = rawId === data._id || log.id === data._id;
        return matches ? { ...log, face_snapshot_url: data.face_snapshot_url } : log;
      });
      setState((prev) => ({ ...prev, recentLogs: recentLogsRef.current }));
    });

    // No cleanup — listeners persist for the app lifecycle
  }, []);

  return state;
}
