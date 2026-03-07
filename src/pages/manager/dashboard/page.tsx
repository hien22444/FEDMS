import { useEffect, useState } from 'react';
import {
  Building2,
  LayoutGrid,
  DoorOpen,
  Bed,
  CheckCircle,
  Clock,
  FileText,
} from 'lucide-react';
import { StatCard, BedUsageChart, BedStatusChart, QuickActions, RecentRequests } from './components';
import type {
  IBedStatusDistribution,
  IRecentRequest,
} from '@/interfaces/manager.interface';
import { fetchDashboardStats, type DashboardStatsResponse } from '@/lib/actions/admin';

const DEFAULT_STATS: DashboardStatsResponse = {
  totalDorms: 0, totalBlocks: 0, totalRooms: 0, totalBeds: 0,
  occupiedBeds: 0, availableBeds: 0, maintenanceBeds: 0,
  pendingRequests: 0, unpaidInvoices: 0, unpaidAmount: 0,
  bedUsageByBlock: [],
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStatsResponse>(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats(true)
      .then((data) => { if (data) setStats(data); })
      .catch((err) => console.error('Dashboard load error:', err))
      .finally(() => setLoading(false));
  }, []);

  const bedStatusData: IBedStatusDistribution = {
    occupied: stats.occupiedBeds,
    available: stats.availableBeds,
    maintenance: stats.maintenanceBeds,
  };

  const recentRequests: IRecentRequest[] = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500">
          Welcome back! Here is an overview of your dormitory system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Dorms"
          value={loading ? '—' : stats.totalDorms}
          subtitle="Active dormitories"
          icon={<Building2 size={24} />}
          variant="blue"
        />
        <StatCard
          title="Total Blocks"
          value={loading ? '—' : stats.totalBlocks}
          subtitle="Across all dorms"
          icon={<LayoutGrid size={24} />}
          variant="purple"
        />
        <StatCard
          title="Total Rooms"
          value={loading ? '—' : stats.totalRooms}
          subtitle="Including all types"
          icon={<DoorOpen size={24} />}
          variant="cyan"
        />
        <StatCard
          title="Total Beds"
          value={loading ? '—' : stats.totalBeds.toLocaleString()}
          subtitle="Capacity"
          icon={<Bed size={24} />}
          variant="pink"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Occupied Beds"
          value={loading ? '—' : stats.occupiedBeds.toLocaleString()}
          icon={<CheckCircle size={24} />}
          variant="success"
        />
        <StatCard
          title="Available Beds"
          value={loading ? '—' : stats.availableBeds.toLocaleString()}
          icon={<Clock size={24} />}
          variant="warning"
        />
        <StatCard
          title="Pending Requests"
          value={stats.pendingRequests}
          subtitle="Requires attention"
          icon={<FileText size={24} />}
          variant="orange"
        />
        <StatCard
          title="Unpaid Invoices"
          value={stats.unpaidInvoices}
          subtitle="Total: 0 VND"
          icon={<FileText size={24} />}
          variant="danger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BedUsageChart data={stats.bedUsageByBlock} />
        <BedStatusChart data={bedStatusData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions />
        <RecentRequests data={recentRequests} />
      </div>
    </div>
  );
}
