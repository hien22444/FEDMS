import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Blocks,
  DoorClosed,
  Layers3,
  FolderCog,
  UserCog,
  BarChart3,
  Database,
  BookOpen,
  LogOut,
  X,
} from 'lucide-react';
import { ROUTES } from '@/constants';
import { useAuth } from '@/contexts';

type AdminSidebarProps = {
  isDesktop?: boolean;
  mobileOpen?: boolean;
  onClose?: () => void;
};

type NavItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', path: ROUTES.ADMIN, icon: <LayoutDashboard size={18} /> },
  { label: 'Dorm Management', path: ROUTES.ADMIN_DORMS, icon: <Building2 size={18} /> },
  { label: 'Block Management', path: ROUTES.ADMIN_BLOCKS, icon: <Blocks size={18} /> },
  { label: 'Room Management', path: ROUTES.ADMIN_ROOMS, icon: <DoorClosed size={18} /> },
  { label: 'Room Type Management', path: ROUTES.ADMIN_ROOM_TYPES, icon: <Layers3 size={18} /> },
  { label: 'Facility Management', path: ROUTES.ADMIN_FACILITIES, icon: <FolderCog size={18} /> },
  { label: 'User Management', path: ROUTES.ADMIN_USERS, icon: <UserCog size={18} /> },
  { label: 'Dorm Rules', path: ROUTES.ADMIN_DORM_RULES, icon: <BookOpen size={18} /> },
  { label: 'Reports & Monitoring', path: ROUTES.ADMIN_REPORTS, icon: <BarChart3 size={18} /> },
  { label: 'Data Management', path: ROUTES.ADMIN_DATA, icon: <Database size={18} /> },
];

export default function AdminSidebar({
  isDesktop = false,
  mobileOpen = false,
  onClose,
}: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (!isDesktop) onClose?.();
  };

  return (
    <aside
      className={[
        'sidebar-filter fixed left-0 top-0 z-40 flex h-screen w-[280px] flex-col border-r border-[#d4621c] bg-[#f37021] text-white transition-transform duration-300 ease-out',
        isDesktop || mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
      ].join(' ')}
    >
      {/* Brand */}
      <div className="flex h-20 items-center gap-3 border-b border-[#d4621c] px-5">
        <img
          src="/images/logo.png"
          alt="FUDA Dormitory logo"
          className="w-10 h-10 rounded-xl object-cover bg-white"
        />
        <div className="leading-tight">
          <div className="font-semibold text-base">FUDA Dormitory</div>
          <div className="text-xs text-white">Admin Panel</div>
        </div>
        {!isDesktop && (
          <button
            type="button"
            onClick={onClose}
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white lg:hidden"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <li key={item.path}>
                <button
                  type="button"
                  onClick={() => handleNavigate(item.path)}
                  className={[
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    active
                      ? 'bg-white/30 text-white font-bold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]'
                      : 'text-white hover:bg-white/10',
                  ].join(' ')}
                >
                  <span className="text-white">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-[#d4621c]">
        <button
          type="button"
          onClick={() => {
            logout();
            if (!isDesktop) onClose?.();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white hover:bg-white/10 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
