import { RequestStatus, RequestType } from '@/constants/manager.constant';

// Dashboard Stats
export interface IDashboardStats {
  totalDorms: number;
  totalBlocks: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  pendingRequests: number;
  unpaidInvoices: number;
  unpaidAmount: number;
  occupiedChange: number;
  availableChange: number;
}

// Bed Usage by Block
export interface IBedUsageByBlock {
  block: string;
  occupancyRate: number;
}

// Bed Status Distribution
export interface IBedStatusDistribution {
  occupied: number;
  available: number;
  maintenance: number;
}

// Recent Request
export interface IRecentRequest {
  id: string;
  room: string;
  type: RequestType | string;
  status: RequestStatus;
  date: string;
}

// Quick Action
export interface IQuickAction {
  title: string;
  description: string;
  icon: string;
  path: string;
}

// ============ Bed Statistics Interfaces ============

// Occupancy Trend Data (for line chart)
export interface IOccupancyTrend {
  date: string;
  occupied: number;
  available: number;
}

// Block Statistics (for comparison)
export interface IBlockStatistics {
  block: string;
  totalBeds: number;
  occupied: number;
  available: number;
  maintenance: number;
  occupancyRate: number;
}

// Room Occupancy Detail (for table)
export interface IRoomOccupancy {
  id: string;
  room: string;
  block: string;
  capacity: number;
  occupied: number;
  status: 'Full' | 'Available' | 'Maintenance';
}

// Bed Statistics Summary
export interface IBedStatsSummary {
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  maintenanceBeds: number;
  occupancyRate: number;
  changeFromLastWeek: number;
}
