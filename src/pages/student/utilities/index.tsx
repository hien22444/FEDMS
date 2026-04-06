import { useEffect, useState } from 'react';
import { Button, Card, Empty, Spin, Table, Tag, Typography, message, theme } from 'antd';
import { ThunderboltOutlined, FileTextOutlined } from '@ant-design/icons';
import { getMyEWUsages, type MyEWRecord } from '@/lib/actions/ewUsage';
import {
  createInvoicePayosLink,
  getInvoicePaymentStatus,
  getMyInvoices,
  type StudentInvoice,
} from '@/lib/actions/invoice';
import { useWindowSize } from '@/hooks/useWindowSize';

const { Title, Text } = Typography;

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
  const [loading, setLoading] = useState(true);
  const [blockName, setBlockName] = useState<string | null>(null);
  const [roomNumber, setRoomNumber] = useState<string | null>(null);
  const [records, setRecords] = useState<MyEWRecord[]>([]);
  const [invoices, setInvoices] = useState<StudentInvoice[]>([]);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);
  const [checkingInvoiceId, setCheckingInvoiceId] = useState<string | null>(null);
  const [noRoom, setNoRoom] = useState(false);

  const replaceInvoice = (invoice: StudentInvoice) => {
    setInvoices((current) =>
      current.map((item) => (item.id === invoice.id ? invoice : item))
    );
  };

  useEffect(() => {
    const fetchEW = getMyEWUsages()
      .then((res) => {
        setBlockName(res.block_name);
        setRoomNumber(res.room_number);
        setRecords(res.data);
        if (!res.block_name) setNoRoom(true);
      })
      .catch(() => setNoRoom(true));

    const fetchInvoices = getMyInvoices()
      .then((data) => {
        const ewInvoices = data
          .filter((invoice) => invoice.invoice_code.startsWith('EW-'))
          .sort(
            (left, right) =>
              new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
          );
        setInvoices(ewInvoices);
      })
      .catch(() => {});

    Promise.all([fetchEW, fetchInvoices]).finally(() => setLoading(false));
  }, []);

  const totalAmount = records.reduce((sum, record) => sum + (record.amount || 0), 0);
  const latest = records[0];
  const canPayInvoice = (invoice: StudentInvoice) =>
    invoice.payment_status === 'unpaid' && invoice.total_amount > 0;

  const handlePayInvoice = async (invoice: StudentInvoice) => {
    try {
      setPayingInvoiceId(invoice.id);
      const payosLink =
        invoice.payos?.checkoutUrl && invoice.payos?.status === 'pending'
          ? { invoice, payos: invoice.payos }
          : await createInvoicePayosLink(invoice.id);

      replaceInvoice({
        ...invoice,
        payos: payosLink.payos ?? null,
      });

      if (!payosLink.payos?.checkoutUrl) {
        message.error('Payment link is not available for this invoice');
        return;
      }

      window.open(payosLink.payos.checkoutUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      message.error((err as { message?: string })?.message || 'Failed to open payment link');
    } finally {
      setPayingInvoiceId(null);
    }
  };

  const handleCheckInvoiceStatus = async (invoice: StudentInvoice) => {
    try {
      setCheckingInvoiceId(invoice.id);
      const result = await getInvoicePaymentStatus(invoice.id);
      replaceInvoice({
        ...invoice,
        ...result.invoice,
        payos: result.payos ?? invoice.payos ?? null,
      });

      if (result.paid) {
        message.success('Payment confirmed');
        return;
      }

      if (result.status === 'cancelled') {
        message.warning(result.message || 'Payment was cancelled');
        return;
      }

      message.info(result.message || 'Payment is still pending');
    } catch (err) {
      message.error((err as { message?: string })?.message || 'Failed to check payment status');
    } finally {
      setCheckingInvoiceId(null);
    }
  };

  const invoiceColumns = [
      { title: 'Invoice Code', dataIndex: 'invoice_code', key: 'invoice_code' },
      {
        title: 'Month',
        dataIndex: 'invoice_month',
        key: 'invoice_month',
        render: (value: string) => {
          const [year, month] = value.split('-');
          return month && year
            ? `${new Date(Number(year), Number(month) - 1).toLocaleString('en-US', { month: 'long' })} ${year}`
            : value;
        },
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
        render: (value: string) => new Date(value).toLocaleDateString('en-US'),
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
            <Button
              size="small"
              onClick={() => handleCheckInvoiceStatus(invoice)}
              loading={checkingInvoiceId === invoice.id}
              disabled={!canPayInvoice(invoice)}
            >
              Check Status
            </Button>
          </div>
        ),
      },
    ];

  const usageColumns = [
    { title: 'Term', dataIndex: 'term', key: 'term' },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
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
      render: (value: string) => new Date(value).toLocaleDateString('en-US'),
    },
    {
      title: 'Previous Meter',
      dataIndex: 'meter_left',
      key: 'meter_left',
      render: (value: number, record: MyEWRecord) => `${value} ${record.unit}`,
    },
    {
      title: 'Current Meter',
      dataIndex: 'meter_right',
      key: 'meter_right',
      render: (value: number, record: MyEWRecord) => `${value} ${record.unit}`,
    },
    {
      title: 'Consumption',
      dataIndex: 'consumption',
      key: 'consumption',
      render: (value: number, record: MyEWRecord) => <Tag color="orange">{value} {record.unit}</Tag>,
    },
    {
      title: 'Unit Price',
      dataIndex: 'price_per_unit',
      key: 'price_per_unit',
      render: (value: number, record: MyEWRecord) => `${value.toLocaleString('en-US')} VND/${record.unit}`,
    },
    {
      title: 'Students',
      dataIndex: 'occupied_beds',
      key: 'occupied_beds',
      render: (value: number) => value,
    },
    {
      title: 'Your Share',
      dataIndex: 'amount',
      key: 'amount',
      render: (value: number) => (
        <Text strong style={{ color: token.colorError }}>
          {value.toLocaleString('en-US')} VND
        </Text>
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
            <Card style={{ marginBottom: 24, borderLeft: '4px solid #faad14' }}>
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
                    background: '#fffbe6',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ThunderboltOutlined style={{ fontSize: 32, color: '#faad14' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <Text type="secondary">Latest Term</Text>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
                    {latest ? `${latest.consumption} ${latest.unit}` : '-'}
                  </div>
                  <Text type="secondary" style={{ fontSize: 13 }}>{latest?.term}</Text>
                </div>
                <div style={{ textAlign: isTablet ? 'right' : 'left', width: isTablet ? 'auto' : '100%' }}>
                  <Text type="secondary">Latest Term Amount</Text>
                  <div style={{ fontSize: 22, fontWeight: 700, color: token.colorError, marginTop: 4 }}>
                    {latest ? `${latest.amount.toLocaleString('en-US')} VND` : '-'}
                  </div>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Grand total: <b>{totalAmount.toLocaleString('en-US')} VND</b>
                  </Text>
                </div>
              </div>
            </Card>

            <Card title="Utility Usage by Term" style={{ marginBottom: 24 }}>
              <Table
                rowKey="id"
                columns={usageColumns}
                dataSource={records}
                pagination={false}
                size="middle"
                scroll={{ x: 1100 }}
                locale={{ emptyText: 'No utility usage data yet' }}
              />
            </Card>
          </>
        )}

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
