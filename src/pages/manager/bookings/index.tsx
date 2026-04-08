import { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Input,
  Space,
  Card,
  Button,
  message,
  Modal,
  Form,
} from 'antd';
import { Search, Mail } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import toast from 'react-hot-toast';
import { getAllBookings, sendEmailToStudent, sendEmailToAllStudents } from '@/lib/actions';
import type { BookingRequestItem } from '@/lib/actions';

const statusConfig: Record<string, { color: string; label: string }> = {
  awaiting_payment: { color: 'warning', label: 'Awaiting Payment' },
  approved: { color: 'success', label: 'Approved' },
  cancelled: { color: 'default', label: 'Cancelled' },
  expired: { color: 'error', label: 'Expired' },
};

const ManagerBookings = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BookingRequestItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [search, setSearch] = useState('');
  const [emailModal, setEmailModal] = useState<{ open: boolean; bookingId: string; studentName: string } | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailForm] = Form.useForm();
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastForm] = Form.useForm();

  const fetchData = async (page = 1, overrides?: { search?: string }) => {
    setLoading(true);
    const q = overrides !== undefined ? overrides.search : search;
    try {
      const res = await getAllBookings({
        page,
        limit: pagination.limit,
        search: q || undefined,
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
    setSearch('');
    fetchData(1, { search: '' });
  };

  const handleBroadcast = async () => {
    const values = await broadcastForm.validateFields();
    setBroadcastSending(true);
    try {
      const res = await sendEmailToAllStudents({ subject: values.subject, body: values.body });
      toast.success(`Email sent to ${res.count} students!`);
      setBroadcastOpen(false);
      broadcastForm.resetFields();
    } catch {
      toast.error('Failed to send broadcast email');
    } finally {
      setBroadcastSending(false);
    }
  };

  const handleSendEmail = async () => {
    const values = await emailForm.validateFields();
    setEmailSending(true);
    try {
      await sendEmailToStudent(emailModal!.bookingId, { subject: values.subject, body: values.body });
      toast.success('Email sent successfully!');
      setEmailModal(null);
      emailForm.resetFields();
    } catch {
      toast.error('Failed to send email');
    } finally {
      setEmailSending(false);
    }
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
      title: 'Bed',
      key: 'bed',
      width: 160,
      render: (_, record) => {
        const block = record.room?.block;
        const dormCode = block?.dorm?.dorm_code || '';
        const blockCode = block?.block_code || '';
        const roomNumber = record.room?.room_number || '';
        const bedNumber = record.bed?.bed_number || '';
        const transferRoom = record.bed_transfer?.room || record.room_transfer || null;
        const transferBlock = transferRoom?.block;
        const transferDormCode = transferBlock?.dorm?.dorm_code || '';
        const transferBlockCode = transferBlock?.block_code || transferBlock?.block_name || '';
        const transferRoomNumber = transferRoom?.room_number || '';
        const transferBedNumber = record.bed_transfer?.bed_number || '';
        if (!dormCode && !blockCode && !roomNumber && !bedNumber) return '—';
        return (
          <div className="font-mono text-sm leading-5">
            <div>
              {dormCode}{blockCode}-{roomNumber} Bed {bedNumber}
            </div>
            {transferBedNumber ? (
              <div className="text-xs text-blue-600 mt-0.5">
                {transferDormCode}{transferBlockCode}-{transferRoomNumber} Bed {transferBedNumber}
              </div>
            ) : null}
          </div>
        );
      },
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
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
      width: 180,
      render: (val: string) => val || '',
    },
    {
      title: 'Email',
      key: 'email',
      width: 130,
      render: (_, record: any) => (
        <Button
          size="small"
          icon={<Mail className="w-3.5 h-3.5" />}
          onClick={() =>
            setEmailModal({
              open: true,
              bookingId: record.id,
              studentName: record.student?.full_name || 'Student',
            })
          }
        >
          Send Email
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Booking Management</h1>
        <p className="text-sm text-gray-500">View all student booking requests</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Search by name, student code or semester..."
            prefix={<Search className="w-4 h-4 text-gray-400" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 320 }}
            onPressEnter={handleSearch}
          />
          <Space>
            <Button type="primary" onClick={handleSearch}>
              Search
            </Button>
            <Button onClick={handleReset}>Reset</Button>
          </Space>
          </div>
          <Button
            type="primary"
            icon={<Mail className="w-4 h-4" />}
            onClick={() => setBroadcastOpen(true)}
          >
            Send Email to All Students
          </Button>
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
      <Modal
        title="Send Email to All Students"
        open={broadcastOpen}
        onOk={handleBroadcast}
        onCancel={() => { setBroadcastOpen(false); broadcastForm.resetFields(); }}
        okText="Send to All"
        confirmLoading={broadcastSending}
        destroyOnClose
      >
        <Form form={broadcastForm} layout="vertical" className="mt-4">
          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: 'Please enter a subject' }]}
          >
            <Input placeholder="Email subject" />
          </Form.Item>
          <Form.Item
            name="body"
            label="Content"
            rules={[{ required: true, message: 'Please enter content' }]}
          >
            <Input.TextArea rows={6} placeholder="Email content..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Send Email to ${emailModal?.studentName}`}
        open={emailModal?.open ?? false}
        onOk={handleSendEmail}
        onCancel={() => { setEmailModal(null); emailForm.resetFields(); }}
        okText="Send"
        confirmLoading={emailSending}
        destroyOnClose
      >
        <Form form={emailForm} layout="vertical" className="mt-4">
          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: 'Please enter a subject' }]}
          >
            <Input placeholder="Email subject" />
          </Form.Item>
          <Form.Item
            name="body"
            label="Content"
            rules={[{ required: true, message: 'Please enter content' }]}
          >
            <Input.TextArea rows={6} placeholder="Email content..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManagerBookings;
