import { useState, useEffect } from 'react';
import { Button, Avatar, Badge, Dropdown, Popover } from 'antd';
import { RiNotification3Line, RiArrowDownSLine } from 'react-icons/ri';
import type { MenuProps } from 'antd';
import { useAuth } from '@/contexts';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { getMyNotifications, markAllNotificationsRead, type INotification } from '@/lib/actions/notification';
import { connectSocket } from '@/lib/socket';

export default function ManagerHeader() {
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
    } else if (key === 'profile') {
      navigate('/manager/settings');
    } else if (key === 'settings') {
      navigate('/manager/settings');
    }
  };

  const userMenuItems: MenuProps['items'] = [
    { key: 'profile', label: 'My Profile' },
    { key: 'settings', label: 'Settings' },
    { type: 'divider' },
    { key: 'logout', label: 'Logout', danger: true },
  ];
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 fixed top-0 left-[280px] right-0 z-10">
      <div />

      <div className="flex items-center gap-4">
        <Popover content={notifPopoverContent} trigger="click" placement="bottomRight" open={bellOpen} onOpenChange={handleBellOpenChange}>
          <Badge count={unreadCount} size="small">
            <Button
              type="text"
              icon={<RiNotification3Line size={20} className="text-gray-600" />}
              className="flex items-center justify-center"
            />
          </Badge>
        </Popover>

        <Button type="default">View Reports</Button>
        <Button type="primary" className="bg-orange-500 hover:bg-orange-600 border-orange-500">
          Create Invoice
        </Button>

        <Dropdown menu={{ items: userMenuItems, onClick: handleMenuClick }} trigger={['click']}>
          <div className="flex items-center gap-2 cursor-pointer ml-2">
            <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" size={36} />
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900 leading-tight">{user?.fullname || 'Admin User'}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role || 'Manager'}</p>
            </div>
            <RiArrowDownSLine className="w-4 h-4 text-gray-400" />
          </div>
        </Dropdown>
      </div>
    </header>
  );
}
