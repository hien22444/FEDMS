import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Tag,
  Button,
  Input,
  Select,
  Space,
  Modal,
  message,
  Alert,
  Card,
  Row,
  Col,
  Statistic,
  Form,
  InputNumber,
  DatePicker,
  Switch,
  Descriptions,
  Tabs,
  Tooltip,
  Popconfirm,
  Badge,
} from 'antd';
import {
  FileTextOutlined,
  PlusOutlined,
  EyeOutlined,
  StopOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleFilled,
} from '@ant-design/icons';
import { Search } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  getManagerInvoices,
  getManagerInvoiceDetail,
  createInvoiceForStudent,
  createEWInvoiceForStudent,
  createInvoicesForRoom,
  createEWInvoicesForAllBlocks,
  cancelManagerInvoice,
  type ManagerInvoice,
  type ManagerInvoiceFilter,
  type CreateInvoiceDto,
  type BulkInvoiceDto,
  type BulkInvoiceResult,
} from '@/lib/actions/invoice';
import {
  fetchBlocks,
  fetchRooms,
  type Block,
  type Room,
} from '@/lib/actions';

const { Option } = Select;
const { TabPane } = Tabs;

const STATUS_CONFIG: Record<
  string,
  { color: string; label: string; icon: React.ReactNode }
> = {
  unpaid: {
    color: 'orange',
    label: 'Unpaid',
    icon: <ClockCircleOutlined />,
  },
  paid: {
    color: 'green',
    label: 'Paid',
    icon: <CheckCircleOutlined />,
  },
  overdue: {
    color: 'red',
    label: 'Overdue',
    icon: <ExclamationCircleOutlined />,
  },
};

const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);

