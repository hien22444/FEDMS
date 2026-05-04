import { useCallback, useEffect, useRef, useState } from 'react';
import { connectSocket } from '@/lib/socket';
import { useAuth } from '@/contexts';
import {
  clearAllNotifications,
  deleteNotification as apiDelete,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationAsRead,
  type INotification,
} from '@/lib/actions/notification';

export function useSecurityNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(false);
  const listenersAttached = useRef(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyNotifications();
      if (data) setNotifications(data);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (!user?.id) return;
    refresh();
  }, [user?.id, refresh]);

  // Live socket updates
  useEffect(() => {
    if (!user?.id || listenersAttached.current) return;
    listenersAttached.current = true;

    const socket = connectSocket();
    socket.on('notification_created', (notif: INotification) => {
      // Each security/admin user receives one row; backend emits one event per row
      // to the security_cameras room. Filter so each user only sees their own.
      if (notif.user !== user.id) return;
      setNotifications((prev) => [notif, ...prev].slice(0, 50));
    });

    return () => {
      // Listeners persist for app lifecycle; do not detach.
    };
  }, [user?.id]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    try {
      await markNotificationAsRead(id);
    } catch {
      refresh();
    }
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await markAllNotificationsRead();
    } catch {
      refresh();
    }
  }, [refresh]);

  const removeOne = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await apiDelete(id);
    } catch {
      refresh();
    }
  }, [refresh]);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    try {
      await clearAllNotifications();
    } catch {
      refresh();
    }
  }, [refresh]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    loading,
    refresh,
    markAsRead,
    markAllRead,
    removeOne,
    clearAll,
  };
}
