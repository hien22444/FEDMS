import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Spin, Tag, Typography, message, theme, Table, Tabs } from 'antd';
import {
  cancelTransferRequest,
  checkTransferPaymentStatus,
  createEmptyBedTransferRequest,
  createSwapTransferRequest,
  getSwapTargetPreview,
  getAvailableBedsForTransfer,
  getMyTransferRequests,
  getMyTransferHistory,
  respondSwapTransferRequest,
  type RoomTransferRequest,
  type BedTransferHistoryItem,
  type TransferAvailableBed,
  type SwapTargetPreview,
  type TransferQuota,
  getMyTransferQuota,
} from '@/lib/actions/roomTransfer';
import { getMyMaintenanceContext } from '@/lib/actions';
import { useAuth } from '@/contexts';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { connectSocket } from '@/lib/socket';

const { Title, Text } = Typography;
const { TextArea } = Input;

const BedTransferPage: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const [confirmModal, confirmContextHolder] = Modal.useModal();
  const { profile } = useAuth();
  const { token } = theme.useToken();
  const [loading, setLoading] = useState(true);
  const [canCreateRequest, setCanCreateRequest] = useState(true);
  const [requests, setRequests] = useState<RoomTransferRequest[]>([]);
  const [histories, setHistories] = useState<BedTransferHistoryItem[]>([]);
  const [availableBeds, setAvailableBeds] = useState<TransferAvailableBed[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'target_empty' | 'swap'>('target_empty');
  const [submitting, setSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [swapPreview, setSwapPreview] = useState<SwapTargetPreview | null>(null);
  const [swapPreviewLoading, setSwapPreviewLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'history'>('requests');
  const [form] = Form.useForm();
  const [quota, setQuota] = useState<TransferQuota | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      await getMyMaintenanceContext();
      setCanCreateRequest(true);
      const [transferData, bedData, historyData, quotaData] = await Promise.all([
        getMyTransferRequests().catch(() => []),
        getAvailableBedsForTransfer().catch(() => []),
        getMyTransferHistory().catch(() => []),
        getMyTransferQuota().catch(() => null),
      ]);
      setRequests(Array.isArray(transferData) ? transferData : []);
      setAvailableBeds(Array.isArray(bedData) ? bedData : []);
      setHistories(Array.isArray(historyData) ? historyData : []);
      setQuota(quotaData);
    } catch {
      setCanCreateRequest(false);
      setRequests([]);
      setAvailableBeds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const refresh = () => void load();
    window.addEventListener('student:transfer:upgrade-cancelled', refresh);
    return () => window.removeEventListener('student:transfer:upgrade-cancelled', refresh);
  }, []);

  useEffect(() => {
    const socket = connectSocket();
    const refresh = () => void load();
    socket.on('room_transfer_updated', refresh);
    socket.on('room_transfer_history_updated', refresh);
    return () => {
      socket.off('room_transfer_updated', refresh);
      socket.off('room_transfer_history_updated', refresh);
    };
  }, []);

  const pendingUpgradeRequests = useMemo(
    () => requests.filter((r) => r.status === 'pending_payment_upgrade'),
    [requests],
  );
  const hasPendingUpgradePayment = pendingUpgradeRequests.length > 0;
  useEffect(() => {
    if (!hasPendingUpgradePayment) return;
    const tick = async () => {
      for (const r of pendingUpgradeRequests) {
        try {
          const res = await checkTransferPaymentStatus(r.id);
          if (res.paid) {
            message.success('Payment received. Your bed change is complete.');
            load();
            return;
          }
          if (res.transfer && res.transfer.status !== 'pending_payment_upgrade') {
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
  }, [hasPendingUpgradePayment, pendingUpgradeRequests]);

  const statusTag = (status: string) => {
    if (status === 'pending_partner') return <Tag color="orange">Pending partner</Tag>;
    if (status === 'pending_manager') return <Tag color="processing">Pending manager</Tag>;
    if (status === 'pending_payment_upgrade') return <Tag color="gold">Awaiting payment (upgrade)</Tag>;
    if (status === 'pending_refund_office') return <Tag color="cyan">Refund at office</Tag>;
    if (status === 'approved') return <Tag color="success">Approved</Tag>;
    if (status === 'rejected') return <Tag color="error">Rejected</Tag>;
    if (status === 'cancelled') return <Tag>Cancelled</Tag>;
    return <Tag>{status}</Tag>;
  };

  const roomBedLabel = (
    room?: BedTransferHistoryItem['to_room'] | BedTransferHistoryItem['from_room'],
    bed?: BedTransferHistoryItem['to_bed'] | BedTransferHistoryItem['from_bed']
  ) => {
    const roomNumber = String(room?.room_number || '').trim();
    const dormCode = String(room?.block?.dorm?.dorm_code || '').trim();
    const blockCodeRaw = String(room?.block?.block_code || room?.block?.block_name || '').trim();
    const blockCode = blockCodeRaw.replace(/\s+/g, '');
    const bedNumber = bed?.bed_number || '';
    const fullBlockPrefix = dormCode
      ? (blockCode.toLowerCase().startsWith(dormCode.toLowerCase()) ? blockCode : `${dormCode}${blockCode}`)
      : blockCode;

    const roomLabel = roomNumber
      ? (fullBlockPrefix ? `${fullBlockPrefix}-${roomNumber}` : roomNumber)
      : (fullBlockPrefix || '-');
    return `${roomLabel}${bedNumber ? ` Bed ${bedNumber}` : ''}`;
  };

  const availableBedLabel = (b: TransferAvailableBed) => {
    const dormCode = String(b.room?.block?.dorm?.dorm_code || '').trim();
    const blockCodeRaw = String(b.room?.block?.block_code || b.room?.block?.block_name || '').trim();
    const blockCode = blockCodeRaw.replace(/\s+/g, '');
    const roomNumber = String(b.room?.room_number || '').trim();
    const fullBlockPrefix = dormCode
      ? (blockCode.toLowerCase().startsWith(dormCode.toLowerCase()) ? blockCode : `${dormCode}${blockCode}`)
      : blockCode;
    const roomLabel = roomNumber ? `${fullBlockPrefix}-${roomNumber}` : (fullBlockPrefix || '-');
    const price = b.room_price ?? b.room?.price_per_semester;
    const priceSuffix = typeof price === 'number' && !Number.isNaN(price) ? ` · ${price.toLocaleString('vi-VN')} đ/sem` : '';
    return `${roomLabel} Bed ${b.bed_number}${priceSuffix}`;
  };

  const transferRoomBedLabel = (
    room?:
      | RoomTransferRequest['requested_room']
      | RoomTransferRequest['current_room']
      | SwapTargetPreview['room']
      | null,
    bed?:
      | RoomTransferRequest['requested_bed']
      | RoomTransferRequest['current_bed']
      | SwapTargetPreview['bed']
      | null
  ) => {
    const dormCode = String(room?.block?.dorm?.dorm_code || '').trim();
    const blockCodeRaw = String(room?.block?.block_code || room?.block?.block_name || '').trim();
    const blockCode = blockCodeRaw.replace(/\s+/g, '');
    const roomNumber = String(room?.room_number || '').trim();
    const fullBlockPrefix = dormCode
      ? (blockCode.toLowerCase().startsWith(dormCode.toLowerCase()) ? blockCode : `${dormCode}${blockCode}`)
      : blockCode;
    const roomLabel = roomNumber
      ? (fullBlockPrefix ? `${fullBlockPrefix}-${roomNumber}` : roomNumber)
      : (fullBlockPrefix || '-');
    return `${roomLabel} Bed ${bed?.bed_number || '-'}`;
  };

  const submit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      setInlineError(null);
      if (mode === 'target_empty') {
        await createEmptyBedTransferRequest({
          requested_bed_id: values.requested_bed_id,
          reason: values.reason,
        });
      } else {
        await createSwapTransferRequest({
          target_student_code: values.target_student_code,
          reason: values.reason,
        });
      }
      message.success('Bed transfer request submitted');
      setModalOpen(false);
      form.resetFields();
      setSwapPreview(null);
      load();
    } catch (err: any) {
      if (err?.errorFields) return;
      const raw = String(err?.message || '').toLowerCase();
      const serverMessage = err?.message || 'Failed to submit transfer request';

      // Map common backend validation errors to clearer UI feedback
      if (raw.includes('target_student_code is required')) {
        form.setFields([{ name: 'target_student_code', errors: ['Please enter student code'] }]);
      } else if (raw.includes('reason is required')) {
        form.setFields([{ name: 'reason', errors: ['Please enter reason'] }]);
      } else if (raw.includes('target student not found')) {
        form.setFields([{ name: 'target_student_code', errors: ['Student code not found'] }]);
      } else if (
        raw.includes('không thể tự đổi chéo') ||
        raw.includes('swap with chính mình') ||
        raw.includes('cannot swap with yourself')
      ) {
        form.setFields([{ name: 'target_student_code', errors: ['You cannot swap with yourself'] }]);
      } else if (
        (raw.includes('sinh viên') && raw.includes('chưa có giường')) ||
        (raw.includes('student') && raw.includes('does not currently have a dorm bed'))
      ) {
        form.setFields([{ name: 'target_student_code', errors: [serverMessage] }]);
      } else if (
        raw.includes('chưa có giường') ||
        raw.includes('cannot create bed transfer requests') ||
        raw.includes('do not currently have a dorm bed')
      ) {
        setInlineError('You do not currently have a dorm bed, so you cannot submit a bed transfer request.');
      } else if (
        raw.includes('đang có một đơn đổi giường chưa xử lý') ||
        raw.includes('open request') ||
        raw.includes('open bed transfer request')
      ) {
        setInlineError('You already have an open bed transfer request. Please complete or cancel the current one first.');
      } else if (
        raw.includes('đang có yêu cầu đổi chéo chờ xác nhận') ||
        raw.includes('pending swap request waiting for partner response')
      ) {
        form.setFields([
          { name: 'target_student_code', errors: ['This student already has another pending swap request'] },
        ]);
      } else if (raw.includes('requested bed is no longer available')) {
        form.setFields([{ name: 'requested_bed_id', errors: ['This bed is no longer available. Please choose another bed.'] }]);
      } else if (raw.includes('requested bed must be different')) {
        form.setFields([{ name: 'requested_bed_id', errors: ['You are selecting your current bed. Please choose a different bed.'] }]);
      } else if (raw.includes('same price') || raw.includes('cùng giá') || raw.includes('room prices')) {
        setInlineError(
          mode === 'swap'
            ? 'Swap is only allowed with students whose bed price is the same, and within the same semester stay.'
            : 'During the semester, transfer is only allowed to a bed/room with the same price as your current contract.'
        );
      }

      message.error(serverMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const respond = async (id: string, accept: boolean) => {
    try {
      await respondSwapTransferRequest(id, { accept });
      message.success(accept ? 'Swap accepted, waiting manager approval' : 'Swap rejected');
      load();
    } catch (err: any) {
      message.error(err?.message || 'Failed to respond request');
    }
  };

  const cancel = async (id: string) => {
    try {
      await cancelTransferRequest(id);
      message.success('Transfer request cancelled');
      load();
    } catch (err: any) {
      message.error(err?.message || 'Failed to cancel request');
    }
  };

  const confirmBeforeSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (mode === 'swap' && swapPreview?.swap_allowed === false) {
        message.error('Cannot submit: swap is not allowed (same price required, and only during the stay period).');
        return;
      }
      const summary =
        mode === 'target_empty'
          ? `Request move to bed: ${availableBedLabel(
              availableBeds.find((b) => b.id === values.requested_bed_id) || { id: '', bed_number: '-', status: '', room: {} }
            )}`
          : `Request swap with student: ${values.target_student_code}`;

      confirmModal.confirm({
        title: 'Confirm bed change request',
        content: (
          <div className="text-sm">
            <div>{summary}</div>
            <div className="mt-1 text-gray-600">Reason: {values.reason}</div>
          </div>
        ),
        okText: 'Confirm',
        cancelText: 'Back',
        onOk: submit,
      });
    } catch {
      // Validation errors are already shown by form.
    }
  };

  const confirmRespondSwap = (id: string, accept: boolean) => {
    confirmModal.confirm({
      title: accept ? 'Accept swap request?' : 'Reject swap request?',
      content: accept
        ? 'After accepting, request will be sent to manager for approval.'
        : 'You are about to reject this swap request.',
      okText: accept ? 'Accept' : 'Reject',
      cancelText: 'Back',
      okButtonProps: accept ? undefined : { danger: true },
      onOk: () => respond(id, accept),
    });
  };

  if (loading) {
    return (
      <div
        className={`flex justify-center items-center ${embedded ? 'min-h-[200px]' : 'min-h-[320px]'}`}
        style={embedded ? undefined : { background: token.colorBgLayout }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!canCreateRequest) {
    const emptyInner = (
      <div className={`flex flex-col items-center justify-center text-center ${embedded ? 'min-h-[40vh] py-8' : 'min-h-[55vh]'}`}>
        <img src="/images/booking-not-started.png" alt="No record" style={{ width: 320, marginBottom: 28, opacity: 0.92 }} />
        <Title level={3} style={{ color: '#ea580c', fontWeight: 700, margin: 0 }}>
          No record found!
        </Title>
      </div>
    );
    if (embedded) return emptyInner;
    return (
      <div style={{ padding: '32px', background: token.colorBgLayout }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            {emptyInner}
          </div>
        </div>
      </div>
    );
  }

  const innerContent = (
    <>
      <div className="flex items-end justify-between gap-3 flex-wrap mb-4">
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Change Bed Requests
          </Title>
          <Text type="secondary">Request a move to an empty bed or swap with another student.</Text>
          {quota && (
            <div className="mt-1 text-xs text-gray-600">
              You have used{' '}
              <span className="font-semibold">
                {quota.used}/{quota.max}
              </span>{' '}
              bed changes this semester. Remaining:{' '}
              <span className="font-semibold">{quota.remaining}</span>.
            </div>
          )}
        </div>
        <Space>
          <Button
            disabled={quota?.remaining === 0}
            onClick={() => {
              setMode('target_empty');
              form.resetFields();
              setModalOpen(true);
            }}
          >
            Request empty bed change
          </Button>
          <Button
            type="primary"
            disabled={quota?.remaining === 0}
            onClick={() => {
              setMode('swap');
              form.resetFields();
              setModalOpen(true);
            }}
          >
            Request swap with another student
          </Button>
        </Space>
      </div>

      <Tabs
        className="mt-2"
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as 'requests' | 'history')}
        items={[
          {
            key: 'requests',
            label: 'Requests',
            children: requests.length === 0 ? (
              <Alert type="info" showIcon message="No bed transfer requests yet." />
            ) : (
              <div className="space-y-2">
                {requests.map((r) => (
                  <Card key={r.id} size="small">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <Text strong>{r.request_code}</Text> {statusTag(r.status)}
                        <div className="text-xs text-gray-500 mt-1">
                          Type: {r.transfer_type === 'swap' ? 'Swap with student' : 'Move to empty bed'}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Move from bed: {transferRoomBedLabel(r.current_room, r.current_bed)}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Requested bed: {transferRoomBedLabel(r.requested_room, r.requested_bed)}
                        </div>
                        <div className="text-xs text-gray-700 mt-1">{r.reason}</div>
                        {r.rejection_reason ? (
                          <Text type="danger" className="block text-xs mt-1">
                            Rejection reason: {r.rejection_reason}
                          </Text>
                        ) : null}
                        {r.status === 'pending_payment_upgrade' && (
                          <Text type="secondary" className="block text-xs mt-2">
                            Pay the price difference within 36 hours on the{' '}
                            <Link to={ROUTES.STUDENT_PAYMENT} className="text-blue-600 hover:underline">
                              Payment
                            </Link>{' '}
                            page.
                          </Text>
                        )}
                        {r.status === 'pending_refund_office' && (
                          <Alert
                            className="mt-2"
                            type="warning"
                            showIcon
                            message="Visit the dormitory office for refund"
                            description={
                              <div className="text-sm">
                                <div>
                                  Your move to the lower-priced bed is approved. Please go to the management office within{' '}
                                  <strong>36 hours</strong> to complete the refund procedure.
                                </div>
                                {r.refund_deadline ? (
                                  <div className="mt-1 text-gray-600">
                                    Deadline: {new Date(r.refund_deadline).toLocaleString('vi-VN')}
                                  </div>
                                ) : null}
                              </div>
                            }
                          />
                        )}
                      </div>
                      <Space>
                        {r.status === 'pending_partner' &&
                          r.target_student?.student_code === profile?.student_code && (
                          <>
                            <Button size="small" onClick={() => confirmRespondSwap(r.id, true)}>Accept</Button>
                            <Button size="small" danger onClick={() => confirmRespondSwap(r.id, false)}>Reject</Button>
                          </>
                        )}
                        {(r.status === 'pending_manager' ||
                          (r.status === 'pending_partner' &&
                            r.initiator_student?.student_code === profile?.student_code)) && (
                          <Popconfirm
                            title="Cancel this transfer request?"
                            description="This action cannot be undone."
                            onConfirm={() => cancel(r.id)}
                          >
                            <Button size="small">Cancel</Button>
                          </Popconfirm>
                        )}
                      </Space>
                    </div>
                  </Card>
                ))}
              </div>
            ),
          },
          {
            key: 'history',
            label: 'History',
            children: (
              <Table<BedTransferHistoryItem>
                rowKey="id"
                size="small"
                dataSource={histories}
                pagination={{ pageSize: 6, showSizeChanger: false }}
                locale={{ emptyText: 'No transfer history yet' }}
                columns={[
                  {
                    title: 'Time',
                    dataIndex: 'changed_at',
                    width: 170,
                    render: (v: string) => (v ? new Date(v).toLocaleString('vi-VN') : '-'),
                  },
                  {
                    title: 'From',
                    render: (_, row) => roomBedLabel(row.from_room, row.from_bed),
                  },
                  {
                    title: 'To',
                    render: (_, row) => roomBedLabel(row.to_room, row.to_bed),
                  },
                  {
                    title: 'Source',
                    dataIndex: 'transfer_source',
                    width: 170,
                    render: (v: string) => {
                      if (v === 'manual_assignment') return 'Manager manual';
                      if (v === 'transfer_request_empty') return 'Request (empty bed)';
                      if (v === 'transfer_request_swap') return 'Request (swap)';
                      return v;
                    },
                  },
                ]}
              />
            ),
          },
        ]}
      />
    </>
  );

  const transferModal = (
    <Modal
      open={modalOpen}
      onCancel={() => {
        setModalOpen(false);
        setInlineError(null);
        setSwapPreview(null);
      }}
      onOk={confirmBeforeSubmit}
      confirmLoading={submitting}
      title={mode === 'swap' ? 'Swap bed with another student' : 'Move to an available bed'}
      okText="Submit"
      destroyOnClose
    >
      {inlineError && (
        <Alert
          type="warning"
          showIcon
          message={inlineError}
          style={{ marginBottom: 12 }}
        />
      )}
      <Form form={form} layout="vertical">
        {mode === 'target_empty' ? (
          <Form.Item
            name="requested_bed_id"
            label="Desired bed"
            rules={[{ required: true, message: 'Please select a bed' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={availableBeds.map((b) => ({
                value: b.id,
                label: availableBedLabel(b),
              }))}
            />
          </Form.Item>
        ) : (
          <Form.Item
            name="target_student_code"
            label="Student code to swap with"
            rules={[{ required: true, message: 'Please enter student code' }]}
          >
            <Input
              placeholder="e.g. DE170123"
              onBlur={async (e) => {
                const code = String(e.target.value || '').trim();
                if (!code) {
                  setSwapPreview(null);
                  return;
                }
                try {
                  setSwapPreviewLoading(true);
                  setSwapPreview(null);
                  const data = await getSwapTargetPreview(code);
                  setSwapPreview(data || null);
                } catch (err: any) {
                  setSwapPreview(null);
                  const msg = String(err?.message || '').toLowerCase();
                  if (msg.includes('target student not found')) {
                    form.setFields([{ name: 'target_student_code', errors: ['Student code not found'] }]);
                  }
                } finally {
                  setSwapPreviewLoading(false);
                }
              }}
            />
          </Form.Item>
        )}
        {mode === 'swap' && (
          <div className="mb-3">
            {swapPreviewLoading && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                Checking student information...
              </div>
            )}
            {swapPreview && !swapPreviewLoading && (
              <>
                {swapPreview.swap_allowed === false && (
                  <Alert
                    type="error"
                    showIcon
                    className="mb-2"
                    message="Swap not allowed"
                    description={
                      <div className="text-sm">
                        You can only swap with a student whose bed has the same semester price, and only during the stay
                        period.{' '}
                        {typeof swapPreview.initiator_room_price === 'number' &&
                        typeof swapPreview.room_price === 'number' ? (
                          <span>
                            Your price: {swapPreview.initiator_room_price.toLocaleString('vi-VN')} đ · Their price:{' '}
                            {swapPreview.room_price.toLocaleString('vi-VN')} đ
                          </span>
                        ) : null}
                      </div>
                    }
                  />
                )}
                <div
                  className={`rounded-lg border px-3 py-2 ${
                    swapPreview.swap_allowed === false
                      ? 'border-gray-200 bg-gray-50'
                      : 'border-emerald-200 bg-emerald-50'
                  }`}
                >
                  <div className={`text-xs ${swapPreview.swap_allowed === false ? 'text-gray-600' : 'text-emerald-700'}`}>
                    Student
                  </div>
                  <div
                    className={`text-sm font-medium leading-5 ${
                      swapPreview.swap_allowed === false ? 'text-gray-900' : 'text-emerald-900'
                    }`}
                  >
                    {swapPreview.student.full_name} ({swapPreview.student.student_code})
                  </div>
                  <div
                    className={`mt-1 text-xs ${swapPreview.swap_allowed === false ? 'text-gray-600' : 'text-emerald-700'}`}
                  >
                    Current bed
                  </div>
                  <div className={`text-sm ${swapPreview.swap_allowed === false ? 'text-gray-800' : 'text-emerald-900'}`}>
                    {transferRoomBedLabel(swapPreview.room, swapPreview.bed)}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        <Form.Item
          name="reason"
          label="Reason"
          rules={[{ required: true, message: 'Please enter reason' }, { min: 10, message: 'At least 10 characters' }]}
        >
          <TextArea rows={4} placeholder="Explain why you want to change/swap bed..." />
        </Form.Item>
      </Form>
    </Modal>
  );

  if (embedded) {
    return (
      <>
        {confirmContextHolder}
        {innerContent}
        {transferModal}
      </>
    );
  }

  return (
    <div style={{ padding: '32px', background: token.colorBgLayout }}>
      {confirmContextHolder}
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          {innerContent}
        </div>
      </div>
      {transferModal}
    </div>
  );
};

export default BedTransferPage;
