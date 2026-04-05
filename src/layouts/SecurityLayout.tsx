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
  KeyRound,
} from 'lucide-react';
import { Button, Form, Input, Modal, message } from 'antd';
import { ROUTES } from '@/constants';
import { cn } from '@/utils';
import { useAuth, useSecurityAdminAccess } from '@/contexts';
import { connectSocket } from '@/lib/socket';

const SecurityLayout = () => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const {
    isAdminAccessGranted,
    grantAdminAccess,
    revokeAdminAccess,
  } = useSecurityAdminAccess();
  const [adminAccessOpen, setAdminAccessOpen] = useState(false);
  const [adminAccessLoading, setAdminAccessLoading] = useState(false);
  const [adminForm] = Form.useForm();

  // Connect socket so the security user joins the 'security_cameras' room
  // and receives live face_detection_result events from the backend.
  useEffect(() => {
    connectSocket();
    return () => {
      // Socket is a singleton — don't disconnect on unmount,
      // just let AuthContext handle it on logout.
    };
  }, []);

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
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="bg-[#FF5C00] p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">DormFlow Security</h1>
                <p className="text-sm text-gray-500">Security Management System</p>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {user?.role === 'security' &&
                (isAdminAccessGranted ? (
                  <Button
                    onClick={() => {
                      revokeAdminAccess();
                      message.success('Admin access ended');
                    }}
                    icon={<KeyRound className="w-4 h-4" />}
                    className="border-orange-200 text-orange-600 hover:!border-orange-300 hover:!text-orange-700"
                  >
                    End Admin Access
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    onClick={() => setAdminAccessOpen(true)}
                    icon={<KeyRound className="w-4 h-4" />}
                    className="bg-[#FF5C00] hover:!bg-[#e65300] border-[#FF5C00]"
                  >
                    Admin Access
                  </Button>
                ))}
              <div className="relative">
                <Bell className="w-5 h-5 text-gray-600 cursor-pointer" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
              </div>
              <button
                onClick={() => {
                  revokeAdminAccess();
                  logout();
                }}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 mt-4 border-b border-gray-200">
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
                      ? 'text-[#FF5C00]'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF5C00]"></span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
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
    </div>
  );
};

export default SecurityLayout;
