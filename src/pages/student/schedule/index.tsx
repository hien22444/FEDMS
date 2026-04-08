import React, { useEffect, useState } from 'react';
import { Table, Button, Typography, Spin, Tag, Modal } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { getMyBookings, getRoommates } from '@/lib/actions';
import type { BookingRequestItem, RoommateItem } from '@/lib/actions';
import { useAuth } from '@/contexts';
import { useWindowSize } from '@/hooks/useWindowSize';

const { Title, Text } = Typography;

const parseSemester = (semesterLabel: string): { semester: number; year: number } => {
  const [name, year] = semesterLabel.split('-');
  const map: Record<string, number> = { Spring: 1, Summer: 2, Fall: 3 };
  return { semester: map[name] ?? 0, year: parseInt(year, 10) };
};

const formatCheckout = (endDate: string): string => {
  const end = new Date(endDate);
  if (end > new Date()) return '';
  return end.toLocaleDateString('en-GB');
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN').format(amount) + ' VND';

const buildRoomCode = (params: {
  dormCode?: string;
  blockCode?: string;
  roomNumber?: string;
}) => {
  const dormCode = String(params.dormCode || '').trim();
  const blockCode = String(params.blockCode || '').trim();
  const roomNumber = String(params.roomNumber || '').trim();

  const blockPart = dormCode
    ? (blockCode.toLowerCase().startsWith(dormCode.toLowerCase()) ? blockCode : `${dormCode}${blockCode}`)
    : blockCode;

  if (blockPart && roomNumber) return `${blockPart}-${roomNumber}`;
  return roomNumber || blockPart || '-';
};

const RoommatesModal: React.FC<{ booking: BookingRequestItem; open: boolean; onClose: () => void }> = ({
  booking,
  open,
  onClose,
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
      render: (value: string) => `Bed ${value}`,
    },
    { title: 'Phone Number', dataIndex: 'phone', key: 'phone' },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={<Button onClick={onClose}>Close</Button>}
      title={<span><TeamOutlined style={{ marginRight: 8 }} />Roommates - Room {booking.room?.room_number}</span>}
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
          scroll={{ x: 640 }}
        />
      )}
    </Modal>
  );
};

const Schedule: React.FC = () => {
  const { profile } = useAuth();
  const { width } = useWindowSize();
  const isTablet = width >= 768;
  const [records, setRecords] = useState<BookingRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [roommatesBooking, setRoommatesBooking] = useState<BookingRequestItem | null>(null);

  useEffect(() => {
    getMyBookings({ page: 1, limit: 50 })
      .then((data) => {
        const approved = data.items.filter((booking) => booking.status === 'approved');
        setRecords(approved);
      })
      .catch(() => {
        setRecords([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const isActiveBooking = (record: BookingRequestItem) => {
    if (record.checkout_date) return false;
    if (!record.end_date) return true;
    return new Date(record.end_date) > new Date();
  };

  const renderBedInfo = (
    room?: { room_number?: string; block?: { dorm?: { dorm_code?: string }; block_code?: string; block_name?: string } },
    bedNum?: string | number | null
  ) => {
    const roomLabel = buildRoomCode({
      dormCode: room?.block?.dorm?.dorm_code ?? '',
      blockCode: room?.block?.block_code ?? room?.block?.block_name ?? '',
      roomNumber: room?.room_number ?? '',
    });
    return (
      <Text strong>
        {roomLabel}
        {bedNum != null && <Text style={{ marginLeft: 10, fontWeight: 400 }}>Bed {bedNum}</Text>}
      </Text>
    );
  };

  const hasAnyBedTransfer = records.some((r) => r.bed_transfer?.bed_number);

  const columns = [
    {
      title: 'Student ID',
      key: 'student_id',
      render: () => <Text strong>{profile?.student_code ?? '-'}</Text>,
    },
    {
      title: 'Bed Information',
      key: 'bed_info',
      render: (_: unknown, record: BookingRequestItem) => {
        const dormCode = record.room?.block?.dorm?.dorm_code ?? '';
        const blockCode = record.room?.block?.block_code ?? '';
        const roomNumber = record.room?.room_number ?? '';
        const bedNumber = record.bed?.bed_number;
        const roomLabel = `${dormCode}${blockCode}-${roomNumber}`;
        return (
          <Text strong>
            {roomLabel}
            {bedNumber != null && <Text style={{ marginLeft: 10, fontWeight: 400 }}>Bed {bedNumber}</Text>}
          </Text>
        );
      },
    },
    ...(hasAnyBedTransfer
      ? [{
          title: 'Bed Transfer',
          key: 'bed_transfer',
          render: (_: unknown, record: BookingRequestItem) => {
            if (!record.bed_transfer?.bed_number) return null;
            return renderBedInfo(record.bed_transfer.room, record.bed_transfer.bed_number);
          },
        }]
      : []),
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

        const dateLabel = record.end_date ? formatCheckout(record.end_date) : '';
        return dateLabel ? <Text>{dateLabel}</Text> : <Text type="secondary"></Text>;
      },
    },
    {
      title: 'Price',
      key: 'price',
      render: (_: unknown, record: BookingRequestItem) => (
        <Text strong style={{ color: '#1a6ef5' }}>
          {record.invoice?.total_amount != null ? formatCurrency(record.invoice.total_amount) : '-'}
        </Text>
      ),
    },
    {
      title: 'Semester',
      key: 'semester',
      render: (_: unknown, record: BookingRequestItem) => {
        const { semester } = parseSemester(record.semester ?? '');
        return <Tag color="blue">{semester || '-'}</Tag>;
      },
    },
    {
      title: 'Year',
      key: 'year',
      render: (_: unknown, record: BookingRequestItem) => {
        const { year } = parseSemester(record.semester ?? '');
        return <Text>{year || '-'}</Text>;
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
    <div style={{ padding: isTablet ? '32px 40px' : '16px', background: '#fff', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Title level={2} style={{ color: '#1a3c6e', marginBottom: 28 }}>
          Room History
        </Title>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
          </div>
        ) : records.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '55vh',
              textAlign: 'center',
            }}
          >
            <img
              src="/images/booking-not-started.png"
              alt="No record"
              style={{ width: isTablet ? 320 : 220, maxWidth: '100%', marginBottom: 28, opacity: 0.92 }}
            />
            <Title level={3} style={{ color: '#ea580c', fontWeight: 700, margin: 0 }}>
              No record found
            </Title>
          </div>
        ) : (
          <Table
            dataSource={records}
            columns={columns}
            rowKey="id"
            pagination={false}
            bordered
            scroll={{ x: 900 }}
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
