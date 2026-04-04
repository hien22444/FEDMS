import { useState, useEffect } from 'react';
import { Button, Badge, Popover, Avatar, Dropdown } from 'antd';
import { RiNotification3Line, RiMenuLine, RiArrowDownSLine } from 'react-icons/ri';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { ROUTES } from '@/constants';
import { getMyNotifications, markAllNotificationsRead, type INotification } from '@/lib/actions/notification';
import { connectSocket } from '@/lib/socket';

type ManagerHeaderProps = {
  isDesktop?: boolean;
  onToggleSidebar?: () => void;
};

export default function ManagerHeader({
  isDesktop = false,
  onToggleSidebar,
}: ManagerHeaderProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [bellOpen, setBellOpen] = useState(false);

  // Fetch initial notifications
  useEffect(() => {
    getMyNotifications()
      .then((data) => { if (Array.isArray(data)) setNotifications(data); })
      .catch(() => {});
  }, []);

  // Connect socket and listen for real-time notifications from BE
  // (e.g. student starts a conversation or sends a message to my assigned conv)
  useEffect(() => {
    const socket = connectSocket();
    const handler = (payload: { title: string; message: string }) => {
      setNotifications((prev) => [
        {
          id: `rt_${Date.now()}`,
          user: '',
          title: payload.title,
          message: payload.message,
          notification_type: 'info',
          category: 'chat',
          is_read: false,
          created_at: new Date().toISOString(),
        } as INotification,
        ...prev,
      ]);
    };
    socket.on('new_notification', handler);
    return () => {
      socket.off('new_notification', handler);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Mark all as read when the bell popover opens
  const handleBellOpenChange = (open: boolean) => {
    setBellOpen(open);
    if (open && unreadCount > 0) {
      markAllNotificationsRead()
        .then(() => setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true }))))
        .catch(() => {});
    }
  };

  const notifPopoverContent = (
    <div style={{ width: 320 }}>
      <div style={{ fontWeight: 600, borderBottom: '1px solid #f0f0f0', paddingBottom: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Notifications</span>
        {unreadCount > 0 && <span style={{ fontSize: 12, color: '#f97316', fontWeight: 400 }}>({unreadCount} unread)</span>}
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: '#999', fontSize: 13 }}>No notifications</div>
        ) : (
          notifications.slice(0, 8).map((n) => (
            <div
              key={n.id}
              onClick={() => { navigate('/manager/notifications'); setBellOpen(false); }}
              style={{
                padding: '8px 4px',
                borderBottom: '1px solid #f5f5f5',
                opacity: n.is_read ? 0.55 : 1,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6,
              }}
            >
              {!n.is_read && (
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f97316', flexShrink: 0, marginTop: 5 }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: n.is_read ? 400 : 600, fontSize: 13 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{n.message}</div>
              </div>
            </div>
          ))
        )}
      </div>
      <div style={{ textAlign: 'center', paddingTop: 10, borderTop: '1px solid #f0f0f0', marginTop: 4 }}>
        <button
          style={{ color: '#f97316', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
          onClick={() => { navigate('/manager/notifications'); setBellOpen(false); }}
        >
          View all notifications →
        </button>
      </div>
    </div>
  );

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      logout();
      navigate(ROUTES.LANDING);
      return;
    }

    navigate('/manager/settings');
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', label: 'My Profile' },
    { key: 'settings', label: 'Settings' },
    { type: 'divider' },
    { key: 'logout', label: 'Logout', danger: true },
  ];

  return (
    <header className="fixed left-0 right-0 top-0 z-20 flex h-16 items-center justify-between bg-white px-4 sm:px-6 lg:left-[280px]">
      <div className="flex min-w-0 items-center">
        {!isDesktop && (
          <Button
            type="text"
            icon={<RiMenuLine size={20} className="text-gray-700" />}
            onClick={onToggleSidebar}
            className="flex items-center justify-center lg:hidden"
          />
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Popover content={notifPopoverContent} trigger="click" placement="bottomRight" open={bellOpen} onOpenChange={handleBellOpenChange}>
          <Badge count={unreadCount} size="small">
            <Button
              type="text"
              icon={<RiNotification3Line size={20} className="text-gray-600" />}
              className="flex items-center justify-center"
            />
          </Badge>
        </Popover>

        <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} trigger={['click']}>
          <div className="ml-1 flex cursor-pointer items-center gap-2 rounded-xl px-1 py-1 transition hover:bg-gray-50 sm:ml-2">
            <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" size={36} />
            <div className="hidden md:block">
              <p className="text-sm font-medium leading-tight text-gray-900">{user?.fullname || 'Admin User'}</p>
              <p className="text-xs capitalize text-gray-500">{user?.role || 'Manager'}</p>
            </div>
            <RiArrowDownSLine className="h-4 w-4 text-gray-400" />
          </div>
        </Dropdown>
      </div>
    </header>
  );
}
