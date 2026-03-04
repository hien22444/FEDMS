
import {
  Clock,
  Users as UsersIcon,
  FileText,
  Video,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/utils';

const DashboardPage = () => {
  // Summary Cards Data
  const summaryCards = [
    {
      title: 'Pending Requests',
      value: '12',
      detail: '+3 from yesterday',
      icon: FileText,
      bgColor: 'bg-orange-50',
      iconBg: 'bg-[#FF5C00]',
    },
    {
      title: 'Visitors in Dorm',
      value: '28',
      detail: '↑ 5 today',
      icon: UsersIcon,
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-500',
    },
    {
      title: 'Checkout Requests',
      value: '5',
      detail: 'Pending',
      icon: FileText,
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-400',
    },
    {
      title: 'Active Cameras',
      value: '24/24',
      detail: '✓ Normal',
      icon: Video,
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-500',
    },
  ];

  // Processing Requests Data
  const processingRequests = [
    {
      type: 'Visitor',
      room: 'Room 305',
      name: 'Nguyen Van A',
      time: '2025-01-24 10:30',
      status: 'pending',
    },
    {
      type: 'Maintenance',
      room: 'Room 201',
      name: 'Repair Worker',
      time: '2025-01-24 09:15',
      status: 'pending',
    },
    {
      type: 'Delivery',
      room: 'Room 102',
      name: 'Delivery Person',
      time: '2025-01-24 08:45',
      status: 'approved',
    },
  ];

  // Security Notifications Data
  const notifications = [
    {
      type: 'alert',
      icon: AlertCircle,
      message: 'Unauthorized visitor detected',
      time: '5 minutes ago',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-500',
    },
    {
      type: 'info',
      icon: Info,
      message: 'Camera in room 301 needs maintenance',
      time: '2 hours ago',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      type: 'success',
      icon: CheckCircle,
      message: 'All cameras reconnected',
      time: '1 hour ago',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-500',
    },
    {
      type: 'alert',
      icon: AlertCircle,
      message: 'Unlocked door latch found',
      time: '30 minutes ago',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={cn(
                'bg-white rounded-xl p-6 shadow-sm border border-gray-100',
                card.bgColor
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {card.value}
                  </p>
                  <p className="text-xs text-gray-500">{card.detail}</p>
                </div>
                <div className={cn('p-3 rounded-lg', card.iconBg)}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Processing Requests Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Processing Requests
            </h2>
            <button className="bg-[#FF5C00] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#e65300] transition-colors text-sm">
              New Request
            </button>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {processingRequests.map((request, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  request.status === 'pending' ? 'bg-yellow-100' : 'bg-green-100'
                )}>
                  {request.status === 'pending' ? (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">
                      {request.type}
                    </span>
                    <span className="bg-[#FF5C00] text-white text-xs px-2 py-0.5 rounded-full">
                      {request.room}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{request.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{request.time}</p>
                </div>

                <div className="flex items-center gap-2">
                  {request.status === 'pending' ? (
                    <>
                      <button className="px-3 py-1.5 text-xs rounded-lg border border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100">
                        Pending
                      </button>
                      <button className="px-3 py-1.5 text-xs rounded-lg border border-green-300 text-green-700 bg-green-50 hover:bg-green-100">
                        Approve
                      </button>
                      <button className="px-3 py-1.5 text-xs rounded-lg border border-red-300 text-red-700 bg-red-50 hover:bg-red-100">
                        Reject
                      </button>
                    </>
                  ) : (
                    <button className="px-3 py-1.5 text-xs rounded-lg border border-green-300 text-green-700 bg-green-50">
                      Approved
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Notifications Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Security Notifications
          </h2>

          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {notifications.map((notification, index) => {
              const Icon = notification.icon;
              return (
                <div
                  key={index}
                  className={cn(
                    'p-4 rounded-lg border',
                    notification.bgColor,
                    'border-transparent'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={cn('w-5 h-5 mt-0.5', notification.iconColor)} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500">{notification.time}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="mt-6 text-[#FF5C00] text-sm font-medium hover:underline">
            View All Notifications
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
