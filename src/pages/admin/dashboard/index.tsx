import {
  Building2,
  Blocks,
  DoorClosed,
  Users,
  RefreshCw,
  ArrowRight,
  BedDouble,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { ROUTES } from '@/constants';
import {
  fetchDashboardStats,
  fetchBedUsageStats,
  fetchUsers,
  type DashboardStatsResponse,
  type BedUsageStatsResponse,
  type BedUsageRoomType,
  type UserRecord,
} from '@/lib/actions/admin';

// ---------- helpers ----------
const fmt = (n: number) => n.toLocaleString('vi-VN');

// ---------- Skeleton ----------
function Skeleton({ className }: { className?: string }) {
  return <span className={`inline-block bg-gray-100 rounded animate-pulse ${className}`} />;
}

// ---------- Stat Card ----------
interface StatCardProps {
  title: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ReactNode;
  accentClass: string;
  iconBgClass: string;
  iconColorClass: string;
  onClick?: () => void;
  loading?: boolean;
}

function StatCard({
  title,
  value,
  hint,
  icon,
  accentClass,
  iconBgClass,
  iconColorClass,
  onClick,
  loading,
}: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`group relative bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all text-left overflow-hidden ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      {/* accent top bar */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${accentClass}`} />

      <div className="flex items-start justify-between gap-3 mt-1">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 leading-none">
            {loading ? <Skeleton className="w-14 h-7" /> : value}
          </p>
          {hint && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
        </div>
        <div
          className={`${iconBgClass} ${iconColorClass} w-11 h-11 rounded-xl flex items-center justify-center shrink-0`}
        >
          {icon}
        </div>
      </div>

      <div className={`mt-3 flex items-center gap-1 text-xs font-medium transition-colors ${
        onClick ? 'text-gray-400 group-hover:text-orange-500' : 'invisible'
      }`}>
        View details <ArrowRight size={12} className="mt-[1px]" />
      </div>
    </button>
  );
}

// ---------- Section Header ----------
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

