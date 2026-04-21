import { useCallback, useEffect, useState } from 'react';
import { connectSocket } from '@/lib/socket';
import { Alert, App, Button, Card, Form, Image, Input, Modal, Select, Space, Table, Tabs, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { getAllOtherRequests, reviewOtherRequest, type OtherRequestItem } from '@/lib/actions/otherRequest';
import {
  getAllMaintenanceRequests,
  reviewMaintenanceRequest,
  type StudentMaintenanceRequest,
} from '@/lib/actions/maintenanceRequest';
import {
  getAllCheckoutRequests,
  reviewCheckoutRequest,
  completeCheckoutRequest,
  type StudentCheckoutRequest,
} from '@/lib/actions/checkoutRequest';
import { useWindowSize } from '@/hooks/useWindowSize';

const { Title, Text } = Typography;

const statusColor: Record<string, string> = {
  pending: 'processing',
  in_review: 'warning',
  resolved: 'success',
  rejected: 'error',
};

const maintenanceStatusColor: Record<string, string> = {
  pending: 'processing',
  approved: 'success',
  assigned: 'blue',
  in_progress: 'warning',
  completed: 'cyan',
  rejected: 'error',
};

type TabKey = 'list' | 'detail';

export default function ManagerRequestsPage() {
  const { message } = App.useApp();
  const { width } = useWindowSize();
  const isTablet = width >= 768;
  const [items, setItems] = useState<OtherRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<OtherRequestItem | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('list');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [form] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const isSelectedFinalized = selected?.status === 'resolved' || selected?.status === 'rejected';

  // Toggle between All / Other / Maintenance / Checkout Requests
  type RequestModeKey = 'all' | 'other' | 'maintenance' | 'checkout';
  const [mode, setMode] = useState<RequestModeKey>('all');

  // ===== All Requests (unified) =====
  type UnifiedRequest = {
    id: string;
    _type: 'other' | 'maintenance' | 'checkout';
    request_code: string;
    student_name: string;
    student_code: string;
    room: string;
    status: string;
    created_at: string;
    _raw: any;
  };
  const [allItems, setAllItems] = useState<UnifiedRequest[]>([]);
  const [allLoading, setAllLoading] = useState(false);
  const [allStatusFilter, setAllStatusFilter] = useState<string>('all');
  const [allSearch, setAllSearch] = useState<string>('');

  // ===== Maintenance states (manager) =====
  type MaintenanceTabKey = 'list' | 'detail';
  const terminalMaintenanceStatuses = ['completed', 'done', 'cannot_fix', 'cancelled', 'rejected'];
  const [maintenanceItems, setMaintenanceItems] = useState<StudentMaintenanceRequest[]>([]);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceStatusFilter, setMaintenanceStatusFilter] = useState<string>('all');
  const [maintenanceSelected, setMaintenanceSelected] = useState<StudentMaintenanceRequest | null>(null);
  const [maintenanceActiveTab, setMaintenanceActiveTab] = useState<MaintenanceTabKey>('list');
  const [maintenanceReviewLoading, setMaintenanceReviewLoading] = useState(false);
  const [maintenanceForm] = Form.useForm();
  const selectedMaintenanceStatus = Form.useWatch('status', maintenanceForm);
  const isMaintenanceTerminal = maintenanceSelected
    ? terminalMaintenanceStatuses.includes(String(maintenanceSelected.status))
    : false;

  // ===== Checkout states (manager) =====
  type CheckoutTabKey = 'list' | 'detail';
  const [checkoutItems, setCheckoutItems] = useState<StudentCheckoutRequest[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutStatusFilter, setCheckoutStatusFilter] = useState<string>('all');
  const [checkoutSelected, setCheckoutSelected] = useState<StudentCheckoutRequest | null>(null);
  const [checkoutActiveTab, setCheckoutActiveTab] = useState<CheckoutTabKey>('list');
  const [checkoutReviewLoading, setCheckoutReviewLoading] = useState(false);
  const [checkoutRejectOpen, setCheckoutRejectOpen] = useState(false);
  const [checkoutRejectLoading, setCheckoutRejectLoading] = useState(false);
  const [checkoutRejectForm] = Form.useForm();

  const loadCheckoutData = useCallback(async () => {
    setCheckoutLoading(true);
    try {
      const res = await getAllCheckoutRequests({
        status: checkoutStatusFilter === 'all' ? undefined : checkoutStatusFilter,
        page: 1,
        limit: 100,
      });
      setCheckoutItems(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      message.error(e?.message || 'Failed to load checkout requests');
    } finally {
      setCheckoutLoading(false);
    }
  }, [message, checkoutStatusFilter]);

  useEffect(() => {
    loadCheckoutData();
  }, [loadCheckoutData]);

  const formatRoomStr = (room?: any) => {
    if (!room) return '-';
    const parts = [room.block?.dorm?.dorm_name, room.block?.block_name, room.room_number ? `Room ${room.room_number}` : null].filter(Boolean);
    return parts.length ? parts.join(' · ') : '-';
  };

  const loadAllData = useCallback(async () => {
    setAllLoading(true);
    try {
      const [otherRes, mainRes, checkRes] = await Promise.all([
        getAllOtherRequests({ page: 1, limit: 200 }),
        getAllMaintenanceRequests({ page: 1, limit: 200 }),
        getAllCheckoutRequests({ page: 1, limit: 200 }),
      ]);
      const unified: UnifiedRequest[] = [
        ...((Array.isArray(otherRes.data) ? otherRes.data : []) as OtherRequestItem[]).map((r) => ({
          id: r.id,
          _type: 'other' as const,
          request_code: r.request_code,
          student_name: r.user?.fullname || r.user?.email || '-',
          student_code: r.user?.student_code || '-',
          room: '-',
          status: r.status,
          created_at: r.createdAt || '',
          _raw: r,
        })),
        ...((Array.isArray(mainRes.data) ? mainRes.data : []) as StudentMaintenanceRequest[]).map((r) => ({
          id: r.id,
          _type: 'maintenance' as const,
          request_code: r.request_code,
          student_name: r.student?.full_name || r.student?.user?.email || '-',
          student_code: r.student?.student_code || '-',
          room: formatRoomStr(r.room),
          status: String(r.status),
          created_at: r.requested_at || '',
          _raw: r,
        })),
        ...((Array.isArray(checkRes.data) ? checkRes.data : []) as StudentCheckoutRequest[]).map((r) => ({
          id: r.id,
          _type: 'checkout' as const,
          request_code: r.request_code,
          student_name: r.student?.full_name || r.student?.user?.email || '-',
          student_code: r.student?.student_code || '-',
          room: formatRoomStr(r.room),
          status: r.status,
          created_at: r.requested_at || '',
          _raw: r,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setAllItems(unified);
    } catch (e: any) {
      message.error(e?.message || 'Failed to load requests');
    } finally {
      setAllLoading(false);
    }
  }, [message]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllOtherRequests({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: 1,
        limit: 100,
      });
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      message.error(e?.message || 'Failed to load other requests');
    } finally {
      setLoading(false);
    }
  }, [message, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadMaintenanceData = useCallback(async () => {
    setMaintenanceLoading(true);
    try {
      const res = await getAllMaintenanceRequests({
        status: maintenanceStatusFilter === 'all' ? undefined : maintenanceStatusFilter,
        page: 1,
        limit: 100,
      });
      setMaintenanceItems(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      message.error(e?.message || 'Failed to load maintenance requests');
    } finally {
      setMaintenanceLoading(false);
    }
  }, [message, maintenanceStatusFilter]);

  useEffect(() => {
    loadMaintenanceData();
  }, [loadMaintenanceData]);

  const allStatusNormalized = (status: string): string => {
    if (['pending', 'in_review'].includes(status)) return 'pending';
    if (['resolved', 'completed', 'done'].includes(status)) return 'completed';
    if (['rejected', 'cancelled'].includes(status)) return 'rejected';
    return status;
  };

  const allItemsFiltered = allItems.filter((r) => {
    const statusMatch = allStatusFilter === 'all' || allStatusNormalized(r.status) === allStatusFilter;
    const searchLower = allSearch.toLowerCase();
    const searchMatch = !searchLower || r.request_code?.toLowerCase().includes(searchLower) || r.student_name.toLowerCase().includes(searchLower) || r.student_code.toLowerCase().includes(searchLower);
    return statusMatch && searchMatch;
  });

  const typeColor: Record<string, string> = { other: 'purple', maintenance: 'blue', checkout: 'orange' };
  const typeLabel: Record<string, string> = { other: 'Other', maintenance: 'Maintenance', checkout: 'Checkout' };

  const unifiedStatusColor: Record<string, string> = {
    pending: 'processing', in_review: 'warning', approved: 'blue', assigned: 'cyan',
    in_progress: 'geekblue', inspected: 'warning', completed: 'success', resolved: 'success',
    done: 'success', rejected: 'error', cancelled: 'default',
  };

  const openUnifiedDetail = (r: UnifiedRequest) => {
    setMode(r._type);
    if (r._type === 'other') { openDetailTab(r._raw); }
    else if (r._type === 'maintenance') { openMaintenanceDetail(r._raw); }
    else { openCheckoutDetail(r._raw); }
  };

  // Real-time: checkout events from backend
  useEffect(() => {
    const socket = connectSocket(); // ensures socket exists even on first mount

    const handleNewRequest = (req: StudentCheckoutRequest) => {
      message.info({ content: `New checkout request: ${req.request_code}`, duration: 5 });
      // Re-fetch from API to keep list in sync with current status filter
      loadCheckoutData();
      loadAllData();
    };

    const handleInspected = (req: StudentCheckoutRequest) => {
      message.warning({
        content: `Room inspected: ${req.request_code} — review required`,
        duration: 6,
      });
      setCheckoutItems((prev) =>
        prev.map((i) => (i.id === req.id ? (req as StudentCheckoutRequest) : i))
      );
      loadAllData();
    };

    const handleStatusUpdated = (req: StudentCheckoutRequest) => {
      setCheckoutItems((prev) =>
        prev.map((i) => (i.id === req.id ? (req as StudentCheckoutRequest) : i))
      );
      if (checkoutSelected?.id === req.id) {
        setCheckoutSelected(req as StudentCheckoutRequest);
      }
      loadAllData();
    };

    const handleNewMaintenance = (req: StudentMaintenanceRequest) => {
      message.info({ content: `New maintenance request: ${req.request_code}`, duration: 5 });
      loadMaintenanceData();
      loadAllData();
    };

    const handleMaintenanceUpdated = (req: StudentMaintenanceRequest) => {
      setMaintenanceItems((prev) =>
        prev.map((i) => (i.id === req.id ? (req as StudentMaintenanceRequest) : i))
      );
      if (maintenanceSelected?.id === req.id) {
        setMaintenanceSelected(req as StudentMaintenanceRequest);
      }
      loadAllData();
    };

    socket.on('new_checkout_request', handleNewRequest);
    socket.on('checkout_inspected', handleInspected);
    socket.on('checkout_status_updated', handleStatusUpdated);
    socket.on('new_maintenance_request', handleNewMaintenance);
    socket.on('maintenance_updated', handleMaintenanceUpdated);

    return () => {
      socket.off('new_checkout_request', handleNewRequest);
      socket.off('checkout_inspected', handleInspected);
      socket.off('checkout_status_updated', handleStatusUpdated);
      socket.off('new_maintenance_request', handleNewMaintenance);
      socket.off('maintenance_updated', handleMaintenanceUpdated);
    };
  }, [message, checkoutSelected?.id, maintenanceSelected?.id, loadCheckoutData, loadMaintenanceData, loadAllData]);

  useEffect(() => {
    if (!checkoutSelected?.id) return;
    const updated = checkoutItems.find((i) => i.id === checkoutSelected.id);
    if (updated) setCheckoutSelected(updated);
  }, [checkoutItems, checkoutSelected?.id]);

  const openCheckoutDetail = (item: StudentCheckoutRequest) => {
    setCheckoutSelected(item);
    checkoutRejectForm.resetFields();
    setCheckoutRejectOpen(false);
    setCheckoutActiveTab('detail');
  };

  const backToCheckoutList = () => {
    setCheckoutActiveTab('list');
    setCheckoutSelected(null);
    checkoutRejectForm.resetFields();
  };

  const submitCheckoutApprove = async () => {
    if (!checkoutSelected) return;
    try {
      setCheckoutReviewLoading(true);
      await reviewCheckoutRequest(checkoutSelected.id, { status: 'approved' });
      message.success('Checkout request approved');
      backToCheckoutList();
      loadCheckoutData();
    } catch (e: any) {
      message.error(e?.message || 'Failed to approve');
    } finally {
      setCheckoutReviewLoading(false);
    }
  };

  const submitCheckoutReject = async () => {
    if (!checkoutSelected) return;
    try {
      const values = await checkoutRejectForm.validateFields();
      setCheckoutRejectLoading(true);
      await reviewCheckoutRequest(checkoutSelected.id, {
        status: 'rejected',
        rejection_reason: values.rejection_reason,
      });
      message.success('Checkout request rejected');
      setCheckoutRejectOpen(false);
      backToCheckoutList();
      loadCheckoutData();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.message || 'Failed to reject');
    } finally {
      setCheckoutRejectLoading(false);
    }
  };

  const submitCheckoutComplete = async () => {
    if (!checkoutSelected) return;
    try {
      setCheckoutReviewLoading(true);
      await completeCheckoutRequest(checkoutSelected.id);
      message.success('Checkout completed. Contract terminated and bed freed.');
      backToCheckoutList();
      loadCheckoutData();
    } catch (e: any) {
      message.error(e?.message || 'Failed to complete checkout');
    } finally {
      setCheckoutReviewLoading(false);
    }
  };

  const formatCheckoutRoom = (room?: StudentCheckoutRequest['room']) => {
    if (!room) return '-';
    const parts = [
      room.block?.dorm?.dorm_name,
      room.block?.block_name,
      room.room_number ? `Room ${room.room_number}` : null,
    ].filter(Boolean) as string[];
    return parts.length ? parts.join(' · ') : '-';
  };

  const checkoutStatusColor: Record<string, string> = {
    pending: 'processing',
    approved: 'blue',
    inspected: 'warning',
    completed: 'success',
    rejected: 'error',
    cancelled: 'default',
  };

  const checkoutDetailTabLabel = checkoutSelected
    ? `Detail · ${checkoutSelected.request_code}`
    : 'Checkout detail';

  const checkoutTabItems = [
    {
      key: 'list',
      label: 'Checkout list',
      children: (
        <Table
          rowKey="id"
          loading={checkoutLoading}
          dataSource={checkoutItems}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
          columns={[
            { title: 'Request Code', dataIndex: 'request_code', width: 170 },
            {
              title: 'Student',
              render: (_: any, r: StudentCheckoutRequest) =>
                r.student?.full_name || r.student?.user?.email || '-',
              width: 220,
            },
            {
              title: 'Student Code',
              render: (_: any, r: StudentCheckoutRequest) => r.student?.student_code || '-',
              width: 150,
            },
            {
              title: 'Room',
              render: (_: any, r: StudentCheckoutRequest) => formatCheckoutRoom(r.room),
              width: 260,
            },
            {
              title: 'Expected Checkout',
              dataIndex: 'expected_checkout_date',
              width: 160,
              render: (v: string) => (v ? dayjs(v).format('DD/MM/YYYY') : '-'),
            },
            {
              title: 'Status',
              dataIndex: 'status',
              width: 120,
              render: (v: string) => (
                <Tag color={checkoutStatusColor[v] || 'default'}>{v}</Tag>
              ),
            },
            {
              title: 'Action',
              width: 100,
              render: (_: any, r: StudentCheckoutRequest) => (
                <Button size="small" type="link" onClick={() => openCheckoutDetail(r)} style={{ padding: 0 }}>
                  Details
                </Button>
              ),
            },
          ]}
        />
      ),
    },
    {
      key: 'detail',
      label: checkoutDetailTabLabel,
      disabled: !checkoutSelected,
      children: checkoutSelected ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button onClick={backToCheckoutList}>← Back to list</Button>
            <Space>
              {checkoutSelected.status === 'pending' && (
                <>
                  <Button danger onClick={() => { checkoutRejectForm.resetFields(); setCheckoutRejectOpen(true); }}>
                    Reject
                  </Button>
                  <Button type="primary" loading={checkoutReviewLoading} onClick={submitCheckoutApprove}>
                    Approve
                  </Button>
                </>
              )}
              {checkoutSelected.status === 'inspected' && (
                <Button type="primary" loading={checkoutReviewLoading} onClick={submitCheckoutComplete}>
                  Complete Checkout
                </Button>
              )}
            </Space>
          </div>

          {/* Inspection result banner */}
          {checkoutSelected.status === 'inspected' && checkoutSelected.inspection && (() => {
            const ins = checkoutSelected.inspection;
            const hasIssue = ins.equipment_status !== 'complete' || ins.cleanliness_status !== 'clean';
            return (
              <Alert
                type={hasIssue ? 'warning' : 'success'}
                showIcon
                message={hasIssue ? 'Room inspection found issues' : 'Room inspection passed — no issues found'}
                description={
                  <div className="space-y-1 mt-1 text-sm">
                    <div><span className="font-medium">Cleanliness:</span> {ins.cleanliness_status}</div>
                    <div><span className="font-medium">Equipment:</span> {ins.equipment_status}</div>
                    {ins.equipment_notes && <div><span className="font-medium">Equipment notes:</span> {ins.equipment_notes}</div>}
                    {ins.maintenance_needed && <div><span className="font-medium">Maintenance needed:</span> {ins.maintenance_needed}</div>}
                    <div className="text-gray-500">
                      Inspected by {ins.inspected_by?.full_name || 'security'} · {ins.inspected_at ? dayjs(ins.inspected_at).format('DD/MM/YYYY HH:mm') : '-'}
                    </div>
                  </div>
                }
              />
            );
          })()}

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2.5">
            <div><Text type="secondary">Request Code:</Text> <Text strong>{checkoutSelected.request_code}</Text></div>
            <div>
              <Text type="secondary">Student:</Text>{' '}
              <Text>{checkoutSelected.student?.full_name || '-'}</Text>
            </div>
            <div>
              <Text type="secondary">Student Code:</Text>{' '}
              <Text>{checkoutSelected.student?.student_code || '-'}</Text>
            </div>
            <div><Text type="secondary">Room:</Text> <Text>{formatCheckoutRoom(checkoutSelected.room)}</Text></div>
            <div><Text type="secondary">Bed:</Text> <Text>{checkoutSelected.bed?.bed_number || '-'}</Text></div>
            <div>
              <Text type="secondary">Expected Checkout Date:</Text>{' '}
              <Text>{dayjs(checkoutSelected.expected_checkout_date).format('DD/MM/YYYY')}</Text>
            </div>
            <div>
              <Text type="secondary">Reason:</Text>
              <div className="mt-1 whitespace-pre-wrap rounded border border-gray-200 bg-white p-3 text-sm min-h-[80px]">
                {checkoutSelected.reason || '-'}
              </div>
            </div>
            <div>
              <Text type="secondary">Status:</Text>{' '}
              <Tag color={checkoutStatusColor[checkoutSelected.status] || 'default'}>
                {checkoutSelected.status}
              </Tag>
            </div>
            {checkoutSelected.status === 'rejected' && checkoutSelected.rejection_reason && (
              <div>
                <Text type="secondary">Rejection reason:</Text>
                <div className="mt-1 rounded border border-red-100 bg-red-50 p-2 text-sm text-red-800">
                  {checkoutSelected.rejection_reason}
                </div>
              </div>
            )}
            <div>
              <Text type="secondary">Submitted:</Text>{' '}
              <Text>{checkoutSelected.requested_at ? dayjs(checkoutSelected.requested_at).format('DD/MM/YYYY HH:mm') : '-'}</Text>
            </div>
          </div>
        </div>
      ) : (
        <Alert type="info" message="Select a checkout request to review." />
      ),
    },
  ];




  /** Sync selected row after list refresh (same request still open in detail tab) */
  useEffect(() => {
    if (!maintenanceSelected?.id) return;
    const updated = maintenanceItems.find((i) => i.id === maintenanceSelected.id);
    if (updated) setMaintenanceSelected(updated);
  }, [maintenanceItems, maintenanceSelected?.id]);

  /** Sync selected row after list refresh (same request still open in detail tab) */
  useEffect(() => {
    if (!selected?.id) return;
    const updated = items.find((i) => i.id === selected.id);
    if (updated) setSelected(updated);
  }, [items, selected?.id]);


  const openDetailTab = (item: OtherRequestItem) => {
    setSelected(item);
    form.setFieldsValue({
      manager_response: item.manager_response || '',
    });
    rejectForm.resetFields();
    setRejectOpen(false);
    setActiveTab('detail');
  };

  const backToList = () => {
    setActiveTab('list');
  };

  const resetAfterAction = () => {
    setActiveTab('list');
    setSelected(null);
    rejectForm.resetFields();
    form.resetFields();
  };

  const formatMaintenanceRoom = (room?: StudentMaintenanceRequest['room']) => {
    if (!room) return '-';
    const dorm = room.block?.dorm?.dorm_name;
    const block = room.block?.block_name;
    const roomNumber = room.room_number;
    const parts = [dorm, block, roomNumber ? `Room ${roomNumber}` : null].filter(Boolean) as string[];
    return parts.length ? parts.join(' · ') : '-';
  };

  const getMaintenanceNextStatusDefault = (currentStatus?: string) => {
    const optionsByStatus: Record<string, string[]> = {
      pending: ['approved', 'rejected'],
      approved: ['assigned'],
      assigned: ['in_progress'],
      in_progress: ['completed'],
    };
    const options = optionsByStatus[String(currentStatus || 'pending')] || [];
    return options[0];
  };

  const getMaintenanceTransitionOptions = (currentStatus?: string) => {
    const optionsByStatus: Record<string, Array<{ label: string; value: string }>> = {
      pending: [
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      approved: [{ label: 'Assigned', value: 'assigned' }],
      assigned: [{ label: 'In progress', value: 'in_progress' }],
      in_progress: [{ label: 'Completed', value: 'completed' }],
    };
    return optionsByStatus[String(currentStatus || 'pending')] || [];
  };

  const openMaintenanceDetail = (item: StudentMaintenanceRequest) => {
    setMaintenanceSelected(item);
    maintenanceForm.setFieldsValue({
      status: getMaintenanceNextStatusDefault(String(item.status)),
      technician_name: item.technician_name || '',
      technician_phone: item.technician_phone || '',
      completion_notes: item.completion_notes || '',
      rejection_reason: item.rejection_reason || '',
    });
    setMaintenanceActiveTab('detail');
  };

  const backToMaintenanceList = () => {
    setMaintenanceActiveTab('list');
    setMaintenanceSelected(null);
    maintenanceForm.resetFields();
  };


  const submitMaintenanceUpdate = async () => {
    if (!maintenanceSelected) return;
    if (isMaintenanceTerminal) {
      message.error('This maintenance request is closed and cannot be edited');
      return;
    }

    try {
      const values = await maintenanceForm.validateFields();
      const status = String(values.status || '').trim();
      setMaintenanceReviewLoading(true);
      const payload: any = { status: status as any };
      if (status === 'assigned') {
        if (values.scheduled_time && dayjs(values.scheduled_time).isBefore(dayjs())) {
          message.error('Scheduled time must be in the future');
          return;
        }
        payload.technician_name = values.technician_name?.trim() || undefined;
        payload.technician_phone = values.technician_phone || undefined;
      }
      if (status === 'completed') {
        payload.completion_notes = values.completion_notes || undefined;
      }
      if (status === 'rejected') {
        payload.rejection_reason = values.rejection_reason;
      }

      await reviewMaintenanceRequest(maintenanceSelected.id, payload);
      message.success('Maintenance request updated');
      backToMaintenanceList();
      loadMaintenanceData();
    } catch (e: any) {
      if (!e?.errorFields) {
        message.error(e?.message || 'Failed to update maintenance request');
      }
    } finally {
      setMaintenanceReviewLoading(false);
    }
  };

  /** Save response and mark request as resolved */
  const submitResolve = async () => {
    if (!selected) return;
    if (selected.status === 'resolved' || selected.status === 'rejected') {
      message.error('This request has been finalized and cannot be edited');
      return;
    }
    try {
      const values = await form.validateFields(['manager_response']);
      setReviewLoading(true);
      await reviewOtherRequest(selected.id, {
        status: 'resolved',
        manager_response: values.manager_response,
      });
      message.success('Request marked as resolved');
      resetAfterAction();
      loadData();
    } catch (e: any) {
      if (!e?.errorFields) {
        message.error(e?.message || 'Failed to update request');
      }
    } finally {
      setReviewLoading(false);
    }
  };

  const openRejectFlow = () => {
    rejectForm.resetFields();
    setRejectOpen(true);
  };

  /** Mark as spam / invalid — requires rejection reason */
  const submitReject = async () => {
    if (!selected) return Promise.reject();
    try {
      const values = await rejectForm.validateFields();
      setRejectLoading(true);
      await reviewOtherRequest(selected.id, {
        status: 'rejected',
        rejection_reason: values.rejection_reason,
        manager_response: '',
      });
      message.success('Request rejected');
      setRejectOpen(false);
      resetAfterAction();
      loadData();
    } catch (e: any) {
      if (e?.errorFields) return Promise.reject();
      message.error(e?.message || 'Failed to reject request');
      return Promise.reject();
    } finally {
      setRejectLoading(false);
    }
  };

  const detailTabLabel = selected ? `Detail · ${selected.request_code}` : 'Request detail';

  const tabItems = [
    {
      key: 'list',
      label: 'Request list',
      children: (
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 980 }}
          columns={[
            {
              title: 'Request Code',
              dataIndex: 'request_code',
              width: 170,
            },
            {
              title: 'Student',
              render: (_, r) => r.user?.fullname || r.user?.email || '-',
              width: 220,
            },
            {
              title: 'Student Code',
              render: (_, r) => r.user?.student_code || '-',
              width: 170,
            },
            {
              title: 'Request',
              dataIndex: 'title',
            },
            {
              title: 'Status',
              dataIndex: 'status',
              width: 130,
              render: (v: string) => <Tag color={statusColor[v] || 'default'}>{v}</Tag>,
            },
            {
              title: 'Created',
              dataIndex: 'createdAt',
              width: 150,
              render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
            },
            {
              title: 'Action',
              width: 120,
              render: (_, r) => (
                <Space>
                  <Button size="small" type="link" onClick={() => openDetailTab(r)} style={{ padding: 0 }}>
                    Details
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      ),
    },
    {
      key: 'detail',
      label: detailTabLabel,
      disabled: !selected,
      children: selected ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button onClick={backToList}>← Back to list</Button>
            {!isSelectedFinalized && (
              <Space>
                <Button onClick={backToList}>Cancel</Button>
                <Button danger onClick={openRejectFlow}>
                  Rejected
                </Button>
                <Button type="primary" loading={reviewLoading} onClick={submitResolve}>
                  Save
                </Button>
              </Space>
            )}
            {isSelectedFinalized && (
              <Button type="primary" onClick={backToList}>
                Back to list
              </Button>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2.5">
            <div>
              <Text type="secondary">Request Code:</Text> <Text strong>{selected.request_code}</Text>
            </div>
            <div>
              <Text type="secondary">Student:</Text>{' '}
              <Text>{selected.user?.fullname || selected.user?.email || '-'}</Text>
            </div>
            <div>
              <Text type="secondary">Student Code:</Text> <Text>{selected.user?.student_code || '-'}</Text>
            </div>
            <div>
              <Text type="secondary">Request:</Text> <Text strong>{selected.title}</Text>
            </div>
            <div>
              <Text type="secondary">Description:</Text>
              <div className="mt-1 whitespace-pre-wrap rounded border border-gray-200 bg-white p-3 text-sm min-h-[140px]">
                {selected.description || '-'}
              </div>
            </div>
            <div>
              <Text type="secondary">Current Status:</Text>{' '}
              <Tag color={statusColor[selected.status] || 'default'}>{selected.status}</Tag>
            </div>
            {selected.status === 'rejected' && selected.rejection_reason && (
              <div>
                <Text type="secondary">Rejection reason:</Text>
                <div className="mt-1 rounded border border-red-100 bg-red-50 p-2 text-sm text-red-800">
                  {selected.rejection_reason}
                </div>
              </div>
            )}
            {selected.manager_response && (
              <div>
                <Text type="secondary">Manager response:</Text>
                <div className="mt-1 whitespace-pre-wrap rounded border border-gray-200 bg-white p-2 text-sm">
                  {selected.manager_response}
                </div>
              </div>
            )}
            <div>
              <Text type="secondary">Created:</Text>{' '}
              <Text>{selected.createdAt ? dayjs(selected.createdAt).format('DD/MM/YYYY HH:mm') : '-'}</Text>
            </div>
          </div>

          <Form form={form} layout="vertical" className="max-w-3xl">
            <Form.Item
              name="manager_response"
              label="Response to Student"
              rules={
                isSelectedFinalized
                  ? []
                  : [{ required: true, message: 'Please enter a response before marking as resolved' }]
              }
            >
              <Input.TextArea
                rows={5}
                placeholder="Write guidance / response for student..."
                disabled={isSelectedFinalized}
              />
            </Form.Item>
          </Form>
        </div>
      ) : (
        <Alert type="info" message="Select a request from the list and click Review to open details here." />
      ),
    },
  ];

  const maintenanceDetailTabLabel = maintenanceSelected ? `Detail · ${maintenanceSelected.request_code}` : 'Maintenance detail';

  const maintenanceTabItems = [
    {
      key: 'list',
      label: 'Maintenance list',
      children: (
        <Table
          rowKey="id"
          loading={maintenanceLoading}
          dataSource={maintenanceItems}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1100 }}
          columns={[
            {
              title: 'Request Code',
              dataIndex: 'request_code',
              width: 170,
            },
            {
              title: 'Student',
              render: (_, r) => r.student?.full_name || r.student?.user?.email || '-',
              width: 240,
            },
            {
              title: 'Room',
              render: (_, r) => formatMaintenanceRoom(r.room),
              width: 260,
            },
            {
              title: 'Bed',
              render: (_, r) => r.bed?.bed_number || '-',
              width: 120,
            },
            {
              title: 'Status',
              dataIndex: 'status',
              width: 130,
              render: (v: string) => (
                <Tag color={maintenanceStatusColor[v] || 'default'}>{v}</Tag>
              ),
            },
            {
              title: 'Created',
              dataIndex: 'requested_at',
              width: 150,
              render: (v: string) => (v ? dayjs(v).format('DD/MM/YYYY') : '-'),
            },
            {
              title: 'Action',
              width: 120,
              render: (_, r) => (
                <Space>
                  <Button
                    size="small"
                    type="link"
                    onClick={() => openMaintenanceDetail(r)}
                    style={{ padding: 0 }}
                  >
                    Details
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      ),
    },
    {
      key: 'detail',
      label: maintenanceDetailTabLabel,
      disabled: !maintenanceSelected,
      children: maintenanceSelected ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button onClick={backToMaintenanceList}>← Back to list</Button>
            {!isMaintenanceTerminal ? (
              <Space>
                <Button type="primary" loading={maintenanceReviewLoading} onClick={submitMaintenanceUpdate}>
                  Save
                </Button>
              </Space>
            ) : (
              <Button type="primary" onClick={backToMaintenanceList}>
                Back to list
              </Button>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2.5">
            <div>
              <Text type="secondary">Request Code:</Text> <Text strong>{maintenanceSelected.request_code}</Text>
            </div>
            <div>
              <Text type="secondary">Student:</Text>{' '}
              <Text>{maintenanceSelected.student?.full_name || maintenanceSelected.student?.user?.email || '-'}</Text>
            </div>
            <div>
              <Text type="secondary">Student Code:</Text>{' '}
              <Text>{maintenanceSelected.student?.student_code || '-'}</Text>
            </div>
            <div>
              <Text type="secondary">Room:</Text> <Text>{formatMaintenanceRoom(maintenanceSelected.room)}</Text>
            </div>
            <div>
              <Text type="secondary">Bed:</Text> <Text>{maintenanceSelected.bed?.bed_number || '-'}</Text>
            </div>
            {(maintenanceSelected.equipment &&
              typeof maintenanceSelected.equipment.template === 'object' &&
              maintenanceSelected.equipment.template !== null) ||
              maintenanceSelected.equipment_other_selected ? (
              <div>
                <Text type="secondary">Affected equipment:</Text>{' '}
                <Text>
                  {maintenanceSelected.equipment_other_selected
                    ? 'Other'
                    : `${maintenanceSelected.equipment?.template?.equipment_name || 'Equipment'}${maintenanceSelected.equipment?.template?.brand
                      ? ` (${maintenanceSelected.equipment.template.brand})`
                      : ''
                    }`}
                </Text>
              </div>
            ) : null}
            <div>
              <Text type="secondary">Description:</Text>
              <div className="mt-1 whitespace-pre-wrap rounded border border-gray-200 bg-white p-3 text-sm min-h-[140px]">
                {maintenanceSelected.description || '-'}
              </div>
            </div>
            <div>
              <Text type="secondary">Current Status:</Text>{' '}
              <Tag color={maintenanceStatusColor[String(maintenanceSelected.status)] || 'default'}>
                {maintenanceSelected.status}
              </Tag>
            </div>
            {maintenanceSelected.scheduled_time && (
              <div>
                <Text type="secondary">Technician scheduled time:</Text>{' '}
                <Text>{dayjs(maintenanceSelected.scheduled_time).format('DD/MM/YYYY HH:mm')}</Text>
              </div>
            )}
            {maintenanceSelected.status === 'rejected' && maintenanceSelected.rejection_reason && (
              <div>
                <Text type="secondary">Rejection reason:</Text>
                <div className="mt-1 rounded border border-red-100 bg-red-50 p-2 text-sm text-red-800">
                  {maintenanceSelected.rejection_reason}
                </div>
              </div>
            )}
            {maintenanceSelected.completion_notes && (
              <div>
                <Text type="secondary">Completion notes / repair report:</Text>
                <div className="mt-1 whitespace-pre-wrap rounded border border-gray-200 bg-white p-2 text-sm">
                  {maintenanceSelected.completion_notes}
                </div>
              </div>
            )}
            {maintenanceSelected.evidence_urls && maintenanceSelected.evidence_urls.length > 0 ? (
              <div className="mt-4">
                <Text type="secondary" className="block mb-2 font-medium">
                  Evidence Imaging
                </Text>
                <Image.PreviewGroup>
                  <Space wrap size={[12, 12]}>
                    {maintenanceSelected.evidence_urls.map((url, idx) => (
                      <div key={idx} className="relative group">
                        <Image
                          width={110}
                          height={110}
                          src={url}
                          className="rounded-lg object-cover border-2 border-gray-100 hover:border-blue-400 transition-all duration-300 shadow-sm"
                          fallback="https://placehold.co/110x110?text=No+Image"
                        />
                      </div>
                    ))}
                  </Space>
                </Image.PreviewGroup>
              </div>
            ) : (
              <div className="mt-4">
                <Text type="secondary" className="block mb-1 font-medium">
                  Evidence Imaging
                </Text>
                <Text type="disabled">No evidence imaging provided</Text>
              </div>
            )}
            <div>
              <Text type="secondary">Created:</Text>{' '}
              <Text>
                {maintenanceSelected.requested_at ? dayjs(maintenanceSelected.requested_at).format('DD/MM/YYYY HH:mm') : '-'}
              </Text>
            </div>
          </div>

          <Form form={maintenanceForm} layout="vertical" className="max-w-3xl">
            <Form.Item
              name="status"
              label="Update status"
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select
                disabled={isMaintenanceTerminal}
                options={getMaintenanceTransitionOptions(maintenanceSelected.status)}
              />
            </Form.Item>

            {selectedMaintenanceStatus === 'assigned' && (
              <>
                <Form.Item
                  name="technician_name"
                  label="Technician name"
                  rules={[
                    { required: true, message: 'Technician name is required' },
                    {
                      pattern: /^[\p{L}\s]+$/u,
                      message: 'Technician name must contain letters and spaces only',
                    },
                  ]}
                >
                  <Input
                    disabled={isMaintenanceTerminal}
                    placeholder="Enter technician name"
                    maxLength={100}
                  />
                </Form.Item>

                <Form.Item
                  name="technician_phone"
                  label="Technician phone"
                  normalize={(v) => String(v || '').replace(/\D/g, '')}
                  rules={[
                    { required: true, message: 'Technician phone is required' },
                    { pattern: /^\d{10}$/, message: 'Phone must be exactly 10 digits' },
                  ]}
                >
                  <Input
                    disabled={isMaintenanceTerminal}
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                  />
                </Form.Item>
              </>
            )}

            {selectedMaintenanceStatus === 'completed' && (
              <Form.Item name="completion_notes" label="Repair report / completion notes">
                <Input.TextArea
                  disabled={isMaintenanceTerminal}
                  rows={4}
                  placeholder="Repair report / completion notes..."
                />
              </Form.Item>
            )}

            {selectedMaintenanceStatus === 'rejected' && (
              <Form.Item
                name="rejection_reason"
                label="Rejection reason"
                rules={[{ required: true, message: 'Rejection reason is required' }]}
              >
                <Input.TextArea disabled={isMaintenanceTerminal} rows={4} placeholder="Please provide reason..." />
              </Form.Item>
            )}
          </Form>
        </div>
      ) : (
        <Alert type="info" message="Select a maintenance request to review and update status." />
      ),
    },
  ];


  return (
    <div className="space-y-6">
      <Tabs
        activeKey={mode}
        onChange={(k) => {
          const next = k as RequestModeKey;
          setMode(next);
          setRejectOpen(false);
          if (next === 'maintenance') {
            backToMaintenanceList();
          } else if (next === 'checkout') {
            backToCheckoutList();
          } else {
            resetAfterAction();
          }
        }}
        items={[
          { key: 'all', label: 'All Requests' },
          { key: 'other', label: 'Other Requests' },
          { key: 'maintenance', label: 'Maintenance Requests' },
          { key: 'checkout', label: 'Checkout Requests' },
        ]}
      />

      {mode === 'all' && (
        <Card className="rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <div>
              <Title level={3} style={{ marginBottom: 4 }}>All Requests</Title>
              <Text type="secondary">All student requests across types.</Text>
            </div>
            <Space wrap>
              <Input.Search
                placeholder="Search by code, name, student ID..."
                allowClear
                style={{ width: 260 }}
                value={allSearch}
                onChange={(e) => setAllSearch(e.target.value)}
              />
              <Select
                value={allStatusFilter}
                onChange={setAllStatusFilter}
                style={{ width: 160 }}
                options={[
                  { label: 'All statuses', value: 'all' },
                  { label: 'Pending', value: 'pending' },
                  { label: 'Completed', value: 'completed' },
                  { label: 'Rejected', value: 'rejected' },
                ]}
              />
              <Button onClick={loadAllData} loading={allLoading}>Refresh</Button>
            </Space>
          </div>
          <Table
            rowKey="id"
            loading={allLoading}
            dataSource={allItemsFiltered}
            pagination={{ pageSize: 15, showTotal: (t) => `${t} requests` }}
            scroll={{ x: 1000 }}
            columns={[
              {
                title: 'Code',
                dataIndex: 'request_code',
                width: 160,
              },
              {
                title: 'Type',
                dataIndex: '_type',
                width: 130,
                render: (v: string) => <Tag color={typeColor[v]}>{typeLabel[v]}</Tag>,
              },
              {
                title: 'Student',
                dataIndex: 'student_name',
                width: 200,
              },
              {
                title: 'Student ID',
                dataIndex: 'student_code',
                width: 140,
              },
              {
                title: 'Room',
                dataIndex: 'room',
                width: 220,
              },
              {
                title: 'Status',
                dataIndex: 'status',
                width: 130,
                render: (v: string) => <Tag color={unifiedStatusColor[v] || 'default'}>{v}</Tag>,
              },
              {
                title: 'Date',
                dataIndex: 'created_at',
                width: 130,
                render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '-',
                sorter: (a: UnifiedRequest, b: UnifiedRequest) =>
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
                defaultSortOrder: 'descend',
              },
              {
                title: 'Action',
                width: 90,
                render: (_: any, r: UnifiedRequest) => (
                  <Button size="small" type="link" style={{ padding: 0 }} onClick={() => openUnifiedDetail(r)}>
                    Details
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      )}

      {mode === 'other' && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Title level={3} style={{ marginBottom: 4 }}>
              Request Management
            </Title>
            <Text type="secondary">Review student Other Requests and update status.</Text>
          </div>
          <Space direction={isTablet ? 'horizontal' : 'vertical'} style={{ width: isTablet ? 'auto' : '100%' }}>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: isTablet ? 180 : '100%' }}
              options={[
                { label: 'All statuses', value: 'all' },
                { label: 'Pending', value: 'pending' },
                { label: 'In Review', value: 'in_review' },
                { label: 'Resolved', value: 'resolved' },
                { label: 'Rejected', value: 'rejected' },
              ]}
            />
            <Button onClick={loadData} block={!isTablet}>Refresh</Button>
          </Space>
        </div>
      )}

      {mode === 'other' && (
        <Card className="rounded-2xl border border-gray-200 shadow-sm">
          <Tabs
            activeKey={activeTab}
            onChange={(k) => {
              const key = k as TabKey;
              if (key === 'detail' && !selected) return;
              setActiveTab(key);
            }}
            items={tabItems}
            destroyInactiveTabPane={false}
          />
        </Card>
      )}

      {mode === 'maintenance' && (
        <Card className="rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <div>
              <Title level={3} style={{ marginBottom: 4 }}>
                Maintenance Request Management
              </Title>
              <Text type="secondary">Review student maintenance requests and update status.</Text>
            </div>
            <Space direction={isTablet ? 'horizontal' : 'vertical'} style={{ width: isTablet ? 'auto' : '100%' }}>
              <Select
                value={maintenanceStatusFilter}
                onChange={setMaintenanceStatusFilter}
                style={{ width: isTablet ? 220 : '100%' }}
                options={[
                  { label: 'All statuses', value: 'all' },
                  { label: 'Pending', value: 'pending' },
                  { label: 'Approved', value: 'approved' },
                  { label: 'Assigned', value: 'assigned' },
                  { label: 'In progress', value: 'in_progress' },
                  { label: 'Completed', value: 'completed' },
                  { label: 'Rejected', value: 'rejected' },
                ]}
              />
              <Button onClick={loadMaintenanceData} block={!isTablet}>Refresh</Button>
            </Space>
          </div>
          <Tabs
            activeKey={maintenanceActiveTab}
            onChange={(k) => {
              const key = k as MaintenanceTabKey;
              if (key === 'detail' && !maintenanceSelected) return;
              setMaintenanceActiveTab(key);
            }}
            items={maintenanceTabItems}
            destroyInactiveTabPane={false}
          />
        </Card>
      )}

      {
        mode === 'checkout' && (
          <Card className="rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
              <div>
                <Title level={3} style={{ marginBottom: 4 }}>Checkout Request Management</Title>
                <Text type="secondary">Review and approve or reject student checkout requests.</Text>
              </div>
              <Space direction={isTablet ? 'horizontal' : 'vertical'} style={{ width: isTablet ? 'auto' : '100%' }}>
                <Select
                  value={checkoutStatusFilter}
                  onChange={setCheckoutStatusFilter}
                  style={{ width: isTablet ? 200 : '100%' }}
                  options={[
                    { label: 'All statuses', value: 'all' },
                    { label: 'Pending', value: 'pending' },
                    { label: 'Approved', value: 'approved' },
                    { label: 'Inspected', value: 'inspected' },
                    { label: 'Completed', value: 'completed' },
                    { label: 'Rejected', value: 'rejected' },
                    { label: 'Cancelled', value: 'cancelled' },
                  ]}
                />
                <Button onClick={loadCheckoutData} block={!isTablet}>Refresh</Button>
              </Space>
            </div>
            <Tabs
              activeKey={checkoutActiveTab}
              onChange={(k) => {
                const key = k as CheckoutTabKey;
                if (key === 'detail' && !checkoutSelected) return;
                setCheckoutActiveTab(key);
              }}
              items={checkoutTabItems}
              destroyInactiveTabPane={false}
            />
          </Card>
        )
      }

      <Modal
        open={checkoutRejectOpen}
        title="Reject checkout request"
        okText="Confirm reject"
        okButtonProps={{ danger: true, loading: checkoutRejectLoading }}
        onCancel={() => setCheckoutRejectOpen(false)}
        onOk={submitCheckoutReject}
        destroyOnClose
        width={isTablet ? 520 : 'calc(100vw - 24px)'}
      >
        <p className="mb-3 text-gray-600 text-sm">
          Please provide a reason for rejection. The student will be notified.
        </p>
        <Form form={checkoutRejectForm} layout="vertical">
          <Form.Item
            name="rejection_reason"
            label="Rejection reason"
            rules={[{ required: true, message: 'Please enter a rejection reason' }]}
          >
            <Input.TextArea rows={4} placeholder="e.g. Contract not eligible for early checkout..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={rejectOpen}
        title="Reject request"
        okText="Confirm reject"
        okButtonProps={{ danger: true, loading: rejectLoading }}
        onCancel={() => setRejectOpen(false)}
        onOk={submitReject}
        destroyOnClose
        width={isTablet ? 520 : 'calc(100vw - 24px)'}
      >
        <p className="mb-3 text-gray-600 text-sm">
          Use this if the request is spam or invalid. The student will see the reason you provide.
        </p>
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="rejection_reason"
            label="Rejection reason"
            rules={[{ required: true, message: 'Please enter a rejection reason' }]}
          >
            <Input.TextArea rows={4} placeholder="e.g. Spam, duplicate request, not applicable..." />
          </Form.Item>
        </Form>
      </Modal>
    </div >
  );
}
