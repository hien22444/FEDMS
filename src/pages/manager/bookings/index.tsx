import { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Select,
  Input,
  Space,
  Card,
  Button,
  message,
} from 'antd';
import { Search } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import { getAllBookings } from '@/lib/actions';
import type { BookingRequestItem } from '@/lib/actions';

const statusConfig: Record<string, { color: string; label: string }> = {
  awaiting_payment: { color: 'warning', label: 'Awaiting Payment' },
  approved: { color: 'success', label: 'Approved' },
  cancelled: { color: 'default', label: 'Cancelled' },
  expired: { color: 'error', label: 'Expired' },
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN').format(amount) + ' VND';

const ManagerBookings = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BookingRequestItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [semesterFilter, setSemesterFilter] = useState('');

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const res = await getAllBookings({
        page,
        limit: pagination.limit,
        status: statusFilter,
        semester: semesterFilter || undefined,
      });
      setData(res.items);
      setPagination((prev) => ({
        ...prev,
        page: res.pagination.page,
        total: res.pagination.total,
      }));
    } catch {
      message.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, []);

  const handleSearch = () => fetchData(1);

  const handleReset = () => {
    setStatusFilter(undefined);
    setSemesterFilter('');
    setTimeout(() => fetchData(1), 0);
  };

  const columns: ColumnsType<BookingRequestItem> = [
    {
      title: 'Student',
      key: 'student',
      width: 180,
      render: (_, record: any) => (
        <div>
          <span className="font-medium">{record.student?.full_name || '—'}</span>
          <br />
          <span className="text-xs text-gray-500">{record.student?.student_code || ''}</span>
        </div>
      ),
    },
    {
      title: 'Room',
      key: 'room',
      width: 140,
      render: (_, record) => (
        <span className="font-mono text-sm">{record.room?.room_number || '—'}</span>
      ),
    },
    {
      title: 'Dorm / Block',
      key: 'dorm_block',
      width: 160,
      render: (_, record) => {
        const block = record.room?.block;
        return (
          <span className="text-sm">
            {block?.dorm?.dorm_name || '—'} / {block?.block_code || '—'}
          </span>
        );
      },
    },
    {
      title: 'Bed',
      dataIndex: ['bed', 'bed_number'],
      key: 'bed',
      width: 80,
      render: (val: string) => val || '—',
    },
    {
      title: 'Room Type',
      dataIndex: ['room', 'room_type'],
      key: 'room_type',
      width: 140,
    },
    {
      title: 'Semester',
      dataIndex: 'semester',
      key: 'semester',
      width: 120,
      render: (val: string) => val?.replace('-', ' - ') || '—',
    },
    {
      title: 'Invoice',
      key: 'invoice',
      width: 160,
      render: (_, record) => {
        if (!record.invoice) return '—';
        return (
          <div>
            <span className="text-sm">{formatCurrency(record.invoice.total_amount)}</span>
            <br />
            <Tag
              color={record.invoice.payment_status === 'paid' ? 'success' : 'warning'}
              style={{ marginTop: 2 }}
            >
              {record.invoice.payment_status}
            </Tag>
          </div>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => {
        const cfg = statusConfig[status] || statusConfig.cancelled;
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Requested At',
      dataIndex: 'requested_at',
      key: 'requested_at',
      width: 160,
      render: (val: string) =>
        val ? new Date(val).toLocaleString('vi-VN') : '—',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Booking Management</h1>
        <p className="text-sm text-gray-500">View all student booking requests</p>
      </div>

      <Card>
        <div className="flex flex-wrap gap-4">
          <Select
            placeholder="Status"
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 180 }}
            options={Object.entries(statusConfig).map(([value, cfg]) => ({
              value,
              label: cfg.label,
            }))}
          />
          <Input
            placeholder="Semester (e.g. Summer-2026)"
            prefix={<Search className="w-4 h-4 text-gray-400" />}
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            style={{ width: 220 }}
            onPressEnter={handleSearch}
          />
          <Space>
            <Button type="primary" onClick={handleSearch}>
              Search
            </Button>
            <Button onClick={handleReset}>Reset</Button>
          </Space>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} records`,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, limit: pageSize ?? prev.limit }));
              fetchData(page);
            },
          }}
        />
      </Card>
    </div>
  );
};

export default ManagerBookings;
