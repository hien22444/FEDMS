import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  App,
  Badge,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Radio,
  Spin,
  Table,
  Tag,
  Tabs,
  Typography,
} from 'antd';
import { CheckCircleOutlined, FileSearchOutlined, HistoryOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getApprovedCheckoutRequests,
  getCheckoutInspectionHistory,
  inspectCheckoutRequest,
  type StudentCheckoutRequest,
  type InspectCheckoutDto,
} from '@/lib/actions/checkoutRequest';
import { connectSocket } from '@/lib/socket';

const { Title, Text } = Typography;
const { TextArea } = Input;

function formatRoom(room?: StudentCheckoutRequest['room']) {
  if (!room) return '—';
  const parts = [
    room.block?.dorm?.dorm_name,
    room.block?.block_name,
    room.room_number ? `Room ${room.room_number}` : null,
  ].filter(Boolean) as string[];
  return parts.length ? parts.join(' · ') : '—';
}

const cleanlinessLabel: Record<string, { label: string; color: string }> = {
  clean:          { label: 'Clean ✅',          color: 'success' },
  needs_cleaning: { label: 'Needs cleaning ⚠️', color: 'warning' },
  dirty:          { label: 'Dirty ❌',           color: 'error'   },
};

const equipmentLabel: Record<string, { label: string; color: string }> = {
  complete: { label: 'Complete ✅',      color: 'success' },
  missing:  { label: 'Missing items ⚠️', color: 'warning' },
  damaged:  { label: 'Damaged ❌',       color: 'error'   },
};

const statusColor: Record<string, string> = {
  inspected:       'orange',
  pending_payment: 'volcano',
  completed:       'green',
};

