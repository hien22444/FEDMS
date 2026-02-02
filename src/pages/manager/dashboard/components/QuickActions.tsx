import { useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import { RiDoorLine, RiHotelBedLine, RiFileList3Line, RiListCheck2 } from 'react-icons/ri';
=======
import { DoorOpen, Bed, FileText, ListChecks } from 'lucide-react';
>>>>>>> b08cf52a5d072614a43cfae62aa76e7efed1071d

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
}

const quickActions: QuickAction[] = [
  {
    title: 'Room Management',
    description: 'View and manage rooms',
    icon: <DoorOpen size={20} className="text-orange-500" />,
    path: '/manager/rooms',
  },
  {
    title: 'Bed Management',
    description: 'Assign and update beds',
    icon: <Bed size={20} className="text-orange-500" />,
    path: '/manager/beds',
  },
  {
    title: 'Create Invoice',
    description: 'Generate new invoice',
    icon: <FileText size={20} className="text-orange-500" />,
    path: '/manager/invoices/create',
  },
  {
    title: 'View Requests',
    description: 'Handle pending requests',
    icon: <ListChecks size={20} className="text-orange-500" />,
    path: '/manager/requests',
  },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900">Quick Actions</h3>
        <p className="text-xs text-gray-500">Common tasks you can perform</p>
      </div>

      <div className="space-y-3">
        {quickActions.map((action) => (
          <button
            key={action.title}
            onClick={() => navigate(action.path)}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition-colors text-left"
          >
            <div className="p-2 bg-orange-50 rounded-lg">{action.icon}</div>
            <div>
              <p className="text-sm font-medium text-gray-900">{action.title}</p>
              <p className="text-xs text-gray-500">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
