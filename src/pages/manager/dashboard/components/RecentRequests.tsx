import { Table, Tag, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { RiArrowRightLine } from 'react-icons/ri';
import { RequestStatus } from '@/constants/manager.constant';
import type { IRecentRequest } from '@/interfaces/manager.interface';

interface RecentRequestsProps {
  data: IRecentRequest[];
}

const statusColors: Record<RequestStatus, { color: string; bg: string }> = {
  [RequestStatus.PENDING]: { color: '#F59E0B', bg: '#FEF3C7' },
  [RequestStatus.IN_PROGRESS]: { color: '#3B82F6', bg: '#DBEAFE' },
  [RequestStatus.COMPLETED]: { color: '#10B981', bg: '#D1FAE5' },
  [RequestStatus.REJECTED]: { color: '#EF4444', bg: '#FEE2E2' },
};

const columns: ColumnsType<IRecentRequest> = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 100,
  },
  {
    title: 'Room',
    dataIndex: 'room',
    key: 'room',
    width: 100,
    render: (room: string) => <span className="text-blue-600 hover:underline cursor-pointer">{room}</span>,
  },
  {
    title: 'Type',
    dataIndex: 'type',
    key: 'type',
    width: 120,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: (status: RequestStatus) => {
      const style = statusColors[status];
      return (
        <Tag
          style={{
            color: style.color,
            backgroundColor: style.bg,
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {status.replace('_', ' ')}
        </Tag>
      );
    },
  },
  {
    title: 'Date',
    dataIndex: 'date',
    key: 'date',
    width: 120,
  },
];

export default function RecentRequests({ data }: RecentRequestsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Recent Requests</h3>
          <p className="text-xs text-gray-500">Latest facility requests from students</p>
        </div>
        <Button type="link" className="text-gray-600 hover:text-orange-500 p-0 flex items-center gap-1">
          View all <RiArrowRightLine />
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={false}
        size="small"
        className="recent-requests-table"
      />
    </div>
  );
}
