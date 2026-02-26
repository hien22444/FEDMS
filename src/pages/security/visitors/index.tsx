import { useState } from 'react';
import { RiGroupLine, RiCheckboxCircleLine, RiCloseCircleLine, RiAddLine, RiTimeLine } from 'react-icons/ri';
import { cn } from '@/utils';

const VisitorsPage = () => {
  const [visitors] = useState([
    {
      id: 1,
      name: 'Nguyen Thi Hoa',
      student: 'Nguyen Van A',
      room: 'Room 305',
      checkIn: '10:00',
      expectedOut: '12:00',
      status: 'active',
    },
    {
      id: 2,
      name: 'Tran Van Hung',
      student: 'Tran Thi B',
      room: 'Room 402',
      checkIn: '09:30',
      expectedOut: '11:30',
      status: 'active',
    },
    {
      id: 3,
      name: 'Le Thu Ha',
      student: 'Le Van C',
      room: 'Room 205',
      checkIn: '08:00',
      expectedOut: '10:00',
      status: 'departed',
    },
  ]);

  const activeCount = visitors.filter((v) => v.status === 'active').length;

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RiGroupLine className="w-6 h-6 text-[#FF5C00]" />
          <h1 className="text-2xl font-bold text-gray-900">Visitors</h1>
        </div>
        <span className="bg-[#FF5C00] text-white px-3 py-1 rounded-full text-sm font-medium">
          {activeCount} Present
        </span>
      </div>

      {/* Visitors List */}
      <div className="space-y-4">
        {visitors.map((visitor) => (
          <div
            key={visitor.id}
            className={cn(
              'rounded-xl p-6 border-2 transition-shadow',
              visitor.status === 'active'
                ? 'bg-green-50 border-green-200'
                : 'bg-white border-gray-200'
            )}
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 bg-[#FF5C00] rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {getInitials(visitor.name)}
              </div>

              {/* Visitor Info */}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {visitor.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {visitor.student} - {visitor.room}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <RiTimeLine className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">In:</p>
                      <p className="text-sm font-medium text-gray-900">
                        {visitor.checkIn}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RiTimeLine className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Expected:</p>
                      <p className="text-sm font-medium text-gray-900">
                        {visitor.expectedOut}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  {visitor.status === 'active' ? (
                    <>
                      <RiCheckboxCircleLine className="w-5 h-5 text-green-500" />
                      <span className="text-sm font-medium text-green-600">
                        Present
                      </span>
                    </>
                  ) : (
                    <>
                      <RiCloseCircleLine className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-500">
                        Departed
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {visitor.status === 'active' && (
                <button className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors whitespace-nowrap">
                  Mark as Departed
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add New Visitor Button */}
      <button className="w-full border-2 border-[#FF5C00] border-dashed rounded-xl p-6 flex items-center justify-center gap-2 text-[#FF5C00] font-medium hover:bg-orange-50 transition-colors">
        <RiAddLine className="w-5 h-5" />
        Add New Visitor
      </button>
    </div>
  );
};

export default VisitorsPage;
