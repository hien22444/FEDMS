import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MANAGER_MENU } from '@/constants/manager.constant';
import {
  LayoutDashboard,
  BarChart3,
  Building2,
  LayoutGrid,
  DoorOpen,
  Bed,
  History,
  LogOut,
  User,
  AlertTriangle,
  Plus,
  Wrench,
  ListChecks,
  Zap,
  FileText,
  Newspaper,
  MessageCircle,
  Mail,
  Bell,
  Settings,
  Upload,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard size={18} />,
  barChart: <BarChart3 size={18} />,
  building: <Building2 size={18} />,
  block: <LayoutGrid size={18} />,
  door: <DoorOpen size={18} />,
  bed: <Bed size={18} />,
  history: <History size={18} />,
  checkout: <LogOut size={18} />,
  user: <User size={18} />,
  warning: <AlertTriangle size={18} />,
  plus: <Plus size={18} />,
  tool: <Wrench size={18} />,
  list: <ListChecks size={18} />,
  electricity: <Zap size={18} />,
  invoice: <FileText size={18} />,
  news: <Newspaper size={18} />,
  chat: <MessageCircle size={18} />,
  email: <Mail size={18} />,
  bell: <Bell size={18} />,
  settings: <Settings size={18} />,
  import: <Upload size={18} />,
  export: <Download size={18} />,
  gear: <Settings size={18} />,
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
                        className={`w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm transition-colors ${
                          isActive(item.path)
                            ? 'bg-orange-100 text-orange-600'
                            : 'text-gray-500 hover:bg-orange-100 hover:text-orange-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {iconMap[item.icon]}
                          <span>{item.label}</span>
                        </div>
                        {expandedItems.includes(item.key) ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                      {expandedItems.includes(item.key) && (
                        <ul className="ml-6 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <li key={child.key}>
                              <button
                                onClick={() => navigate(child.path)}
                                className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${
                                  isActive(child.path)
? 'bg-orange-100 text-orange-600'
                                  : 'text-gray-500 hover:bg-orange-100 hover:text-orange-600'
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
                      className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors ${
                        isActive(item.path)
                          ? 'bg-orange-100 text-orange-600'
                          : 'text-gray-600 hover:bg-orange-100 hover:text-orange-600'
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
