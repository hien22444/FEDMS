import { useNavigate } from 'react-router-dom';
import {
  X,
  CheckCircle,
  AlertOctagon,
  AlertTriangle,
  Info,
  BellOff,
  Check,
  Trash2,
} from 'lucide-react';
import { cn } from '@/utils';
import { ROUTES } from '@/constants';
import type { INotification } from '@/lib/actions/notification';

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: INotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllRead: () => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

function formatTime(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleString([], {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function iconFor(type: INotification['notification_type']) {
  switch (type) {
    case 'success':
      return { Icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' };
    case 'warning':
      return { Icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' };
    case 'error':
      return { Icon: AlertOctagon, color: 'text-red-600', bg: 'bg-red-100' };
    default:
      return { Icon: Info, color: 'text-blue-600', bg: 'bg-blue-100' };
  }
}

export default function NotificationPanel({
  open,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllRead,
  onRemove,
  onClearAll,
}: NotificationPanelProps) {
  const navigate = useNavigate();
  const hasUnread = notifications.some((n) => !n.is_read);

  const handleItemClick = (n: INotification) => {
    if (!n.is_read) onMarkAsRead(n.id);
    if (n.category === 'access') {
      onClose();
      navigate(ROUTES.CAMERA_MANAGEMENT);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-[55] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-[56] transition-transform duration-300 flex flex-col',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">Notifications</h3>
          <div className="flex items-center gap-2">
            {hasUnread && (
              <button
                onClick={onMarkAllRead}
                className="text-xs text-[#FF5C00] hover:text-[#e65300] font-medium"
              >
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-gray-500 hover:text-red-600 font-medium"
                title="Clear all"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <BellOff className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => {
              const { Icon, color, bg } = iconFor(n.notification_type);
              return (
                <div
                  key={n.id}
                  className={cn(
                    'group px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors',
                    !n.is_read && 'bg-orange-50/50',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                        bg,
                      )}
                    >
                      <Icon className={cn('w-4 h-4', color)} />
                    </div>

                    <div
                      onClick={() => handleItemClick(n)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {n.title}
                        </p>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatTime(n.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      {!n.is_read && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF5C00] mt-1" />
                      )}
                    </div>

                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.is_read && (
                        <button
                          onClick={() => onMarkAsRead(n.id)}
                          className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-green-600"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onRemove(n.id)}
                        className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-red-600"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
