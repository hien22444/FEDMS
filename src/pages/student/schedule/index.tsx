import React, { useEffect, useState } from 'react';
import { Table, Button, Typography, Spin, Tag, Modal } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { getMyBookings, getRoommates } from '@/lib/actions';
import type { BookingRequestItem, RoommateItem } from '@/lib/actions';
import { useAuth } from '@/contexts';

const { Title, Text } = Typography;

// Parse "Spring-2026" → { semester: 1, year: 2026 }
const parseSemester = (sem: string): { semester: number; year: number } => {
  const [name, year] = sem.split('-');
  const map: Record<string, number> = { Spring: 1, Summer: 2, Fall: 3 };
  return { semester: map[name] ?? 0, year: parseInt(year, 10) };
};

// Show date only when checkout has actually happened (end_date passed), else blank
const formatCheckout = (endDate: string): string => {
  const end = new Date(endDate);
  if (end > new Date()) return '';
  return end.toLocaleDateString('en-GB'); // DD/MM/YYYY
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN').format(amount) + ' VND';

const RoommatesModal: React.FC<{ booking: BookingRequestItem; open: boolean; onClose: () => void }> = ({
  booking, open, onClose,
}) => {
  const [roommates, setRoommates] = useState<RoommateItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getRoommates(booking.id)
      .then(setRoommates)
      .catch(() => setRoommates([]))
      .finally(() => setLoading(false));
  }, [open, booking.id]);

  const columns = [
    { title: 'Student ID', dataIndex: 'student_code', key: 'student_code' },
    { title: 'Full Name', dataIndex: 'full_name', key: 'full_name' },
    {
      title: 'Bed',
      dataIndex: 'bed_number',
      key: 'bed_number',
      render: (val: string) => `Bed ${val}`,
    },
    { title: 'Phone Number', dataIndex: 'phone', key: 'phone' },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={<Button onClick={onClose}>Close</Button>}
      title={<span><TeamOutlined style={{ marginRight: 8 }} />Roommates — Room {booking.room?.room_number}</span>}
      width={700}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin />
        </div>
      ) : (
        <Table
          dataSource={roommates}
          columns={columns}
          rowKey="student_code"
          pagination={false}
          size="small"
          bordered
        />
      )}
    </Modal>
  );
};

const Schedule: React.FC = () => {
  const { profile } = useAuth();
  const [records, setRecords] = useState<BookingRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [roommatesBooking, setRoommatesBooking] = useState<BookingRequestItem | null>(null);

  useEffect(() => {
    getMyBookings({ page: 1, limit: 50 })
      .then((data) => {
        const approved = data.items.filter((b) => b.status === 'approved');
        setRecords(approved);
      })
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      title: 'Student ID',
      key: 'student_id',
      render: () => (
        <Text strong>{profile?.student_code ?? '—'}</Text>
      ),
    },
    {
      title: 'Bed Information',
      key: 'bed_info',
      render: (_: unknown, record: BookingRequestItem) => {
        const dormCode = record.room?.block?.dorm?.dorm_code ?? '';
        const blockCode = record.room?.block?.block_code ?? '';
        const roomNum = record.room?.room_number ?? '';
        const bedNum = record.bed?.bed_number;
        const roomLabel = `${dormCode}${blockCode}-${roomNum}`;
        return (
          <Text strong>
            {roomLabel}
            {bedNum != null && (
              <Text style={{ marginLeft: 10, fontWeight: 400 }}>Bed {bedNum}</Text>
            )}
          </Text>
        );
      },
    },
    {
      title: 'Check-out Date',
      key: 'checkout',
      render: (_: unknown, record: BookingRequestItem) => {
        if (record.checkout_date) {
          return (
            <Text style={{ color: '#cf1322' }}>
              {new Date(record.checkout_date).toLocaleDateString('en-GB')}
            </Text>
          );
        }
        const dateStr = record.end_date ? formatCheckout(record.end_date) : '';
        return dateStr ? <Text>{dateStr}</Text> : <Text type="secondary"></Text>;
      },
    },
    {
      title: 'Price',
      key: 'price',
      render: (_: unknown, record: BookingRequestItem) => (
        <Text strong style={{ color: '#1a6ef5' }}>
          {record.invoice?.total_amount != null
            ? formatCurrency(record.invoice.total_amount)
            : '—'}
        </Text>
      ),
    },
    {
      title: 'Semester',
      key: 'semester',
      render: (_: unknown, record: BookingRequestItem) => {
        const { semester } = parseSemester(record.semester ?? '');
        return <Tag color="blue">{semester || '—'}</Tag>;
      },
    },
    {
      title: 'Year',
      key: 'year',
      render: (_: unknown, record: BookingRequestItem) => {
        const { year } = parseSemester(record.semester ?? '');
        return <Text>{year || '—'}</Text>;
      },
    },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, record: BookingRequestItem) => (
        <Button
          type="primary"
          size="small"
          icon={<TeamOutlined />}
          onClick={() => setRoommatesBooking(record)}
          style={{ borderRadius: 6 }}
        >
          Roommates
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '32px 40px', background: '#fff', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Title level={2} style={{ color: '#1a3c6e', marginBottom: 28 }}>
          Room History
        </Title>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
          </div>
        ) : records.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: '55vh', textAlign: 'center',
          }}>
            <img
              src="/images/booking-not-started.png"
              alt="No record"
              style={{ width: 320, marginBottom: 28, opacity: 0.92 }}
            />
            <Title level={3} style={{ color: '#ea580c', fontWeight: 700, margin: 0 }}>
              No record found!
            </Title>
          </div>
        ) : (
          <Table
            dataSource={records}
            columns={columns}
            rowKey="id"
            pagination={false}
            bordered
          />
        )}

        {roommatesBooking && (
          <RoommatesModal
            booking={roommatesBooking}
            open={!!roommatesBooking}
            onClose={() => setRoommatesBooking(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Schedule;
