import { useState } from 'react';
import { Video, CheckCircle, XCircle, Settings, Eye } from 'lucide-react';
import { cn } from '@/utils';

const CameraCheckinPage = () => {
  const [activeTab, setActiveTab] = useState<'qr' | 'manual'>('qr');

  // Summary Cards
  const summaryCards = [
    { label: 'Active', value: '3', color: 'green' },
    { label: 'Offline', value: '1', color: 'red' },
    { label: 'Total', value: '4', color: 'orange' },
    { label: 'Recordings', value: '8', color: 'blue' },
  ];

  // Camera Feeds
  const cameras = [
    {
      id: 1,
      name: 'Main Gate',
      location: 'Building A entrance',
      status: 'active',
      resolution: '1080p',
      lastActive: '2 minutes ago',
    },
    {
      id: 2,
      name: 'Floor 3 Hallway',
      location: 'Building A',
      status: 'active',
      resolution: '1080p',
      lastActive: '1 minute ago',
    },
    {
      id: 3,
      name: 'Student Room Area',
      location: 'Building B',
      status: 'offline',
      resolution: '720p',
      lastActive: '30 minutes ago',
    },
    {
      id: 4,
      name: 'Back Gate',
      location: 'Emergency exit',
      status: 'active',
      resolution: '1080p',
      lastActive: 'Just now',
    },
  ];

  // Recent Activity
  const recentActivity = [
    { name: 'Nguyen Van A', action: 'Check in', time: '09:30' },
    { name: 'Tran Thi B', action: 'Check out', time: '09:15' },
    { name: 'Le Van C', action: 'Check in', time: '09:00' },
    { name: 'Pham Thi D', action: 'Check out', time: '08:45' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <Video className="w-6 h-6 text-[#FF5C00]" />
        <h1 className="text-2xl font-bold text-gray-900">
          Camera Check-In Management
        </h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <div
            key={index}
            className={cn(
              'rounded-xl p-6 border-2',
              card.color === 'green' && 'bg-green-50 border-green-200',
              card.color === 'red' && 'bg-red-50 border-red-200',
              card.color === 'orange' && 'bg-orange-50 border-orange-200',
              card.color === 'blue' && 'bg-blue-50 border-blue-200'
            )}
          >
            <p className={cn(
              'text-3xl font-bold mb-1',
              card.color === 'green' && 'text-green-600',
              card.color === 'red' && 'text-red-600',
              card.color === 'orange' && 'text-orange-600',
              card.color === 'blue' && 'text-blue-600'
            )}>
              {card.value}
            </p>
            <p className="text-sm text-gray-600">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Check In/Out */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Check In / Out</h2>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('qr')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors',
                activeTab === 'qr'
                  ? 'bg-[#FF5C00] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              <Video className="w-5 h-5" />
              QR Code
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors',
                activeTab === 'manual'
                  ? 'bg-[#FF5C00] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              <XCircle className="w-5 h-5" />
              Manual
            </button>
          </div>

          {/* QR Scanner Area */}
          {activeTab === 'qr' && (
            <div className="border-2 border-dashed border-[#FF5C00] rounded-xl p-12 mb-6 bg-gray-50">
              <div className="flex flex-col items-center justify-center text-center">
                <Video className="w-16 h-16 text-[#FF5C00] mb-4" />
                <p className="text-gray-700 font-medium mb-2">
                  Scan student's QR Code
                </p>
                <p className="text-sm text-gray-500">
                  Place camera in front of QR code
                </p>
              </div>
            </div>
          )}

          {/* Manual Input */}
          {activeTab === 'manual' && (
            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Enter student ID"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF5C00]"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button className="flex-1 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors">
              Check In
            </button>
            <button className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
              Check Out
            </button>
          </div>

          {/* Recent Activity */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{activity.name}</p>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{activity.time}</span>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Camera Feeds */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Camera Feeds
          </h2>

          <div className="grid grid-cols-1 gap-4 max-h-[800px] overflow-y-auto">
            {cameras.map((camera) => (
              <div
                key={camera.id}
                className={cn(
                  'border-2 rounded-xl p-4',
                  camera.status === 'active'
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{camera.name}</h3>
                    <p className="text-sm text-gray-500">{camera.location}</p>
                  </div>
                  {camera.status === 'active' ? (
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  ) : (
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  )}
                </div>

                {/* Video Placeholder */}
                <div className="bg-gray-200 rounded-lg h-48 flex items-center justify-center mb-4">
                  {camera.status === 'active' ? (
                    <div className="text-center">
                      <Video className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Live Stream</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <XCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                      <p className="text-sm text-red-500">Camera Offline</p>
                    </div>
                  )}
                </div>

                {/* Camera Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={cn(
                        'font-medium',
                        camera.status === 'active' ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {camera.status === 'active' ? 'Active' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Resolution:</span>
                    <span className="font-medium text-gray-900">{camera.resolution}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Last Active:</span>
                    <span className="font-medium text-gray-900">{camera.lastActive}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  <button className="flex-1 bg-[#FF5C00] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#e65300] transition-colors flex items-center justify-center gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraCheckinPage;
