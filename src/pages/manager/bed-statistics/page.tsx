import {
  RiHotelBedLine,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiToolsLine,
} from 'react-icons/ri';
import { StatCard } from '../dashboard/components';
import {
  FilterBar,
  OccupancyTrendChart,
  BlockComparisonChart,
  StatusByBlockChart,
  RoomOccupancyTable,
} from './components';
import type {
  IBedStatsSummary,
  IOccupancyTrend,
  IBlockStatistics,
  IRoomOccupancy,
} from '@/interfaces/manager.interface';

// Mock data - replace with API calls
const bedStatsSummary: IBedStatsSummary = {
  totalBeds: 2315,
  occupiedBeds: 1847,
  availableBeds: 423,
  maintenanceBeds: 45,
  occupancyRate: 79.8,
  changeFromLastWeek: 2.3,
};

const occupancyTrendData: IOccupancyTrend[] = [
  { date: 'Jan 20', occupied: 1820, available: 450 },
  { date: 'Jan 21', occupied: 1835, available: 435 },
  { date: 'Jan 22', occupied: 1828, available: 442 },
  { date: 'Jan 23', occupied: 1840, available: 430 },
  { date: 'Jan 24', occupied: 1855, available: 415 },
  { date: 'Jan 25', occupied: 1842, available: 428 },
  { date: 'Jan 26', occupied: 1847, available: 423 },
];

const blockStatisticsData: IBlockStatistics[] = [
  { block: 'Block A', totalBeds: 500, occupied: 460, available: 35, maintenance: 5, occupancyRate: 92 },
  { block: 'Block B', totalBeds: 450, occupied: 351, available: 90, maintenance: 9, occupancyRate: 78 },
  { block: 'Block C', totalBeds: 480, occupied: 456, available: 19, maintenance: 5, occupancyRate: 95 },
  { block: 'Block D', totalBeds: 420, occupied: 344, available: 67, maintenance: 9, occupancyRate: 82 },
  { block: 'Block E', totalBeds: 465, occupied: 409, available: 39, maintenance: 17, occupancyRate: 88 },
];

const roomOccupancyData: IRoomOccupancy[] = [
  { id: '1', room: 'A101', block: 'A', capacity: 8, occupied: 8, status: 'Full' },
  { id: '2', room: 'A102', block: 'A', capacity: 8, occupied: 6, status: 'Available' },
  { id: '3', room: 'A103', block: 'A', capacity: 8, occupied: 8, status: 'Full' },
  { id: '4', room: 'B201', block: 'B', capacity: 6, occupied: 4, status: 'Available' },
  { id: '5', room: 'B202', block: 'B', capacity: 6, occupied: 6, status: 'Full' },
  { id: '6', room: 'B203', block: 'B', capacity: 6, occupied: 0, status: 'Maintenance' },
  { id: '7', room: 'C301', block: 'C', capacity: 8, occupied: 8, status: 'Full' },
  { id: '8', room: 'C302', block: 'C', capacity: 8, occupied: 7, status: 'Available' },
  { id: '9', room: 'D401', block: 'D', capacity: 6, occupied: 5, status: 'Available' },
  { id: '10', room: 'D402', block: 'D', capacity: 6, occupied: 0, status: 'Maintenance' },
  { id: '11', room: 'E501', block: 'E', capacity: 8, occupied: 8, status: 'Full' },
  { id: '12', room: 'E502', block: 'E', capacity: 8, occupied: 3, status: 'Available' },
];

export default function BedStatisticsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bed Usage Statistics</h1>
        <p className="text-sm text-gray-500">Detailed analysis of bed occupancy and trends</p>
      </div>

      {/* Filter Bar */}
      <FilterBar />

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Beds"
          value={bedStatsSummary.totalBeds.toLocaleString()}
          subtitle="Across all blocks"
          icon={<RiHotelBedLine size={24} />}
          variant="blue"
        />
        <StatCard
          title="Occupied Beds"
          value={bedStatsSummary.occupiedBeds.toLocaleString()}
          subtitle={`${bedStatsSummary.occupancyRate}% occupancy rate`}
          change={bedStatsSummary.changeFromLastWeek}
          icon={<RiCheckboxCircleLine size={24} />}
          variant="success"
        />
        <StatCard
          title="Available Beds"
          value={bedStatsSummary.availableBeds}
          subtitle="Ready for booking"
          icon={<RiTimeLine size={24} />}
          variant="warning"
        />
        <StatCard
          title="Maintenance"
          value={bedStatsSummary.maintenanceBeds}
          subtitle="Under repair"
          icon={<RiToolsLine size={24} />}
          variant="orange"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OccupancyTrendChart data={occupancyTrendData} />
        <BlockComparisonChart data={blockStatisticsData} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusByBlockChart data={blockStatisticsData} />
        <RoomOccupancyTable data={roomOccupancyData} />
      </div>
    </div>
  );
}
