import {
  Building,
  Users,
  ShieldCheck,
  AlertCircle,
  Plus,
  UserCog,
  ClipboardList,
  HardDrive,
  Activity,
} from 'lucide-react';

type MetricCardProps = {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  iconBgClass: string;
  iconTextClass: string;
};

function MetricCard({ title, value, icon, iconBgClass, iconTextClass }: MetricCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-gray-500 font-medium">{title}</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
        </div>
        <div className={`${iconBgClass} ${iconTextClass} w-10 h-10 rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

type QuickActionProps = {
  label: string;
  icon: React.ReactNode;
};

function QuickActionCard({ label, icon }: QuickActionProps) {
  return (
    <button
      type="button"
      className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center gap-3 text-center"
    >
      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
        {icon}
      </div>
      <div className="text-sm font-medium text-gray-900">{label}</div>
    </button>
  );
}

const activityItems = [
  { dot: 'bg-red-500', title: 'Facility Maintenance Scheduled', time: '2 hours ago' },
  { dot: 'bg-green-500', title: 'New User Account Created', time: '4 hours ago' },
  { dot: 'bg-green-500', title: 'System Backup Completed', time: '1 day ago' },
  { dot: 'bg-red-500', title: 'Facility Inspection Report Submitted', time: '2 days ago' },
];

const systemStatus = [
  { label: 'Database', status: 'Online' },
  { label: 'API Server', status: 'Online' },
  { label: 'File Storage', status: 'Online' },
  { label: 'Backup Service', status: 'Online' },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            FPT University Dormitory Management System
          </h1>
          <p className="text-sm text-gray-500 mt-1">Admin Dashboard</p>
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Total Facilities"
          value="24"
          icon={<Building size={18} />}
          iconBgClass="bg-orange-50"
          iconTextClass="text-orange-600"
        />
        <MetricCard
          title="Active Users"
          value="156"
          icon={<Users size={18} />}
          iconBgClass="bg-blue-50"
          iconTextClass="text-blue-600"
        />
        <MetricCard
          title="System Status"
          value={<span className="font-extrabold">Operational</span>}
          icon={<ShieldCheck size={18} />}
          iconBgClass="bg-emerald-50"
          iconTextClass="text-emerald-600"
        />
        <MetricCard
          title="Pending Tasks"
          value="8"
          icon={<AlertCircle size={18} />}
          iconBgClass="bg-orange-50"
          iconTextClass="text-orange-600"
        />
      </div>

      {/* Quick actions */}
      <div className="space-y-3">
        <div className="text-base font-semibold text-gray-900">Quick Actions</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <QuickActionCard label="Create New Facility" icon={<Plus size={18} />} />
          <QuickActionCard label="Manage Users" icon={<UserCog size={18} />} />
          <QuickActionCard label="View Reports" icon={<ClipboardList size={18} />} />
          <QuickActionCard label="Backup Data" icon={<HardDrive size={18} />} />
        </div>
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="xl:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-orange-600" />
            <div className="font-semibold text-gray-900">Recent Activity</div>
          </div>

          <div className="divide-y divide-gray-100">
            {activityItems.map((item) => (
              <div key={item.title} className="py-4 flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${item.dot}`} />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{item.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System status */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="font-semibold text-gray-900 mb-4">System Status</div>
          <div className="space-y-4">
            {systemStatus.map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <div className="text-sm text-gray-700">{s.label}</div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium text-emerald-600">{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

