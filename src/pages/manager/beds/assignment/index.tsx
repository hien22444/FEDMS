import { useEffect, useState } from 'react';
import { Select, Button, Alert, Tag, Modal, Tabs, Table, Input, Typography, Card, message } from 'antd';
import { ArrowRight, UserCheck, BedDouble } from 'lucide-react';
import {
  fetchBeds,
  changeBedAssignment,
  fetchBedTransferHistory,
  type Bed,
  type BedTransferHistoryItem,
} from '@/lib/actions/admin';
import {
  confirmTransferRefundDone,
  getAllTransferRequests,
  reviewTransferRequest,
  type RoomTransferRequest,
  type TransferReviewApproveResponse,
} from '@/lib/actions/roomTransfer';
import { connectSocket } from '@/lib/socket';

const { Text } = Typography;

const BED_LABEL = (b: Bed) => {
  const room = `${b.room?.block?.block_name ?? ''}-${b.room?.room_number ?? ''}`;
  return `${room} · Bed #${b.bed_number}`;
};

const OCCUPIED_BED_STUDENT_LABEL = (b?: Bed) => {
  const name = b?.contract?.student?.full_name || 'Unknown student';
  const code = b?.contract?.student?.student_code || 'N/A';
  return `${name} (${code})`;
};

const formatMoneyVnd = (n?: number) =>
  typeof n === 'number' && !Number.isNaN(n) ? `${n.toLocaleString('vi-VN')} ₫` : '—';