const feeFormatter = (v: number | string | undefined) =>
  `${v ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const feeParser = (v: string | undefined) =>
  Number((v ?? '').replace(/[^\d]/g, ''));
const blockNonDigit = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const allowed = [
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ];
  if (allowed.includes(e.key)) return;
  if (e.ctrlKey || e.metaKey) return; // allow Ctrl+A/C/V/X
  if (!/^\d$/.test(e.key)) e.preventDefault();
};
const ClearableInputNumber = ({
  value,
  onChange,
  ...rest
}: {
  value?: number | null;
  onChange?: (v: number | null) => void;
  [key: string]: unknown;
}) => (
  <div style={{ position: 'relative' }}>
    <InputNumber
      value={value}
      onChange={onChange}
      controls={false}
      style={{ width: '100%' }}
      formatter={feeFormatter}
      parser={feeParser}
      onKeyDown={blockNonDigit}
      {...rest}
    />
    {!!value && (
      <CloseCircleFilled
        onClick={() => onChange?.(null)}
        style={{
          position: 'absolute',
          right: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#bfbfbf',
          cursor: 'pointer',
          fontSize: 13,
          zIndex: 1,
        }}
      />
    )}
  </div>
);

const feeRule = {
  validator: (_: unknown, value: number | null | undefined) => {
    if (value == null || value === 0) return Promise.resolve();
    if (value < 2000)
      return Promise.reject(new Error('Minimum is 2,000 VND'));
    if (value > 9999999)
      return Promise.reject(new Error('Maximum is 9,999,999 VND'));
    return Promise.resolve();
  },
};

const FeeFields = () => {
  const form = Form.useFormInstance();
  const otherFees = Form.useWatch('other_fees', form);
  const hasOtherFee = !!otherFees;

  return (
    <>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label='Fine (VND)'
            name='water_fee'
            rules={[feeRule]}
          >
            <ClearableInputNumber />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label='Service Fee (VND)'
            name='service_fee'
            rules={[feeRule]}
          >
            <ClearableInputNumber />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label='Other Fees (VND)'
            name='other_fees'
            rules={[feeRule]}
          >
            <ClearableInputNumber />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label='Other Fees Description'
            name='other_fees_description'
            rules={
              hasOtherFee
                ? [
                    {
                      required: true,
                      message: 'Please enter a description',
                    },
                  ]
                : []
            }
          >
            <Input
              placeholder='e.g. Parking fee'
              disabled={!hasOtherFee}
            />
          </Form.Item>
        </Col>
      </Row>
      <InvoicePeriodFields />
    </>
  );
};

const InvoicePeriodFields = () => (
  <Row gutter={16}>
    <Col span={12}>
      <Form.Item
        label='Invoice Month'
        name='invoice_month'
        rules={[{ required: true, message: 'Required' }]}
      >
        <DatePicker
          picker='month'
          style={{ width: '100%' }}
          format='MM/YYYY'
          placeholder='Select month'
        />
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item
        label='Due Date'
        name='due_date'
        rules={[{ required: true, message: 'Required' }]}
      >
        <DatePicker
          style={{ width: '100%' }}
          format='DD/MM/YYYY'
          disabledDate={current =>
            current && current.isBefore(dayjs().startOf('day'))
          }
        />
      </Form.Item>
    </Col>
  </Row>
);

const EWInvoiceFields = () => (
  <>
    <div className='mb-3 rounded bg-orange-50 p-3 text-sm text-orange-700'>
      EW bills will be created from the recalculated electricity and water usage
      for the selected month. No manual electricity or water amount will be entered here.
    </div>
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          label='Invoice Month'
          name='invoice_month'
          rules={[{ required: true, message: 'Required' }]}
        >
          <DatePicker
            picker='month'
            style={{ width: '100%' }}
            format='MM/YYYY'
            placeholder='Select month'
            disabledDate={current =>
              !!current && current.startOf('month').isAfter(dayjs().startOf('month'))
            }
          />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item
          label='Due Date'
          name='due_date'
          rules={[{ required: true, message: 'Required' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            format='DD/MM/YYYY'
            disabledDate={current =>
              current && current.isBefore(dayjs().startOf('day'))
            }
          />
        </Form.Item>
      </Col>
    </Row>
  </>
);

const buildCreateInvoiceErrorMessage = (
  error: unknown,
  context: 'student-manual' | 'student-ew' | 'room' | 'block-ew',
) => {
  const typedError = error as {
    message?: string;
    errorFields?: unknown[];
  };

  if (typedError?.errorFields?.length) {
    return {
      type: 'warning' as const,
      message: 'Please complete the required fields before creating the invoice.',
    };
  }

  if (typedError?.message?.trim()) {
    return {
      type: 'error' as const,
      message: typedError.message.trim(),
    };
  }

  if (context === 'block-ew') {
    return {
      type: 'warning' as const,
      message:
        'Cannot create EW invoices for the selected month. Make sure EW usage has been imported and recalculated for that month, and that invoices have not already been created.',
    };
  }

  if (context === 'student-ew') {
    return {
      type: 'warning' as const,
      message:
        'Cannot create the EW invoice for this student. Make sure EW usage has been imported and recalculated for the selected month.',
    };
  }

  if (context === 'room') {
    return {
      type: 'warning' as const,
      message:
        'Cannot create invoices for the selected room. Please check the room, invoice month, due date, and active contracts.',
    };
  }

  return {
    type: 'error' as const,
    message: 'Action failed. Please try again.',
  };
};

export default function ManagerInvoicesPage() {
  const [invoices, setInvoices] = useState<ManagerInvoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Filters
  const [studentCode, setStudentCode] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [blockFilter, setBlockFilter] = useState('');
  const [roomFilter, setRoomFilter] = useState('');

  // Blocks / Rooms for dropdowns
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createTab, setCreateTab] = useState('student');
  const [createFeedback, setCreateFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);
  const [studentForm] = Form.useForm();
  const [roomForm] = Form.useForm();
  const [blockForm] = Form.useForm();
  const studentEWMode = Form.useWatch('create_ew_bills', studentForm);

  const [bulkResult, setBulkResult] =
    useState<BulkInvoiceResult | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] =
    useState<ManagerInvoice | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    paid: 0,
    unpaid: 0,
    overdue: 0,
    totalAmount: 0,
    paidAmount: 0,
  });

  const buildFilter = useCallback((): ManagerInvoiceFilter => {
    const f: ManagerInvoiceFilter = { page, limit: 25 };
    if (studentCode.trim()) f.student_code = studentCode.trim();
    if (statusFilter) f.payment_status = statusFilter;
    if (monthFilter) f.invoice_month = monthFilter;
    if (roomFilter) f.room_id = roomFilter;
    else if (blockFilter) f.block_id = blockFilter;
    return f;
  }, [
    page,
    studentCode,
    statusFilter,
    monthFilter,
    blockFilter,
    roomFilter,
  ]);

  const fetchData = useCallback(
    async (p = page) => {
      setLoading(true);
      try {
        const f: ManagerInvoiceFilter = { ...buildFilter(), page: p };
        const res = await getManagerInvoices(f);
        setInvoices(res.data);
        setTotal(res.total);

        // Compute stats from current page (approximation from full list on first load)
        if (
          p === 1 &&
          !studentCode &&
          !statusFilter &&
          !monthFilter &&
          !blockFilter &&
          !roomFilter
        ) {
          const allRes = await getManagerInvoices({ limit: 1000 });
          const all = allRes.data;
          setStats({
            total: all.length,
            paid: all.filter(i => i.payment_status === 'paid').length,
            unpaid: all.filter(i => i.payment_status === 'unpaid')
              .length,
            overdue: all.filter(i => i.payment_status === 'overdue')
              .length,
            totalAmount: all.reduce((s, i) => s + i.total_amount, 0),
            paidAmount: all
              .filter(i => i.payment_status === 'paid')
              .reduce((s, i) => s + i.total_amount, 0),
          });
        }
      } catch {
        message.error('Failed to load invoices');
      } finally {
        setLoading(false);
      }
    },
    [
      buildFilter,
      studentCode,
      statusFilter,
      monthFilter,
      blockFilter,
      roomFilter,
    ],
  );

  const refreshStats = async () => {
    try {
      const allRes = await getManagerInvoices({ limit: 1000 });
      const all = allRes.data;
      setStats({
        total: allRes.total,
        paid: all.filter(i => i.payment_status === 'paid').length,
        unpaid: all.filter(i => i.payment_status === 'unpaid').length,
        overdue: all.filter(i => i.payment_status === 'overdue')
          .length,
        totalAmount: all.reduce((s, i) => s + i.total_amount, 0),
        paidAmount: all
          .filter(i => i.payment_status === 'paid')
          .reduce((s, i) => s + i.total_amount, 0),
      });
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchData(1);
    setPage(1);
  }, []);

  useEffect(() => {
    fetchBlocks({ limit: 200 })
      .then(res =>
        setBlocks(Array.isArray(res) ? res : (res?.items ?? [])),
      )
      .catch(() => {});
    fetchRooms({ limit: 500 })
      .then(res =>
        setRooms(Array.isArray(res) ? res : (res?.items ?? [])),
      )
      .catch(() => {});
  }, []);

  const handleSearch = () => {
    setPage(1);
    fetchData(1);
  };
  const handleReset = () => {
    setStudentCode('');
    setStatusFilter('');
    setMonthFilter('');
    setBlockFilter('');
    setRoomFilter('');
    setPage(1);
    fetchData(1);
  };

  const handleViewDetail = async (record: ManagerInvoice) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const detail = await getManagerInvoiceDetail(record.id);
      setDetailRecord(detail);
    } catch {
      message.error('Failed to load invoice detail');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelManagerInvoice(id);
      message.success('Invoice cancelled');
      fetchData(page);
      refreshStats();
    } catch (err: unknown) {
      message.error(
        (err as { message?: string })?.message ||
          'Failed to cancel invoice',
      );
    }
  };

  const handleCreateSubmit = async () => {
    setCreateLoading(true);
    setCreateFeedback(null);
    try {
      if (createTab === 'student') {
        const values = await studentForm.validateFields();
        if (values.create_ew_bills) {
          const result = await createEWInvoiceForStudent({
            student_code: values.student_code,
            invoice_month:
              values.invoice_month?.format?.('YYYY-MM') ??
              values.invoice_month,
            due_date: values.due_date.toISOString(),
          });
          message.success(result.message);
          setCreateFeedback({ type: 'success', message: result.message });
          closeCreate();
          fetchData(1);
          refreshStats();
          return;
        }
        const body: CreateInvoiceDto = {
          student_code: values.student_code,
          invoice_month:
            values.invoice_month?.format?.('YYYY-MM') ??
            values.invoice_month,
          room_fee: values.room_fee || 0,
          electricity_fee: values.electricity_fee || 0,
          water_fee: values.water_fee || 0,
          service_fee: values.service_fee || 0,
          other_fees: values.other_fees || 0,
          other_fees_description: values.other_fees_description,
          due_date: values.due_date.toISOString(),
        };
        await createInvoiceForStudent(body);
        message.success('Invoice created for student');
        setCreateFeedback({
          type: 'success',
          message: 'Invoice created for student',
        });
        setCreateOpen(false);
        studentForm.resetFields();
      } else if (createTab === 'room') {
        const values = await roomForm.validateFields();
        const body: BulkInvoiceDto = {
          invoice_month:
            values.invoice_month?.format?.('YYYY-MM') ??
            values.invoice_month,
          room_fee: values.room_fee || 0,
          electricity_fee: values.electricity_fee || 0,
          water_fee: values.water_fee || 0,
          service_fee: values.service_fee || 0,
          other_fees: values.other_fees || 0,
          other_fees_description: values.other_fees_description,
          due_date: values.due_date.toISOString(),
        };
        const result = await createInvoicesForRoom(
          values.room_id,
          body,
        );
        setCreateFeedback({
          type: 'success',
          message: `Created ${result.created} invoice(s) for the selected room`,
        });
        setBulkResult(result);
        roomForm.resetFields();
      } else {
        const values = await blockForm.validateFields();
        const result = await createEWInvoicesForAllBlocks({
          invoice_month:
            values.invoice_month?.format?.('YYYY-MM') ??
            values.invoice_month,
          due_date: values.due_date.toISOString(),
        });
        message.success(result.message);
        setCreateFeedback({ type: 'success', message: result.message });
        closeCreate();
        fetchData(1);
        refreshStats();
        return;
      }

      fetchData(1);
      refreshStats();
    } catch (err: unknown) {
      const context =
        createTab === 'student'
          ? studentEWMode
            ? 'student-ew'
            : 'student-manual'
          : createTab === 'room'
            ? 'room'
            : 'block-ew';
      const feedback = buildCreateInvoiceErrorMessage(err, context);
      setCreateFeedback(feedback);
      if (feedback.type === 'warning') {
        message.warning(feedback.message);
      } else {
        message.error(feedback.message);
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreateFeedback(null);
    setBulkResult(null);
    studentForm.resetFields();
    roomForm.resetFields();
    blockForm.resetFields();
  };

  const columns: ColumnsType<ManagerInvoice> = [
    {
      title: 'Invoice Code',
      dataIndex: 'invoice_code',
      key: 'invoice_code',
      width: 160,
      render: (code: string) => (
        <span className='font-mono text-sm font-semibold text-blue-600'>
          {code}
        </span>
      ),
    },
    {
      title: 'Student',
      key: 'student',
      width: 180,
      render: (_, record) =>
        record.student ? (
          <div>
            <div className='font-medium text-sm'>
              {record.student.full_name}
            </div>
            <div className='text-xs text-gray-400'>
              {record.student.student_code}
            </div>
          </div>
        ) : (
          <span className='text-gray-400'>—</span>
        ),
    },
    {
      title: 'Room',
      key: 'room',
      width: 140,
      render: (_, record) =>
        record.room ? (
          <div>
            <div className='text-sm font-medium'>
              {record.room.room_number}
            </div>
            {record.room.block && (
              <div className='text-xs text-gray-400'>
                {record.room.block.block_name}
              </div>
            )}
          </div>
        ) : (
          <span className='text-gray-400'>—</span>
        ),
    },
    {
      title: 'Month',
      dataIndex: 'invoice_month',
      key: 'invoice_month',
      width: 100,
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 150,
      render: (amount: number) => (
        <span className='font-semibold text-gray-800'>
          {formatVND(amount)}
        </span>
      ),
      sorter: (a, b) => a.total_amount - b.total_amount,
    },
    {
      title: 'Status',
      dataIndex: 'payment_status',
      key: 'payment_status',
      width: 110,
      render: (s: string) => {
        const cfg = STATUS_CONFIG[s] || {
          color: 'default',
          label: s,
          icon: null,
        };
        return (
          <Tag color={cfg.color} icon={cfg.icon}>
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 110,
      render: (d: string, record) => {
        const due = dayjs(d);
        const isOverdue =
          due.isBefore(dayjs()) && record.payment_status === 'unpaid';
        return (
          <span
            className={isOverdue ? 'text-red-500 font-medium' : ''}
          >
            {due.format('DD/MM/YYYY')}
          </span>
        );
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 130,
      render: (_, record) => (
        <Space>
          <Tooltip title='View Detail'>
            <Button
              type='text'
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {(record.payment_status === 'unpaid' ||
            record.payment_status === 'overdue') && (
            <Popconfirm
              title='Cancel this invoice?'
              onConfirm={() => handleCancel(record.id)}
              okText='Yes'
              cancelText='No'
              okButtonProps={{ danger: true }}
            >
              <Tooltip title='Cancel Invoice'>
                <Button
                  type='text'
                  icon={<StopOutlined />}
                  className='text-orange-500'
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>
            Invoice Management
          </h1>
          <p className='text-sm text-gray-500 mt-0.5'>
            Create and manage student invoices manually
          </p>
        </div>
        <Button
          type='primary'
          icon={<PlusOutlined />}
          size='large'
          onClick={() => setCreateOpen(true)}
          style={{ background: '#f37021', borderColor: '#f37021' }}
        >
          Create Invoice
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className='shadow-sm'>
            <Statistic
              title='Total Invoices'
              value={stats.total}
              prefix={
                <FileTextOutlined className='text-blue-500 mr-1' />
              }
              valueStyle={{ color: '#1d4ed8' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className='shadow-sm'>
            <Statistic
              title='Paid'
              value={stats.paid}
              prefix={
                <CheckCircleOutlined className='text-green-500 mr-1' />
              }
              valueStyle={{ color: '#16a34a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className='shadow-sm'>
            <Statistic
              title='Unpaid'
              value={stats.unpaid}
              prefix={
                <ClockCircleOutlined className='text-orange-500 mr-1' />
              }
              valueStyle={{ color: '#d97706' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} className='shadow-sm'>
            <Statistic
              title='Overdue'
              value={stats.overdue}
              prefix={
                <ExclamationCircleOutlined className='text-red-500 mr-1' />
              }
              valueStyle={{ color: '#dc2626' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card bordered={false} className='shadow-sm'>
        <div className='flex flex-wrap gap-3 items-end'>
          <div>
            <div className='text-xs text-gray-500 mb-1'>
              Student Code
            </div>
            <Input
              prefix={<Search className='w-4 h-4 text-gray-400' />}
              placeholder='e.g. DE180775'
              value={studentCode}
              onChange={e => setStudentCode(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 180 }}
            />
          </div>
          <div>
            <div className='text-xs text-gray-500 mb-1'>Status</div>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 140 }}
              allowClear
              placeholder='All status'
            >
              {Object.entries(STATUS_CONFIG).map(([v, cfg]) => (
                <Option key={v} value={v}>
                  {cfg.label}
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <div className='text-xs text-gray-500 mb-1'>Month</div>
            <Input
              placeholder='e.g. 2025-05'
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
              style={{ width: 130 }}
              onPressEnter={handleSearch}
            />
          </div>
          <div>
            <div className='text-xs text-gray-500 mb-1'>Block</div>
            <Select
              value={blockFilter}
              onChange={v => {
                setBlockFilter(v);
                setRoomFilter('');
              }}
              style={{ width: 160 }}
              allowClear
              placeholder='All blocks'
              showSearch
              optionFilterProp='children'
            >
              {blocks.map(b => (
                <Option key={b.id} value={b.id}>
                  {b.block_name || b.block_code}
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <div className='text-xs text-gray-500 mb-1'>Room</div>
            <Select
              value={roomFilter}
              onChange={setRoomFilter}
              style={{ width: 140 }}
              allowClear
              placeholder='All rooms'
              showSearch
              optionFilterProp='children'
            >
              {rooms
                .filter(r => {
                  if (!blockFilter) return true;
                  const b = r.block;
                  return typeof b === 'string'
                    ? b === blockFilter
                    : (b as { id: string }).id === blockFilter;
                })
                .map(r => (
                  <Option key={r.id} value={r.id}>
                    {r.room_number}
                  </Option>
                ))}
            </Select>
          </div>
          <Space>
            <Button
              type='primary'
              onClick={handleSearch}
              style={{
                background: '#f37021',
                borderColor: '#f37021',
              }}
            >
              Search
            </Button>
            <Button onClick={handleReset}>Reset</Button>
          </Space>
        </div>
        <div className='mt-2 text-sm text-gray-500'>
          Found{' '}
          <span className='font-semibold text-gray-800'>{total}</span>{' '}
          invoice(s)
        </div>
      </Card>

      {/* Table */}
      <Card bordered={false} className='shadow-sm'>
        <Table
          rowKey='id'
          columns={columns}
          dataSource={invoices}
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            current: page,
            pageSize: 25,
            total,
            showSizeChanger: false,
            showTotal: t => `Total ${t} invoices`,
            onChange: p => {
              setPage(p);
              fetchData(p);
            },
          }}
          rowClassName={record =>
            record.payment_status === 'overdue' ||
            (record.payment_status === 'unpaid' &&
              dayjs(record.due_date).isBefore(dayjs()))
              ? 'bg-red-50'
              : ''
          }
        />
      </Card>

      {/* ─── Create Invoice Modal ─────────────────────────────────────── */}
      <Modal
        title={
          <div className='flex items-center gap-2'>
            <PlusOutlined className='text-orange-500' />
            <span>Create Invoice</span>
          </div>
        }
        open={createOpen}
        onCancel={closeCreate}
        width={700}
        footer={
          bulkResult ? (
            <Button
              type='primary'
              onClick={closeCreate}
              style={{
                background: '#f37021',
                borderColor: '#f37021',
              }}
            >
              Close
            </Button>
          ) : (
            <Space>
              <Button onClick={closeCreate}>Cancel</Button>
              <Button
                type='primary'
                loading={createLoading}
                onClick={handleCreateSubmit}
                style={{
                  background: '#f37021',
                  borderColor: '#f37021',
                }}
              >
                Create
              </Button>
            </Space>
          )
        }
      >
        {createFeedback && !bulkResult && (
          <Alert
            type={createFeedback.type}
            showIcon
            message={createFeedback.message}
            style={{ marginBottom: 16 }}
          />
        )}
        {bulkResult ? (
          <div className='py-4'>
            <div className='flex items-center gap-3 mb-4 p-4 bg-green-50 rounded-lg border border-green-200'>
              <CheckCircleOutlined className='text-green-500 text-2xl' />
              <div>
                <div className='font-semibold text-green-700'>
                  Invoices Created Successfully
                </div>
                <div className='text-sm text-green-600'>
                  {bulkResult.created} invoice(s) have been generated
                </div>
              </div>
            </div>
            <div className='space-y-2 max-h-60 overflow-y-auto'>
              {bulkResult.invoices.slice(0, 20).map(inv => (
                <div
                  key={inv.id}
                  className='flex items-center justify-between p-2 bg-gray-50 rounded text-sm'
                >
                  <span className='font-mono text-blue-600 font-medium'>
                    {inv.invoice_code}
                  </span>
                  <span className='text-gray-600'>
                    {inv.student?.full_name || '—'}
                  </span>
                  <span className='font-medium'>
                    {formatVND(inv.total_amount)}
                  </span>
                </div>
              ))}
              {bulkResult.invoices.length > 20 && (
                <div className='text-center text-gray-400 text-xs'>
                  ...and {bulkResult.invoices.length - 20} more
                </div>
              )}
            </div>
          </div>
        ) : (
          <Tabs
            activeKey={createTab}
            onChange={setCreateTab}
            className='mt-2'
          >
            <TabPane tab='Single Student' key='student'>
              <Form
                form={studentForm}
                layout='vertical'
                className='mt-4'
              >
                <Form.Item
                  label='Student Code'
                  name='student_code'
                  rules={[
                    {
                      required: true,
                      message: 'Student code is required',
                    },
                  ]}
                >
                  <Input
                    placeholder='e.g. DE180775'
                    prefix={
                      <Search className='w-4 h-4 text-gray-400' />
                    }
                  />
                </Form.Item>
                <Form.Item
                  label='EW Bills'
                  name='create_ew_bills'
                  valuePropName='checked'
                  initialValue={false}
                >
                  <Switch checkedChildren='EW' unCheckedChildren='Manual' />
                </Form.Item>
                {studentEWMode ? <EWInvoiceFields /> : <FeeFields />}
              </Form>
            </TabPane>

            <TabPane
              tab={<Badge color='blue' text='By Room' />}
              key='room'
            >
              <Form
                form={roomForm}
                layout='vertical'
                className='mt-4'
              >
                <Form.Item
                  label='Select Room'
                  name='room_id'
                  rules={[
                    {
                      required: true,
                      message: 'Please select a room',
                    },
                  ]}
                >
                  <Select
                    showSearch
                    placeholder='Select room'
                    optionFilterProp='label'
                    options={rooms.map(r => {
                      const blockName =
                        typeof r.block === 'object' &&
                        r.block !== null
                          ? (
                              r.block as {
                                block_name?: string;
                                block_code?: string;
                              }
                            ).block_name ||
                            (r.block as { block_code?: string })
                              .block_code ||
                            ''
                          : '';
                      const label = blockName
                        ? `${blockName} - ${r.room_number}`
                        : r.room_number;
                      return { value: r.id, label };
                    })}
                  />
                </Form.Item>
                <div className='mb-3 p-3 bg-blue-50 rounded text-sm text-blue-700'>
                  Invoices will be created for{' '}
                  <strong>all active students</strong> in the selected
                  room.
                </div>
                <FeeFields />
              </Form>
            </TabPane>

            <TabPane
              tab={<Badge color='orange' text='By Block' />}
              key='block'
            >
              <Form
                form={blockForm}
                layout='vertical'
                className='mt-4'
              >
                <div className='mb-3 p-3 bg-orange-50 rounded text-sm text-orange-700'>
                  EW invoices will be created for <strong>all active students in all
                  blocks</strong> that have recalculated EW usage in the selected month.
                </div>
                <EWInvoiceFields />
              </Form>
            </TabPane>
          </Tabs>
        )}
      </Modal>

      {/* ─── Detail Modal ─────────────────────────────────────────────── */}
      <Modal
        title={
          <div className='flex items-center gap-2'>
            <DollarOutlined className='text-orange-500' />
            <span>Invoice Detail</span>
          </div>
        }
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false);
          setDetailRecord(null);
        }}
        footer={
          <Button
            onClick={() => {
              setDetailOpen(false);
              setDetailRecord(null);
            }}
          >
            Close
          </Button>
        }
        width={680}
      >
        {detailLoading ? (
          <div className='py-8 text-center text-gray-400'>
            Loading...
          </div>
        ) : detailRecord ? (
          <div className='space-y-4'>
            {/* Status badge */}
            <div className='flex items-center justify-between'>
              <span className='font-mono text-lg font-bold text-blue-600'>
                {detailRecord.invoice_code}
              </span>
              <Tag
                color={
                  STATUS_CONFIG[detailRecord.payment_status]?.color
                }
                icon={
                  STATUS_CONFIG[detailRecord.payment_status]?.icon
                }
                className='text-sm px-3 py-0.5'
              >
                {STATUS_CONFIG[detailRecord.payment_status]?.label}
              </Tag>
            </div>

            <Descriptions bordered column={2} size='small'>
              <Descriptions.Item label='Student' span={2}>
                {detailRecord.student
                  ? `${detailRecord.student.full_name} (${detailRecord.student.student_code})`
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label='Room'>
                {detailRecord.room?.room_number || '—'}
              </Descriptions.Item>
              <Descriptions.Item label='Block'>
                {detailRecord.room?.block?.block_name || '—'}
              </Descriptions.Item>
              <Descriptions.Item label='Invoice Month'>
                {detailRecord.invoice_month}
              </Descriptions.Item>
              <Descriptions.Item label='Due Date'>
                {dayjs(detailRecord.due_date).format('DD/MM/YYYY')}
              </Descriptions.Item>
              {detailRecord.paid_at && (
                <Descriptions.Item label='Paid At' span={2}>
                  {dayjs(detailRecord.paid_at).format(
                    'DD/MM/YYYY HH:mm',
                  )}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Fee breakdown */}
            <div>
              <div className='font-semibold text-gray-700 mb-2'>
                Fee Breakdown
              </div>
              <div className='rounded-lg border divide-y'>
                {detailRecord.room_fee > 0 && (
                  <div className='flex justify-between px-4 py-2 text-sm'>
                    <span className='text-gray-600'>Room Fee</span>
                    <span className='font-medium'>
                      {formatVND(detailRecord.room_fee)}
                    </span>
                  </div>
                )}
                {detailRecord.electricity_fee > 0 && (
                  <div className='flex justify-between px-4 py-2 text-sm'>
                    <span className='text-gray-600'>
                      Electricity Fee
                    </span>
                    <span className='font-medium'>
                      {formatVND(detailRecord.electricity_fee)}
                    </span>
                  </div>
                )}
                {detailRecord.water_fee > 0 && (
                  <div className='flex justify-between px-4 py-2 text-sm'>
                    <span className='text-gray-600'>Fine</span>
                    <span className='font-medium'>
                      {formatVND(detailRecord.water_fee)}
                    </span>
                  </div>
                )}
                {detailRecord.service_fee > 0 && (
                  <div className='flex justify-between px-4 py-2 text-sm'>
                    <span className='text-gray-600'>Service Fee</span>
                    <span className='font-medium'>
                      {formatVND(detailRecord.service_fee)}
                    </span>
                  </div>
                )}
                {detailRecord.other_fees > 0 && (
                  <div className='flex justify-between px-4 py-2 text-sm'>
                    <span className='text-gray-600'>Other Fees</span>
                    <span className='font-medium'>
                      {formatVND(detailRecord.other_fees)}
                    </span>
                  </div>
                )}
                <div className='flex justify-between px-4 py-3 font-bold text-base bg-gray-50 rounded-b-lg'>
                  <span>Total</span>
                  <span className='text-orange-600'>
                    {formatVND(detailRecord.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Line items */}
            {detailRecord.line_items &&
              detailRecord.line_items.length > 0 && (
                <div>
                  <div className='font-semibold text-gray-700 mb-2'>
                    Line Items
                  </div>
                  <Table
                    size='small'
                    rowKey={r => r.item_type + r.description}
                    dataSource={detailRecord.line_items}
                    pagination={false}
                    columns={[
                      {
                        title: 'Type',
                        dataIndex: 'item_type',
                        key: 'type',
                        width: 100,
                        render: (v: string) => {
                          const map: Record<string, string> = {
                            water: 'Fine',
                            room_fee: 'Room',
                            electricity: 'Electricity',
                            service: 'Service',
                            other: 'Other',
                          };
                          return map[v] ?? v;
                        },
                      },
                      {
                        title: 'Description',
                        dataIndex: 'description',
                        key: 'desc',
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        render: (v: string, r: any) =>
                          r.item_type === 'water' ? 'Fine' : v,
                      },
                      {
                        title: 'Qty',
                        dataIndex: 'quantity',
                        key: 'qty',
                        width: 60,
                      },
                      {
                        title: 'Unit Price',
                        dataIndex: 'unit_price',
                        key: 'price',
                        width: 130,
                        render: (v: number) => formatVND(v),
                      },
                      {
                        title: 'Amount',
                        dataIndex: 'amount',
                        key: 'amount',
                        width: 130,
                        render: (v: number) => (
                          <span className='font-medium'>
                            {formatVND(v)}
                          </span>
                        ),
                      },
                    ]}
                  />
                </div>
              )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