const CheckoutRequestsPage = () => {
  const { message } = App.useApp();

  // ── Pending (approved) ───────────────────────────────────────────────────
  const [pending, setPending]   = useState<StudentCheckoutRequest[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  // ── History ──────────────────────────────────────────────────────────────
  const [history, setHistory]   = useState<StudentCheckoutRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage]   = useState(1);

  // ── Inspect modal ────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<StudentCheckoutRequest | null>(null);
  const [modalOpen, setModalOpen]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // ── Active tab ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  const loadPending = useCallback(async () => {
    setPendingLoading(true);
    try {
      const res = await getApprovedCheckoutRequests();
      setPending(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      message.error(e?.message || 'Failed to load');
    } finally {
      setPendingLoading(false);
    }
  }, [message]);

  const loadHistory = useCallback(async (page = 1) => {
    setHistoryLoading(true);
    try {
      const res = await getCheckoutInspectionHistory({ page, limit: 20 });
      setHistory(Array.isArray(res.data) ? res.data : []);
      setHistoryTotal(res.total ?? 0);
      setHistoryPage(page);
    } catch (e: any) {
      message.error(e?.message || 'Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  }, [message]);

  useEffect(() => { loadPending(); }, [loadPending]);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  // Real-time: manager approves → item appears in pending list immediately
  useEffect(() => {
    const socket = connectSocket();
    const handle = (req: StudentCheckoutRequest) => {
      message.info(`New room to inspect: ${req.request_code}`);
      setPending((prev) => prev.find((i) => i.id === req.id) ? prev : [req, ...prev]);
    };
    socket.on('checkout_approved', handle);
    return () => { socket.off('checkout_approved', handle); };
  }, [message]);

  const openInspect = (item: StudentCheckoutRequest) => {
    setSelected(item);
    form.resetFields();
    setModalOpen(true);
  };

  const submitInspection = async () => {
    if (!selected) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const dto: InspectCheckoutDto = {
        cleanliness_status: values.cleanliness_status,
        equipment_status:   values.equipment_status,
        equipment_notes:    values.equipment_notes?.trim()    || undefined,
        maintenance_needed: values.maintenance_needed?.trim() || undefined,
      };
      await inspectCheckoutRequest(selected.id, dto);
      message.success('Room inspection submitted. Manager has been notified.');
      setModalOpen(false);
      setSelected(null);
      loadPending();
      loadHistory(1);
    } catch (e: any) {
      if (!e?.errorFields) {
        message.error(e?.message || 'Failed to submit inspection');
        if (e?.statusCode === 409) {
          setModalOpen(false);
          setSelected(null);
          loadPending();
          loadHistory(1);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ── Pending tab ───────────────────────────────────────────────────────────
  const renderPending = () => {
    if (pendingLoading) return <div className="flex justify-center py-16"><Spin size="large" /></div>;

    if (pending.length === 0) return (
      <Card>
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
          <CheckCircleOutlined style={{ fontSize: 48 }} />
          <Text type="secondary">No rooms awaiting inspection.</Text>
        </div>
      </Card>
    );

    return (
      <div className="space-y-4">
        <Badge count={pending.length} color="orange">
          <Text strong>{pending.length} room{pending.length > 1 ? 's' : ''} awaiting inspection</Text>
        </Badge>

        {pending.map((req) => (
          <Card key={req.id} className="rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {(req.student?.full_name || 'SV').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Text strong className="text-base">{req.student?.full_name || '—'}</Text>
                    <Tag color="orange">{req.student?.student_code || '—'}</Tag>
                    <Tag color="blue">{formatRoom(req.room)}</Tag>
                    {req.bed?.bed_number && <Tag>Bed {req.bed.bed_number}</Tag>}
                  </div>
                  <div className="flex items-center gap-4 flex-wrap text-sm text-gray-500">
                    <span><ClockCircleOutlined className="mr-1" />Expected: {dayjs(req.expected_checkout_date).format('DD/MM/YYYY')}</span>
                    <span>Code: {req.request_code}</span>
                  </div>
                  <Text className="text-sm text-gray-600">{req.reason}</Text>
                </div>
              </div>
              <Button type="primary" icon={<FileSearchOutlined />} onClick={() => openInspect(req)}>
                Inspect Room
              </Button>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  // ── History tab ───────────────────────────────────────────────────────────
  const historyColumns = [
    {
      title: 'Code',
      dataIndex: 'request_code',
      width: 160,
    },
    {
      title: 'Student',
      render: (_: any, r: StudentCheckoutRequest) => (
        <div>
          <div className="font-medium">{r.student?.full_name || '—'}</div>
          <div className="text-xs text-gray-400">{r.student?.student_code}</div>
        </div>
      ),
      width: 180,
    },
    {
      title: 'Room',
      render: (_: any, r: StudentCheckoutRequest) => (
        <div>
          <div>{formatRoom(r.room)}</div>
          {r.bed?.bed_number && <div className="text-xs text-gray-400">Bed {r.bed.bed_number}</div>}
        </div>
      ),
      width: 220,
    },
    {
      title: 'Cleanliness',
      render: (_: any, r: StudentCheckoutRequest) => {
        const v = r.inspection?.cleanliness_status;
        const cfg = v ? cleanlinessLabel[v] : null;
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : '—';
      },
      width: 160,
    },
    {
      title: 'Equipment',
      render: (_: any, r: StudentCheckoutRequest) => {
        const v = r.inspection?.equipment_status;
        const cfg = v ? equipmentLabel[v] : null;
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : '—';
      },
      width: 160,
    },
    {
      title: 'Notes',
      render: (_: any, r: StudentCheckoutRequest) =>
        r.inspection?.equipment_notes || r.inspection?.maintenance_needed
          ? (
            <div className="text-sm space-y-0.5">
              {r.inspection.equipment_notes && <div><span className="text-gray-400">Equipment: </span>{r.inspection.equipment_notes}</div>}
              {r.inspection.maintenance_needed && <div><span className="text-gray-400">Maintenance: </span>{r.inspection.maintenance_needed}</div>}
            </div>
          )
          : <Text type="secondary">—</Text>,
    },
    {
      title: 'Inspected by',
      render: (_: any, r: StudentCheckoutRequest) => (
        <div>
          <div>{r.inspection?.inspected_by?.full_name || '—'}</div>
          {r.inspection?.inspected_at && (
            <div className="text-xs text-gray-400">{dayjs(r.inspection.inspected_at).format('DD/MM/YYYY HH:mm')}</div>
          )}
        </div>
      ),
      width: 160,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 130,
      render: (v: string) => <Tag color={statusColor[v] || 'default'}>{v}</Tag>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Title level={3} style={{ margin: 0 }}>Checkout Requests</Title>
          <Text type="secondary">Room inspections for student checkout requests.</Text>
        </div>
        <Button onClick={() => { loadPending(); loadHistory(historyPage); }} loading={pendingLoading || historyLoading}>
          Refresh
        </Button>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as 'pending' | 'history')}
        items={[
          {
            key: 'pending',
            label: (
              <span className="flex items-center gap-2">
                <FileSearchOutlined />
                Pending Inspection
                {pending.length > 0 && (
                  <Badge count={pending.length} size="small" />
                )}
              </span>
            ),
            children: renderPending(),
          },
          {
            key: 'history',
            label: (
              <span className="flex items-center gap-2">
                <HistoryOutlined />
                Inspection History
              </span>
            ),
            children: (
              <Card className="rounded-xl border border-gray-200">
                <Table
                  rowKey="id"
                  loading={historyLoading}
                  dataSource={history}
                  columns={historyColumns}
                  scroll={{ x: 1200 }}
                  pagination={{
                    current: historyPage,
                    total: historyTotal,
                    pageSize: 20,
                    onChange: (page) => loadHistory(page),
                    showSizeChanger: false,
                    showTotal: (total) => `${total} inspections`,
                  }}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Inspection Modal */}
      <Modal
        open={modalOpen}
        title={`Room Inspection — ${selected?.request_code}`}
        onCancel={() => { setModalOpen(false); setSelected(null); }}
        onOk={submitInspection}
        okText="Submit Inspection"
        confirmLoading={submitting}
        destroyOnClose
        width={560}
      >
        {selected && (
          <div className="space-y-4">
            <Alert
              type="info"
              showIcon
              message={`Inspect ${formatRoom(selected.room)} · Bed ${selected.bed?.bed_number || '—'}`}
              description={`Student: ${selected.student?.full_name} (${selected.student?.student_code})`}
            />
            <Form form={form} layout="vertical">
              <Form.Item
                name="cleanliness_status"
                label="Cleanliness"
                rules={[{ required: true, message: 'Please select cleanliness status' }]}
              >
                <Radio.Group>
                  <Radio value="clean">Clean ✅</Radio>
                  <Radio value="needs_cleaning">Needs cleaning ⚠️</Radio>
                  <Radio value="dirty">Dirty ❌</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item
                name="equipment_status"
                label="Equipment / Furniture"
                rules={[{ required: true, message: 'Please select equipment status' }]}
              >
                <Radio.Group>
                  <Radio value="complete">Complete ✅</Radio>
                  <Radio value="missing">Missing items ⚠️</Radio>
                  <Radio value="damaged">Damaged ❌</Radio>
                </Radio.Group>
              </Form.Item>
              <Form.Item name="equipment_notes" label="Equipment notes (optional)">
                <TextArea rows={3} placeholder="Describe any missing or damaged items..." maxLength={500} />
              </Form.Item>
              <Form.Item name="maintenance_needed" label="Maintenance needed (optional)">
                <TextArea rows={2} placeholder="List any repairs needed..." maxLength={500} />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CheckoutRequestsPage;
