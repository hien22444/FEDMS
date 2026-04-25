import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Descriptions, Empty, Modal, Spin, Table, Tag, Typography, message, theme } from 'antd';
import { ThunderboltOutlined, FileTextOutlined } from '@ant-design/icons';
import { getMyEWUsages, type MyEWRecord } from '@/lib/actions/ewUsage';
import {
  createInvoicePayosLink,
  getInvoicePaymentStatus,
  getMyInvoices,
  type StudentInvoice,
} from '@/lib/actions/invoice';
import { useWindowSize } from '@/hooks/useWindowSize';
import { brandPalette } from '@/themes/brandPalette';
import { connectSocket } from '@/lib/socket';
import { useLocation, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const formatDateDMY = (value?: string | Date) =>
  value ? new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC' }).format(new Date(value)) : '-';
const formatMonthYear = (value?: string | Date) =>
  value
    ? new Intl.DateTimeFormat('en-GB', {
        timeZone: 'UTC',
        month: 'long',
        year: 'numeric',
      }).format(new Date(value))
    : '-';
const formatInvoiceMonth = (value?: string) => {
  if (!value) return '-';
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return value;
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
};

const statusColor: Record<string, string> = {
  unpaid: 'red',
  paid: 'green',
  overdue: 'volcano',
  cancelled: 'default',
};

const statusLabel: Record<string, string> = {
  unpaid: 'Unpaid',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

const Utilities = () => {
  const { token } = theme.useToken();
  const { width } = useWindowSize();
  const isTablet = width >= 768;
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [blockName, setBlockName] = useState<string | null>(null);
  const [roomNumber, setRoomNumber] = useState<string | null>(null);
  const [records, setRecords] = useState<MyEWRecord[]>([]);
  const [invoices, setInvoices] = useState<StudentInvoice[]>([]);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<MyEWRecord | null>(null);
  const [noRoom, setNoRoom] = useState(false);

  const replaceInvoice = (invoice: Partial<StudentInvoice> & { id: string }) => {
    setInvoices((current) =>
      current.map((item) => (item.id === invoice.id ? { ...item, ...invoice } : item))
    );
  };

  const loadEWInvoices = useCallback(async () => {
    const data = await getMyInvoices();
    const ewInvoices = data
      .filter((invoice) => invoice.invoice_code.startsWith('EW-'))
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
    setInvoices(ewInvoices);
  }, []);

  useEffect(() => {
    const fetchEW = getMyEWUsages()
      .then((res) => {
        setBlockName(res.block_name);
        setRoomNumber(res.room_number);
        setRecords(res.data);
        if (!res.block_name) setNoRoom(true);
      })
      .catch(() => setNoRoom(true));

    const fetchInvoices = loadEWInvoices().catch(() => {});

    Promise.all([fetchEW, fetchInvoices]).finally(() => setLoading(false));
  }, [loadEWInvoices]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentResult = params.get('payment');
    const invoiceId = params.get('invoice');
    if (!invoiceId || !paymentResult) return;
    if (!['success', 'cancelled'].includes(paymentResult)) return;

    let active = true;

    const syncReturnedPayment = async () => {
      try {
        const result = await getInvoicePaymentStatus(invoiceId);
        if (!active) return;

        replaceInvoice({
          ...result.invoice,
          payos: result.payos ?? result.invoice.payos ?? null,
        });

        if (result.paid) {
          message.success('Payment confirmed');
        } else if (result.status === 'cancelled') {
          message.warning(result.message || 'Payment was cancelled');
        } else {
          message.info(result.message || 'Payment is still pending');
        }
      } catch (err) {
        if (!active) return;
        message.error((err as { message?: string })?.message || 'Failed to refresh payment status');
      } finally {
        if (active) {
          navigate('/student/utilities', { replace: true });
        }
      }
    };

    void syncReturnedPayment();
    return () => {
      active = false;
    };
  }, [location.search, navigate]);

  useEffect(() => {
    const socket = connectSocket();

    const handleInvoiceUpdated = (payload: {
      action?: 'created' | 'updated' | 'deleted';
      invoiceId?: string;
      invoice_code?: string;
      payment_status?: StudentInvoice['payment_status'];
      total_amount?: number;
      invoice_month?: string;
    }) => {
      if (!payload?.invoice_code?.startsWith('EW-') || !payload.invoiceId) return;

      if (payload.action === 'deleted') {
        setInvoices((current) => current.filter((item) => item.id !== payload.invoiceId));
        return;
      }

      if (payload.action === 'created') {
        void loadEWInvoices().catch(() => {});
        return;
      }

      replaceInvoice({
        id: payload.invoiceId,
        payment_status: payload.payment_status,
        total_amount: payload.total_amount,
        invoice_month: payload.invoice_month,
      });
    };

    socket.on('invoice_updated', handleInvoiceUpdated);
    return () => {
      socket.off('invoice_updated', handleInvoiceUpdated);
    };
  }, [loadEWInvoices]);

  const latest = records[0];
  const latestMonthLabel = latest ? formatMonthYear(latest.date) : '-';
  const latestMonthKey = latest ? new Date(latest.date).toISOString().slice(0, 7) : null;
  const latestMonthRecords = latestMonthKey
    ? records.filter(
        (record) => new Date(record.date).toISOString().slice(0, 7) === latestMonthKey
      )
    : [];
  const latestMonthTotal = latestMonthKey
    ? latestMonthRecords
        .reduce((sum, record) => sum + (record.amount || 0), 0)
    : 0;
  const canPayInvoice = (invoice: StudentInvoice) =>
    invoice.payment_status === 'unpaid' && invoice.total_amount > 0;

  const handlePayInvoice = async (invoice: StudentInvoice) => {
    try {
      setPayingInvoiceId(invoice.id);
      const payosLink = await createInvoicePayosLink(invoice.id);

      replaceInvoice({
        ...invoice,
        ...payosLink.invoice,
        payos: payosLink.payos ?? null,
      });

      if (!payosLink.payos?.checkoutUrl) {
        message.error('Payment link is not available for this invoice');
        return;
      }

      window.location.href = payosLink.payos.checkoutUrl;
    } catch (err) {
      message.error((err as { message?: string })?.message || 'Failed to open payment link');
    } finally {
      setPayingInvoiceId(null);
    }
  };

  const invoiceColumns = [
      { title: 'Invoice Code', dataIndex: 'invoice_code', key: 'invoice_code' },
      {
        title: 'Month',
        dataIndex: 'invoice_month',
        key: 'invoice_month',
        render: (value: string) => formatInvoiceMonth(value),
      },
      {
        title: 'Electricity Fee',
        dataIndex: 'electricity_fee',
        key: 'electricity_fee',
        render: (value: number) => `${value.toLocaleString('en-US')} VND`,
      },
      {
        title: 'Water Fee',
        dataIndex: 'water_fee',
        key: 'water_fee',
        render: (value: number) => `${value.toLocaleString('en-US')} VND`,
      },
      {
        title: 'Total',
        dataIndex: 'total_amount',
        key: 'total_amount',
        render: (value: number) => (
          <Text strong style={{ color: token.colorError }}>
            {value.toLocaleString('en-US')} VND
          </Text>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'payment_status',
        key: 'payment_status',
        render: (status: string) => (
          <Tag color={statusColor[status]}>{statusLabel[status] ?? status}</Tag>
        ),
      },
      {
        title: 'Due Date',
        dataIndex: 'due_date',
        key: 'due_date',
        render: (value: string) => formatDateDMY(value),
      },
      {
        title: 'Action',
        key: 'action',
        render: (_: unknown, invoice: StudentInvoice) => (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button
              type="primary"
              size="small"
              onClick={() => handlePayInvoice(invoice)}
              loading={payingInvoiceId === invoice.id}
              disabled={!canPayInvoice(invoice)}
            >
              Pay Now
            </Button>
          </div>
        ),
      },
    ];

  const usageColumns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (value: string) => (
        <Tag color={value === 'electric' ? 'orange' : 'blue'}>
          {value === 'electric' ? 'Electric' : 'Water'}
        </Tag>
      ),
    },
    {
      title: 'Recorded Date',
      dataIndex: 'date',
      key: 'date',
      width: 160,
      render: (value: string) => formatDateDMY(value),
    },
    {
      title: 'Consumption',
      dataIndex: 'consumption',
      key: 'consumption',
      width: 160,
      render: (value: number, record: MyEWRecord) => <Tag color="orange">{value} {record.unit}</Tag>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 180,
      render: (value: number) => (
        <Text strong style={{ color: token.colorError, whiteSpace: 'nowrap' }}>
          {value.toLocaleString('en-US')} VND
        </Text>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_: unknown, record: MyEWRecord) => (
        <Button size="small" onClick={() => setSelectedRecord(record)}>
          Details
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: isTablet ? 32 : 16, background: token.colorBgLayout, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 4 }}>Utilities</Title>
          {blockName && (
            <Text type="secondary">
              Block <b>{blockName}</b>
              {roomNumber ? ` - Room ${roomNumber}` : ''}
            </Text>
          )}
        </div>

        {noRoom ? (
          <Card style={{ marginBottom: 24 }}>
            <Empty description="You have not been assigned a room yet or there is no utility data." />
          </Card>
        ) : (
          <>
            <Card style={{ marginBottom: 24, borderLeft: `4px solid ${brandPalette.primaryAccent}` }}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: isTablet ? 'row' : 'column',
                  alignItems: isTablet ? 'center' : 'flex-start',
                  gap: 20,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    background: brandPalette.primarySoft,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ThunderboltOutlined style={{ fontSize: 32, color: brandPalette.primaryAccent }} />
                </div>
                <div style={{ flex: 1 }}>
                  <Text type="secondary">Latest Month</Text>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
                    {latest ? `${latest.consumption} ${latest.unit}` : '-'}
                  </div>
                  <Text type="secondary" style={{ fontSize: 13 }}>{latestMonthLabel}</Text>
                </div>
                <div style={{ textAlign: isTablet ? 'right' : 'left', width: isTablet ? 'auto' : '100%' }}>
                  <Text type="secondary">Total</Text>
                  <div style={{ fontSize: 22, fontWeight: 700, color: token.colorError, marginTop: 4 }}>
                    {latestMonthTotal.toLocaleString('en-US')} VND
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Utility Usage - Latest Month" style={{ marginBottom: 24 }}>
              <Table
                rowKey="id"
                columns={usageColumns}
                dataSource={latestMonthRecords}
                pagination={false}
                size="middle"
                scroll={{ x: 760 }}
                locale={{ emptyText: 'No utility usage data yet' }}
              />
            </Card>
          </>
        )}

        <Modal
          title="Utility Usage Details"
          open={Boolean(selectedRecord)}
          onCancel={() => setSelectedRecord(null)}
          footer={
            <Button onClick={() => setSelectedRecord(null)}>
              Close
            </Button>
          }
        >
          {selectedRecord && (
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Term">{selectedRecord.term}</Descriptions.Item>
              <Descriptions.Item label="Type">
                {selectedRecord.type === 'electric' ? 'Electric' : 'Water'}
              </Descriptions.Item>
              <Descriptions.Item label="Recorded Date">
                {formatDateDMY(selectedRecord.date)}
              </Descriptions.Item>
              <Descriptions.Item label="Previous Meter">
                {selectedRecord.meter_left} {selectedRecord.unit}
              </Descriptions.Item>
              <Descriptions.Item label="Current Meter">
                {selectedRecord.meter_right} {selectedRecord.unit}
              </Descriptions.Item>
              <Descriptions.Item label="Consumption">
                {selectedRecord.consumption} {selectedRecord.unit}
              </Descriptions.Item>
              <Descriptions.Item label="Unit Price">
                {selectedRecord.price_per_unit.toLocaleString('en-US')} VND/{selectedRecord.unit}
              </Descriptions.Item>
              <Descriptions.Item label="Students">
                {selectedRecord.occupied_beds}
              </Descriptions.Item>
              <Descriptions.Item label="Your Share">
                <Text strong style={{ color: token.colorError }}>
                  {selectedRecord.amount.toLocaleString('en-US')} VND
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Total Block Amount">
                {selectedRecord.total_amount.toLocaleString('en-US')} VND
              </Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        <Card
          title={
            <span>
              <FileTextOutlined style={{ marginRight: 8 }} />
              Utility Invoices
            </span>
          }
        >
          <Table
            rowKey="id"
            columns={invoiceColumns}
            dataSource={invoices}
            pagination={false}
            size="middle"
            scroll={{ x: 920 }}
            locale={{ emptyText: 'No invoices yet' }}
          />
        </Card>
      </div>
    </div>
  );
};

export default Utilities;
