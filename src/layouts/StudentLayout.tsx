import { useEffect, useMemo, useState } from 'react';
import {
  Layout,
  Menu,
  Avatar,
  Space,
  Button,
  Badge,
  Popover,
  Typography,
  notification,
  theme,
  ConfigProvider,
  Drawer,
} from 'antd';
import {
  HomeOutlined,
  FileTextOutlined,
  CalendarOutlined,
  KeyOutlined,
  ThunderboltOutlined,
  CreditCardOutlined,
  FileSearchOutlined,
  AlertOutlined,
  LogoutOutlined,
  EnvironmentOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  MessageOutlined,
  BellOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getMyNotifications, markAllNotificationsRead, type INotification } from '@/lib/actions/notification';
import { ROUTES } from '@/constants';
import { useAuth } from '@/contexts';
import { connectSocket } from '@/lib/socket';
import { useWindowSize } from '@/hooks/useWindowSize';
import { brandPalette } from '@/themes/brandPalette';
import { Agent } from '@/components/agent/Agent';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;
const studentSidebarBg = brandPalette.primary;
const studentSidebarBorder = brandPalette.primaryDark;
const studentSidebarAccent = 'rgba(255, 255, 255, 0.2)';

const StudentLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = theme.useToken();
  const { width } = useWindowSize();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768;

  const { user, profile, logout } = useAuth();

  const refreshNotifications = () => {
    getMyNotifications()
      .then((data) => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshNotifications();
  }, [location.pathname]);

  useEffect(() => {
    window.addEventListener('student:notifications:changed', refreshNotifications);
    return () => window.removeEventListener('student:notifications:changed', refreshNotifications);
  }, []);

  useEffect(() => {
    const socket = connectSocket();

    const handleNewNotification = ({ title, message: msg }: { title: string; message: string }) => {
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
      notification.info({
        message: title,
        description: msg,
        placement: 'topRight',
        duration: 6,
      });
    };

    const handleBookingConfigUpdated = () => {
      notification.info({
        message: 'Booking Configuration Updated',
        description: 'The booking window schedule has been updated. Your booking page will refresh automatically.',
        placement: 'topRight',
        duration: 6,
      });
      window.dispatchEvent(new Event('student:booking:config_updated'));
    };

    const handleBookingApproved = () => {
      notification.success({
        message: 'Payment Successful',
        description: 'Your payment has been confirmed and your booking is approved.',
        placement: 'topRight',
        duration: 6,
      });
      window.dispatchEvent(new Event('student:booking:approved'));
    };

    const handleBookingCancelled = () => {
      notification.info({
        message: 'Booking Cancelled',
        description: 'Your booking has been cancelled and the bed has been released.',
        placement: 'topRight',
        duration: 6,
      });
      window.dispatchEvent(new Event('student:booking:cancelled'));
    };

    const handleRoomTransferUpdated = () => {
      window.dispatchEvent(new Event('student:transfer:updated'));
    };

    const handleTransferUpgradePaymentCancelled = () => {
      notification.info({
        message: 'Bed upgrade payment cancelled',
        description: 'PayOS payment was cancelled. Your supplement invoice is closed and your previous bed assignment is unchanged.',
        placement: 'topRight',
        duration: 6,
      });
      window.dispatchEvent(new Event('student:transfer:upgrade-cancelled'));
    };

    socket.on('new_notification', handleNewNotification);
    socket.on('booking_config_updated', handleBookingConfigUpdated);
    socket.on('booking_approved', handleBookingApproved);
    socket.on('booking_cancelled', handleBookingCancelled);
    socket.on('room_transfer_updated', handleRoomTransferUpdated);
    socket.on('room_transfer_history_updated', handleRoomTransferUpdated);
    socket.on('transfer_upgrade_payment_cancelled', handleTransferUpgradePaymentCancelled);
    return () => {
      socket.off('new_notification', handleNewNotification);
      socket.off('booking_config_updated', handleBookingConfigUpdated);
      socket.off('booking_approved', handleBookingApproved);
      socket.off('booking_cancelled', handleBookingCancelled);
      socket.off('room_transfer_updated', handleRoomTransferUpdated);
      socket.off('room_transfer_history_updated', handleRoomTransferUpdated);
      socket.off('transfer_upgrade_payment_cancelled', handleTransferUpgradePaymentCancelled);
    };
  }, []);

  useEffect(() => {
    if (isDesktop) {
      setMobileSidebarOpen(false);
      return;
    }
    setCollapsed(false);
  }, [isDesktop]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleBellOpenChange = (open: boolean) => {
    setBellOpen(open);
    if (open && unreadCount > 0) {
      markAllNotificationsRead()
        .then(() => setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true }))))
        .catch(() => {});
    }
  };

  const notifPopoverContent = (
    <div style={{ width: isTablet ? 320 : 280, maxWidth: 'calc(100vw - 32px)' }}>
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
              onClick={() => {
                navigate(ROUTES.STUDENT_NOTIFICATIONS);
                setBellOpen(false);
              }}
              style={{
                padding: '8px 4px',
                borderBottom: '1px solid #f5f5f5',
                opacity: n.is_read ? 0.55 : 1,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
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

  const menuItems = useMemo(
    () => [
      { key: ROUTES.STUDENT_DASHBOARD, icon: <HomeOutlined />, label: 'Home' },
      { key: ROUTES.STUDENT_NEWS, icon: <FileTextOutlined />, label: 'News' },
      { key: ROUTES.STUDENT_SCHEDULE, icon: <CalendarOutlined />, label: 'Room History' },
      { key: ROUTES.STUDENT_BOOKING, icon: <KeyOutlined />, label: 'Booking' },
      { key: ROUTES.STUDENT_UTILITIES, icon: <ThunderboltOutlined />, label: 'Utilities' },
      { key: ROUTES.STUDENT_PAYMENT, icon: <CreditCardOutlined />, label: 'Payment' },
      { key: ROUTES.STUDENT_REQUESTS, icon: <FileSearchOutlined />, label: 'Requests' },
      { key: ROUTES.STUDENT_CFD_POINTS, icon: <AlertOutlined />, label: 'CFD Points' },
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
    ],
    [unreadCount]
  );

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    setMobileSidebarOpen(false);
    logout();
  };

  const displayName =
    profile?.full_name ||
    profile?.student_code ||
    user?.email?.split('@')[0] ||
    'Student';
  const studentCode = profile?.student_code || '';
  const behavioralScore = profile?.behavioral_score ?? 'N/A';
  const sidebarWidth = collapsed ? 80 : 240;

  const sidebarContent = (mobile = false) => (
    <div
      className="sidebar-filter"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: studentSidebarBg }}
    >
      <div
        style={{
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${studentSidebarBorder}`,
        }}
      >
        {!collapsed || mobile ? (
          <Space>
            <img
              src="/images/logo.png"
              alt="FUDA Dormitory logo"
              style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', background: 'white' }}
            />
            <div>
              <div style={{ color: 'white', fontWeight: 'bold' }}>FUDA Dormitory</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px' }}>Student Panel</div>
            </div>
          </Space>
        ) : (
          <div style={{ width: '100%', textAlign: 'center' }}>
            <img
              src="/images/logo.png"
              alt="logo"
              style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover', background: 'white', display: 'inline-block' }}
            />
          </div>
        )}

        {mobile ? (
          <Button
            type="text"
            icon={<CloseOutlined style={{ color: 'white' }} />}
            onClick={() => setMobileSidebarOpen(false)}
            style={{ color: 'white' }}
          />
        ) : (
          <Button
            type="text"
            icon={
              collapsed ? (
                <MenuUnfoldOutlined style={{ color: 'white' }} />
              ) : (
                <MenuFoldOutlined style={{ color: 'white' }} />
              )
            }
            onClick={() => setCollapsed((prev) => !prev)}
            style={{ color: 'white' }}
          />
        )}
      </div>

      <div style={{ padding: '16px', borderBottom: `1px solid ${studentSidebarBorder}` }}>
        <Space size="middle">
          <Avatar
            size={collapsed && !mobile ? 32 : 40}
            src={profile?.avatar_url}
            icon={!profile?.avatar_url && <UserOutlined />}
            style={{
              border: `2px solid ${studentSidebarAccent}`,
              backgroundColor: studentSidebarAccent,
            }}
          />
          {(!collapsed || mobile) && (
            <div>
              <div style={{ color: 'white', fontWeight: 600, fontSize: '12px' }}>{displayName}</div>
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '11px' }}>
                {studentCode && `${studentCode} - `}CFD: {behavioralScore}
              </div>
            </div>
          )}
        </Space>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <ConfigProvider
          theme={{
            components: {
              Menu: {
                darkItemBg: 'transparent',
                darkSubMenuItemBg: 'transparent',
                darkItemSelectedBg: 'rgba(255, 255, 255, 0.3)',
                darkItemSelectedColor: '#ffffff',
                darkItemColor: '#ffffff',
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
            className="student-sidebar-menu"
            inlineCollapsed={!mobile && collapsed}
            items={menuItems}
          />
        </ConfigProvider>
      </div>

      <div style={{ flexShrink: 0, padding: '16px', borderTop: `1px solid ${studentSidebarBorder}` }}>
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          block
          style={{ color: 'white', textAlign: collapsed && !mobile ? 'center' : 'left' }}
        >
          {collapsed && !mobile ? null : 'Logout'}
        </Button>
      </div>
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      {isDesktop && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          width={240}
          collapsedWidth={80}
          style={{
            backgroundColor: studentSidebarBg,
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            overflowY: 'hidden',
            overflowX: 'hidden',
          }}
        >
          {sidebarContent(false)}
        </Sider>
      )}

      {!isDesktop && (
        <Drawer
          placement="left"
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          closable={false}
          width={288}
          bodyStyle={{ padding: 0 }}
          styles={{ body: { padding: 0, background: studentSidebarBg } }}
        >
          {sidebarContent(true)}
        </Drawer>
      )}

      <Layout
        style={{
          marginLeft: isDesktop ? sidebarWidth : 0,
          transition: 'all 0.2s',
          minWidth: 0,
          background: token.colorBgLayout,
        }}
      >
        <div
          style={{
            backgroundColor: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorder}`,
            padding: isTablet ? '0 24px' : '0 16px',
            minHeight: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            {!isDesktop && (
              <Button
                type="text"
                icon={<MenuUnfoldOutlined style={{ fontSize: 18 }} />}
                onClick={() => setMobileSidebarOpen(true)}
              />
            )}
            <div style={{ minWidth: 0 }}>
              <Title level={isTablet ? 3 : 4} style={{ margin: 0 }}>
                Student <span style={{ color: token.colorPrimary }}>Board</span>
              </Title>
              {!isTablet && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Dormitory services and updates
                </Text>
              )}
            </div>
          </div>

          <Space size={isTablet ? 'middle' : 'small'}>
            <Popover
              content={notifPopoverContent}
              trigger="click"
              placement="bottomRight"
              arrow={false}
              open={bellOpen}
              onOpenChange={handleBellOpenChange}
            >
              <Badge count={unreadCount} size="small">
                <Button type="text" icon={<BellOutlined style={{ fontSize: '20px' }} />} size="large" />
              </Badge>
            </Popover>

            {isTablet && (
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
            )}
          </Space>
        </div>

        <Content style={{ minWidth: 0 }}>
          <Outlet />
        </Content>
      </Layout>
      <Agent />
    </Layout>
  );
};

export default StudentLayout;
