import {
  Building2,
  Blocks,
  DoorClosed,
  Package,
  Users,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants';
import {
  fetchBlocks,
  fetchDorms,
  fetchEquipmentTemplates,
  fetchRooms,
  fetchUsers,
} from '@/lib/actions/admin';

type MetricCardProps = {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  iconBgClass: string;
  iconTextClass: string;
  hint?: string;
  onClick?: () => void;
  loading?: boolean;
};

function MetricCard({
  title,
  value,
  icon,
  iconBgClass,
  iconTextClass,
  hint,
  onClick,
  loading,
}: MetricCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`group bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow text-left ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs text-gray-500 font-medium">{title}</div>
          <div className="mt-1 text-2xl font-bold text-gray-900">
            {loading ? <span className="text-gray-300">--</span> : value}
          </div>
          {hint && <div className="mt-1 text-xs text-gray-400">{hint}</div>}
        </div>
        <div
          className={`${iconBgClass} ${iconTextClass} w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}
        >
          {icon}
        </div>
      </div>
      {onClick && (
        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-gray-500 group-hover:text-gray-700">
          View details <ArrowRight size={14} className="mt-[1px]" />
        </div>
      )}
    </button>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    dorms: number;
    blocks: number;
    rooms: number;
    facilities: number;
    users: number;
  } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const [dormRes, blockRes, roomRes, facilityRes, userRes] = await Promise.all([
        fetchDorms({ page: 1, limit: 1 }),
        fetchBlocks({ page: 1, limit: 1 }),
        fetchRooms({ page: 1, limit: 1 }),
        fetchEquipmentTemplates({ page: 1, limit: 1 }),
        fetchUsers({ page: 1, limit: 1 }),
      ]);

      setStats({
        dorms: dormRes.pagination.total,
        blocks: blockRes.pagination.total,
        rooms: roomRes.pagination?.total ?? roomRes.items.length,
        facilities: facilityRes.pagination.total,
        users: userRes.pagination.total,
      });
    } catch (e: any) {
      const msg = Array.isArray(e?.message) ? e.message.join(', ') : e?.message || 'Failed to load dashboard stats';
      setLoadError(msg);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const subtitle = useMemo(() => {
    const date = new Date();
    const d = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
    return `Overview • ${d}`;
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={loadStats}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-800 hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <MetricCard
          title="Total Dorms"
          value={stats?.dorms ?? 0}
          loading={loading}
          hint="Dorm buildings"
          onClick={() => navigate(ROUTES.ADMIN_DORMS)}
          icon={<Building2 size={18} />}
          iconBgClass="bg-orange-50"
          iconTextClass="text-orange-600"
        />
        <MetricCard
          title="Total Blocks"
          value={stats?.blocks ?? 0}
          loading={loading}
          hint="Blocks in all dorms"
          onClick={() => navigate(ROUTES.ADMIN_BLOCKS)}
          icon={<Blocks size={18} />}
          iconBgClass="bg-blue-50"
          iconTextClass="text-blue-600"
        />
        <MetricCard
          title="Total Rooms"
          value={stats?.rooms ?? 0}
          loading={loading}
          hint="Rooms across blocks"
          onClick={() => navigate(ROUTES.ADMIN_ROOMS)}
          icon={<DoorClosed size={18} />}
          iconBgClass="bg-emerald-50"
          iconTextClass="text-emerald-600"
        />
        <MetricCard
          title="Total Facilities"
          value={stats?.facilities ?? 0}
          loading={loading}
          hint="Device templates"
          onClick={() => navigate(ROUTES.ADMIN_FACILITIES)}
          icon={<Package size={18} />}
          iconBgClass="bg-purple-50"
          iconTextClass="text-purple-600"
        />
        <MetricCard
          title="Total Users"
          value={stats?.users ?? 0}
          loading={loading}
          hint="All roles"
          onClick={() => navigate(ROUTES.ADMIN_USERS)}
          icon={<Users size={18} />}
          iconBgClass="bg-slate-50"
          iconTextClass="text-slate-700"
        />
      </div>

      {loadError && (
        <div className="bg-white border border-red-200 rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-semibold text-red-700">Couldn’t load dashboard stats</div>
          <div className="text-sm text-red-600 mt-1">{loadError}</div>
        </div>
      )}
    </div>
  );
}