// ---------- Bed Status Donut ----------
function BedStatusChart({
  occupied,
  available,
  maintenance,
}: {
  occupied: number;
  available: number;
  maintenance: number;
}) {
  const total = occupied + available + maintenance;
  const data = [
    { name: 'Occupied', value: occupied, color: '#3B82F6' },
    { name: 'Available', value: available, color: '#10B981' },
    { name: 'Maintenance', value: maintenance, color: '#F97316' },
  ];
  const pct = (v: number) =>
    total > 0 ? `${Math.round((v / total) * 100)}%` : '0%';

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm h-full">
      <SectionHeader title="Bed Status" subtitle="Current allocation overview" />

      <div className="flex items-center gap-5">
        {/* Donut chart */}
        <div className="relative shrink-0" style={{ width: 156, height: 156 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-gray-900">{fmt(total)}</span>
            <span className="text-[10px] text-gray-400">Total</span>
          </div>
        </div>

        {/* Legend + values */}
        <div className="flex-1 space-y-3">
          {data.map((item) => (
            <div key={item.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {fmt(item.value)}{' '}
                  <span className="text-gray-400 font-normal">{pct(item.value)}</span>
                </span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: total > 0 ? `${(item.value / total) * 100}%` : '0%',
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Occupancy rate footer */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-500">Occupancy Rate</span>
        <div className="flex items-center gap-3">
          <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: total > 0 ? `${(occupied / total) * 100}%` : '0%' }}
            />
          </div>
          <span className="text-sm font-bold text-blue-600">{pct(occupied)}</span>
        </div>
      </div>
    </div>
  );
}

// ---------- Occupancy By Block Bar Chart ----------
function OccupancyByBlockChart({
  data,
}: {
  data: { block: string; occupancyRate: number }[];
}) {
  const chartData = data.map((d) => ({
    ...d,
    fill:
      d.occupancyRate >= 90
        ? '#EF4444'
        : d.occupancyRate >= 70
        ? '#F97316'
        : '#10B981',
  }));

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm h-full">
      <SectionHeader
        title="Occupancy by Block"
        subtitle="Percentage of beds occupied per block"
      />

      {data.length === 0 ? (
        <div className="h-52 flex items-center justify-center text-sm text-gray-400">
          No data available
        </div>
      ) : (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 0, right: 28, top: 4, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="#F3F4F6"
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
              />
              <YAxis
                type="category"
                dataKey="block"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#6B7280' }}
                width={60}
              />
              <Tooltip
                formatter={(value: number) => [`${value}%`, 'Occupancy']}
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,.06)',
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="occupancyRate"
                radius={[0, 6, 6, 0]}
                barSize={20}
                maxBarSize={24}
                label={{ position: 'right', fontSize: 11, fill: '#9CA3AF', formatter: (v: number) => `${v}%` }}
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-3 flex items-center gap-5 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          &lt; 70%
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
          70 – 90%
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          ≥ 90%
        </div>
      </div>
    </div>
  );
}

// ---------- Room Type Bed Distribution ----------
function RoomTypeBedChart({ data }: { data: BedUsageRoomType[] }) {
  const chartData = data.map((d) => ({
    name: d.roomType,
    Used: d.usedBeds,
    Free: d.freeBeds,
    Maintenance: d.maintenanceBeds,
  }));

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <SectionHeader
        title="Beds by Room Type"
        subtitle="Status breakdown across room types"
      />

      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-gray-400">
          No data available
        </div>
      ) : (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ left: 0, right: 8, top: 4, bottom: 4 }}
              barGap={4}
              barCategoryGap="32%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#F3F4F6"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#6B7280' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,.06)',
                  fontSize: 12,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                iconType="circle"
                iconSize={8}
              />
              <Bar dataKey="Used" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={18} />
              <Bar dataKey="Free" fill="#10B981" radius={[4, 4, 0, 0]} barSize={18} />
              <Bar
                dataKey="Maintenance"
                fill="#F97316"
                radius={[4, 4, 0, 0]}
                barSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ---------- User Distribution Chart ----------
const ROLE_COLORS: Record<string, string> = {
  admin:    '#F97316',
  manager:  '#3B82F6',
  student:  '#10B981',
  security: '#8B5CF6',
  staff:    '#06B6D4',
};
const ROLE_FALLBACK = '#94A3B8';

function roleColor(role: string) {
  return ROLE_COLORS[role.toLowerCase()] ?? ROLE_FALLBACK;
}

function UserDistributionChart({ users }: { users: UserRecord[] }) {
  const navigate = useNavigate();

  const roleData = useMemo(() => {
    const map: Record<string, number> = {};
    users.forEach((u) => {
      const r = u.role?.toLowerCase() || 'unknown';
      map[r] = (map[r] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, color: roleColor(name) }))
      .sort((a, b) => b.value - a.value);
  }, [users]);

  const activeCount = users.filter((u) => u.is_active).length;
  const inactiveCount = users.length - activeCount;
  const total = users.length;

  const activeRate = total > 0 ? Math.round((activeCount / total) * 100) : 0;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm h-full">
      <div className="flex items-start justify-between mb-4">
        <SectionHeader title="User Overview" subtitle="Distribution by role & status" />
        <button
          type="button"
          onClick={() => navigate(ROUTES.ADMIN_USERS)}
          className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1 shrink-0 mt-0.5"
        >
          View all <ArrowRight size={12} />
        </button>
      </div>

      {total === 0 ? (
        <div className="h-40 flex items-center justify-center text-sm text-gray-400">
          No data available
        </div>
      ) : (
        <>
          {/* Donut + role list */}
          <div className="flex items-center gap-4">
            {/* Donut */}
            <div className="relative shrink-0" style={{ width: 130, height: 130 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={58}
                    paddingAngle={2}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {roleData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name]}
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #E5E7EB',
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-gray-900">{fmt(total)}</span>
                <span className="text-[10px] text-gray-400">Users</span>
              </div>
            </div>

            {/* Role breakdown list */}
            <div className="flex-1 space-y-2 min-w-0">
              {roleData.map((item) => (
                <div key={item.name} className="space-y-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-gray-600 capitalize">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800">
                      {item.value}
                      <span className="text-gray-400 font-normal ml-1">
                        {Math.round((item.value / total) * 100)}%
                      </span>
                    </span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(item.value / total) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active / Inactive footer */}
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50">
              <div className="bg-emerald-100 text-emerald-600 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                <UserCheck size={15} />
              </div>
              <div>
                <p className="text-[10px] text-emerald-600 font-medium">Active</p>
                <p className="text-base font-bold text-emerald-700 leading-tight">{fmt(activeCount)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50">
              <div className="bg-gray-200 text-gray-500 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                <UserX size={15} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-medium">Inactive</p>
                <p className="text-base font-bold text-gray-700 leading-tight">{fmt(inactiveCount)}</p>
              </div>
            </div>
          </div>

          {/* Active rate bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1 text-xs">
              <span className="text-gray-500">Active Rate</span>
              <span className="font-semibold text-emerald-600">{activeRate}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${activeRate}%` }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// =========== MAIN PAGE ===========

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashStats, setDashStats] = useState<DashboardStatsResponse | null>(null);
  const [bedUsage, setBedUsage] = useState<BedUsageStatsResponse | null>(null);
  const [userCount, setUserCount] = useState<number>(0);
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadStats = async (force = false) => {
    try {
      setLoading(true);
      setLoadError(null);

      const [dash, usage, users] = await Promise.all([
        fetchDashboardStats(force),
        fetchBedUsageStats(),
        fetchUsers({ page: 1, limit: 200 }),
      ]);

      setDashStats(dash);
      setBedUsage(usage);
      setUserCount(users.pagination.total);
      setAllUsers(users.items);
    } catch (e: any) {
      const msg = Array.isArray(e?.message)
        ? e.message.join(', ')
        : e?.message || 'Failed to load dashboard stats';
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const subtitle = useMemo(() => {
    const d = new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
    return `Overview • ${d}`;
  }, []);

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => loadStats(true)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* ---- Error ---- */}
      {loadError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <span className="font-semibold">Could not load stats: </span>
          {loadError}
        </div>
      )}

      {/* ---- Stat Cards ---- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Dorms"
          value={fmt(dashStats?.totalDorms ?? 0)}
          hint="Dorm buildings"
          loading={loading}
          onClick={() => navigate(ROUTES.ADMIN_DORMS)}
          icon={<Building2 size={18} />}
          accentClass="bg-orange-500"
          iconBgClass="bg-orange-50"
          iconColorClass="text-orange-500"
        />
        <StatCard
          title="Total Blocks"
          value={fmt(dashStats?.totalBlocks ?? 0)}
          hint="Across all dorms"
          loading={loading}
          onClick={() => navigate(ROUTES.ADMIN_BLOCKS)}
          icon={<Blocks size={18} />}
          accentClass="bg-blue-500"
          iconBgClass="bg-blue-50"
          iconColorClass="text-blue-600"
        />
        <StatCard
          title="Total Rooms"
          value={fmt(dashStats?.totalRooms ?? 0)}
          hint="Across all blocks"
          loading={loading}
          onClick={() => navigate(ROUTES.ADMIN_ROOMS)}
          icon={<DoorClosed size={18} />}
          accentClass="bg-emerald-500"
          iconBgClass="bg-emerald-50"
          iconColorClass="text-emerald-600"
        />
        <StatCard
          title="Total Beds"
          value={fmt(dashStats?.totalBeds ?? 0)}
          hint="All beds in system"
          loading={loading}
          icon={<BedDouble size={18} />}
          accentClass="bg-violet-500"
          iconBgClass="bg-violet-50"
          iconColorClass="text-violet-600"
        />
        <StatCard
          title="Total Users"
          value={fmt(userCount)}
          hint="All roles"
          loading={loading}
          onClick={() => navigate(ROUTES.ADMIN_USERS)}
          icon={<Users size={18} />}
          accentClass="bg-slate-500"
          iconBgClass="bg-slate-50"
          iconColorClass="text-slate-600"
        />
      </div>

      {/* ---- Charts Row 1: Occupancy by Block + Bed Status ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <OccupancyByBlockChart data={dashStats?.bedUsageByBlock ?? []} />
        </div>
        <div className="lg:col-span-2">
          <BedStatusChart
            occupied={dashStats?.occupiedBeds ?? 0}
            available={dashStats?.availableBeds ?? 0}
            maintenance={dashStats?.maintenanceBeds ?? 0}
          />
        </div>
      </div>

      {/* ---- Charts Row 2: Room Type + Alerts ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RoomTypeBedChart data={bedUsage?.byRoomType ?? []} />
        </div>
        <div>
          <UserDistributionChart users={allUsers} />
        </div>
      </div>
    </div>
  );
}
