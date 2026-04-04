import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Empty, Row, Space, Tag, Typography, message, theme } from 'antd';
import { ReloadOutlined, ClockCircleOutlined, FileSearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { checkPaymentStatus, getMyBookings } from '@/lib/actions';
import type { BookingRequestItem } from '@/lib/actions';
import { ROUTES } from '@/constants';
import { useWindowSize } from '@/hooks/useWindowSize';

const { Title, Text } = Typography;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN').format(amount) + ' VND';

const formatCountdown = (expiresAt?: string) => {
  if (!expiresAt) return '-';
  const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  const mm = Math.floor(remaining / 60).toString().padStart(2, '0');
  const ss = (remaining % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
};

const Payment: React.FC = () => {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const { width } = useWindowSize();
  const isTablet = width >= 768;
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<BookingRequestItem[]>([]);

  const pending = useMemo(() => items.filter((b) => b.status === 'awaiting_payment'), [items]);
  const history = useMemo(() => items.filter((b) => b.status !== 'awaiting_payment'), [items]);

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

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const handleFocus = async () => {
      const hasPending = items.some((b) => b.status === 'awaiting_payment');
      if (!hasPending) return;

      try {
        const checks = items
          .filter((b) => b.status === 'awaiting_payment')
          .map((b) => checkPaymentStatus(b.id).catch(() => null));
        const results = await Promise.all(checks);
        const hasUpdate = results.some(
          (r) => r && (r.paid || r.status === 'approved' || r.status === 'cancelled' || r.status === 'expired')
        );
        if (hasUpdate) load();
      } catch {
        // Ignore transient payment status errors on focus refresh.
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [items]);

  return (
    <div
      style={{
        padding: isTablet ? 32 : 16,
        background: token.colorBgLayout,
        minHeight: '100vh',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isTablet ? 'center' : 'flex-start',
            flexDirection: isTablet ? 'row' : 'column',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <Title level={2} style={{ marginBottom: 4 }}>Payment</Title>
            <Text type="secondary">View pending invoices and complete or review payment activity</Text>
          </div>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={load} block={!isTablet}>
            Reload
          </Button>
        </div>

        <Title level={4} style={{ marginTop: 24 }}>Pending invoices</Title>
        {pending.length === 0 ? (
          <Empty description="No pending invoices" />
        ) : (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {pending.map((booking) => (
              <Card key={booking.id}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={14}>
                    <Space direction="vertical" size={6}>
                      <div>
                        <Tag color="warning" icon={<ClockCircleOutlined />}>Awaiting Payment</Tag>
                      </div>
                      <Text strong>Invoice: {booking.invoice?.invoice_code}</Text>
                      <Text type="secondary">
                        Amount: {formatCurrency(booking.invoice?.total_amount || 0)}
                      </Text>
                      <Text type="secondary">
                        Hold time left:{' '}
                        <Text strong style={{ color: token.colorError }}>{formatCountdown(booking.expires_at)}</Text>
                      </Text>
                      <Text type="secondary">
                        Room {booking.room?.room_number}
                        {booking.bed ? ` - Bed ${booking.bed.bed_number}` : ''}
                      </Text>
                    </Space>
                  </Col>

                  <Col xs={24} md={10}>
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        justifyContent: isTablet ? 'flex-end' : 'stretch',
                        flexWrap: 'wrap',
                      }}
                    >
                      <Button
                        type="primary"
                        icon={<FileSearchOutlined />}
                        onClick={() => navigate(ROUTES.STUDENT_BOOKING, { state: { resumeBookingId: booking.id } })}
                        block={!isTablet}
                      >
                        Details
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        )}

        <Title level={4} style={{ marginTop: 32 }}>History</Title>
        {history.length === 0 ? (
          <Empty description="No history yet" />
        ) : (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {history.slice(0, 20).map((booking) => (
              <Card key={booking.id} size="small">
                <Row justify="space-between" align="middle" gutter={[12, 12]}>
                  <Col xs={24} sm={16}>
                    <Text strong>{booking.invoice?.invoice_code || '-'}</Text>
                    <Text type="secondary" style={{ display: 'block' }}>
                      {formatCurrency(booking.invoice?.total_amount || 0)} - {booking.status}
                    </Text>
                  </Col>
                  <Col xs={24} sm="auto">
                    <Tag
                      color={
                        booking.status === 'approved'
                          ? 'success'
                          : booking.status === 'cancelled'
                            ? 'default'
                            : 'error'
                      }
                    >
                      {booking.status}
                    </Tag>
                  </Col>
                </Row>
              </Card>
            ))}
          </Space>
        )}
      </div>
    </div>
  );
};

export default Payment;
