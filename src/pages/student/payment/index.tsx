import React, { useEffect, useMemo, useState } from 'react';
import {
  Button, Card, Col, Descriptions, Empty, Modal, Row, Space, Statistic,
  Table, Tag, Typography, message, theme, Divider, Badge,
} from 'antd';
import {
  ReloadOutlined, ClockCircleOutlined, CheckCircleOutlined,
  CloseCircleOutlined, FileTextOutlined, CreditCardOutlined,
  HomeOutlined, CalendarOutlined, DollarOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { cancelBookingRequest, checkPaymentStatus, getMyBookings } from '@/lib/actions';
import type { BookingRequestItem } from '@/lib/actions';
import { ROUTES } from '@/constants';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';

const useCountdown = (expiresAt?: string) => {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () =>
      setRemaining(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const mm = Math.floor(remaining / 60).toString().padStart(2, '0');
  const ss = (remaining % 60).toString().padStart(2, '0');
  return { remaining, label: `${mm}:${ss}` };
};

const statusMeta: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  awaiting_payment: { color: 'warning', icon: <ClockCircleOutlined />, label: 'Awaiting Payment' },
  approved: { color: 'success', icon: <CheckCircleOutlined />, label: 'Paid' },
  cancelled: { color: 'default', icon: <CloseCircleOutlined />, label: 'Cancelled' },
  expired: { color: 'error', icon: <ExclamationCircleOutlined />, label: 'Expired' },
};

// ─── Pending Card ─────────────────────────────────────────────────────────────
const PendingCard: React.FC<{
  booking: BookingRequestItem;
  onPay: () => void;
  onCancel: () => void;
  onDetails: () => void;
}> = ({ booking, onPay, onDetails }) => {
  const { token } = theme.useToken();
  const { remaining, label } = useCountdown(booking.expires_at);
  const isUrgent = remaining > 0 && remaining <= 120;
  const isExpired = remaining === 0;

  return (
    <Card
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${isUrgent || isExpired ? token.colorError : token.colorBorderSecondary}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
      styles={{ body: { padding: 0 } }}
    >
      {/* Colored top strip */}
      <div style={{
        height: 4,
        background: isExpired
          ? token.colorError
          : isUrgent
            ? `linear-gradient(90deg, ${token.colorWarning}, ${token.colorError})`
            : `linear-gradient(90deg, #1a6ef5, #0ea5e9)`,
      }} />

      <div style={{ padding: '20px 24px' }}>
        <Row gutter={[24, 16]} align="middle">
          {/* Left: Invoice info */}
          <Col xs={24} md={14}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: '#f0f5ff', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <FileTextOutlined style={{ fontSize: 22, color: '#1a6ef5' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Text strong style={{ fontSize: 15 }}>{booking.invoice?.invoice_code ?? '—'}</Text>
                  <Tag color="warning" icon={<ClockCircleOutlined />} style={{ margin: 0 }}>
                    Awaiting Payment
                  </Tag>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 16px' }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    <HomeOutlined style={{ marginRight: 4 }} />
                    {booking.room?.block?.dorm?.dorm_name ?? '—'}
                    {booking.room?.room_number ? ` · Room ${booking.room.room_number}` : ''}
                    {booking.bed?.bed_number ? ` · Bed ${booking.bed.bed_number}` : ''}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    <CalendarOutlined style={{ marginRight: 4 }} />
                    {booking.semester?.replace('-', ' ') ?? '—'}
                  </Text>
                </div>
              </div>
            </div>
          </Col>

          {/* Center: amount + timer */}
          <Col xs={24} md={6}>
            <div style={{ textAlign: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: 700, color: token.colorPrimary, display: 'block' }}>
                {formatCurrency(booking.invoice?.total_amount ?? 0)}
              </Text>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6,
                padding: '3px 10px', borderRadius: 20,
                background: isExpired ? '#fff1f0' : isUrgent ? '#fff7e6' : '#f6ffed',
                border: `1px solid ${isExpired ? '#ffccc7' : isUrgent ? '#ffd591' : '#b7eb8f'}`,
              }}>
                <ClockCircleOutlined style={{
                  fontSize: 12,
                  color: isExpired ? token.colorError : isUrgent ? token.colorWarning : token.colorSuccess,
                }} />
                <Text style={{
                  fontSize: 14, fontWeight: 600, fontFamily: 'monospace',
                  color: isExpired ? token.colorError : isUrgent ? token.colorWarning : token.colorSuccess,
                }}>
                  {isExpired ? 'Expired' : label}
                </Text>
              </div>
            </div>
          </Col>

          {/* Right: actions */}
          <Col xs={24} md={4}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button
                type="primary"
                icon={<CreditCardOutlined />}
                block
                disabled={isExpired}
                onClick={onPay}
                style={{ borderRadius: 8 }}
              >
                Pay Now
              </Button>
              <Button
                icon={<FileTextOutlined />}
                block
                onClick={onDetails}
                style={{ borderRadius: 8 }}
              >
                Details
              </Button>
            </div>
          </Col>
        </Row>
      </div>
    </Card>
  );
};

// ─── Invoice Detail Modal ──────────────────────────────────────────────────────
const InvoiceModal: React.FC<{
  booking: BookingRequestItem | null;
  open: boolean;
  onClose: () => void;
}> = ({ booking, open, onClose }) => {
  if (!booking) return null;
  const inv = booking.invoice;
  const meta = statusMeta[booking.status] ?? statusMeta.cancelled;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={<Button onClick={onClose}>Close</Button>}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#f0f5ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FileTextOutlined style={{ color: '#1a6ef5', fontSize: 18 }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Invoice Details</div>
            <div style={{ fontWeight: 400, fontSize: 12, color: '#888' }}>{inv?.invoice_code}</div>
          </div>
        </div>
      }
      width={560}
      centered
    >
      {/* Status banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
        borderRadius: 8, marginBottom: 20,
        background: booking.status === 'approved' ? '#f6ffed'
          : booking.status === 'awaiting_payment' ? '#fffbe6'
            : '#fff1f0',
        border: `1px solid ${booking.status === 'approved' ? '#b7eb8f'
          : booking.status === 'awaiting_payment' ? '#ffe58f' : '#ffccc7'}`,
      }}>
        {meta.icon}
        <Text strong style={{ fontSize: 13 }}>{meta.label}</Text>
      </div>

      <Descriptions column={2} size="small" bordered labelStyle={{ width: 130, fontWeight: 500 }}>
        <Descriptions.Item label="Invoice Code" span={2}>
          <Text strong>{inv?.invoice_code ?? '—'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Semester" span={2}>
          {booking.semester?.replace('-', ' ') ?? '—'}
        </Descriptions.Item>
      </Descriptions>

      <Divider style={{ margin: '16px 0', fontSize: 13 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>Room Information</Text>
      </Divider>

      <Descriptions column={2} size="small" bordered labelStyle={{ width: 130, fontWeight: 500 }}>
        <Descriptions.Item label="Dorm">
          {booking.room?.block?.dorm?.dorm_name ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Room Type">
          {booking.room?.room_type ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Room">
          {booking.room?.room_number ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Bed">
          {booking.bed?.bed_number ?? '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Start Date">
          {booking.start_date ? new Date(booking.start_date).toLocaleDateString('vi-VN') : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="End Date">
          {booking.end_date ? new Date(booking.end_date).toLocaleDateString('vi-VN') : '—'}
        </Descriptions.Item>
      </Descriptions>

      <Divider style={{ margin: '16px 0' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>Payment</Text>
      </Divider>

      {/* Amount row */}
      <div style={{
        background: '#fafafa', borderRadius: 10, padding: '16px 20px',
        border: '1px solid #f0f0f0',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text type="secondary">Room Fee</Text>
          <Text strong>{formatCurrency(inv?.total_amount ?? 0)}</Text>
        </div>
        <Divider style={{ margin: '10px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong style={{ fontSize: 15 }}>Total Amount</Text>
          <Text strong style={{ fontSize: 20, color: '#1a6ef5' }}>
            {formatCurrency(inv?.total_amount ?? 0)}
          </Text>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 13 }}>
        <Text type="secondary">
          Due: {inv?.due_date ? new Date(inv.due_date).toLocaleDateString('vi-VN') : '—'}
        </Text>
        <Text type="secondary">
          Requested: {new Date(booking.requested_at).toLocaleDateString('vi-VN')}
        </Text>
      </div>
    </Modal>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const Payment: React.FC = () => {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<BookingRequestItem[]>([]);
  const [detailBooking, setDetailBooking] = useState<BookingRequestItem | null>(null);

  const pending = useMemo(() => items.filter((b) => b.status === 'awaiting_payment'), [items]);
  const history = useMemo(() => items.filter((b) => b.status !== 'awaiting_payment'), [items]);

  const totalPending = useMemo(
    () => pending.reduce((s, b) => s + (b.invoice?.total_amount ?? 0), 0),
    [pending]
  );
  const totalPaid = useMemo(
    () => history
      .filter((b) => b.status === 'approved')
      .reduce((s, b) => s + (b.invoice?.total_amount ?? 0), 0),
    [history]
  );

  const load = async () => {
    setLoading(true);
    try {
      const data = await getMyBookings({ page: 1, limit: 50 });
      setItems(data.items);
    } catch {
      message.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const handleFocus = async () => {
      const hasPending = items.some((b) => b.status === 'awaiting_payment');
      if (!hasPending) return;
      try {
        const results = await Promise.all(
          items.filter((b) => b.status === 'awaiting_payment')
            .map((b) => checkPaymentStatus(b.id).catch(() => null))
        );
        if (results.some((r) => r && (r.paid || r.status === 'approved' || r.status === 'cancelled' || r.status === 'expired'))) {
          load();
        }
      } catch { /* ignore */ }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [items]);

  const handleCancel = async (bookingId: string) => {
    try {
      await cancelBookingRequest(bookingId);
      message.success('Cancelled');
      load();
    } catch (e: unknown) {
      message.error((e as { message?: string })?.message || 'Cancel failed');
    }
  };

  // ─── History table columns ──────────────────────────────────────────────────
  const historyColumns: ColumnsType<BookingRequestItem> = [
    {
      title: 'Invoice',
      dataIndex: ['invoice', 'invoice_code'],
      render: (code: string) => <Text strong style={{ fontFamily: 'monospace' }}>{code ?? '—'}</Text>,
    },
    {
      title: 'Room',
      render: (_, b) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 13 }}>
            {b.room?.block?.dorm?.dorm_name ?? '—'} · Room {b.room?.room_number ?? '—'}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {b.semester?.replace('-', ' ')}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Amount',
      dataIndex: ['invoice', 'total_amount'],
      align: 'right',
      render: (amt: number) => (
        <Text strong>{formatCurrency(amt ?? 0)}</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      align: 'center',
      render: (s: string) => {
        const m = statusMeta[s] ?? statusMeta.cancelled;
        return <Tag color={m.color} icon={m.icon}>{m.label}</Tag>;
      },
    },
    {
      title: 'Action',
      align: 'center',
      render: (_, b) => (
        <Button
          size="small"
          icon={<FileTextOutlined />}
          onClick={() => setDetailBooking(b)}
          style={{ borderRadius: 6 }}
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '32px 40px', background: token.colorBgLayout, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <Title level={2} style={{ marginBottom: 2, color: '#1a3c6e' }}>Payment</Title>
            <Text type="secondary">Manage your invoices and payment history</Text>
          </div>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={load} style={{ borderRadius: 8 }}>
            Refresh
          </Button>
        </div>

        {/* ── Stats row ── */}
        <Row gutter={16} style={{ marginBottom: 28 }}>
          {[
            {
              title: 'Pending',
              value: pending.length,
              suffix: 'invoice(s)',
              color: '#fa8c16',
              bg: '#fff7e6',
              border: '#ffd591',
              icon: <ClockCircleOutlined style={{ fontSize: 22, color: '#fa8c16' }} />,
            },
            {
              title: 'Pending Amount',
              value: formatCurrency(totalPending),
              color: '#cf1322',
              bg: '#fff1f0',
              border: '#ffccc7',
              icon: <DollarOutlined style={{ fontSize: 22, color: '#cf1322' }} />,
              isAmount: true,
            },
            {
              title: 'Total Paid',
              value: formatCurrency(totalPaid),
              color: '#389e0d',
              bg: '#f6ffed',
              border: '#b7eb8f',
              icon: <CheckCircleOutlined style={{ fontSize: 22, color: '#389e0d' }} />,
              isAmount: true,
            },
          ].map((s) => (
            <Col xs={24} sm={8} key={s.title}>
              <Card
                style={{
                  borderRadius: 12, border: `1px solid ${s.border}`,
                  background: s.bg, boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                }}
                styles={{ body: { padding: '16px 20px' } }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10, background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  }}>
                    {s.icon}
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{s.title}</Text>
                    {s.isAmount ? (
                      <Text strong style={{ fontSize: 17, color: s.color }}>{s.value}</Text>
                    ) : (
                      <Statistic
                        value={s.value as number}
                        suffix={s.suffix}
                        valueStyle={{ fontSize: 20, fontWeight: 700, color: s.color, lineHeight: 1.2 }}
                      />
                    )}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* ── Pending Invoices ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Title level={4} style={{ margin: 0 }}>Pending Invoices</Title>
            {pending.length > 0 && (
              <Badge count={pending.length} color="#fa8c16" />
            )}
          </div>

          {pending.length === 0 ? (
            <Card style={{ borderRadius: 12 }} styles={{ body: { padding: '16px 24px' } }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                styles={{ image: { height: 40 } }}
                description={<Text type="secondary">No pending invoices — you're all caught up!</Text>}
              />
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pending.map((b) => (
                <PendingCard
                  key={b.id}
                  booking={b}
                  onPay={() => navigate(ROUTES.STUDENT_BOOKING, { state: { resumeBookingId: b.id } })}
                  onCancel={() => handleCancel(b.id)}
                  onDetails={() => setDetailBooking(b)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── History ── */}
        <div>
          <Title level={4} style={{ marginBottom: 14 }}>Payment History</Title>
          {history.length === 0 ? (
            <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 32, textAlign: 'center' } }}>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No payment history" />
            </Card>
          ) : (
            <Card
              style={{ borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
              styles={{ body: { padding: 0 } }}
            >
              <Table<BookingRequestItem>
                dataSource={history}
                columns={historyColumns}
                rowKey="id"
                pagination={{ pageSize: 10, showSizeChanger: false, size: 'small' }}
                size="middle"
                style={{ borderRadius: 12, overflow: 'hidden' }}
              />
            </Card>
          )}
        </div>
      </div>

      {/* ── Invoice Detail Modal ── */}
      <InvoiceModal
        booking={detailBooking}
        open={!!detailBooking}
        onClose={() => setDetailBooking(null)}
      />
    </div>
  );
};

export default Payment;
