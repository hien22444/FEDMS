import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  App,
  Card,
  Button,
  Typography,
  Tag,
  Space,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  theme,
  Modal,
  message,
  Form,
  Spin,
  Alert,
  Tabs,
} from 'antd';
import {
  FileSearchOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  ToolOutlined,
  FlagOutlined,
  ArrowLeftOutlined,
  CloseOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  AppstoreOutlined,
  LogoutOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import {
  createVisitorRequest,
  getMyVisitorRequests,
  cancelVisitorRequest as cancelVisitorRequestAction,
  createOtherRequest,
  getMyOtherRequests,
  createMaintenanceRequest,
  getMyMaintenanceRequests,
  getMyRoomEquipmentForMaintenance,
  getMyMaintenanceContext,
  createCheckoutRequest,
  getMyCheckoutRequests,
  cancelCheckoutRequest as cancelCheckoutRequestAction,
} from '@/lib/actions';
import type { StudentCheckoutRequest } from '@/lib/actions/checkoutRequest';
import type { StudentMaintenanceRequest } from '@/lib/actions/maintenanceRequest';
import type { MaintenanceContext } from '@/lib/actions/maintenanceRequest';
import type { RoomEquipment } from '@/lib/actions/admin';
import type { IVisitor } from '@/interfaces';
import { ViolationType, ReporterType, type IViolation } from '@/interfaces';
import violationActions from '@/lib/actions/violation';
const { getMyViolationReports, createViolationReport } = violationActions;
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import BedTransferPage from '@/pages/student/bed-transfer';
import { useWindowSize } from '@/hooks/useWindowSize';
import { connectSocket } from '@/lib/socket';

const { Title, Text } = Typography;
const { TextArea } = Input;


type RequestType = 'visitor' | 'maintenance' | 'report' | 'other' | 'checkout' | null;
type RequestTabKey = 'all' | 'visitor' | 'maintenance' | 'bed-transfer' | 'report' | 'checkout' | 'other';

type StudentOtherRequest = {
  id: string;
  request_code: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  rejection_reason?: string | null;
  manager_response?: string | null;
};

const VIOLATION_TYPE_LABEL: Record<string, string> = {
  noise: 'Noise Disturbance',
  cleanliness: 'Cleanliness Issue',
  guest: 'Unauthorized Guest',
  alcohol: 'Alcohol / Smoking',
  other: 'Other',
};

function formatMaintenanceRoom(room?: StudentMaintenanceRequest['room']) {
  if (!room) return '—';
  const dorm = room.block?.dorm?.dorm_name;
  const block = room.block?.block_name;
  const num = room.room_number;
  const parts = [dorm, block, num ? `Room ${num}` : null].filter(Boolean) as string[];
  return parts.length ? parts.join(' · ') : '—';
}

type OtherSubTabKey = 'list' | 'detail';
type InnerListTabKey = 'list' | 'detail';

type UnifiedListItem = {
  id: string;
  type: 'visitor' | 'report' | 'other' | 'maintenance' | 'checkout';
  title: string;
  subtitle: string;
  status: string;
  date: string;
  detail: string;
  rejection_reason?: string | null | undefined;
  manager_response?: string | null | undefined;
  visitors: IVisitor.Visitor[] | undefined;
  raw: IVisitor.VisitorRequest | IViolation.ViolationReport | StudentOtherRequest | StudentMaintenanceRequest | StudentCheckoutRequest;
  sortTime: number;
};

const Requests: React.FC = () => {
  const { token } = theme.useToken();
  const [searchParams, setSearchParams] = useSearchParams();
  const { width } = useWindowSize();
  const isTablet = width >= 768;
  const [selectedType, setSelectedType] = useState<RequestType>(null);
  const [activeTab, setActiveTab] = useState<RequestTabKey>('all');
  const [showForm, setShowForm] = useState(false);
  const [visitorRequests, setVisitorRequests] = useState<IVisitor.VisitorRequest[]>([]);
  const [violationReports, setViolationReports] = useState<IViolation.ViolationReport[]>([]);
  const [otherRequests, setOtherRequests] = useState<StudentOtherRequest[]>([]);
  const [otherSubTab, setOtherSubTab] = useState<OtherSubTabKey>('list');
  const [selectedOther, setSelectedOther] = useState<StudentOtherRequest | null>(null);
  const [allInnerTab, setAllInnerTab] = useState<InnerListTabKey>('list');
  const [selectedAll, setSelectedAll] = useState<UnifiedListItem | null>(null);
  const [visitorInnerTab, setVisitorInnerTab] = useState<InnerListTabKey>('list');
  const [selectedVisitor, setSelectedVisitor] = useState<UnifiedListItem | null>(null);
  const [reportInnerTab, setReportInnerTab] = useState<InnerListTabKey>('list');
  const [selectedReport, setSelectedReport] = useState<UnifiedListItem | null>(null);
  const [maintenanceInnerTab, setMaintenanceInnerTab] = useState<InnerListTabKey>('list');
  const [selectedMaintenance, setSelectedMaintenance] = useState<UnifiedListItem | null>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<StudentMaintenanceRequest[]>([]);
  const [checkoutRequests, setCheckoutRequests] = useState<StudentCheckoutRequest[]>([]);
  const [checkoutInnerTab, setCheckoutInnerTab] = useState<InnerListTabKey>('list');
  const [selectedCheckout, setSelectedCheckout] = useState<UnifiedListItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [canCreateRequest, setCanCreateRequest] = useState(true);

  const fetchMyRequests = useCallback(async () => {
    setLoading(true);
    try {
      const [visitorData, reportData, otherData, maintData, checkoutData] = await Promise.all([
        getMyVisitorRequests(),
        getMyViolationReports().catch(() => []),
        getMyOtherRequests().catch(() => []),
        getMyMaintenanceRequests().catch(() => []),
        getMyCheckoutRequests().catch(() => []),
      ]);
      setVisitorRequests(visitorData);
      setViolationReports(Array.isArray(reportData) ? reportData : []);
      setOtherRequests(Array.isArray(otherData) ? otherData : []);
      setMaintenanceRequests(Array.isArray(maintData) ? maintData : []);
      setCheckoutRequests(Array.isArray(checkoutData) ? checkoutData : []);
    } catch {
      // silent — API may not be ready
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  // Real-time: listen for checkout status changes from manager
  useEffect(() => {
    const socket = connectSocket();

    const handleStatusUpdated = (req: StudentCheckoutRequest) => {
      setCheckoutRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, ...req } : r))
      );
    };

    const handleCompleted = (req: StudentCheckoutRequest) => {
      setCheckoutRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, ...req, status: 'completed' } : r))
      );
    };

    socket.on('checkout_status_updated', handleStatusUpdated);
    socket.on('checkout_completed', handleCompleted);
    return () => {
      socket.off('checkout_status_updated', handleStatusUpdated);
      socket.off('checkout_completed', handleCompleted);
    };
  }, []);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'bed-transfer' && canCreateRequest) {
      setActiveTab('bed-transfer');
    }
  }, [searchParams, canCreateRequest]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await getMyMaintenanceContext();
        if (!cancelled) setCanCreateRequest(true);
      } catch {
        if (!cancelled) setCanCreateRequest(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Keep detail view in sync after Refresh / background updates */
  useEffect(() => {
    if (!selectedOther?.id) return;
    const next = otherRequests.find((o) => o.id === selectedOther.id);
    if (next) setSelectedOther(next);
  }, [otherRequests, selectedOther?.id]);

  const allRequests: UnifiedListItem[] = useMemo(
    () => [
      ...visitorRequests.map((r) => ({
        id: r.id,
        type: 'visitor' as const,
        title: r.purpose || 'Visitor Request',
        subtitle: r.request_code,
        status: r.status,
        date: dayjs(r.visit_date).format('DD/MM/YYYY'),
        detail: `${r.visit_time_from ?? '07:00'} - ${r.visit_time_to ?? '17:00'}`,
        rejection_reason: r.rejection_reason,
        manager_response: undefined as string | undefined,
        visitors: r.visitors,
        raw: r,
        sortTime: dayjs(r.visit_date).valueOf(),
      })),
      ...violationReports.map((r) => ({
        id: r.id,
        type: 'report' as const,
        title:
          r.violation_other_detail ||
          VIOLATION_TYPE_LABEL[r.violation_type] ||
          r.violation_type ||
          'Violation Report',
        subtitle: r.report_code,
        status: r.status,
        date: dayjs(r.violation_date).format('DD/MM/YYYY'),
        detail: r.location || '—',
        rejection_reason: undefined as string | undefined,
        manager_response: undefined as string | undefined,
        visitors: undefined,
        raw: r,
        sortTime: dayjs(r.violation_date).valueOf(),
      })),
      ...otherRequests.map((r) => ({
        id: r.id,
        type: 'other' as const,
        title: r.title,
        subtitle: r.request_code,
        status: r.status,
        date: dayjs(r.createdAt).format('DD/MM/YYYY'),
        detail: 'Other request',
        rejection_reason: r.rejection_reason,
        manager_response: r.manager_response,
        visitors: undefined,
        raw: r,
        sortTime: dayjs(r.createdAt).valueOf(),
      })),
      ...maintenanceRequests.map((r) => ({
        id: r.id,
        type: 'maintenance' as const,
        title: 'Maintenance request',
        subtitle: r.request_code,
        status: r.status,
        date: dayjs(r.requested_at || r.id).format('DD/MM/YYYY'),
        detail: formatMaintenanceRoom(r.room),
        rejection_reason: r.rejection_reason,
        manager_response: r.completion_notes ?? undefined,
        visitors: undefined,
        raw: r,
        sortTime: dayjs(r.requested_at || Date.now()).valueOf(),
      })),
      ...checkoutRequests.map((r) => ({
        id: r.id,
        type: 'checkout' as const,
        title: 'Checkout Request',
        subtitle: r.request_code,
        status: r.status,
        date: dayjs(r.expected_checkout_date).format('DD/MM/YYYY'),
        detail: r.reason.slice(0, 60),
        rejection_reason: r.rejection_reason,
        manager_response: undefined as string | undefined,
        visitors: undefined,
        raw: r,
        sortTime: dayjs(r.requested_at || Date.now()).valueOf(),
      })),
    ],
    [visitorRequests, violationReports, otherRequests, maintenanceRequests, checkoutRequests]
  );

  useEffect(() => {
    if (!selectedAll?.id) return;
    const next = allRequests.find((i) => i.id === selectedAll.id && i.type === selectedAll.type);
    if (next) setSelectedAll(next);
  }, [allRequests, selectedAll?.id, selectedAll?.type]);

  useEffect(() => {
    if (!selectedVisitor?.id) return;
    const next = allRequests.find((i) => i.id === selectedVisitor.id && i.type === 'visitor');
    if (next) setSelectedVisitor(next);
  }, [allRequests, selectedVisitor?.id]);

  useEffect(() => {
    if (!selectedReport?.id) return;
    const next = allRequests.find((i) => i.id === selectedReport.id && i.type === 'report');
    if (next) setSelectedReport(next);
  }, [allRequests, selectedReport?.id]);

  useEffect(() => {
    if (!selectedMaintenance?.id) return;
    const next = allRequests.find((i) => i.id === selectedMaintenance.id && i.type === 'maintenance');
    if (next) setSelectedMaintenance(next);
  }, [allRequests, selectedMaintenance?.id]);

  useEffect(() => {
    if (!selectedCheckout?.id) return;
    const next = allRequests.find((i) => i.id === selectedCheckout.id && i.type === 'checkout');
    if (next) setSelectedCheckout(next);
  }, [allRequests, selectedCheckout?.id]);

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="processing">Pending</Tag>;
      case 'approved':
        return <Tag color="success">Approved</Tag>;
      case 'in_progress':
        return <Tag color="warning">In Progress</Tag>;
      case 'assigned':
        return <Tag color="blue">Assigned</Tag>;
      case 'waiting_parts':
        return <Tag color="orange">Waiting parts</Tag>;
      case 'completed':
        return <Tag color="cyan">Completed</Tag>;
      case 'done':
        return <Tag color="success">Done</Tag>;
      case 'need_rework':
        return <Tag color="volcano">Need rework</Tag>;
      case 'cannot_fix':
        return <Tag color="default">Cannot fix</Tag>;
      case 'rejected':
        return <Tag color="error">Rejected</Tag>;
      case 'cancelled':
        return <Tag color="default">Cancelled</Tag>;
      // Violation report statuses
      case 'new':
        return <Tag color="processing">New</Tag>;
      case 'under_review':
        return <Tag color="warning">Under Review</Tag>;
      case 'resolved_penalized':
        return <Tag color="error">Penalized</Tag>;
      case 'resolved_no_action':
        return <Tag color="success">Resolved</Tag>;
      case 'in_review':
        return <Tag color="warning">In Review</Tag>;
      case 'resolved':
        return <Tag color="success">Resolved</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'visitor':
        return <TeamOutlined style={{ fontSize: '24px', color: '#1890ff' }} />;
      case 'maintenance':
        return <ToolOutlined style={{ fontSize: '24px', color: '#52c41a' }} />;
      case 'report':
        return <FlagOutlined style={{ fontSize: '24px', color: '#fa541c' }} />;
      case 'other':
        return <FileSearchOutlined style={{ fontSize: '24px', color: '#722ed1' }} />;
      case 'checkout':
        return <LogoutOutlined style={{ fontSize: '24px', color: '#f5222d' }} />;
      default:
        return <FileSearchOutlined />;
    }
  };

  const relationshipLabel: Record<string, string> = {
    parent: 'Parent',
    sibling: 'Sibling',
    friend: 'Friend',
    other: 'Other',
  };

  const requestTypeLabel: Record<RequestTabKey, string> = {
    all: 'All',
    visitor: 'Visitor',
    maintenance: 'Maintenance',
    'bed-transfer': 'Change Bed',
    report: 'Violation',
    other: 'Other',
    checkout: 'Checkout',
  };

  const filteredRequestsByTab = (tab: RequestTabKey) => {
    const list = tab === 'all' ? [...allRequests] : allRequests.filter((r) => r.type === tab);
    return list.sort((a, b) => b.sortTime - a.sortTime);
  };

  const handleNewRequest = (type: RequestType) => {
    if (!canCreateRequest) {
      message.warning('You are not currently staying in the dormitory and cannot submit requests.');
      return;
    }
    setSelectedType(type);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedType(null);
  };

  const handleVisitorCreated = () => {
    handleCloseForm();
    fetchMyRequests();
  };

  const handleReportCreated = () => {
    handleCloseForm();
    fetchMyRequests();
  };

  const handleOtherCreated = () => {
    handleCloseForm();
    fetchMyRequests();
  };

  const handleMaintenanceCreated = () => {
    handleCloseForm();
    fetchMyRequests();
  };

  const handleCheckoutCreated = () => {
    handleCloseForm();
    fetchMyRequests();
    toast.success('Checkout request submitted successfully!');
  };

  const handleCheckoutConflict = () => {
    handleCloseForm();
    fetchMyRequests(); // refresh to show the existing active request
  };

  const handleCancelCheckout = async (id: string) => {
    try {
      await cancelCheckoutRequestAction(id);
      message.success('Checkout request cancelled');
      fetchMyRequests();
      if (selectedCheckout?.id === id) {
        setSelectedCheckout(null);
        setCheckoutInnerTab('list');
      }
    } catch {
      message.error('Failed to cancel checkout request');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelVisitorRequestAction(id);
      message.success('Request cancelled');
      fetchMyRequests();
    } catch {
      message.error('Failed to cancel request');
    }
  };

  const renderStudentRequestDetail = (
    item: UnifiedListItem | null,
    onBack: () => void,
    opts?: { showTypeBadge?: boolean }
  ) => {
    if (!item) {
      return <Alert type="info" message="Choose a request from the list and click View detail." />;
    }
    const showTypeBadge = opts?.showTypeBadge ?? false;

    if (item.type === 'visitor') {
      const v = item.raw as IVisitor.VisitorRequest;
      return (
        <div className="space-y-5">
          <Button onClick={onBack}>← Back to list</Button>
          {showTypeBadge && <Tag color="blue">Visitor request</Tag>}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2.5">
            <div>
              <Text type="secondary">Request Code:</Text> <Text strong>{v.request_code}</Text>
            </div>
            <div>
              <Text type="secondary">Status:</Text> {getStatusTag(v.status)}
            </div>
            <div>
              <Text type="secondary">Visit date:</Text> <Text>{dayjs(v.visit_date).format('DD/MM/YYYY')}</Text>
            </div>
            <div>
              <Text type="secondary">Time window:</Text>{' '}
              <Text>
                {v.visit_time_from ?? '07:00'} – {v.visit_time_to ?? '17:00'}
              </Text>
            </div>
            <div>
              <Text type="secondary">Purpose:</Text>
              <div className="mt-1 rounded border border-gray-200 bg-white p-3 text-sm whitespace-pre-wrap">
                {v.purpose || '-'}
              </div>
            </div>
            <div>
              <Text type="secondary">Submitted:</Text>{' '}
              <Text>{v.createdAt ? dayjs(v.createdAt).format('DD/MM/YYYY HH:mm') : '-'}</Text>
            </div>
            {v.rejection_reason && (
              <div>
                <Text type="secondary">Rejection reason:</Text>
                <div className="mt-1 rounded border border-red-100 bg-red-50 p-3 text-sm text-red-800">
                  {v.rejection_reason}
                </div>
              </div>
            )}
            <div>
              <Text type="secondary" className="block mb-2">
                Visitors
              </Text>
              <div className="space-y-2">
                {v.visitors?.map((vis, idx) => (
                  <div
                    key={vis.id || idx}
                    className="rounded border border-gray-200 bg-white p-3 text-sm space-y-1"
                  >
                    <div>
                      <Text strong>{vis.full_name}</Text>
                    </div>
                    <div>
                      <Text type="secondary">CCCD:</Text> {vis.citizen_id}
                    </div>
                    <div>
                      <Text type="secondary">Phone:</Text> {vis.phone}
                    </div>
                    <div>
                      <Text type="secondary">Relationship:</Text>{' '}
                      {relationshipLabel[vis.relationship] ?? vis.relationship}
                      {vis.relationship === 'other' && vis.relationship_other
                        ? ` (${vis.relationship_other})`
                        : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (item.type === 'report') {
      const r = item.raw as IViolation.ViolationReport;
      const typeLabel =
        r.violation_other_detail ||
        VIOLATION_TYPE_LABEL[r.violation_type] ||
        r.violation_type;
      return (
        <div className="space-y-5">
          <Button onClick={onBack}>← Back to list</Button>
          {showTypeBadge && <Tag color="orange">Violation report</Tag>}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2.5">
            <div>
              <Text type="secondary">Report Code:</Text> <Text strong>{r.report_code}</Text>
            </div>
            <div>
              <Text type="secondary">Status:</Text> {getStatusTag(r.status)}
            </div>
            <div>
              <Text type="secondary">Violation type:</Text> <Text>{typeLabel}</Text>
            </div>
            <div>
              <Text type="secondary">Violation date:</Text>{' '}
              <Text>{dayjs(r.violation_date).format('DD/MM/YYYY')}</Text>
            </div>
            {r.location && (
              <div>
                <Text type="secondary">Location:</Text> <Text>{r.location}</Text>
              </div>
            )}
            <div>
              <Text type="secondary">Description:</Text>
              <div className="mt-1 whitespace-pre-wrap rounded border border-gray-200 bg-white p-3 text-sm min-h-[100px]">
                {r.description || '-'}
              </div>
            </div>
            {r.evidence_urls && r.evidence_urls.length > 0 && (
              <div>
                <Text type="secondary" className="block mb-1">
                  Evidence links
                </Text>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {r.evidence_urls.map((url, i) => (
                    <li key={i}>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <Text type="secondary">Submitted:</Text>{' '}
              <Text>{r.createdAt ? dayjs(r.createdAt).format('DD/MM/YYYY HH:mm') : '-'}</Text>
            </div>
            {r.review_notes && (
              <div>
                <Text type="secondary">Review notes (manager):</Text>
                <div className="mt-1 rounded border border-gray-200 bg-white p-3 text-sm whitespace-pre-wrap">
                  {r.review_notes}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (item.type === 'maintenance') {
      const m = item.raw as StudentMaintenanceRequest;
      const eq = m.equipment;
      const eqLabel =
        eq && eq.template
          ? `${eq.template.equipment_name || 'Equipment'}${eq.template.brand ? ` (${eq.template.brand})` : ''
          }`
          : m.equipment_other_selected
            ? 'Other'
            : null;
      return (
        <div className="space-y-5">
          <Button onClick={onBack}>← Back to list</Button>
          {showTypeBadge && <Tag color="green">Maintenance</Tag>}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2.5">
            <div>
              <Text type="secondary">Request code:</Text> <Text strong>{m.request_code}</Text>
            </div>
            <div>
              <Text type="secondary">Status:</Text> {getStatusTag(m.status)}
            </div>
            <div>
              <Text type="secondary">Room:</Text> <Text>{formatMaintenanceRoom(m.room)}</Text>
            </div>
            <div>
              <Text type="secondary">Bed:</Text> <Text>{m.bed?.bed_number || '-'}</Text>
            </div>
            {eqLabel && (
              <div>
                <Text type="secondary">Equipment:</Text> <Text>{eqLabel}</Text>
              </div>
            )}
            <div>
              <Text type="secondary">Description:</Text>
              <div className="mt-1 whitespace-pre-wrap rounded border border-gray-200 bg-white p-3 text-sm min-h-[100px]">
                {m.description || '-'}
              </div>
            </div>
            {m.evidence_urls && m.evidence_urls.length > 0 && (
              <div>
                <Text type="secondary" className="block mb-1">
                  Evidence links
                </Text>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {m.evidence_urls.map((url, i) => (
                    <li key={i}>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <Text type="secondary">Submitted:</Text>{' '}
              <Text>
                {m.requested_at ? dayjs(m.requested_at).format('DD/MM/YYYY HH:mm') : '-'}
              </Text>
            </div>
            {m.status === 'rejected' && m.rejection_reason && (
              <div>
                <Text type="secondary">Rejection reason:</Text>
                <div className="mt-1 rounded border border-red-100 bg-red-50 p-3 text-sm text-red-800">
                  {m.rejection_reason}
                </div>
              </div>
            )}
            {(m.technician_name || m.technician_phone || m.scheduled_time) && (
              <div>
                <Text type="secondary" className="block mb-1">
                  Technician information:
                </Text>
                <div className="rounded border border-gray-200 bg-white p-3 text-sm space-y-1.5">
                  <div>
                    <Text type="secondary">Name:</Text> <Text>{m.technician_name || '-'}</Text>
                  </div>
                  <div>
                    <Text type="secondary">Phone:</Text> <Text>{m.technician_phone || '-'}</Text>
                  </div>
                  <div>
                    <Text type="secondary">Scheduled time:</Text>{' '}
                    <Text>{m.scheduled_time ? dayjs(m.scheduled_time).format('DD/MM/YYYY HH:mm') : '-'}</Text>
                  </div>
                </div>
              </div>
            )}
            {m.completion_notes && (
              <div>
                <Text type="secondary">Completion notes:</Text>
                <div className="mt-1 whitespace-pre-wrap rounded border border-blue-100 bg-blue-50 p-3 text-sm">
                  {m.completion_notes}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (item.type === 'checkout') {
      const c = item.raw as StudentCheckoutRequest;
      return (
        <div className="space-y-5">
          <Button onClick={onBack}>← Back to list</Button>
          {showTypeBadge && <Tag color="red">Checkout request</Tag>}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2.5">
            <div>
              <Text type="secondary">Request code:</Text> <Text strong>{c.request_code}</Text>
            </div>
            <div>
              <Text type="secondary">Status:</Text> {getStatusTag(c.status)}
            </div>
            <div>
              <Text type="secondary">Expected checkout date:</Text>{' '}
              <Text>{dayjs(c.expected_checkout_date).format('DD/MM/YYYY')}</Text>
            </div>
            <div>
              <Text type="secondary">Room:</Text>{' '}
              <Text>
                {[
                  c.room?.block?.dorm?.dorm_name,
                  c.room?.block?.block_name,
                  c.room?.room_number ? `Room ${c.room.room_number}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || '—'}
              </Text>
            </div>
            <div>
              <Text type="secondary">Bed:</Text> <Text>{c.bed?.bed_number || '—'}</Text>
            </div>
            <div>
              <Text type="secondary">Reason:</Text>
              <div className="mt-1 whitespace-pre-wrap rounded border border-gray-200 bg-white p-3 text-sm min-h-[80px]">
                {c.reason || '-'}
              </div>
            </div>
            <div>
              <Text type="secondary">Submitted:</Text>{' '}
              <Text>{c.requested_at ? dayjs(c.requested_at).format('DD/MM/YYYY HH:mm') : '-'}</Text>
            </div>
            {c.status === 'rejected' && c.rejection_reason && (
              <div>
                <Text type="secondary">Rejection reason:</Text>
                <div className="mt-1 rounded border border-red-100 bg-red-50 p-3 text-sm text-red-800">
                  {c.rejection_reason}
                </div>
              </div>
            )}
            {c.status === 'approved' && (
              <Alert
                type="success"
                showIcon
                message="Your checkout request has been approved. Security will inspect your room before the checkout date."
              />
            )}
            {c.status === 'pending' && (
              <div className="pt-2">
                <Button danger onClick={() => handleCancelCheckout(c.id)}>
                  Cancel Request
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    }

    const o = item.raw as StudentOtherRequest;
    return (
      <div className="space-y-5">
        <Button onClick={onBack}>← Back to list</Button>
        {showTypeBadge && <Tag color="purple">Other request</Tag>}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2.5">
          <div>
            <Text type="secondary">Request Code:</Text> <Text strong>{o.request_code}</Text>
          </div>
          <div>
            <Text type="secondary">Request:</Text> <Text strong>{o.title}</Text>
          </div>
          <div>
            <Text type="secondary">Your description:</Text>
            <div className="mt-1 whitespace-pre-wrap rounded border border-gray-200 bg-white p-3 text-sm min-h-[120px]">
              {o.description || '-'}
            </div>
          </div>
          <div>
            <Text type="secondary">Status:</Text> {getStatusTag(o.status)}
          </div>
          <div>
            <Text type="secondary">Submitted:</Text>{' '}
            <Text>{o.createdAt ? dayjs(o.createdAt).format('DD/MM/YYYY HH:mm') : '-'}</Text>
          </div>
          {o.status === 'rejected' && o.rejection_reason && (
            <div>
              <Text type="secondary">Rejection reason:</Text>
              <div className="mt-1 rounded border border-red-100 bg-red-50 p-3 text-sm text-red-800">
                {o.rejection_reason}
              </div>
            </div>
          )}
          <div>
            <Text type="secondary">Manager response:</Text>
            {o.manager_response ? (
              <div className="mt-1 whitespace-pre-wrap rounded border border-blue-100 bg-blue-50 p-3 text-sm">
                {o.manager_response}
              </div>
            ) : (
              <Alert
                className="mt-2"
                type="info"
                showIcon
                message="No response from the manager yet. You will be notified when it is updated."
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderRequestList = (
    requests: UnifiedListItem[],
    options?: { showTypeTag?: boolean; onViewDetail?: (item: UnifiedListItem) => void }
  ) => {
    const showTypeTag = options?.showTypeTag ?? false;
    const onViewDetail = options?.onViewDetail;
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <Spin size="large" />
        </div>
      );
    }

    if (requests.length === 0) {
      return (
        <Card>
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <Text type="secondary">No requests found</Text>
          </div>
        </Card>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {requests.map((req) => (
          <Card key={`${req.type}-${req.id}`} size="small">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  background: token.colorBgTextHover,
                  borderRadius: token.borderRadius,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                {getTypeIcon(req.type)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '8px',
                    marginBottom: '4px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                      {showTypeTag && (
                        <Tag color="default" style={{ margin: 0 }}>
                          {requestTypeLabel[req.type]}
                        </Tag>
                      )}
                      <Text strong style={{ fontSize: '14px', lineHeight: '22px' }}>
                        {req.title}
                      </Text>
                    </div>
                  </div>
                  {getStatusTag(req.status)}
                </div>

                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Code: {req.subtitle}
                </Text>

                <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                    {req.date}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {req.detail}
                  </Text>
                  {req.visitors && req.visitors.length > 0 && (
                    <Tag color="blue" style={{ fontSize: '11px', lineHeight: '18px' }}>
                      {req.visitors.length} visitor{req.visitors.length > 1 ? 's' : ''}
                    </Tag>
                  )}
                </div>

                {req.visitors && req.visitors.length > 0 && (
                  <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {req.visitors.map((v, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '12px',
                          color: token.colorTextSecondary,
                          background: token.colorBgTextHover,
                          borderRadius: '4px',
                          padding: '1px 8px',
                        }}
                      >
                        {v.full_name}
                        <span style={{ color: token.colorTextQuaternary, marginLeft: 4 }}>
                          ({relationshipLabel[v.relationship] ?? v.relationship})
                        </span>
                      </span>
                    ))}
                  </div>
                )}

                {req.status === 'rejected' && req.rejection_reason && (
                  <Text
                    type="danger"
                    style={{ fontSize: '12px', display: 'block', marginTop: '6px' }}
                  >
                    Rejection reason: {req.rejection_reason}
                  </Text>
                )}
              </div>

              <Space
                direction={isTablet ? 'vertical' : 'horizontal'}
                size="small"
                style={{ flexShrink: 0, width: isTablet ? 'auto' : '100%' }}
              >
                {onViewDetail && (
                  <Button type="primary" size="small" onClick={() => onViewDetail(req)} block={!isTablet}>
                    View detail
                  </Button>
                )}
                {req.type === 'visitor' && req.status === 'pending' && (
                  <Button
                    danger
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => handleCancel(req.id)}
                    block={!isTablet}
                  >
                    Cancel
                  </Button>
                )}
                {req.type === 'checkout' && req.status === 'pending' && (
                  <Button
                    danger
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={() => handleCancelCheckout(req.id)}
                    block={!isTablet}
                  >
                    Cancel
                  </Button>
                )}
              </Space>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const tabItems = [
    {
      key: 'all',
      label: (
        <span className="flex items-center gap-2">
          <AppstoreOutlined /> All
        </span>
      ),
      children: (
        <div className="space-y-4">
          <Card className="rounded-xl border border-gray-200 shadow-sm">
            <Tabs
              activeKey={allInnerTab}
              onChange={(k) => {
                const key = k as InnerListTabKey;
                if (key === 'detail' && !selectedAll) return;
                setAllInnerTab(key);
              }}
              destroyInactiveTabPane={false}
              items={[
                {
                  key: 'list',
                  label: 'My requests',
                  children: (
                    <div className="space-y-4">
                      {renderRequestList(filteredRequestsByTab('all'), {
                        showTypeTag: true,
                        onViewDetail: (it) => {
                          setSelectedAll(it);
                          setAllInnerTab('detail');
                        },
                      })}
                    </div>
                  ),
                },
                {
                  key: 'detail',
                  label: selectedAll ? `Detail · ${selectedAll.subtitle}` : 'Detail',
                  disabled: !selectedAll,
                  children: renderStudentRequestDetail(selectedAll, () => {
                    setAllInnerTab('list');
                    setSelectedAll(null);
                  }, { showTypeBadge: true }),
                },
              ]}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'visitor',
      label: (
        <span className="flex items-center gap-2">
          <TeamOutlined /> Visitor Request
        </span>
      ),
      children: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="primary" onClick={() => handleNewRequest('visitor')} block={!isTablet}>
              New Visitor Request
            </Button>
          </div>
          <Card className="rounded-xl border border-gray-200 shadow-sm">
            <Tabs
              activeKey={visitorInnerTab}
              onChange={(k) => {
                const key = k as InnerListTabKey;
                if (key === 'detail' && !selectedVisitor) return;
                setVisitorInnerTab(key);
              }}
              destroyInactiveTabPane={false}
              items={[
                {
                  key: 'list',
                  label: 'My requests',
                  children: renderRequestList(filteredRequestsByTab('visitor'), {
                    onViewDetail: (it) => {
                      setSelectedVisitor(it);
                      setVisitorInnerTab('detail');
                    },
                  }),
                },
                {
                  key: 'detail',
                  label: selectedVisitor ? `Detail · ${selectedVisitor.subtitle}` : 'Detail',
                  disabled: !selectedVisitor,
                  children: renderStudentRequestDetail(selectedVisitor, () => {
                    setVisitorInnerTab('list');
                    setSelectedVisitor(null);
                  }),
                },
              ]}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'maintenance',
      label: (
        <span className="flex items-center gap-2">
          <ToolOutlined /> Maintenance Request
        </span>
      ),
      children: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="primary" onClick={() => handleNewRequest('maintenance')} block={!isTablet}>
              New Maintenance Request
            </Button>
          </div>
          <Card className="rounded-xl border border-gray-200 shadow-sm">
            <Tabs
              activeKey={maintenanceInnerTab}
              onChange={(k) => {
                const key = k as InnerListTabKey;
                if (key === 'detail' && !selectedMaintenance) return;
                setMaintenanceInnerTab(key);
              }}
              destroyInactiveTabPane={false}
              items={[
                {
                  key: 'list',
                  label: 'My requests',
                  children: (
                    <div className="space-y-4">
                      {renderRequestList(filteredRequestsByTab('maintenance'), {
                        onViewDetail: (it) => {
                          setSelectedMaintenance(it);
                          setMaintenanceInnerTab('detail');
                        },
                      })}
                    </div>
                  ),
                },
                {
                  key: 'detail',
                  label: selectedMaintenance ? `Detail · ${selectedMaintenance.subtitle}` : 'Detail',
                  disabled: !selectedMaintenance,
                  children: renderStudentRequestDetail(selectedMaintenance, () => {
                    setMaintenanceInnerTab('list');
                    setSelectedMaintenance(null);
                  }),
                },
              ]}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'bed-transfer',
      label: (
        <span className="flex items-center gap-2">
          <SwapOutlined /> Change Bed
        </span>
      ),
      children: (
        <div className="space-y-4">
          <BedTransferPage embedded />
        </div>
      ),
    },
    {
      key: 'report',
      label: (
        <span className="flex items-center gap-2">
          <FlagOutlined /> Violation Report
        </span>
      ),
      children: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="primary" onClick={() => handleNewRequest('report')} block={!isTablet}>
              New Violation Report
            </Button>
          </div>
          <Card className="rounded-xl border border-gray-200 shadow-sm">
            <Tabs
              activeKey={reportInnerTab}
              onChange={(k) => {
                const key = k as InnerListTabKey;
                if (key === 'detail' && !selectedReport) return;
                setReportInnerTab(key);
              }}
              destroyInactiveTabPane={false}
              items={[
                {
                  key: 'list',
                  label: 'My requests',
                  children: renderRequestList(filteredRequestsByTab('report'), {
                    onViewDetail: (it) => {
                      setSelectedReport(it);
                      setReportInnerTab('detail');
                    },
                  }),
                },
                {
                  key: 'detail',
                  label: selectedReport ? `Detail · ${selectedReport.subtitle}` : 'Detail',
                  disabled: !selectedReport,
                  children: renderStudentRequestDetail(selectedReport, () => {
                    setReportInnerTab('list');
                    setSelectedReport(null);
                  }),
                },
              ]}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'other',
      label: (
        <span className="flex items-center gap-2">
          <FileSearchOutlined /> Other
        </span>
      ),
      children: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="primary" onClick={() => handleNewRequest('other')} block={!isTablet}>
              New Other Request
            </Button>
          </div>
          <Card className="rounded-xl border border-gray-200 shadow-sm">
            <Tabs
              activeKey={otherSubTab}
              onChange={(k) => {
                const key = k as OtherSubTabKey;
                if (key === 'detail' && !selectedOther) return;
                setOtherSubTab(key);
              }}
              destroyInactiveTabPane={false}
              items={[
                {
                  key: 'list',
                  label: 'My requests',
                  children: loading ? (
                    <div style={{ textAlign: 'center', padding: '48px' }}>
                      <Spin size="large" />
                    </div>
                  ) : otherRequests.length === 0 ? (
                    <Card size="small">
                      <div style={{ textAlign: 'center', padding: '32px' }}>
                        <Text type="secondary">No other requests yet</Text>
                      </div>
                    </Card>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {otherRequests.map((r) => (
                        <Card key={r.id} size="small">
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: '12px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                  gap: '8px',
                                  marginBottom: '4px',
                                }}
                              >
                                <Text strong style={{ fontSize: '14px' }}>
                                  {r.title}
                                </Text>
                                {getStatusTag(r.status)}
                              </div>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                Code: {r.request_code}
                              </Text>
                              <div style={{ marginTop: '6px' }}>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                                  {dayjs(r.createdAt).format('DD/MM/YYYY')}
                                </Text>
                              </div>
                            </div>
                            <Button
                              type="primary"
                              size="small"
                              onClick={() => {
                                setSelectedOther(r);
                                setOtherSubTab('detail');
                              }}
                              block={!isTablet}
                            >
                              View detail
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ),
                },
                {
                  key: 'detail',
                  label: selectedOther ? `Detail · ${selectedOther.request_code}` : 'Detail',
                  disabled: !selectedOther,
                  children: selectedOther ? (
                    <div className="space-y-5">
                      <Button
                        onClick={() => {
                          setOtherSubTab('list');
                        }}
                      >
                        ← Back to list
                      </Button>

                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2.5">
                        <div>
                          <Text type="secondary">Request Code:</Text>{' '}
                          <Text strong>{selectedOther.request_code}</Text>
                        </div>
                        <div>
                          <Text type="secondary">Request:</Text> <Text strong>{selectedOther.title}</Text>
                        </div>
                        <div>
                          <Text type="secondary">Your description:</Text>
                          <div className="mt-1 whitespace-pre-wrap rounded border border-gray-200 bg-white p-3 text-sm min-h-[120px]">
                            {selectedOther.description || '-'}
                          </div>
                        </div>
                        <div>
                          <Text type="secondary">Status:</Text> {getStatusTag(selectedOther.status)}
                        </div>
                        <div>
                          <Text type="secondary">Submitted:</Text>{' '}
                          <Text>
                            {selectedOther.createdAt
                              ? dayjs(selectedOther.createdAt).format('DD/MM/YYYY HH:mm')
                              : '-'}
                          </Text>
                        </div>
                        {selectedOther.status === 'rejected' && selectedOther.rejection_reason && (
                          <div>
                            <Text type="secondary">Rejection reason:</Text>
                            <div className="mt-1 rounded border border-red-100 bg-red-50 p-3 text-sm text-red-800">
                              {selectedOther.rejection_reason}
                            </div>
                          </div>
                        )}
                        <div>
                          <Text type="secondary">Manager response:</Text>
                          {selectedOther.manager_response ? (
                            <div className="mt-1 whitespace-pre-wrap rounded border border-blue-100 bg-blue-50 p-3 text-sm">
                              {selectedOther.manager_response}
                            </div>
                          ) : (
                            <Alert
                              className="mt-2"
                              type="info"
                              showIcon
                              message="No response from the manager yet. You will be notified when it is updated."
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Alert
                      type="info"
                      message="Choose a request from the list and click View detail."
                    />
                  ),
                },
              ]}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'checkout',
      label: (
        <span className="flex items-center gap-2">
          <LogoutOutlined /> Checkout
        </span>
      ),
      children: (
        <div className="space-y-4">
          {(() => {
            const activeCheckout = checkoutRequests.find((r) =>
              r.status === 'pending' || r.status === 'approved' || r.status === 'inspected'
            );
            const alertType = activeCheckout?.status === 'approved' || activeCheckout?.status === 'inspected' ? 'success' : 'info';
            const alertMessage =
              activeCheckout?.status === 'inspected'
                ? 'Your room has been inspected. Waiting for manager to complete checkout.'
                : activeCheckout?.status === 'approved'
                  ? 'Your checkout request has been approved. Security will inspect your room.'
                  : 'You have a pending checkout request. Cancel it before submitting a new one.';
            return activeCheckout ? (
              <Alert
                type={alertType}
                showIcon
                message={alertMessage}
                description={`Request: ${activeCheckout.request_code} · Expected: ${dayjs(activeCheckout.expected_checkout_date).format('DD/MM/YYYY')}`}
              />
            ) : (
              <div className="flex justify-end">
                <Button type="primary" danger onClick={() => handleNewRequest('checkout')} block={!isTablet}>
                  New Checkout Request
                </Button>
              </div>
            );
          })()}
          <Card className="rounded-xl border border-gray-200 shadow-sm">
            <Tabs
              activeKey={checkoutInnerTab}
              onChange={(k) => {
                const key = k as InnerListTabKey;
                if (key === 'detail' && !selectedCheckout) return;
                setCheckoutInnerTab(key);
              }}
              destroyInactiveTabPane={false}
              items={[
                {
                  key: 'list',
                  label: 'My requests',
                  children: renderRequestList(filteredRequestsByTab('checkout'), {
                    onViewDetail: (it) => {
                      setSelectedCheckout(it);
                      setCheckoutInnerTab('detail');
                    },
                  }),
                },
                {
                  key: 'detail',
                  label: selectedCheckout ? `Detail · ${selectedCheckout.subtitle}` : 'Detail',
                  disabled: !selectedCheckout,
                  children: renderStudentRequestDetail(selectedCheckout, () => {
                    setCheckoutInnerTab('list');
                    setSelectedCheckout(null);
                  }),
                },
              ]}
            />
          </Card>
        </div>
      ),
    },
  ];
  const orderedTabItems = [...tabItems].sort((a, b) => {
    const order: Record<string, number> = { checkout: 1, other: 2 };
    const oa = order[a.key as string] ?? 0;
    const ob = order[b.key as string] ?? 0;
    if (oa === 0 && ob === 0) return 0;
    if (oa === 0) return -1;
    if (ob === 0) return 1;
    return oa - ob;
  });

  return (
    <div style={{ padding: isTablet ? '32px' : '16px', background: token.colorBgLayout }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm sm:p-6">
          <div className="mb-4">
            <Title level={4} style={{ margin: 0 }}>
              My Requests
            </Title>
          </div>
          {!canCreateRequest ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '55vh',
                textAlign: 'center',
              }}
            >
              <img
                src="/images/booking-not-started.png"
                alt="No record"
                style={{ width: 320, marginBottom: 28, opacity: 0.92 }}
              />
              <Title level={3} style={{ color: '#ea580c', fontWeight: 700, margin: 0 }}>
                No record found!
              </Title>
            </div>
          ) : (
            <Tabs
              activeKey={activeTab}
              onChange={(k) => {
                const key = k as RequestTabKey;
                setActiveTab(key);
                setSearchParams((prev) => {
                  const p = new URLSearchParams(prev);
                  if (key === 'bed-transfer') {
                    p.set('tab', 'bed-transfer');
                  } else {
                    p.delete('tab');
                  }
                  return p;
                });
              }}
              items={orderedTabItems}
              className="facility-tabs"
            />
          )}
        </div>

        {/* New Request Form Modal */}
        <Modal
          open={showForm}
          onCancel={handleCloseForm}
          footer={null}
          width={isTablet ? 720 : 'calc(100vw - 24px)'}
          destroyOnClose
          title={
            <Space>
              <ArrowLeftOutlined onClick={handleCloseForm} style={{ cursor: 'pointer' }} />
              {selectedType === 'visitor' && 'New Visitor Request'}
              {selectedType === 'maintenance' && 'New Maintenance Request'}
              {selectedType === 'report' && 'New Violation Report'}
              {selectedType === 'other' && 'New Other Request'}
              {selectedType === 'checkout' && 'New Checkout Request'}
            </Space>
          }
        >
          {selectedType === 'visitor' && <VisitorForm onSuccess={handleVisitorCreated} />}
          {selectedType === 'maintenance' && (
            <MaintenanceForm
              onSuccess={handleMaintenanceCreated}
              openRequest={maintenanceRequests.find(
                (r) => !['completed', 'done', 'cannot_fix', 'cancelled', 'rejected'].includes(String(r.status))
              ) || null}
            />
          )}
          {selectedType === 'report' && <ReportForm onSuccess={handleReportCreated} />}
          {selectedType === 'other' && <OtherRequestForm onSuccess={handleOtherCreated} />}
          {selectedType === 'checkout' && <CheckoutRequestForm onSuccess={handleCheckoutCreated} onClose={handleCheckoutConflict} />}
        </Modal>
      </div>
    </div>
  );
};

// ─── Visitor Request Form (connected to API) ───
const VisitorForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const dto: IVisitor.CreateVisitorRequestDto = {
        visit_date: values.visit_date.format('YYYY-MM-DD'),
        purpose: values.purpose,
        visitors: values.visitors.map((v: any) => ({
          full_name: v.full_name,
          citizen_id: v.citizen_id,
          phone: v.phone,
          relationship: v.relationship,
          relationship_other: v.relationship_other,
        })),
      };

      await createVisitorRequest(dto);
      message.success('Visitor request submitted successfully');
      onSuccess();
    } catch (err: any) {
      if (err?.message) {
        message.error(Array.isArray(err.message) ? err.message[0] : err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form form={form} layout="vertical" initialValues={{ visitors: [{}] }}>
      <Alert
        message="Visiting hours are 07:00 - 17:00 every day. Guests may arrive and leave at any time within this window."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Title level={5}>Visit Details</Title>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="visit_date"
            label="Visit Date"
            rules={[{ required: true, message: 'Required' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              disabledDate={(d) => d.isBefore(dayjs().startOf('day'))}
            />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item
        name="purpose"
        label="Purpose of Visit"
        rules={[{ required: true, message: 'Required' }]}
      >
        <TextArea placeholder="Briefly describe the purpose..." rows={2} />
      </Form.Item>

      <Title level={5}>Visitors (max 5)</Title>
      <Form.List name="visitors">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Card
                key={key}
                size="small"
                style={{ marginBottom: 12 }}
                extra={
                  fields.length > 1 ? (
                    <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                  ) : null
                }
                title={`Visitor ${name + 1}`}
              >
                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      {...restField}
                      name={[name, 'full_name']}
                      label="Full Name"
                      rules={[{ required: true, message: 'Required' }]}
                    >
                      <Input placeholder="Full name" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      {...restField}
                      name={[name, 'citizen_id']}
                      label="Citizen ID (CCCD)"
                      rules={[{ required: true, message: 'Required' }]}
                    >
                      <Input placeholder="ID card number" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      {...restField}
                      name={[name, 'phone']}
                      label="Phone"
                      rules={[{ required: true, message: 'Required' }]}
                    >
                      <Input placeholder="0123 456 789" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      {...restField}
                      name={[name, 'relationship']}
                      label="Relationship"
                      rules={[{ required: true, message: 'Required' }]}
                    >
                      <Select
                        placeholder="Select..."
                        options={[
                          { label: 'Parent', value: 'parent' },
                          { label: 'Sibling', value: 'sibling' },
                          { label: 'Friend', value: 'friend' },
                          { label: 'Other', value: 'other' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item noStyle shouldUpdate>
                      {({ getFieldValue }) =>
                        getFieldValue(['visitors', name, 'relationship']) === 'other' ? (
                          <Form.Item
                            {...restField}
                            name={[name, 'relationship_other']}
                            label="Specify relationship"
                            rules={[{ required: true, message: 'Please specify' }]}
                          >
                            <Input placeholder="e.g. Cousin, Aunt..." />
                          </Form.Item>
                        ) : null
                      }
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            ))}
            {fields.length < 5 && (
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Add Visitor
              </Button>
            )}
          </>
        )}
      </Form.List>

      <div style={{ marginTop: 16 }}>
        <Button type="primary" onClick={handleSubmit} loading={submitting} size="large">
          Submit Request
        </Button>
      </div>
    </Form>
  );
};

// ─── Maintenance Request Form (assigned room from active contract) ───
const MaintenanceForm: React.FC<{
  onSuccess: () => void;
  openRequest?: StudentMaintenanceRequest | null;
}> = ({ onSuccess, openRequest = null }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [roomEquipment, setRoomEquipment] = useState<RoomEquipment[]>([]);
  const [loadingEq, setLoadingEq] = useState(true);
  const [loadingContext, setLoadingContext] = useState(true);
  const [context, setContext] = useState<MaintenanceContext | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingContext(true);
      try {
        const ctx = await getMyMaintenanceContext();
        if (!cancelled) setContext(ctx);
      } catch {
        if (!cancelled) setContext(null);
      } finally {
        if (!cancelled) setLoadingContext(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingEq(true);
      try {
        const list = await getMyRoomEquipmentForMaintenance();
        if (!cancelled) setRoomEquipment(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setRoomEquipment([]);
      } finally {
        if (!cancelled) setLoadingEq(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const equipmentOptions = roomEquipment.map((eq) => {
    const tpl = typeof eq.template === 'object' ? eq.template : null;
    const name = tpl?.equipment_name || 'Equipment';
    const brand = tpl?.brand ? ` (${tpl.brand})` : '';
    return {
      // Send equipment_code (like manager UI) and let BE resolve to RoomEquipment.
      value: eq.equipment_code,
      // Only show the equipment name (hide equipment_code).
      label: `${name}${brand}`,
    };
  });
  equipmentOptions.push({ value: 'other', label: 'Other' });

  const handleSubmit = async () => {
    if (openRequest) {
      message.warning(
        `You already have an active maintenance request (${openRequest.request_code} - ${openRequest.status}). Please wait until it is processed.`
      );
      return;
    }
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const selectedEquipment = values.equipment ? String(values.equipment).trim() : undefined;
      await createMaintenanceRequest({
        description: values.description,
        equipment: selectedEquipment,
        evidence_urls: values.evidence_urls?.length ? values.evidence_urls : undefined,
      });
      message.success('Maintenance request submitted');
      form.resetFields();
      onSuccess();
    } catch (err: any) {
      if (err?.errorFields) return;
      if (err?.message) {
        message.error(Array.isArray(err.message) ? err.message[0] : err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{}}
    >
      <Alert
        type="info"
        showIcon
        message="The room is linked to your active contract. Choose an item from the list if the issue relates to a specific piece of equipment assigned to your room."
        style={{ marginBottom: 16 }}
      />
      {openRequest ? (
        <Alert
          type="warning"
          showIcon
          message={`Active request in progress: ${openRequest.request_code} (${openRequest.status})`}
          description="You can create a new maintenance request only after the current one is finished."
          style={{ marginBottom: 16 }}
        />
      ) : null}
      <div style={{ marginBottom: 16 }}>
        {loadingContext ? (
          <Alert type="info" showIcon message="Loading room and bed information..." />
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2.5">
            <div>
              <Text type="secondary">Student:</Text>{' '}
              <Text strong>
                {context?.student?.full_name || '-'}{' '}
                {context?.student?.student_code ? `(${context?.student?.student_code})` : ''}
              </Text>
            </div>
            <div>
              <Text type="secondary">Room:</Text> <Text>{formatMaintenanceRoom(context?.room)}</Text>
            </div>
            <div>
              <Text type="secondary">Bed:</Text> <Text>{context?.bed?.bed_number || '-'}</Text>
            </div>
          </div>
        )}
      </div>
      <Form.Item name="equipment" label="Affected equipment (optional)">
        <Select
          allowClear
          loading={loadingEq}
          placeholder={loadingEq ? 'Loading…' : 'General room issue — leave empty'}
          options={equipmentOptions}
          size="large"
          showSearch
          optionFilterProp="label"
        />
      </Form.Item>
      <Form.Item
        name="description"
        label="Description"
        rules={[
          { required: true, message: 'Please describe the issue' },
          { min: 10, message: 'At least 10 characters' },
        ]}
      >
        <TextArea rows={4} placeholder="Describe the damage or issue in detail..." size="large" />
      </Form.Item>
      <Form.Item name="evidence_urls" label="Evidence image URLs (optional)">
        <Select
          mode="tags"
          placeholder="Paste image URLs, press Enter"
          tokenSeparators={[',']}
        />
      </Form.Item>
      <Button
        type="primary"
        size="large"
        onClick={handleSubmit}
        loading={submitting}
        disabled={!!openRequest}
      >
        Submit request
      </Button>
    </Form>
  );
};

// ─── Violation Report Form (placeholder — no API yet) ───
const violationTypeOptions = [
  { label: 'Noise Disturbance', value: ViolationType.NOISE },
  { label: 'Cleanliness Issue', value: ViolationType.CLEANLINESS },
  { label: 'Unauthorized Guest', value: ViolationType.UNAUTHORIZED_GUEST },
  { label: 'Alcohol / Smoking', value: ViolationType.ALCOHOL },
  { label: 'Other', value: ViolationType.OTHER },
];

const ReportForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { modal } = App.useApp();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const violationLabel =
        violationTypeOptions.find((opt) => opt.value === values.violation_type)?.label ||
        values.violation_type;

      modal.confirm({
        title: 'Confirm violation report',
        content: (
          <div>
            <p>Are you sure you want to submit this violation report?</p>
            <p>
              <strong>Violation type:</strong> {violationLabel}
            </p>
            {values.location && (
              <p>
                <strong>Location:</strong> {values.location}
              </p>
            )}
            <p>
              <strong>Description:</strong> {values.description}
            </p>
            <p className="mt-2">
              Please make sure the details are correct before submitting. You cannot edit this
              report after it is sent.
            </p>
          </div>
        ),
        okText: 'Confirm & Submit',
        cancelText: 'Cancel',
        onOk: async () => {
          setSubmitting(true);
          try {
            const dto: IViolation.CreateViolationDto = {
              reporter_type: ReporterType.STUDENT,
              violation_type: values.violation_type,
              violation_other_detail: values.violation_other_detail,
              description: values.description,
              violation_date: values.violation_date
                ? values.violation_date.format('YYYY-MM-DD')
                : dayjs().format('YYYY-MM-DD'),
              location: values.location,
              evidence_urls: values.evidence_urls || [],
            };

            await createViolationReport(dto);
            message.success('Violation report submitted successfully');
            form.resetFields();
            onSuccess?.();
          } catch (err: any) {
            if (err?.message) {
              message.error(Array.isArray(err.message) ? err.message[0] : err.message);
            }
          } finally {
            setSubmitting(false);
          }
        },
      });
    } catch (err: any) {
      if (err?.message && !err.errorFields) {
        message.error(Array.isArray(err.message) ? err.message[0] : err.message);
      }
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        violation_type: ViolationType.NOISE,
        violation_date: dayjs(),
      }}
    >
      <Alert
        message="Use this form to report violations or safety concerns. Your identity will be visible to managers for follow‑up."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="violation_date"
            label="Violation Date"
            rules={[{ required: true, message: 'Please select violation date' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              disabledDate={(current) => current && current > dayjs().endOf('day')}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="violation_type"
        label="Violation Type"
        rules={[{ required: true, message: 'Please select violation type' }]}
      >
        <Select
          placeholder="Select violation type..."
          style={{ width: '100%' }}
          size="large"
          options={violationTypeOptions}
        />
      </Form.Item>

      <Form.Item noStyle shouldUpdate>
        {({ getFieldValue }) =>
          getFieldValue('violation_type') === ViolationType.OTHER ? (
            <Form.Item
              name="violation_other_detail"
              label="Specify Violation Type"
              rules={[{ required: true, message: 'Please specify violation type' }]}
            >
              <Input placeholder="e.g. Fighting, Property Damage..." />
            </Form.Item>
          ) : null
        }
      </Form.Item>

      <Form.Item name="location" label="Location">
        <Input placeholder="E.g: A101-1" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[
          { required: true, message: 'Please enter description' },
          { min: 10, message: 'Description must be at least 10 characters' },
        ]}
      >
        <TextArea placeholder="Provide detailed description..." rows={4} size="large" />
      </Form.Item>

      <Form.Item name="evidence_urls" label="Evidence Links (images)">
        <Select
          mode="tags"
          placeholder="Paste image URLs and press Enter"
          tokenSeparators={[',']}
        />
      </Form.Item>

      <Button type="primary" size="large" onClick={handleSubmit} loading={submitting}>
        Submit Report
      </Button>
    </Form>
  );
};

const OtherRequestForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { modal } = App.useApp();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      modal.confirm({
        title: 'Confirm other request',
        content: (
          <div>
            <p>Are you sure you want to submit this request to manager?</p>
            <p>
              <strong>Title:</strong> {values.title}
            </p>
            <p>
              <strong>Description:</strong> {values.description}
            </p>
          </div>
        ),
        okText: 'Confirm & Submit',
        cancelText: 'Cancel',
        onOk: async () => {
          setSubmitting(true);
          try {
            await createOtherRequest({
              title: values.title,
              description: values.description,
            });
            message.success('Other request submitted successfully');
            form.resetFields();
            onSuccess?.();
          } catch (err: any) {
            if (err?.message) {
              message.error(Array.isArray(err.message) ? err.message[0] : err.message);
            }
          } finally {
            setSubmitting(false);
          }
        },
      });
    } catch (err: any) {
      if (err?.message && !err.errorFields) {
        message.error(Array.isArray(err.message) ? err.message[0] : err.message);
      }
    }
  };

  return (
    <Form form={form} layout="vertical">
      <Form.Item
        name="title"
        label="Title"
        rules={[
          { required: true, message: 'Please enter title' },
          { min: 3, message: 'Title must be at least 3 characters' },
        ]}
      >
        <Input placeholder="Enter request title" maxLength={150} />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[
          { required: true, message: 'Please enter description' },
          { min: 10, message: 'Description must be at least 10 characters' },
        ]}
      >
        <TextArea rows={5} placeholder="Describe your request in detail..." maxLength={3000} />
      </Form.Item>

      <Button type="primary" size="large" onClick={handleSubmit} loading={submitting}>
        Submit Request
      </Button>
    </Form>
  );
};

// ─── Checkout Request Form ───
const CheckoutRequestForm: React.FC<{ onSuccess: () => void; onClose: () => void }> = ({ onSuccess, onClose }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await createCheckoutRequest({
        expected_checkout_date: values.expected_checkout_date.format('YYYY-MM-DD'),
        reason: values.reason,
      });
      onSuccess();
    } catch (err: any) {
      if (err?.errorFields) return; // antd validation error — form already shows inline errors
      const msg = Array.isArray(err?.message) ? err.message[0] : err?.message;
      if (err?.statusCode === 409) {
        onClose();
        toast.error(msg || 'You already have an active checkout request.');
      } else if (msg) {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form form={form} layout="vertical">
      <Alert
        message="Your checkout request will be reviewed by the manager. Security staff will inspect your room before the checkout date."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Form.Item
        name="expected_checkout_date"
        label="Expected Checkout Date"
        rules={[{ required: true, message: 'Please select a checkout date' }]}
      >
        <DatePicker
          style={{ width: '100%' }}
          disabledDate={(d) => d.isBefore(dayjs().add(1, 'day').startOf('day'))}
        />
      </Form.Item>
      <Form.Item
        name="reason"
        label="Reason for Checkout"
        rules={[
          { required: true, message: 'Please enter your reason' },
          { min: 10, message: 'Reason must be at least 10 characters' },
        ]}
      >
        <TextArea
          rows={4}
          placeholder="Explain why you want to check out early (e.g. end of semester, personal reasons...)..."
          maxLength={1000}
          showCount
        />
      </Form.Item>
      <Button type="primary" danger size="large" onClick={handleSubmit} loading={submitting}>
        Submit Checkout Request
      </Button>
    </Form>
  );
};


export default Requests;
