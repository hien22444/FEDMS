import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MANAGER_MENU } from '@/constants/manager.constant';
import {
  RiDashboardLine,
  RiBarChartLine,
  RiBuildingLine,
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
  RiFileList3Line,
  RiNewspaperLine,
  RiChat3Line,
  RiMailLine,
  RiNotification3Line,
  RiSettings4Line,
  RiUpload2Line,
  RiDownload2Line,
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiGridLine,
} from 'react-icons/ri';

const iconMap: Record<string, React.ReactNode> = {
  dashboard: <RiDashboardLine size={18} />,
  barChart: <RiBarChartLine size={18} />,
  building: <RiBuildingLine size={18} />,
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
  invoice: <RiFileList3Line size={18} />,
  news: <RiNewspaperLine size={18} />,
  chat: <RiChat3Line size={18} />,
  email: <RiMailLine size={18} />,
  bell: <RiNotification3Line size={18} />,
  settings: <RiSettings4Line size={18} />,
  import: <RiUpload2Line size={18} />,
  export: <RiDownload2Line size={18} />,
  gear: <RiSettings4Line size={18} />,
};

export default function ManagerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['beds', 'electricity']);

  const toggleExpand = (key: string) => {
    setExpandedItems((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-64 bg-white h-screen border-r border-gray-200 flex flex-col fixed left-0 top-0 overflow-hidden">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <div>
            <h1 className="font-semibold text-gray-900 text-sm">FPT Dormitory</h1>
            <p className="text-xs text-gray-500">Management System</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 no-scrollbar">
        {MANAGER_MENU.map((group) => (
          <div key={group.group} className="mb-4">
            <p className="text-xs font-medium text-orange-500 mb-2 px-2">{group.group}</p>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.key}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => toggleExpand(item.key)}
                        className={`w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm transition-colors ${isActive(item.path)
                          ? 'bg-orange-100 text-orange-600'
                          : 'text-dark-500 hover:bg-orange-100 hover:text-orange-600'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          {iconMap[item.icon]}
                          <span>{item.label}</span>
                        </div>
                        {expandedItems.includes(item.key) ? (
                          <RiArrowUpSLine size={16} />
                        ) : (
                          <RiArrowDownSLine size={16} />
                        )}
                      </button>
                      {expandedItems.includes(item.key) && (
                        <ul className="ml-6 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <li key={child.key}>
                              <button
                                onClick={() => navigate(child.path)}
                                className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${isActive(child.path)
                                  ? 'bg-orange-100 text-orange-600'
                                  : 'text-dark-500 hover:bg-orange-100 hover:text-orange-600'
                                  }`}
                              >
                                {child.label}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => navigate(item.path)}
                      className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${isActive(item.path)
                        ? 'bg-orange-100 text-orange-600'
                        : 'text-dark-600 hover:bg-orange-100 hover:text-orange-600'
                        }`}
                    >
                      {iconMap[item.icon]}
                      <span>{item.label}</span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
