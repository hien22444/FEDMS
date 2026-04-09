import { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Camera,
  FileText,
  Users,
  Bell,
  LogOut,
  Shield,
  AlertTriangle,
  FileSpreadsheet,
  Menu,
  X,
  KeyRound,
} from 'lucide-react';
import { Button, Form, Input, Modal, message } from 'antd';
import { ROUTES } from '@/constants';
import { cn } from '@/utils';
import { useAuth, useSecurityAdminAccess } from '@/contexts';
import { connectSocket } from '@/lib/socket';
import { useWindowSize } from '@/hooks/useWindowSize';
import { useDetectionNotifications } from '@/hooks/useDetectionNotifications';
import DetectionToast from '@/components/DetectionToast';
import NotificationPanel from '@/components/NotificationPanel';

const SecurityLayout = () => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const { width } = useWindowSize();
  const {
    isAdminAccessGranted,
    grantAdminAccess,
    revokeAdminAccess,
  } = useSecurityAdminAccess();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminAccessOpen, setAdminAccessOpen] = useState(false);
  const [adminAccessLoading, setAdminAccessLoading] = useState(false);
  const [adminForm] = Form.useForm();
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const {
    notifications,
    activeToast,
    unreadCount,
    dismissToast,
    markAllRead,
  } = useDetectionNotifications();
  const isDesktop = width >= 1024;

  // Connect socket so the security user joins the 'security_cameras' room
  // and receives live face_detection_result events from the backend.
  useEffect(() => {
    connectSocket();
    return () => {
      // Socket is a singleton — don't disconnect on unmount,
      // just let AuthContext handle it on logout.
    };
  }, []);

  useEffect(() => {
    if (isDesktop) setMobileMenuOpen(false);
  }, [isDesktop]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: ROUTES.DASHBOARD, label: 'Overview', icon: LayoutDashboard },
    { path: ROUTES.CAMERA_CHECKIN, label: 'Camera Checkin', icon: Camera },
    { path: ROUTES.CHECKOUT_REQUESTS, label: 'Checkout Requests', icon: FileText },
    { path: ROUTES.VISITORS, label: 'Visitors', icon: Users },
    { path: ROUTES.SECURITY_REPORT_VIOLATION, label: 'Report Violation', icon: AlertTriangle },
    { path: ROUTES.SECURITY_REPORTS, label: 'Reports', icon: FileSpreadsheet },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#FFFBF7]">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex min-w-0 items-center gap-3">
              <div className="bg-[#F36F21] p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold text-gray-900 sm:text-xl">DormFlow Security</h1>
                <p className="hidden text-sm text-gray-500 sm:block">Security Management System</p>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 lg:hidden"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              {user?.role === 'security' &&
                (isAdminAccessGranted ? (
                  <Button
                    onClick={() => {
                      revokeAdminAccess();
                      message.success('Admin access ended');
                    }}
                    icon={<KeyRound className="w-4 h-4" />}
                    className="hidden sm:inline-flex border-orange-200 text-orange-600 hover:!border-orange-300 hover:!text-orange-700"
                  >
                    End Admin Access
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    onClick={() => setAdminAccessOpen(true)}
                    icon={<KeyRound className="w-4 h-4" />}
                    className="hidden sm:inline-flex bg-[#FF5C00] hover:!bg-[#e65300] border-[#FF5C00]"
                  >
                    Admin Access
                  </Button>
                ))}

              <button
                onClick={() => {
                  setNotifPanelOpen(true);
                  markAllRead();
                }}
                className="relative p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  revokeAdminAccess();
                  logout();
                }}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 sm:text-base"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="mt-4 hidden items-center gap-1 overflow-x-auto border-b border-gray-200 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative',
                    active
                      ? 'text-[#F36F21]'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F36F21]"></span>
                  )}
                </Link>
              );
            })}
          </nav>

          {!isDesktop && mobileMenuOpen && (
            <nav className="mt-4 grid gap-2 border-t border-gray-100 pt-4 lg:hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                      active ? 'bg-[#FFF1E8] text-[#F36F21]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      <Modal
        open={adminAccessOpen}
        onCancel={() => {
          setAdminAccessOpen(false);
          adminForm.resetFields();
        }}
        title="Admin Access"
        footer={null}
        destroyOnClose
        centered
      >
        <Form
          form={adminForm}
          layout="vertical"
          onFinish={async (values: { username: string; password: string }) => {
            try {
              setAdminAccessLoading(true);
              await grantAdminAccess({
                username: values.username,
                password: values.password,
              });
              message.success('Admin access granted');
              setAdminAccessOpen(false);
              adminForm.resetFields();
            } catch (err: unknown) {
              const msg =
                err instanceof Error
                  ? err.message
                  : (err as { message?: string })?.message || 'Failed to grant admin access';
              message.error(msg);
            } finally {
              setAdminAccessLoading(false);
            }
          }}
        >
          <Form.Item
            label="Admin Account"
            name="username"
            rules={[{ required: true, message: 'Please enter the admin account' }]}
          >
            <Input
              prefix={<Shield className="w-4 h-4 text-gray-400" />}
              placeholder="admin"
              autoComplete="username"
            />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please enter the admin password' }]}
          >
            <Input.Password
              prefix={<KeyRound className="w-4 h-4 text-gray-400" />}
              placeholder="Admin password"
              autoComplete="current-password"
            />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => {
                setAdminAccessOpen(false);
                adminForm.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={adminAccessLoading}
              className="bg-[#FF5C00] hover:!bg-[#e65300] border-[#FF5C00]"
            >
              Grant Access
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Detection notifications */}
      <DetectionToast notification={activeToast} onDismiss={dismissToast} />
      <NotificationPanel
        open={notifPanelOpen}
        onClose={() => setNotifPanelOpen(false)}
        notifications={notifications}
        onMarkAllRead={markAllRead}
      />
    </div>
  );
};

export default SecurityLayout;
