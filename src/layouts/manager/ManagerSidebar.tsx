import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
} from 'react-icons/ri';

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
};

export default function ManagerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>(['beds', 'electricity']);

  const toggleExpand = (key: string) => {
    setExpandedItems((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const isActive = (path: string) =>
    path === '/manager' ? location.pathname === '/manager' : location.pathname.startsWith(path);

  return (
    <aside className="w-[280px] bg-orange-600 text-white flex flex-col fixed left-0 top-0 h-screen z-20">
      {/* Brand */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-orange-700 shrink-0">
        <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center font-bold text-base">
          F
        </div>
        <div className="leading-tight">
          <div className="font-semibold text-base">FPT Dormitory</div>
          <div className="text-xs text-white/70">Manager Panel</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 no-scrollbar">
        {MANAGER_MENU.map((group) => (
          <div key={group.group} className="mb-3">
            {/* Group label */}
            <p className="text-xs font-semibold tracking-widest text-white/60 uppercase mb-1.5 px-3">
              {group.group}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.path);
                const expanded = expandedItems.includes(item.key);

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
                              ? 'bg-white text-orange-600'
                              : 'text-white/90 hover:bg-white/10',
                          ].join(' ')}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={active ? 'text-orange-600' : 'text-white'}>
                              {iconMap[item.icon]}
                            </span>
                            <span>{item.label}</span>
                          </div>
                          <span className={active ? 'text-orange-400' : 'text-white/60'}>
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
                                    onClick={() => navigate(child.path)}
                                    className={[
                                      'w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors',
                                      childActive
                                        ? 'bg-white text-orange-600 font-medium'
                                        : 'text-white/80 hover:bg-white/10 hover:text-white',
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
                        onClick={() => navigate(item.path)}
                        className={[
                          'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                          active
                            ? 'bg-white text-orange-600 shadow-sm'
                            : 'text-white/90 hover:bg-white/10',
                        ].join(' ')}
                      >
                        <span className={active ? 'text-orange-600' : 'text-white'}>
                          {iconMap[item.icon]}
                        </span>
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
      <div className="p-4 border-t border-orange-700 shrink-0">
        <button
          type="button"
          onClick={() => logout()}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-white/90 hover:bg-white/10 transition-colors"
        >
          <RiLogoutBoxLine size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
