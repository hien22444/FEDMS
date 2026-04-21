import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertOctagon, LogIn, LogOut } from 'lucide-react';
import { cn } from '@/utils';
import { ROUTES } from '@/constants';
import type { DetectionNotification } from '@/hooks/useDetectionNotifications';

interface DetectionToastProps {
  notification: DetectionNotification | null;
  onDismiss: () => void;
}

export default function DetectionToast({ notification, onDismiss }: DetectionToastProps) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      // Trigger enter animation
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [notification]);

  if (!notification) return null;

  const isPass = notification.type === 'pass';
  const isCheckIn = notification.logType === 'check_in';

  const handleClick = () => {
    onDismiss();
    navigate(ROUTES.CAMERA_MANAGEMENT);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'fixed bottom-4 right-4 z-[60] w-80 cursor-pointer rounded-xl shadow-lg border-2 p-4 transition-all duration-300',
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        isPass
          ? 'bg-green-50 border-green-300 hover:border-green-400'
          : 'bg-red-50 border-red-300 hover:border-red-400'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
            isPass ? 'bg-green-200' : 'bg-red-200'
          )}
        >
          {isPass ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertOctagon className="w-5 h-5 text-red-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {isPass ? notification.studentName || 'Student' : 'Unknown Person'}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {isPass
              ? `${notification.studentCode} | ${notification.confidence ? `${(notification.confidence * 100).toFixed(1)}%` : '—'}`
              : 'Unregistered face detected'}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg text-white text-xs font-bold',
              isPass ? 'bg-green-600' : 'bg-red-600'
            )}
          >
            {isPass ? <CheckCircle className="w-3 h-3" /> : <AlertOctagon className="w-3 h-3" />}
            {isPass ? 'PASS' : 'UNKNOWN'}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            {isCheckIn ? <LogIn className="w-3 h-3" /> : <LogOut className="w-3 h-3" />}
            {isCheckIn ? 'Check In' : 'Check Out'}
          </div>
        </div>
      </div>
    </div>
  );
}
