import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Blocks,
  FolderCog,
  UserCog,
  BarChart3,
  Database,
  LogOut,
} from 'lucide-react';
import { ROUTES } from '@/constants';
import { useAuth } from '@/contexts';

type NavItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { label: 'Dashboard', path: ROUTES.ADMIN, icon: <LayoutDashboard size={18} /> },
  { label: 'Dorm Management', path: ROUTES.ADMIN_DORMS, icon: <Building2 size={18} /> },
  { label: 'Block Management', path: ROUTES.ADMIN_BLOCKS, icon: <Blocks size={18} /> },
  { label: 'Facility Management', path: ROUTES.ADMIN_FACILITIES, icon: <FolderCog size={18} /> },
  { label: 'User Management', path: ROUTES.ADMIN_USERS, icon: <UserCog size={18} /> },
  { label: 'Reports & Monitoring', path: ROUTES.ADMIN_REPORTS, icon: <BarChart3 size={18} /> },
  { label: 'Data Management', path: ROUTES.ADMIN_DATA, icon: <Database size={18} /> },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-[280px] bg-orange-600 text-white flex flex-col border-r border-orange-700">
      {/* Brand */}
      <div className="h-20 px-5 flex items-center gap-3 border-b border-orange-700">
        <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center font-bold">
          D
        </div>
        <div className="leading-tight">
          <div className="font-semibold text-base">Dorm Mgmt</div>
          <div className="text-xs text-white/80">Admin Panel</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <li key={item.path}>
                <button
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={[
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    active ? 'bg-white text-orange-600 shadow-sm' : 'text-white/95 hover:bg-white/10',
                  ].join(' ')}
                >
                  <span className={active ? 'text-orange-600' : 'text-white'}>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-orange-700">
        <button
          type="button"
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/95 hover:bg-white/10 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}

