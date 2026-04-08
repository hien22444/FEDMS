import { useNavigate } from 'react-router-dom';
import { X, CheckCircle, AlertOctagon, LogIn, LogOut, BellOff } from 'lucide-react';
import { cn } from '@/utils';
import { ROUTES } from '@/constants';
import type { DetectionNotification } from '@/hooks/useDetectionNotifications';

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: DetectionNotification[];
  onMarkAllRead: () => void;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function NotificationPanel({
  open,
  onClose,
  notifications,
  onMarkAllRead,
}: NotificationPanelProps) {
  const navigate = useNavigate();

  const handleItemClick = () => {
    onClose();
    navigate(ROUTES.CAMERA_CHECKIN);
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
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">Notifications</h3>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.read) && (
              <button
                onClick={onMarkAllRead}
                className="text-xs text-[#FF5C00] hover:text-[#e65300] font-medium"
              >
                Mark all read
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
              const isPass = n.type === 'pass';
              const isCheckIn = n.logType === 'check_in';

              return (
                <div
                  key={n.id}
                  onClick={handleItemClick}
                  className={cn(
                    'px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors',
                    !n.read && 'bg-orange-50/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                        isPass ? 'bg-green-100' : 'bg-red-100'
                      )}
                    >
                      {isPass ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertOctagon className="w-4 h-4 text-red-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {isPass ? n.studentName || 'Student' : 'Unknown Person'}
                        </p>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatTime(n.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={cn(
                            'text-xs font-semibold px-1.5 py-0.5 rounded',
                            isPass
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          )}
                        >
                          {isPass ? 'PASS' : 'UNKNOWN'}
                        </span>
                        <span className="flex items-center gap-0.5 text-xs text-gray-400">
                          {isCheckIn ? (
                            <LogIn className="w-3 h-3" />
                          ) : (
                            <LogOut className="w-3 h-3" />
                          )}
                          {isCheckIn ? 'In' : 'Out'}
                        </span>
                        {isPass && n.studentCode && (
                          <span className="text-xs text-gray-400">{n.studentCode}</span>
                        )}
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C00] ml-auto flex-shrink-0" />
                        )}
                      </div>
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
