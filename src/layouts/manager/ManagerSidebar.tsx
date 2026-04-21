import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tooltip } from 'antd';
import { useAuth } from '@/contexts';
import { MANAGER_MENU } from '@/constants/manager.constant';
import {
  RiDashboardLine,
  RiBarChartLine,
  RiBuilding2Line,
  RiGridLine,
  RiDoorLine,
  RiHotelBedLine,
  RiHistoryLine,
  RiLogoutBoxLine,
  RiUserLine,
  RiAlertLine,
  RiAddLine,
  RiToolsLine,
  RiListCheck2,
  RiFlashlightLine,
  RiFileTextLine,
  RiNewspaperLine,
  RiChat1Line,
  RiMailLine,
  RiNotification3Line,
  RiSettings3Line,
  RiUploadLine,
  RiDownloadLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiCloseLine,
  RiMenuFoldLine,
  RiMenuUnfoldLine,
} from 'react-icons/ri';

type ManagerSidebarProps = {
  isDesktop?: boolean;
  mobileOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

const iconMap: Record<string, React.ReactNode> = {
  dashboard: <RiDashboardLine size={18} />,
  barChart: <RiBarChartLine size={18} />,
  building: <RiBuilding2Line size={18} />,
  block: <RiGridLine size={18} />,
  door: <RiDoorLine size={18} />,
  bed: <RiHotelBedLine size={18} />,
  history: <RiHistoryLine size={18} />,
  checkout: <RiLogoutBoxLine size={18} />,
  user: <RiUserLine size={18} />,
  warning: <RiAlertLine size={18} />,
  plus: <RiAddLine size={18} />,
  tool: <RiToolsLine size={18} />,
  list: <RiListCheck2 size={18} />,
  electricity: <RiFlashlightLine size={18} />,
  invoice: <RiFileTextLine size={18} />,
  news: <RiNewspaperLine size={18} />,
  chat: <RiChat1Line size={18} />,
  email: <RiMailLine size={18} />,
  bell: <RiNotification3Line size={18} />,
  settings: <RiSettings3Line size={18} />,
  import: <RiUploadLine size={18} />,
  export: <RiDownloadLine size={18} />,
  gear: <RiSettings3Line size={18} />,
  cfdRisk: <RiAlertLine size={18} />,
};

export default function ManagerSidebar({
  isDesktop = false,
  mobileOpen = false,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: ManagerSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>(['beds', 'violations']);

  const toggleExpand = (key: string) => {
    setExpandedItems((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const isActive = (path: string) =>
    path === '/manager' ? location.pathname === '/manager' : location.pathname.startsWith(path);

  const handleNavigate = (path: string) => {
    navigate(path);
    if (!isDesktop) onClose?.();
  };

  const sidebarWidth = collapsed ? 'w-[72px]' : 'w-[280px]';

  return (
    <aside
      className={[
        'sidebar-filter fixed left-0 top-0 z-40 h-screen bg-[#f37021] text-white flex flex-col transition-all duration-300 ease-out',
        sidebarWidth,
        isDesktop || mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
      ].join(' ')}
    >
      {/* Brand */}
      <div className="h-16 px-3 flex items-center gap-3 border-b border-[#d4621c] shrink-0">
        {collapsed ? (
          <div className="w-full flex justify-center">
            <img
              src="/images/logo.png"
              alt="logo"
              className="w-8 h-8 rounded-lg object-cover bg-white"
            />
          </div>
        ) : (
          <>
            <img
              src="/images/logo.png"
              alt="FUDA Dormitory logo"
              className="w-10 h-10 rounded-xl object-cover bg-white shrink-0"
            />
            <div className="leading-tight overflow-hidden">
              <div className="font-semibold text-base whitespace-nowrap">FUDA Dormitory</div>
              <div className="text-xs text-white">Manager Panel</div>
            </div>
          </>
        )}

        {/* Desktop: collapse toggle */}
        {isDesktop && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={[
              'inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors shrink-0',
              collapsed ? 'mx-auto' : 'ml-auto',
            ].join(' ')}
          >
            {collapsed ? <RiMenuUnfoldLine size={16} /> : <RiMenuFoldLine size={16} />}
          </button>
        )}

        {/* Mobile: close button */}
        {!isDesktop && (
          <button
            type="button"
            onClick={onClose}
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white lg:hidden"
          >
            <RiCloseLine size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 no-scrollbar">
        {MANAGER_MENU.map((group) => (
          <div key={group.group} className="mb-3">
            {/* Group label — hidden when collapsed */}
            {!collapsed && (
              <p className="text-sm font-bold tracking-widest text-white uppercase mb-1.5 mt-2 px-2 leading-tight">
                <span className="pb-1.5 border-b-2 border-white/50">{group.group}</span>
              </p>
            )}
            {collapsed && <div className="border-t border-white/20 my-2" />}

            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.path);
                const expanded = expandedItems.includes(item.key);

                if (collapsed) {
                  // Collapsed: icon only with tooltip
                  return (
                    <li key={item.key}>
                      <Tooltip title={item.label} placement="right">
                        <button
                          type="button"
                          onClick={() => handleNavigate(item.path)}
                          className={[
                            'w-full flex items-center justify-center py-2 rounded-xl transition-colors',
                            active
                              ? 'bg-white/30 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]'
                              : 'text-white hover:bg-white/10',
                          ].join(' ')}
                        >
                          <span className="text-white">{iconMap[item.icon]}</span>
                        </button>
                      </Tooltip>
                    </li>
                  );
                }

                return (
                  <li key={item.key}>
                    {item.children ? (
                      <>
                        <button
                          type="button"
                          onClick={() => toggleExpand(item.key)}
                          className={[
                            'w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                            active
                              ? 'bg-white/30 text-white font-bold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]'
                              : 'text-white hover:bg-white/10',
                          ].join(' ')}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-white">{iconMap[item.icon]}</span>
                            <span>{item.label}</span>
                          </div>
                          <span className="text-white">
                            {expanded ? <RiArrowUpSLine size={16} /> : <RiArrowDownSLine size={16} />}
                          </span>
                        </button>

                        {expanded && (
                          <ul className="mt-0.5 ml-4 pl-3 border-l border-white/20 space-y-0.5">
                            {item.children.map((child) => {
                              const childActive = location.pathname === child.path;
                              return (
                                <li key={child.key}>
                                  <button
                                    type="button"
                                    onClick={() => handleNavigate(child.path)}
                                    className={[
                                      'w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors',
                                      childActive
                                        ? 'bg-white/30 text-white font-bold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]'
                                        : 'text-white hover:bg-white/10 hover:text-white',
                                    ].join(' ')}
                                  >
                                    {child.label}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleNavigate(item.path)}
                        className={[
                          'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                          active
                            ? 'bg-white/30 text-white font-bold shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]'
                            : 'text-white hover:bg-white/10',
                        ].join(' ')}
                      >
                        <span className="text-white">{iconMap[item.icon]}</span>
                        <span>{item.label}</span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-[#d4621c] shrink-0">
        {collapsed ? (
          <Tooltip title="Logout" placement="right">
            <button
              type="button"
              onClick={() => { logout(); if (!isDesktop) onClose?.(); }}
              className="w-full flex items-center justify-center py-2 rounded-xl text-white hover:bg-white/10 transition-colors"
            >
              <RiLogoutBoxLine size={18} />
            </button>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={() => { logout(); if (!isDesktop) onClose?.(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            <RiLogoutBoxLine size={18} />
            Logout
          </button>
        )}
      </div>
    </aside>
  );
}
