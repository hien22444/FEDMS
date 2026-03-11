import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Space, Button, Badge, Input, Popover, Typography, notification, theme, ConfigProvider } from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  CalendarOutlined,
  KeyOutlined,
  ThunderboltOutlined,
  CreditCardOutlined,
  FileSearchOutlined,
  AlertOutlined,
  TeamOutlined,
  QuestionCircleOutlined,
  LogoutOutlined,
  EnvironmentOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  MessageOutlined,
  BellOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { getMyNotifications, markAllNotificationsRead, type INotification } from '@/lib/actions/notification';
import { connectSocket } from '@/lib/socket';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { useAuth } from '@/contexts';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

const StudentLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();

  // Get user data from AuthContext
  const { user, profile, logout } = useAuth();

  const refreshNotifications = () => {
    getMyNotifications()
      .then((data) => { if (Array.isArray(data)) setNotifications(data); })
      .catch(() => { });
  };

  // Refetch on every page navigation so the bell count stays in sync after
  // the student marks notifications as read on the notifications page.
  useEffect(() => {
    refreshNotifications();
  }, [location.pathname]);

  // Refetch immediately when the notifications page signals a change
  // (mark-as-read, mark-all-read, delete) so the bell count updates in real-time.
  useEffect(() => {
    window.addEventListener('student:notifications:changed', refreshNotifications);
    return () => window.removeEventListener('student:notifications:changed', refreshNotifications);
  }, []);

  // ─── Real-time notification via personal socket room ──────
  // Server emits 'new_notification' to user_${id} room when a new notification
  // is created for this student (e.g. manager closes a conversation).
  useEffect(() => {
    const socket = connectSocket();

    const handleNewNotification = ({ title, message: msg }: { title: string; message: string }) => {
      // Prepend a synthetic unread notification so the bell count increments immediately
      const synthetic: INotification = {
        id: `tmp_${Date.now()}`,
        user: '',
        title,
        message: msg,
        notification_type: 'info',
        category: 'general',
        is_read: false,
        created_at: new Date().toISOString(),
      };
      setNotifications((prev) => [synthetic, ...prev]);

      // Show toast in the top-right corner
      notification.info({
        message: title,
        description: msg,
        placement: 'topRight',
        duration: 6,
      });
    };

    socket.on('new_notification', handleNewNotification);
    return () => { socket.off('new_notification', handleNewNotification); };
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Mark all as read when the bell popover opens
  const handleBellOpenChange = (open: boolean) => {
    setBellOpen(open);
    if (open && unreadCount > 0) {
      markAllNotificationsRead()
        .then(() => setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true }))))
        .catch(() => { });
    }
  };

  // ─── Notification popover content ─────────────────────────
  const notifPopoverContent = (
    <div style={{ width: 320 }}>
      <div
        style={{
          fontWeight: 600,
          borderBottom: '1px solid #f0f0f0',
          paddingBottom: 8,
          marginBottom: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>Notifications</span>
        {unreadCount > 0 && (
          <span style={{ fontSize: 12, color: token.colorPrimary, fontWeight: 400 }}>
            {unreadCount} unread
          </span>
        )}
      </div>

      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '16px 0', fontSize: 13 }}>
            No notifications
          </div>
        ) : (
          notifications.slice(0, 6).map((n) => (
            <div
              key={n.id}
              onClick={() => { navigate(ROUTES.STUDENT_NOTIFICATIONS); setBellOpen(false); }}
              style={{
                padding: '8px 4px',
                borderBottom: '1px solid #f5f5f5',
                opacity: n.is_read ? 0.55 : 1,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                }}
              >
                {!n.is_read && (
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: token.colorPrimary,
                      flexShrink: 0,
                      marginTop: 5,
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: n.is_read ? 400 : 600, fontSize: 13 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{n.message}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div
        style={{
          textAlign: 'center',
          paddingTop: 10,
          borderTop: '1px solid #f0f0f0',
          marginTop: 4,
        }}
      >
        <button
          style={{
            color: token.colorPrimary,
            fontSize: 13,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 500,
          }}
          onClick={() => navigate(ROUTES.STUDENT_NOTIFICATIONS)}
        >
          View all notifications →
        </button>
      </div>
    </div>
  );

  // ─── Sidebar menu items ────────────────────────────────────
  const menuItems = [
    { key: ROUTES.STUDENT_DASHBOARD, icon: <HomeOutlined />, label: 'Home' },
    { key: ROUTES.STUDENT_NEWS, icon: <FileTextOutlined />, label: 'News' },
    { key: ROUTES.STUDENT_SCHEDULE, icon: <CalendarOutlined />, label: 'Room Schedule' },
    { key: ROUTES.STUDENT_BOOKING, icon: <KeyOutlined />, label: 'Booking' },
    { key: ROUTES.STUDENT_UTILITIES, icon: <ThunderboltOutlined />, label: 'Utilities' },
    { key: ROUTES.STUDENT_PAYMENT, icon: <CreditCardOutlined />, label: 'Payment' },
    { key: ROUTES.STUDENT_REQUESTS, icon: <FileSearchOutlined />, label: 'Requests' },
    { key: ROUTES.STUDENT_CFD_POINTS, icon: <AlertOutlined />, label: 'CFD Points' },
    { key: ROUTES.STUDENT_DORM_RULES, icon: <TeamOutlined />, label: 'Dorm Rules' },
    { key: ROUTES.STUDENT_FAQ, icon: <QuestionCircleOutlined />, label: 'FAQ' },
    { key: ROUTES.STUDENT_CHAT, icon: <MessageOutlined />, label: 'Support Chat' },
    {
      key: ROUTES.STUDENT_NOTIFICATIONS,
      icon: (
        <Badge count={unreadCount} size="small" offset={[6, 0]}>
          <BellOutlined />
        </Badge>
      ),
      label: 'Notifications',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => { navigate(key); };
  const handleLogout = () => { logout(); };

  const displayName = profile?.full_name || profile?.student_code || user?.email?.split('@')[0] || 'Student';
  const studentCode = profile?.student_code || '';
  const behavioralScore = profile?.behavioral_score ?? 'N/A';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* ── Sidebar ── */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={240}
        style={{
          backgroundColor: '#ea580c',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          overflowY: 'hidden',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Logo / brand */}
        <div
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #c2410c',
          }}
        >
          {!collapsed ? (
            <Space>
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <EnvironmentOutlined style={{ fontSize: '24px', color: 'white' }} />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 'bold' }}>DOM</div>
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px' }}>FPT Dormitory</div>
              </div>
            </Space>
          ) : (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <EnvironmentOutlined style={{ fontSize: '24px', color: 'white' }} />
            </div>
          )}
          <Button
            type="text"
            icon={
              collapsed
                ? <MenuUnfoldOutlined style={{ color: 'white' }} />
                : <MenuFoldOutlined style={{ color: 'white' }} />
            }
            onClick={() => setCollapsed(!collapsed)}
            style={{ color: 'white' }}
          />
        </div>

        {/* Student profile */}
        <div style={{ padding: '16px', borderBottom: '1px solid #c2410c' }}>
          <Space size="middle">
            <Avatar
              size={collapsed ? 32 : 40}
              src={profile?.avatar_url}
              icon={!profile?.avatar_url && <UserOutlined />}
              style={{
                border: '2px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              }}
            />
            {!collapsed && (
              <div>
                <div style={{ color: 'white', fontWeight: 600, fontSize: '12px' }}>{displayName}</div>
                <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '11px' }}>
                  {studentCode && `${studentCode} • `}CFD: {behavioralScore}
                </div>
              </div>
            )}
          </Space>
        </div>

        {/* Menu */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <ConfigProvider
            theme={{
              components: {
                Menu: {
                  darkItemBg: 'transparent',
                  darkSubMenuItemBg: 'transparent',
                  darkItemSelectedBg: '#ffffff',
                  darkItemSelectedColor: '#ea580c',
                  darkItemColor: 'rgba(255, 255, 255, 0.95)',
                  darkItemHoverBg: 'rgba(255, 255, 255, 0.1)',
                  darkItemHoverColor: '#ffffff',
                },
              },
            }}
          >
            <Menu
              mode="inline"
              selectedKeys={[location.pathname]}
              onClick={handleMenuClick}
              style={{ backgroundColor: 'transparent', border: 'none', marginTop: '16px' }}
              theme="dark"
              items={menuItems}
            />
          </ConfigProvider>
        </div>

        {/* Logout */}
        <div
          style={{
            flexShrink: 0,
            padding: '16px',
            borderTop: '1px solid #c2410c',
          }}
        >
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            block
            style={{ color: 'rgba(255, 255, 255, 0.8)', textAlign: collapsed ? 'center' : 'left' }}
          >
            {!collapsed && 'Logout'}
          </Button>
        </div>
        </div>
      </Sider>

      {/* ── Main area ── */}
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'all 0.2s' }}>
        {/* Persistent top header */}
        <div
          style={{
            backgroundColor: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorder}`,
            padding: '0 32px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <Title level={3} style={{ margin: 0 }}>
            Student <span style={{ color: token.colorPrimary }}>Board</span>
          </Title>

          <Space size="middle">
            <Input
              placeholder="Search..."
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
            />

            <Popover
              content={notifPopoverContent}
              trigger="click"
              placement="bottomRight"
              arrow={false}
              open={bellOpen}
              onOpenChange={handleBellOpenChange}
            >
              <Badge count={unreadCount} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: '20px' }} />}
                  size="large"
                />
              </Badge>
            </Popover>

            <div
              style={{
                borderLeft: `1px solid ${token.colorBorder}`,
                paddingLeft: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <EnvironmentOutlined style={{ color: token.colorPrimary, fontSize: '18px' }} />
              <Text strong>Da Nang</Text>
            </div>
          </Space>
        </div>

        {/* Page content */}
        <Content>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default StudentLayout;
