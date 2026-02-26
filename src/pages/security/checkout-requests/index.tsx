import { useState } from 'react';
import { Clock, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/utils';

const CheckoutRequestsPage = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'completed', label: 'Completed' },
  ];

  const requests = [
    {
      id: 1,
      name: 'Nguyen Van A',
      room: 'Room 305',
      type: 'Dorm Transfer',
      accessCount: 2,
      requestTime: '14:00',
      status: 'pending',
      date: '2025-01-24 14:00',
    },
    {
      id: 2,
      name: 'Tran Thi B',
      room: 'Room 402',
      type: 'Leaving School',
      accessCount: 5,
      requestTime: '13:30',
      status: 'approved',
      date: '2025-01-24 13:30',
    },
    {
      id: 3,
      name: 'Le Van C',
      room: 'Room 205',
      type: 'Room Upgrade',
      accessCount: 1,
      requestTime: '12:15',
      status: 'pending',
      date: '2025-01-24 12:15',
    },
    {
      id: 4,
      name: 'Pham Thi D',
      room: 'Room 101',
      type: 'Temporary Leave',
      accessCount: 3,
      requestTime: '11:00',
      status: 'completed',
      date: '2025-01-24 11:00',
    },
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
        };
      case 'approved':
        return {
          icon: Info,
          label: 'Approved',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
        };
      case 'completed':
        return {
          icon: CheckCircle,
          label: 'Completed',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
        };
      default:
        return {
          icon: Clock,
          label: 'Pending',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        };
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Checkout Requests
        </h1>
        <p className="text-gray-600">
          Manage student checkout requests
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              activeFilter === filter.id
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.map((request) => {
          const statusConfig = getStatusConfig(request.status);
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={request.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="w-16 h-16 bg-[#FF5C00] rounded-lg flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {getInitials(request.name)}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {request.name}
                    </h3>
                    <span className="bg-[#FF5C00] text-white text-xs px-2 py-1 rounded-full">
                      {request.room}
                    </span>
                    <span className="text-[#FF5C00] text-sm font-medium">
                      {request.type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mt-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Access Count</p>
                      <p className="text-xl font-bold text-gray-900">
                        {request.accessCount} Times
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Requested At</p>
                      <p className="text-xl font-bold text-gray-900">
                        {request.requestTime}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status and Actions */}
                <div className="flex flex-col items-end gap-4">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={cn('w-5 h-5', statusConfig.color)} />
                    <span
                      className={cn(
                        'px-3 py-1 rounded-full text-sm font-medium',
                        statusConfig.bgColor,
                        statusConfig.color
                      )}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{request.date}</p>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-2">
                    {request.status === 'pending' && (
                      <>
                        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                          Approve
                        </button>
                        <button className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
                          Reject
                        </button>
                      </>
                    )}
                    {request.status === 'approved' && (
                      <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
                        Complete Checkout
                      </button>
                    )}
                    {request.status === 'completed' && (
                      <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
                        Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CheckoutRequestsPage;
