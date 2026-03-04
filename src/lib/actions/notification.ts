import { api } from '../apiRequest';

export interface INotification {
  id: string;
  user: string;
  title: string;
  message: string;
  notification_type: 'info' | 'warning' | 'error' | 'success';
  category: 'payment' | 'booking' | 'maintenance' | 'violation' | 'visitor' | 'equipment' | 'general';
  is_read: boolean;
  related_id?: string;
  created_at: string;
}

export const getMyNotifications = async () => {
  return api.get<INotification[]>('notifications');
};

export const markNotificationAsRead = async (id: string) => {
  return api.patch<INotification>(`notifications/${id}/read`, {});
};

export const markAllNotificationsRead = async () => {
  return api.patch<{ message: string }>('notifications/read-all', {});
};

export const deleteNotification = async (id: string) => {
  return api.delete<{ message: string }>(`notifications/${id}`);
};
