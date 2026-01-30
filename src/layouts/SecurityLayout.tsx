import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Camera,
  FileText,
  Users,
  Bell,
  LogOut,
  Shield,
} from 'lucide-react';
import { ROUTES } from '@/constants';
import { cn } from '@/utils';

const SecurityLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: ROUTES.DASHBOARD, label: 'Tổng Quan', icon: LayoutDashboard },
    { path: ROUTES.CAMERA_CHECKIN, label: 'Camera Checkin', icon: Camera },
    { path: ROUTES.CHECKOUT_REQUESTS, label: 'Yêu Cầu Checkout', icon: FileText },
    { path: ROUTES.VISITORS, label: 'Khách Tham Quan', icon: Users },
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
                <p className="text-sm text-gray-500">Hệ Thống Quản Lý Bảo Mật</p>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Bell className="w-5 h-5 text-gray-600 cursor-pointer" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
              </div>
              <button
                onClick={() => navigate(ROUTES.SIGN_IN)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-5 h-5" />
                <span>Đăng Xuất</span>
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
    </div>
  );
};

export default SecurityLayout;
