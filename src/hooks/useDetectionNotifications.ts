import { useEffect, useRef, useState, useCallback } from 'react';
import { connectSocket } from '@/lib/socket';
import type { IFaceRecognition } from '@/interfaces';

export interface DetectionNotification {
  id: string;
  type: 'pass' | 'unknown';
  studentName?: string;
  studentCode?: string;
  confidence?: number;
  cameraType: 'checkin' | 'checkout';
  logType: 'check_in' | 'check_out';
  timestamp: number;
  read: boolean;
}

const MAX_NOTIFICATIONS = 100;
const TOAST_DURATION_MS = 30000;

export function useDetectionNotifications() {
  const [notifications, setNotifications] = useState<
    DetectionNotification[]
  >([]);
  const [activeToast, setActiveToast] =
    useState<DetectionNotification | null>(null);
  const listenersAttached = useRef(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    if (listenersAttached.current) return;
    listenersAttached.current = true;

    const socket = connectSocket();

    socket.on(
      'access_log_created',
      (log: IFaceRecognition.AccessLog) => {
        // Only notify for face_recognition logs (not manual overrides)
        if (log.method !== 'face_recognition') return;

        const isPass = !!log.student;
        const notification: DetectionNotification = {
          id: log.id || `notif-${Date.now()}`,
          type: isPass ? 'pass' : 'unknown',
          studentName: log.student?.full_name,
          studentCode: log.student?.student_code,
          confidence: log.confidence,
          cameraType: log.camera_id?.includes('checkout')
            ? 'checkout'
            : 'checkin',
          logType: log.type,
          timestamp: new Date(log.createdAt).getTime(),
          read: false,
        };

        setNotifications(prev =>
          [notification, ...prev].slice(0, MAX_NOTIFICATIONS),
        );
        setActiveToast(notification);
      },
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-dismiss toast after duration
  useEffect(() => {
    if (!activeToast) return;

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    toastTimerRef.current = setTimeout(() => {
      setActiveToast(null);
      toastTimerRef.current = null;
    }, TOAST_DURATION_MS);

    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [activeToast]);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    activeToast,
    unreadCount,
    dismissToast,
    markAllRead,
  };
}