const TRANSFER_ROOM_BED_LABEL = (room?: RoomTransferRequest['requested_room'] | RoomTransferRequest['current_room'] | null, bed?: RoomTransferRequest['requested_bed'] | RoomTransferRequest['current_bed'] | null) => {
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

export default function ChangeBedAssignmentPage() {
  const [modal, modalContextHolder] = Modal.useModal();
  const [tab, setTab] = useState<'manual' | 'requests'>('manual');
  const [occupiedBeds, setOccupiedBeds] = useState<Bed[]>([]);
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [loadingOccupied, setLoadingOccupied] = useState(false);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  const [sourceBedId, setSourceBedId] = useState<string | undefined>();
  const [targetBedId, setTargetBedId] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const sourceBed = occupiedBeds.find((b) => b.id === sourceBedId);
  const targetBed = availableBeds.find((b) => b.id === targetBedId);
  const [historyItems, setHistoryItems] = useState<BedTransferHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [transferItems, setTransferItems] = useState<RoomTransferRequest[]>([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferReviewLoading, setTransferReviewLoading] = useState(false);
  const [refundConfirmLoading, setRefundConfirmLoading] = useState(false);
  const [transferStatusFilter, setTransferStatusFilter] = useState<string>('all');
  const [transferSelected, setTransferSelected] = useState<RoomTransferRequest | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadOccupied();
    loadAvailable();
    loadHistory();
  }, []);

  useEffect(() => {
    loadTransferRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transferStatusFilter]);

  useEffect(() => {
    const socket = connectSocket();
    const refreshAll = () => {
      void Promise.all([loadTransferRequests(), loadOccupied(), loadAvailable(), loadHistory()]);
    };
    socket.on('room_transfer_updated', refreshAll);
    socket.on('room_transfer_history_updated', refreshAll);
    return () => {
      socket.off('room_transfer_updated', refreshAll);
      socket.off('room_transfer_history_updated', refreshAll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transferStatusFilter]);

  const loadOccupied = async () => {
    try {
      setLoadingOccupied(true);
      const res = await fetchBeds({ status: 'occupied', page: 1, limit: 500 });
      setOccupiedBeds(res.items);
    } catch { /* silent */ } finally {
      setLoadingOccupied(false);
    }
  };

  const loadAvailable = async () => {
    try {
      setLoadingAvailable(true);
      const res = await fetchBeds({ status: 'available', page: 1, limit: 500 });
      setAvailableBeds(res.items);
    } catch { /* silent */ } finally {
      setLoadingAvailable(false);
    }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await fetchBedTransferHistory({ page: 1, limit: 20 });
      setHistoryItems(Array.isArray(res.items) ? res.items : []);
    } catch {
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!sourceBedId || !targetBedId) return;
    modal.confirm({
      title: 'Confirm Bed Assignment Change',
      content: (
        <div className="mt-2 space-y-2 text-sm">
          <p><strong>From:</strong> {sourceBed ? BED_LABEL(sourceBed) : '-'}</p>
          <p><strong>Student:</strong> {OCCUPIED_BED_STUDENT_LABEL(sourceBed)}</p>
          <p><strong>To:</strong> {targetBed ? BED_LABEL(targetBed) : '-'}</p>
          <p className="text-orange-600 text-xs mt-2">This will update the student's contract and bed statuses.</p>
        </div>
      ),
      okText: 'Confirm',
      cancelText: 'Cancel',
      okButtonProps: { danger: false },
      centered: true,
      onOk: handleSubmit,
    });
  };

  const transferStatusTag = (s: string) => {
    if (s === 'pending_partner') return <Tag color="orange">pending_partner</Tag>;
    if (s === 'pending_manager') return <Tag color="processing">pending_manager</Tag>;
    if (s === 'pending_payment_upgrade') return <Tag color="gold">pending_payment_upgrade</Tag>;
    if (s === 'pending_refund_office') return <Tag color="cyan">pending_refund_office</Tag>;
    if (s === 'approved') return <Tag color="success">approved</Tag>;
    if (s === 'rejected') return <Tag color="error">rejected</Tag>;
    if (s === 'cancelled') return <Tag>cancelled</Tag>;
    return <Tag>{s}</Tag>;
  };

  const loadTransferRequests = async () => {
    try {
      setTransferLoading(true);
      const res = await getAllTransferRequests({
        status: transferStatusFilter === 'all' ? undefined : transferStatusFilter,
        page: 1,
        limit: 100,
      });
      setTransferItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      // silent
    } finally {
      setTransferLoading(false);
    }
  };

  const submitTransferReview = async (action: 'approve' | 'reject', req?: RoomTransferRequest) => {
    const target = req || transferSelected;
    if (!target) return;
    try {
      setTransferReviewLoading(true);
      const data = await reviewTransferRequest(target.id, {
        action,
        rejection_reason: action === 'reject' ? rejectionReason || 'Rejected by manager' : undefined,
      });
      const maybeUpgrade = data as TransferReviewApproveResponse;
      setSuccessMsg(
        action === 'approve' && maybeUpgrade && 'payos' in maybeUpgrade
          ? 'Upgrade approved — student payment pending.'
          : `Transfer request ${action}d successfully`
      );
      setTransferSelected(null);
      setReviewModalOpen(false);
      setRejectionReason('');
      await Promise.all([loadTransferRequests(), loadOccupied(), loadAvailable(), loadHistory()]);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to review transfer request');
    } finally {
      setTransferReviewLoading(false);
    }
  };

  const confirmTransferReview = (action: 'approve' | 'reject', req?: RoomTransferRequest) => {
    const target = req || transferSelected;
    if (!target) return;

    const isApprove = action === 'approve';
    modal.confirm({
      title: isApprove ? 'Confirm approve transfer request?' : 'Confirm reject transfer request?',
      content: (
        <div className="text-sm">
          <div>
            Request: <strong>{target.request_code}</strong>
          </div>
          <div className="mt-1">
            Action: <strong>{isApprove ? 'Approve & Execute' : 'Reject'}</strong>
          </div>
          {!isApprove && (
            <div className="mt-1 text-gray-600">
              {rejectionReason?.trim()
                ? `Reason: ${rejectionReason.trim()}`
                : 'No rejection reason provided.'}
            </div>
          )}
        </div>
      ),
      okText: isApprove ? 'Approve & Execute' : 'Reject',
      cancelText: 'Back',
      okButtonProps: isApprove ? undefined : { danger: true },
      onOk: () => submitTransferReview(action, target),
    });
  };

  const handleSubmit = async () => {
    if (!sourceBedId || !targetBedId) return;
    try {
      setSubmitting(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      await changeBedAssignment(sourceBedId, targetBedId);
      setSuccessMsg(
        `Successfully moved ${sourceBed?.contract?.student?.full_name || 'student'} from Bed #${sourceBed?.bed_number} to Bed #${targetBed?.bed_number}`
      );
      setSourceBedId(undefined);
      setTargetBedId(undefined);
      // Reload lists
      await Promise.all([loadOccupied(), loadAvailable(), loadHistory()]);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to change bed assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const renderManualChange = () => (
    <>
      {/* Assignment panel */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-start">

        {/* Source bed (occupied) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <BedDouble size={16} className="text-blue-500" />
            <span className="font-semibold text-gray-800">Current Bed (Occupied)</span>
          </div>
          <Select
            showSearch
            allowClear
            placeholder="Search occupied bed or student..."
            loading={loadingOccupied}
            value={sourceBedId}
            onChange={(v) => { setSourceBedId(v); setErrorMsg(null); }}
            filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            options={occupiedBeds.map((b) => ({
              value: b.id,
              label: `${BED_LABEL(b)} — ${OCCUPIED_BED_STUDENT_LABEL(b)}`,
            }))}
            style={{ width: '100%' }}
          />

          {/* Source bed detail */}
          {sourceBed && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm">
              <div className="font-medium text-blue-800 mb-2">
                {sourceBed.room?.block?.block_name}-{sourceBed.room?.room_number} · Bed #{sourceBed.bed_number}
              </div>
              {sourceBed.contract && (
                <div className="space-y-1 text-gray-700">
                  <div><span className="text-gray-500">Name:</span> {sourceBed.contract.student.full_name}</div>
                  <div><span className="text-gray-500">Code:</span> {sourceBed.contract.student.student_code}</div>
                  {sourceBed.contract.student.phone && (
                    <div><span className="text-gray-500">Phone:</span> {sourceBed.contract.student.phone}</div>
                  )}
                  <div><span className="text-gray-500">Semester:</span> {sourceBed.contract.semester}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center py-4 md:py-16">
          <ArrowRight size={32} className="text-orange-400" />
        </div>

        {/* Target bed (available) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <BedDouble size={16} className="text-green-500" />
            <span className="font-semibold text-gray-800">Target Bed (Available)</span>
          </div>
          <Select
            showSearch
            allowClear
            placeholder="Search available bed..."
            loading={loadingAvailable}
            value={targetBedId}
            onChange={(v) => { setTargetBedId(v); setErrorMsg(null); }}
            filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            options={availableBeds.map((b) => ({
              value: b.id,
              label: BED_LABEL(b),
            }))}
            style={{ width: '100%' }}
          />

          {/* Target bed detail */}
          {targetBed && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm">
              <div className="font-medium text-green-800 mb-1">
                {targetBed.room?.block?.block_name}-{targetBed.room?.room_number} · Bed #{targetBed.bed_number}
              </div>
              <div className="text-gray-500">
                Room capacity: {targetBed.room?.total_beds} beds · {targetBed.room?.available_beds} available
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm button */}
      <div className="mt-6 flex justify-center">
        <Button
          type="primary"
          size="large"
          disabled={!sourceBedId || !targetBedId}
          loading={submitting}
          onClick={handleConfirm}
          className="px-10"
        >
          Confirm Assignment Change
        </Button>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900">Change History</h3>
          <Button size="small" onClick={loadHistory}>Refresh</Button>
        </div>
        <Table
          rowKey="id"
          size="small"
          loading={historyLoading}
          dataSource={historyItems}
          pagination={{ pageSize: 8 }}
          locale={{ emptyText: 'No bed assignment change history yet.' }}
          columns={[
            {
              title: 'Time',
              dataIndex: 'changed_at',
              width: 180,
              render: (v: string) => (v ? new Date(v).toLocaleString('vi-VN') : '-'),
            },
            {
              title: 'Student',
              width: 240,
              render: (_, r: BedTransferHistoryItem) =>
                `${r.student?.full_name || '-'} (${r.student?.student_code || '-'})`,
            },
            {
              title: 'From',
              render: (_, r: BedTransferHistoryItem) =>
                `${r.from_room?.block?.dorm?.dorm_code || ''}${r.from_room?.block?.block_code || r.from_room?.block?.block_name || ''}-${r.from_room?.room_number || ''} Bed ${r.from_bed?.bed_number || '-'}`,
            },
            {
              title: 'To',
              render: (_, r: BedTransferHistoryItem) =>
                `${r.to_room?.block?.dorm?.dorm_code || ''}${r.to_room?.block?.block_code || r.to_room?.block?.block_name || ''}-${r.to_room?.room_number || ''} Bed ${r.to_bed?.bed_number || '-'}`,
            },
            {
              title: 'Source',
              width: 160,
              dataIndex: 'transfer_source',
              render: (v: string) => {
                if (v === 'manual_assignment') return 'Manual';
                if (v === 'transfer_request_empty') return 'Request (empty bed)';
                if (v === 'transfer_request_swap') return 'Request (swap)';
                return v;
              },
            },
          ]}
        />
      </div>
    </>
  );

  const pendingForManagerCount = transferItems.filter((i) => i.status === 'pending_manager').length;
  const pendingPaymentCount = transferItems.filter((i) => i.status === 'pending_payment_upgrade').length;
  const pendingRefundOfficeCount = transferItems.filter((i) => i.status === 'pending_refund_office').length;

  const handleConfirmRefundDone = async (req: RoomTransferRequest) => {
    modal.confirm({
      title: 'Mark in-office refund as completed?',
      content: 'Use this after the student has finished the refund process at the office.',
      okText: 'Yes, completed',
      cancelText: 'Back',
      onOk: async () => {
        try {
          setRefundConfirmLoading(true);
          await confirmTransferRefundDone(req.id);
          message.success('Refund marked complete; transfer is fully approved.');
          if (transferSelected?.id === req.id) {
            setTransferSelected(null);
            setReviewModalOpen(false);
          }
          await Promise.all([loadTransferRequests(), loadOccupied(), loadAvailable(), loadHistory()]);
        } catch (err: any) {
          message.error(err?.message || 'Failed to confirm refund');
        } finally {
          setRefundConfirmLoading(false);
        }
      },
    });
  };

  const renderTransferRequests = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <Card size="small">
          <Text type="secondary">Total requests</Text>
          <div className="text-xl font-semibold">{transferItems.length}</div>
        </Card>
        <Card size="small">
          <Text type="secondary">Pending manager</Text>
          <div className="text-xl font-semibold text-blue-600">{pendingForManagerCount}</div>
        </Card>
        <Card size="small">
          <Text type="secondary">Pending partner</Text>
          <div className="text-xl font-semibold text-orange-600">
            {transferItems.filter((i) => i.status === 'pending_partner').length}
          </div>
        </Card>
        <Card size="small">
          <Text type="secondary">Awaiting upgrade payment</Text>
          <div className="text-xl font-semibold text-amber-600">{pendingPaymentCount}</div>
        </Card>
        <Card size="small">
          <Text type="secondary">Refund at office</Text>
          <div className="text-xl font-semibold text-cyan-700">{pendingRefundOfficeCount}</div>
        </Card>
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Select
          value={transferStatusFilter}
          onChange={setTransferStatusFilter}
          style={{ width: 220 }}
          options={[
            { label: 'All statuses', value: 'all' },
            { label: 'Pending partner', value: 'pending_partner' },
            { label: 'Pending manager', value: 'pending_manager' },
            { label: 'Awaiting payment (upgrade)', value: 'pending_payment_upgrade' },
            { label: 'Refund at office', value: 'pending_refund_office' },
            { label: 'Approved', value: 'approved' },
            { label: 'Rejected', value: 'rejected' },
            { label: 'Cancelled', value: 'cancelled' },
          ]}
        />
        <Button onClick={loadTransferRequests}>Refresh</Button>
      </div>
      <Table
        rowKey="id"
        loading={transferLoading}
        dataSource={transferItems}
        pagination={{ pageSize: 8 }}
        columns={[
          { title: 'Code', dataIndex: 'request_code', width: 170 },
          {
            title: 'Initiator',
            render: (_, r) => `${r.initiator_student?.full_name || '-'} (${r.initiator_student?.student_code || '-'})`,
          },
          {
            title: 'Type',
            width: 130,
            render: (_, r) => (r.transfer_type === 'swap' ? 'Swap' : 'Empty bed'),
          },
          {
            title: 'Status',
            width: 150,
            render: (_, r) => transferStatusTag(r.status),
          },
          {
            title: 'Action',
            width: 120,
            render: (_, r) => (
              <Button
                size="small"
                onClick={() => {
                  setTransferSelected(r);
                  setRejectionReason('');
                  setReviewModalOpen(true);
                }}
              >
                View
              </Button>
            ),
          },
        ]}
      />
      {transferReviewLoading && (
        <Alert type="info" showIcon message="Processing transfer request..." />
      )}
      <Modal
        open={reviewModalOpen}
        onCancel={() => setReviewModalOpen(false)}
        footer={null}
        title={transferSelected ? `Transfer request ${transferSelected.request_code}` : 'Transfer request detail'}
      >
        {transferSelected && (
          <div className="space-y-3">
            <div>
              <Text type="secondary">Type: </Text>
              <Text>{transferSelected.transfer_type === 'swap' ? 'Swap' : 'Move to empty bed'}</Text>
            </div>
            <div>
              <Text type="secondary">Status: </Text>
              {transferStatusTag(transferSelected.status)}
            </div>
            <div>
              <Text type="secondary">Initiator: </Text>
              <Text>
                {transferSelected.initiator_student?.full_name} ({transferSelected.initiator_student?.student_code})
              </Text>
            </div>
            {transferSelected.target_student && (
              <div>
                <Text type="secondary">Target student: </Text>
                <Text>
                  {transferSelected.target_student.full_name} ({transferSelected.target_student.student_code})
                </Text>
              </div>
            )}
            <div>
              <Text type="secondary">Reason: </Text>
              <Text>{transferSelected.reason}</Text>
            </div>
            <div>
              <Text type="secondary">Move from bed: </Text>
              <Text>{TRANSFER_ROOM_BED_LABEL(transferSelected.current_room, transferSelected.current_bed)}</Text>
            </div>
            <div>
              <Text type="secondary">Requested bed: </Text>
              <Text>{TRANSFER_ROOM_BED_LABEL(transferSelected.requested_room, transferSelected.requested_bed)}</Text>
            </div>
            {transferSelected.rejection_reason && (
              <div>
                <Text type="secondary">Rejection reason: </Text>
                <Text type="danger">{transferSelected.rejection_reason}</Text>
              </div>
            )}
            {transferSelected.status === 'pending_payment_upgrade' && (
              <Alert
                type="warning"
                showIcon
                className="mt-1"
                message="Waiting for student PayOS payment (36h window)"
                description={
                  <div className="text-sm space-y-1">
                    <div>Supplement: {formatMoneyVnd(transferSelected.supplement_amount)}</div>
                    {transferSelected.payment_deadline ? (
                      <div>Deadline: {new Date(transferSelected.payment_deadline).toLocaleString('vi-VN')}</div>
                    ) : null}
                  </div>
                }
              />
            )}
            {transferSelected.status === 'pending_refund_office' && (
              <>
                <Alert
                  type="info"
                  showIcon
                  className="mt-1"
                  message="Student must visit office for refund (36h)"
                  description={
                    transferSelected.refund_deadline ? (
                      <div className="text-sm">
                        Deadline: {new Date(transferSelected.refund_deadline).toLocaleString('vi-VN')}
                      </div>
                    ) : undefined
                  }
                />
                <div className="flex justify-end pt-2">
                  <Button
                    type="primary"
                    loading={refundConfirmLoading}
                    onClick={() => handleConfirmRefundDone(transferSelected)}
                  >
                    Refund processed (complete)
                  </Button>
                </div>
              </>
            )}
            {transferSelected.status === 'pending_manager' && (
              <>
                <Input.TextArea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Rejection reason (optional)"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    danger
                    loading={transferReviewLoading}
                    onClick={() => confirmTransferReview('reject', transferSelected)}
                  >
                    Reject
                  </Button>
                  <Button
                    type="primary"
                    loading={transferReviewLoading}
                    onClick={() => confirmTransferReview('approve', transferSelected)}
                  >
                    Approve & Execute
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );

  return (
    <div className="p-6">
      {modalContextHolder}
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <UserCheck size={22} className="text-orange-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Change Bed Assignment</h1>
          <p className="text-sm text-gray-500">Move a student from one bed to another available bed</p>
        </div>
      </div>

      {errorMsg && <Alert type="error" message={errorMsg} showIcon className="mb-4" closable onClose={() => setErrorMsg(null)} />}
      {successMsg && <Alert type="success" message={successMsg} showIcon className="mb-4" closable onClose={() => setSuccessMsg(null)} />}

      <Tabs
        activeKey={tab}
        onChange={(k) => setTab(k as 'manual' | 'requests')}
        items={[
          { key: 'manual', label: 'Manual Change Assignment', children: renderManualChange() },
          { key: 'requests', label: 'Student Bed Transfer Requests', children: renderTransferRequests() },
        ]}
      />
    </div>
  );
}
