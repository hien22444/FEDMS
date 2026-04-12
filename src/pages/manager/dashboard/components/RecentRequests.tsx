import { Table, Tag, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { IRecentRequest } from '@/interfaces/manager.interface';

interface RecentRequestsProps {
  data: IRecentRequest[];
}

const STATUS_STYLE_MAP: Record<string, { color: string; bg: string }> = {
  pending: { color: '#F59E0B', bg: '#FEF3C7' },
  in_progress: { color: '#3B82F6', bg: '#DBEAFE' },
  in_review: { color: '#3B82F6', bg: '#DBEAFE' },
  approved: { color: '#3B82F6', bg: '#DBEAFE' },
  assigned: { color: '#6366F1', bg: '#EDE9FE' },
  completed: { color: '#10B981', bg: '#D1FAE5' },
  done: { color: '#10B981', bg: '#D1FAE5' },
  resolved: { color: '#10B981', bg: '#D1FAE5' },
  rejected: { color: '#EF4444', bg: '#FEE2E2' },
  cancelled: { color: '#6B7280', bg: '#F3F4F6' },
};
const DEFAULT_STYLE = { color: '#6B7280', bg: '#F3F4F6' };

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
    render: (room: string) => (
      <span className="text-blue-600 hover:underline cursor-pointer">{room}</span>
    ),
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
    render: (status: string) => {
      const style = STATUS_STYLE_MAP[status?.toLowerCase()] ?? DEFAULT_STYLE;
      return (
        <Tag
          style={{
            color: style.color,
            backgroundColor: style.bg,
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {status?.replace(/_/g, ' ') ?? '—'}
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
  const navigate = useNavigate();
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Recent Requests</h3>
          <p className="text-xs text-gray-500">Latest facility requests from students</p>
        </div>
        <Button type="link" onClick={() => navigate('/manager/requests')} className="text-gray-600 hover:text-orange-500 p-0 flex items-center gap-1">
          View all <ArrowRight size={16} />
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
