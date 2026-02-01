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
import { RequestStatus } from '@/constants/manager.constant';
import type {
  IDashboardStats,
  IBedUsageByBlock,
  IBedStatusDistribution,
  IRecentRequest,
} from '@/interfaces/manager.interface';

const dashboardStats: IDashboardStats = {
  totalDorms: 5,
  totalBlocks: 25,
  totalRooms: 580,
  totalBeds: 2315,
  occupiedBeds: 1847,
  availableBeds: 423,
  pendingRequests: 23,
  unpaidInvoices: 47,
  unpaidAmount: 12450000,
  occupiedChange: 4.2,
  availableChange: -8,
};

const bedUsageData: IBedUsageByBlock[] = [
  { block: 'Block A', occupancyRate: 92 },
  { block: 'Block B', occupancyRate: 78 },
  { block: 'Block C', occupancyRate: 95 },
  { block: 'Block D', occupancyRate: 82 },
  { block: 'Block E', occupancyRate: 88 },
];

const bedStatusData: IBedStatusDistribution = {
  occupied: 80,
  available: 18,
  maintenance: 2,
};

const recentRequests: IRecentRequest[] = [
  {
    id: 'REQ-001',
    room: 'A101',
    type: 'Maintenance',
    status: RequestStatus.PENDING,
    date: '2026-01-24',
  },
  {
    id: 'REQ-002',
    room: 'B205',
    type: 'Cleaning',
    status: RequestStatus.IN_PROGRESS,
    date: '2026-01-23',
  },
  {
    id: 'REQ-003',
    room: 'C304',
    type: 'AC Repair',
    status: RequestStatus.COMPLETED,
    date: '2026-01-22',
  },
  {
    id: 'REQ-004',
    room: 'D102',
    type: 'Plumbing',
    status: RequestStatus.PENDING,
    date: '2026-01-22',
  },
  {
    id: 'REQ-005',
    room: 'E401',
    type: 'Electrical',
    status: RequestStatus.PENDING,
    date: '2026-01-21',
  },
];

export default function DashboardPage() {
  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value) + ' VND';
  };

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
          value={dashboardStats.totalDorms}
          subtitle="Active dormitories"
          icon={<Building2 size={24} />}
          variant="blue"
        />
        <StatCard
          title="Total Blocks"
          value={dashboardStats.totalBlocks}
          subtitle="Across all dorms"
          icon={<LayoutGrid size={24} />}
          variant="purple"
        />
        <StatCard
          title="Total Rooms"
          value={dashboardStats.totalRooms}
          subtitle="Including all types"
          icon={<DoorOpen size={24} />}
          variant="cyan"
        />
        <StatCard
          title="Total Beds"
          value={dashboardStats.totalBeds.toLocaleString()}
          subtitle="Capacity"
          icon={<Bed size={24} />}
          variant="pink"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Occupied Beds"
          value={dashboardStats.occupiedBeds.toLocaleString()}
          change={dashboardStats.occupiedChange}
          icon={<CheckCircle size={24} />}
          variant="success"
        />
        <StatCard
          title="Available Beds"
          value={dashboardStats.availableBeds}
          change={dashboardStats.availableChange}
          icon={<Clock size={24} />}
          variant="warning"
        />
        <StatCard
          title="Pending Requests"
          value={dashboardStats.pendingRequests}
          subtitle="Requires attention"
          icon={<FileText size={24} />}
          variant="orange"
        />
        <StatCard
          title="Unpaid Invoices"
          value={dashboardStats.unpaidInvoices}
          subtitle={`Total: ${formatMoney(dashboardStats.unpaidAmount)}`}
          icon={<FileText size={24} />}
          variant="danger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BedUsageChart data={bedUsageData} />
        <BedStatusChart data={bedStatusData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickActions />
        <RecentRequests data={recentRequests} />
      </div>
    </div>
  );
}
