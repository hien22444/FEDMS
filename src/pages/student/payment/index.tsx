import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button, Card, Col, Descriptions, Empty, Modal, Popconfirm, Row, Space, Statistic,
  Table, Tag, Typography, message, theme, Divider, Badge,
} from 'antd';
import {
  ReloadOutlined, ClockCircleOutlined, CheckCircleOutlined,
  CloseCircleOutlined, FileTextOutlined, CreditCardOutlined,
  HomeOutlined, CalendarOutlined, DollarOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  cancelBookingRequest,
  cancelTransferRequest,
  checkPaymentStatus,
  getMyBookings,
  getMyTransferRequests,
  checkTransferPaymentStatus,
} from '@/lib/actions';
import type { BookingRequestItem, RoomTransferRequest } from '@/lib/actions';
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

/** Countdown for longer windows (e.g. 36h bed-upgrade supplement). */
const useLongCountdown = (expiresAt?: string | null) => {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () =>
      setRemaining(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const isExpired = !!expiresAt && remaining === 0 && new Date(expiresAt).getTime() <= Date.now();
  return { remaining, label, isExpired };
};

const transferUpgradeRoomBedLabel = (r: RoomTransferRequest) => {
  const room = r.requested_room;
  const bed = r.requested_bed;
  const dormCode = String(room?.block?.dorm?.dorm_code || '').trim();
  const blockCodeRaw = String(room?.block?.block_code || room?.block?.block_name || '').trim();
  const blockCode = blockCodeRaw.replace(/\s+/g, '');
  const roomNumber = String(room?.room_number || '').trim();
  const fullBlockPrefix = dormCode
    ? (blockCode.toLowerCase().startsWith(dormCode.toLowerCase()) ? blockCode : `${dormCode}${blockCode}`)
    : blockCode;
  const roomLabel = roomNumber
    ? (fullBlockPrefix ? `${fullBlockPrefix}-${roomNumber}` : roomNumber)
    : (fullBlockPrefix || '—');
  const bn = bed?.bed_number ?? '—';
  return `${roomLabel} · Bed ${bn}`;
};

const transferRequestedLabel = (r: RoomTransferRequest) => {
  const dorm = r.requested_room?.block?.dorm?.dorm_name ?? '—';
  return `New bed: ${dorm} · ${transferUpgradeRoomBedLabel(r)}`;
};

/** Transfers that belong in payment history (not in-flight; has price change or supplement). */
const isTransferPaymentHistoryRow = (t: RoomTransferRequest) => {
  if (['pending_partner', 'pending_manager', 'pending_payment_upgrade'].includes(t.status)) return false;
  const upgrade =
    t.price_adjustment_type === 'upgrade' ||
    Number(t.supplement_amount) > 0 ||
    !!(t.supplement_invoice && typeof t.supplement_invoice === 'object');
  const downgrade = t.price_adjustment_type === 'downgrade';
  return upgrade || downgrade;
};

const transferSupplementAmount = (t: RoomTransferRequest) => {
  if (Number(t.supplement_amount) > 0) return Number(t.supplement_amount);
  const inv = t.supplement_invoice && typeof t.supplement_invoice === 'object'
    ? (t.supplement_invoice as { total_amount?: number }).total_amount
    : undefined;
  return typeof inv === 'number' && !Number.isNaN(inv) ? inv : 0;
};

const transferHistoryInvoiceCode = (t: RoomTransferRequest) => {
  const inv = t.supplement_invoice && typeof t.supplement_invoice === 'object'
    ? (t.supplement_invoice as { invoice_code?: string }).invoice_code
    : undefined;
  return inv || t.request_code;
};

type PaymentHistoryRow =
  | { kind: 'booking'; item: BookingRequestItem }
  | { kind: 'transfer'; item: RoomTransferRequest };

const transferHistoryStatusDisplay = (t: RoomTransferRequest) => {
  if (t.status === 'approved') return { color: 'success', icon: <CheckCircleOutlined />, label: 'Paid' };
  if (t.status === 'rejected') return { color: 'error', icon: <CloseCircleOutlined />, label: 'Rejected' };
  if (t.status === 'pending_refund_office') {
    return { color: 'cyan', icon: <ClockCircleOutlined />, label: 'Refund at office' };
  }
  if (t.status === 'cancelled') {
    const r = (t.rejection_reason || '').toLowerCase();
    if (r.includes('36 hours') || r.includes('not completed in time')) {
      return { color: 'error', icon: <ExclamationCircleOutlined />, label: 'Expired' };
    }
    return { color: 'default', icon: <CloseCircleOutlined />, label: 'Cancelled' };
  }
  return { color: 'default', icon: <FileTextOutlined />, label: t.status };
};

const TransferUpgradeInvoiceModal: React.FC<{
  transfer: RoomTransferRequest;
  open: boolean;
  onClose: () => void;
  /** From Payment History — hide “awaiting pay” messaging. */
  variant?: 'pending' | 'history';
}> = ({ transfer, open, onClose, variant = 'pending' }) => {
  const inv =
    transfer.supplement_invoice && typeof transfer.supplement_invoice === 'object'
      ? (transfer.supplement_invoice as { invoice_code?: string; total_amount?: number })
      : null;

  const hist = variant === 'history' ? transferHistoryStatusDisplay(transfer) : null;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={<Button onClick={onClose}>Close</Button>}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#f9f0ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileTextOutlined style={{ color: '#722ed1', fontSize: 18 }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Bed upgrade supplement</div>
            <div style={{ fontWeight: 400, fontSize: 12, color: '#888' }}>
              {inv?.invoice_code ?? transfer.request_code}
            </div>
          </div>
        </div>
      }
      width={560}
      centered
    >
      {variant === 'history' && hist ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 8,
            marginBottom: 20,
            background: '#fafafa',
            border: '1px solid #f0f0f0',
          }}
        >
          {hist.icon}
          <Text strong style={{ fontSize: 13 }}>Status: {hist.label}</Text>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderRadius: 8,
            marginBottom: 20,
            background: '#fffbe6',
            border: '1px solid #ffe58f',
          }}
        >
          <ClockCircleOutlined />
          <Text strong style={{ fontSize: 13 }}>
            Awaiting payment — complete within 36 hours of manager approval.
          </Text>
        </div>
      )}

      <Descriptions column={1} size="small" bordered labelStyle={{ width: 160, fontWeight: 500 }}>
        <Descriptions.Item label="Request code">{transfer.request_code}</Descriptions.Item>
        <Descriptions.Item label="Invoice code">{inv?.invoice_code ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Target bed">{transferRequestedLabel(transfer)}</Descriptions.Item>
        <Descriptions.Item label="New bed price (per semester)">
          {typeof transfer.requested_room?.price_per_semester === 'number' &&
          !Number.isNaN(transfer.requested_room.price_per_semester) ? (
            <Text strong>{formatCurrency(transfer.requested_room.price_per_semester)}</Text>
          ) : (
            '—'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Supplement amount">
          <Text strong style={{ color: '#722ed1' }}>
            {formatCurrency(Number(transfer.supplement_amount) || 0)}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Payment deadline">
          {transfer.payment_deadline
            ? new Date(transfer.payment_deadline).toLocaleString('vi-VN')
            : '—'}
        </Descriptions.Item>
      </Descriptions>
      {variant === 'pending' ? (
        <Text type="secondary" style={{ display: 'block', marginTop: 16, fontSize: 12 }}>
          Use <Text strong>Pay Now</Text> on the Payment page to open the PayOS checkout when you are ready.
        </Text>
      ) : null}
    </Modal>
  );
};

const TransferUpgradePendingCard: React.FC<{ transfer: RoomTransferRequest; onPaid: () => void }> = ({
  transfer,
  onPaid,
}) => {
  const { token } = theme.useToken();
  const { label, isExpired, remaining } = useLongCountdown(transfer.payment_deadline ?? null);
  const isUrgent = remaining > 0 && remaining <= 2 * 3600;
  const [fetching, setFetching] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const invCode =
    transfer.supplement_invoice && typeof transfer.supplement_invoice === 'object'
      ? (transfer.supplement_invoice as { invoice_code?: string }).invoice_code
      : undefined;

  return (
    <>
    <Card
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${isUrgent || isExpired ? token.colorError : token.colorBorderSecondary}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
      styles={{ body: { padding: 0 } }}
    >
      <div
        style={{
          height: 4,
          background: isExpired
            ? token.colorError
            : isUrgent
              ? `linear-gradient(90deg, ${token.colorWarning}, ${token.colorError})`
              : `linear-gradient(90deg, #722ed1, #1a6ef5)`,
        }}
      />
      <div style={{ padding: '20px 24px' }}>
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} md={14}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: '#f9f0ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <FileTextOutlined style={{ fontSize: 22, color: '#722ed1' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <Text strong style={{ fontSize: 15 }}>
                    {invCode ?? transfer.request_code}
                  </Text>
                  <Tag color="purple" style={{ margin: 0 }}>
                    Bed upgrade
                  </Tag>
                </div>
                <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
                  {transferRequestedLabel(transfer)}
                </Text>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                  Pay the price difference for your approved room change (36h deadline).
                </Text>
              </div>
            </div>
          </Col>
          <Col xs={24} md={6}>
            <div style={{ textAlign: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: 700, color: '#722ed1', display: 'block' }}>
                {formatCurrency(Number(transfer.supplement_amount) || 0)}
              </Text>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: 6,
                  padding: '3px 10px',
                  borderRadius: 20,
                  background: isExpired ? '#fff1f0' : isUrgent ? '#fff7e6' : '#f6ffed',
                  border: `1px solid ${isExpired ? '#ffccc7' : isUrgent ? '#ffd591' : '#b7eb8f'}`,
                }}
              >
                <ClockCircleOutlined style={{ fontSize: 12 }} />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    color: isExpired ? token.colorError : isUrgent ? token.colorWarning : token.colorSuccess,
                  }}
                >
                  {isExpired ? 'Expired' : `Time left ${label}`}
                </Text>
              </div>
            </div>
          </Col>
          <Col xs={24} md={4}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<CreditCardOutlined />}
                block
                disabled={isExpired}
                loading={fetching}
                onClick={async () => {
                  try {
                    setFetching(true);
                    const res = await checkTransferPaymentStatus(transfer.id);
                    if (res.paid) {
                      message.success('Payment received. Your bed change is complete.');
                      onPaid();
                      return;
                    }
                    const url = res.payos?.checkoutUrl ?? null;
                    if (url) window.open(url, '_blank', 'noopener,noreferrer');
                    else message.warning('No payment link available yet. Try again shortly.');
                  } catch (e: unknown) {
                    message.error((e as { message?: string })?.message || 'Could not open payment');
                  } finally {
                    setFetching(false);
                  }
                }}
                style={{ borderRadius: 8, background: '#722ed1' }}
              >
                Pay Now
              </Button>
              <Button
                block
                icon={<FileTextOutlined />}
                onClick={() => setDetailOpen(true)}
                style={{ borderRadius: 8 }}
              >
                Details
              </Button>
              <Popconfirm
                title="Cancel this upgrade payment?"
                description="The supplement invoice will be cancelled (same as booking) and the reserved new bed will be released."
                okText="Cancel payment"
                cancelText="Keep"
                disabled={isExpired}
                onConfirm={async () => {
                  try {
                    setCancelling(true);
                    await cancelTransferRequest(transfer.id);
                    message.success('Upgrade payment cancelled');
                    onPaid();
                  } catch (e: unknown) {
                    message.error((e as { message?: string })?.message || 'Cancel failed');
                  } finally {
                    setCancelling(false);
                  }
                }}
              >
                <Button
                  block
                  danger
                  disabled={isExpired}
                  loading={cancelling}
                  icon={<CloseCircleOutlined />}
                  style={{ borderRadius: 8 }}
                >
                  Cancel payment
                </Button>
              </Popconfirm>
            </Space>
          </Col>
        </Row>
      </div>
    </Card>
    <TransferUpgradeInvoiceModal transfer={transfer} open={detailOpen} onClose={() => setDetailOpen(false)} />
    </>
  );
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
  const [transferRequests, setTransferRequests] = useState<RoomTransferRequest[]>([]);
  const [transferPending, setTransferPending] = useState<RoomTransferRequest[]>([]);
  const [detailBooking, setDetailBooking] = useState<BookingRequestItem | null>(null);
  const [detailTransfer, setDetailTransfer] = useState<RoomTransferRequest | null>(null);

  const pending = useMemo(() => items.filter((b) => b.status === 'awaiting_payment'), [items]);
  const history = useMemo(() => items.filter((b) => b.status !== 'awaiting_payment'), [items]);
  const transferHistory = useMemo(
    () => transferRequests.filter(isTransferPaymentHistoryRow),
    [transferRequests]
  );

  const upgradeSupplementTotal = useMemo(
    () =>
      transferPending.reduce((s, t) => s + (Number(t.supplement_amount) || 0), 0),
    [transferPending]
  );

  const totalPending = useMemo(
    () => pending.reduce((s, b) => s + (b.invoice?.total_amount ?? 0), 0),
    [pending]
  );
  const totalPendingCombined = totalPending + upgradeSupplementTotal;
  const pendingCountCombined = pending.length + transferPending.length;
  const totalPaid = useMemo(() => {
    const bookingPaid = history
      .filter((b) => b.status === 'approved')
      .reduce((s, b) => s + (b.invoice?.total_amount ?? 0), 0);
    const transferPaid = transferHistory
      .filter((t) => t.status === 'approved')
      .reduce((s, t) => s + transferSupplementAmount(t), 0);
    return bookingPaid + transferPaid;
  }, [history, transferHistory]);

  const mergedHistoryRows = useMemo((): PaymentHistoryRow[] => {
    const bookingRows: PaymentHistoryRow[] = history.map((b) => ({ kind: 'booking', item: b }));
    const transferRows: PaymentHistoryRow[] = transferHistory.map((t) => ({ kind: 'transfer', item: t }));
    const merged = [...bookingRows, ...transferRows];
    merged.sort((a, b) => {
      const ta = a.kind === 'booking' ? a.item.requested_at : a.item.requested_at;
      const tb = b.kind === 'booking' ? b.item.requested_at : b.item.requested_at;
      return new Date(tb).getTime() - new Date(ta).getTime();
    });
    return merged;
  }, [history, transferHistory]);

  const load = async () => {
    setLoading(true);
    try {
      const [data, transfers] = await Promise.all([
        getMyBookings({ page: 1, limit: 50 }),
        getMyTransferRequests().catch(() => [] as RoomTransferRequest[]),
      ]);
      setItems(data.items);
      const list = Array.isArray(transfers) ? transfers : [];
      setTransferRequests(list);
      setTransferPending(list.filter((t) => t.status === 'pending_payment_upgrade'));
    } catch {
      message.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      void loadRef.current();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  useEffect(() => {
    const refresh = () => load();
    window.addEventListener('student:booking:approved', refresh);
    window.addEventListener('student:booking:cancelled', refresh);
    window.addEventListener('student:transfer:updated', refresh);
    window.addEventListener('student:transfer:upgrade-cancelled', refresh);
    return () => {
      window.removeEventListener('student:booking:approved', refresh);
      window.removeEventListener('student:booking:cancelled', refresh);
      window.removeEventListener('student:transfer:updated', refresh);
      window.removeEventListener('student:transfer:upgrade-cancelled', refresh);
    };
  }, []);

  useEffect(() => {
    const handleFocus = async () => {
      const hasBookingPending = items.some((b) => b.status === 'awaiting_payment');
      const hasTransferPending = transferPending.length > 0;
      if (!hasBookingPending && !hasTransferPending) return;
      try {
        const bookingResults = hasBookingPending
          ? await Promise.all(
              items
                .filter((b) => b.status === 'awaiting_payment')
                .map((b) => checkPaymentStatus(b.id).catch(() => null))
            )
          : [];
        const transferResults = hasTransferPending
          ? await Promise.all(
              transferPending.map((t) => checkTransferPaymentStatus(t.id).catch(() => null))
            )
          : [];
        const bookingChanged = bookingResults.some(
          (r) => r && (r.paid || r.status === 'approved' || r.status === 'cancelled' || r.status === 'expired')
        );
        const transferChanged = transferResults.some(
          (r) =>
            r &&
            (r.paid || (r.transfer && r.transfer.status !== 'pending_payment_upgrade'))
        );
        if (bookingChanged || transferChanged) load();
      } catch { /* ignore */ }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [items, transferPending]);

  useEffect(() => {
    if (transferPending.length === 0) return;
    const tick = async () => {
      for (const r of transferPending) {
        try {
          const res = await checkTransferPaymentStatus(r.id);
          if (
            res.paid ||
            res.status === 'cancelled' ||
            res.status === 'expired' ||
            (res.transfer && res.transfer.status !== 'pending_payment_upgrade')
          ) {
            load();
            return;
          }
        } catch {
          /* ignore poll errors */
        }
      }
    };
    tick();
    const id = window.setInterval(tick, 4000);
    return () => window.clearInterval(id);
  }, [transferPending.map((t) => `${t.id}:${t.status}`).join('|')]);

  const handleCancel = async (bookingId: string) => {
    try {
      await cancelBookingRequest(bookingId);
      message.success('Cancelled');
      load();
    } catch (e: unknown) {
      message.error((e as { message?: string })?.message || 'Cancel failed');
    }
  };

  // ─── History table columns (booking + change-bed supplement) ───────────────
  const historyColumns: ColumnsType<PaymentHistoryRow> = [
    {
      title: 'Invoice',
      render: (_, row) => {
        if (row.kind === 'booking') {
          const code = row.item.invoice?.invoice_code;
          return <Text strong style={{ fontFamily: 'monospace' }}>{code ?? '—'}</Text>;
        }
        return (
          <Space direction="vertical" size={2}>
            <Text strong style={{ fontFamily: 'monospace' }}>{transferHistoryInvoiceCode(row.item)}</Text>
            <Tag color="purple" style={{ margin: 0 }}>Change bed</Tag>
          </Space>
        );
      },
    },
    {
      title: 'Room',
      render: (_, row) => {
        if (row.kind === 'booking') {
          const b = row.item;
          return (
            <Space direction="vertical" size={0}>
              <Text style={{ fontSize: 13 }}>
                {b.room?.block?.dorm?.dorm_name ?? '—'} · Room {b.room?.room_number ?? '—'}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {b.semester?.replace('-', ' ')}
              </Text>
            </Space>
          );
        }
        const t = row.item;
        return (
          <Space direction="vertical" size={0}>
            <Text style={{ fontSize: 13 }}>{transferRequestedLabel(t)}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Request {t.request_code} · {new Date(t.requested_at).toLocaleDateString('vi-VN')}
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'Amount',
      align: 'right',
      render: (_, row) => {
        if (row.kind === 'booking') {
          return <Text strong>{formatCurrency(row.item.invoice?.total_amount ?? 0)}</Text>;
        }
        const amt = transferSupplementAmount(row.item);
        if (amt > 0) return <Text strong>{formatCurrency(amt)}</Text>;
        return <Text type="secondary">—</Text>;
      },
    },
    {
      title: 'Status',
      align: 'center',
      render: (_, row) => {
        if (row.kind === 'booking') {
          const s = row.item.status;
          const m = statusMeta[s] ?? statusMeta.cancelled;
          return <Tag color={m.color} icon={m.icon}>{m.label}</Tag>;
        }
        const m = transferHistoryStatusDisplay(row.item);
        return <Tag color={m.color} icon={m.icon}>{m.label}</Tag>;
      },
    },
    {
      title: 'Action',
      align: 'center',
      render: (_, row) => (
        <Button
          size="small"
          icon={<FileTextOutlined />}
          onClick={() =>
            row.kind === 'booking' ? setDetailBooking(row.item) : setDetailTransfer(row.item)
          }
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
              value: pendingCountCombined,
              suffix: 'invoice(s)',
              color: '#fa8c16',
              bg: '#fff7e6',
              border: '#ffd591',
              icon: <ClockCircleOutlined style={{ fontSize: 22, color: '#fa8c16' }} />,
            },
            {
              title: 'Pending Amount',
              value: formatCurrency(totalPendingCombined),
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
            {pendingCountCombined > 0 && (
              <Badge count={pendingCountCombined} color="#fa8c16" />
            )}
          </div>

          {pendingCountCombined === 0 ? (
            <Card style={{ borderRadius: 12 }} styles={{ body: { padding: '16px 24px' } }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                styles={{ image: { height: 40 } }}
                description={<Text type="secondary">No pending invoices — you're all caught up!</Text>}
              />
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {transferPending.map((t) => (
                <TransferUpgradePendingCard key={`transfer-${t.id}`} transfer={t} onPaid={() => load()} />
              ))}
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
          {mergedHistoryRows.length === 0 ? (
            <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 32, textAlign: 'center' } }}>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No payment history" />
            </Card>
          ) : (
            <Card
              style={{ borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
              styles={{ body: { padding: 0 } }}
            >
              <Table<PaymentHistoryRow>
                dataSource={mergedHistoryRows}
                columns={historyColumns}
                rowKey={(r) => (r.kind === 'booking' ? `b-${r.item.id}` : `t-${r.item.id}`)}
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
      {detailTransfer ? (
        <TransferUpgradeInvoiceModal
          transfer={detailTransfer}
          open
          variant="history"
          onClose={() => setDetailTransfer(null)}
        />
      ) : null}
    </div>
  );
};

export default Payment;
