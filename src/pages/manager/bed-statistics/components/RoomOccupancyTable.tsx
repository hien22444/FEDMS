import { Table, Tag, Progress } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Table as TableIcon } from 'lucide-react';
import type { IRoomOccupancy } from '@/interfaces/manager.interface';

interface RoomOccupancyTableProps {
  data: IRoomOccupancy[];
}

const statusConfig = {
  Full: { color: '#3B82F6', bg: '#DBEAFE', label: 'Full' },
  Available: { color: '#10B981', bg: '#D1FAE5', label: 'Available' },
  Maintenance: { color: '#F97316', bg: '#FFEDD5', label: 'Maintenance' },
};

const columns: ColumnsType<IRoomOccupancy> = [
  {
    title: 'Room',
    dataIndex: 'room',
    key: 'room',
    width: 100,
    sorter: (a, b) => a.room.localeCompare(b.room),
    render: (room: string) => <span className="font-medium text-gray-900">{room}</span>,
  },
  {
    title: 'Block',
    dataIndex: 'block',
    key: 'block',
    width: 100,
    filters: [
      { text: 'Block A', value: 'A' },
      { text: 'Block B', value: 'B' },
      { text: 'Block C', value: 'C' },
      { text: 'Block D', value: 'D' },
      { text: 'Block E', value: 'E' },
    ],
    onFilter: (value, record) => record.block === value,
    render: (block: string) => <span className="text-gray-600">Block {block}</span>,
  },
  {
    title: 'Capacity',
    dataIndex: 'capacity',
    key: 'capacity',
    width: 100,
    align: 'center',
    sorter: (a, b) => a.capacity - b.capacity,
  },
  {
    title: 'Occupied',
    dataIndex: 'occupied',
    key: 'occupied',
    width: 100,
    align: 'center',
    sorter: (a, b) => a.occupied - b.occupied,
  },
  {
    title: 'Occupancy',
    key: 'occupancy',
    width: 180,
    render: (_, record) => {
      const rate = Math.round((record.occupied / record.capacity) * 100);
      return (
        <div className="flex items-center gap-2">
          <Progress
            percent={rate}
            size="small"
            strokeColor={rate >= 90 ? '#EF4444' : rate >= 70 ? '#F97316' : '#10B981'}
            showInfo={false}
            className="flex-1"
          />
          <span className="text-xs font-medium text-gray-600 w-10">{rate}%</span>
        </div>
      );
    },
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    filters: [
      { text: 'Full', value: 'Full' },
      { text: 'Available', value: 'Available' },
      { text: 'Maintenance', value: 'Maintenance' },
    ],
    onFilter: (value, record) => record.status === value,
    render: (status: keyof typeof statusConfig) => {
      const config = statusConfig[status];
      return (
        <Tag
          style={{
            color: config.color,
            backgroundColor: config.bg,
            border: 'none',
            borderRadius: '6px',
            fontWeight: 500,
          }}
        >
          {config.label}
        </Tag>
      );
    },
  },
];

export default function RoomOccupancyTable({ data }: RoomOccupancyTableProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <TableIcon className="text-cyan-500" size={20} />
        <div>
          <h3 className="font-semibold text-gray-900">Room Occupancy Details</h3>
          <p className="text-xs text-gray-500">Detailed view of all rooms</p>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={{
          pageSize: 5,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} rooms`,
        }}
        size="small"
        className="room-occupancy-table"
      />
    </div>
  );
}
