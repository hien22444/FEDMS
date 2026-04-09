import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Users as UsersIcon, FileText, Video, CheckCircle, AlertCircle, Info, Bell, ChevronRight, LogOut } from 'lucide-react';
import { Badge, Tag } from 'antd';
import { cn } from '@/utils';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { getAllVisitorRequests, getActiveVisitors } from '@/lib/actions/visitor';
import { getApprovedCheckoutRequests, type StudentCheckoutRequest } from '@/lib/actions/checkoutRequest';
import { getMyNotifications, type INotification } from '@/lib/actions/notification';
import { getSocket } from '@/lib/socket';
import type { IVisitor } from '@/interfaces';

dayjs.extend(relativeTime);

type UnifiedRequest =
  | { kind: 'visitor';  data: IVisitor.VisitorRequest }
  | { kind: 'checkout'; data: StudentCheckoutRequest };

const notificationIcon = (type: INotification['notification_type']) => {
  switch (type) {
    case 'error':   return { Icon: AlertCircle, iconColor: 'text-red-500',    bgColor: 'bg-red-50'    };
    case 'warning': return { Icon: AlertCircle, iconColor: 'text-yellow-500', bgColor: 'bg-yellow-50' };
    case 'success': return { Icon: CheckCircle, iconColor: 'text-green-500',  bgColor: 'bg-green-50'  };
    default:        return { Icon: Info,         iconColor: 'text-blue-500',   bgColor: 'bg-blue-50'   };
  }
};

const visitorStatusColor: Record<string, string> = {
  pending:    'orange',
  approved:   'blue',
  checked_in: 'green',
  completed:  'green',
  rejected:   'red',
  cancelled:  'default',
};

const checkoutStatusColor: Record<string, string> = {
  approved: 'blue',
  inspected: 'orange',
};

const DashboardPage = () => {
  const navigate = useNavigate();

  const [pendingCount, setPendingCount]     = useState<number | null>(null);
  const [activeCount, setActiveCount]       = useState<number | null>(null);
  const [checkoutCount, setCheckoutCount]   = useState<number | null>(null);
  const [requests, setRequests]             = useState<UnifiedRequest[]>([]);
  const [notifications, setNotifications]   = useState<INotification[]>([]);

  const loadAll = useCallback(async () => {
    try {
      const [visitorRes, activeRes, checkoutRes, notiRes] = await Promise.allSettled([
        getAllVisitorRequests({ status: 'pending', limit: 10 }),
        getActiveVisitors(),
        getApprovedCheckoutRequests(),
        getMyNotifications(),
      ]);

      const unified: UnifiedRequest[] = [];

      if (visitorRes.status === 'fulfilled') {
        const res = visitorRes.value;
        const items = Array.isArray(res?.data) ? res.data : [];
        items.slice(0, 5).forEach((r) => unified.push({ kind: 'visitor', data: r }));
        setPendingCount(res?.total ?? items.length);
      }
      if (activeRes.status === 'fulfilled') {
        setActiveCount(Array.isArray(activeRes.value) ? activeRes.value.length : 0);
      }
      if (checkoutRes.status === 'fulfilled') {
        const res = checkoutRes.value;
        const items = Array.isArray(res?.data) ? res.data : [];
        items.slice(0, 5).forEach((r) => unified.push({ kind: 'checkout', data: r }));
        setCheckoutCount(res?.total ?? items.length);
      }
      if (notiRes.status === 'fulfilled') {
        setNotifications(Array.isArray(notiRes.value) ? (notiRes.value as INotification[]).slice(0, 8) : []);
      }

      setRequests(unified);
    } catch {
      // silently fail — individual errors handled via allSettled
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Real-time socket updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewVisitor = (req: IVisitor.VisitorRequest) => {
      setRequests((prev) =>
        prev.find((r) => r.kind === 'visitor' && r.data.id === req.id)
          ? prev
          : [{ kind: 'visitor', data: req }, ...prev]
      );
      setPendingCount((prev) => (prev ?? 0) + 1);
    };

    const handleCheckoutApproved = (req: StudentCheckoutRequest) => {
      setRequests((prev) =>
        prev.find((r) => r.kind === 'checkout' && r.data.id === req.id)
          ? prev
          : [...prev, { kind: 'checkout', data: req }]
      );
      setCheckoutCount((prev) => (prev ?? 0) + 1);
    };

    socket.on('new_visitor_request', handleNewVisitor);
    socket.on('checkout_approved', handleCheckoutApproved);
    return () => {
      socket.off('new_visitor_request', handleNewVisitor);
      socket.off('checkout_approved', handleCheckoutApproved);
    };
  }, []);

  const totalRequests = (pendingCount ?? 0) + (checkoutCount ?? 0);

  const summaryCards = [
    {
      title: 'Pending Requests',
      value: pendingCount === null ? '—' : String(pendingCount),
      detail: 'Visitor requests',
      icon: FileText,
      bgColor: 'bg-orange-50',
      iconBg: 'bg-[#F36F21]',
    },
    {
      title: 'Visitors in Dorm',
      value: activeCount === null ? '—' : String(activeCount),
      detail: 'Currently checked in',
      icon: UsersIcon,
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-500',
    },
    {
      title: 'Checkout Requests',
      value: checkoutCount === null ? '—' : String(checkoutCount),
      detail: 'Pending inspection',
      icon: Clock,
      bgColor: 'bg-orange-50',
      iconBg: 'bg-orange-400',
    },
    {
      title: 'Active Cameras',
      value: '24/24',
      detail: '✓ Normal',
      icon: Video,
      bgColor: 'bg-green-50',
      iconBg: 'bg-green-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={cn('bg-white rounded-xl p-6 shadow-sm border border-gray-100', card.bgColor)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{card.value}</p>
                  <p className="text-xs text-gray-500">{card.detail}</p>
                </div>
                <div className={cn('p-3 rounded-lg', card.iconBg)}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Requests Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Requests</h2>
            {totalRequests > 0 && <Badge count={totalRequests} color="orange" />}
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto">
            {requests.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No pending requests.</p>
            ) : (
              requests.map((item, idx) => {
                if (item.kind === 'visitor') {
                  const req = item.data;
                  return (
                    <div
                      key={`v-${req.id ?? idx}`}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                    >
                      {/* Type badge */}
                      <div className="w-9 h-9 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-yellow-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-xs font-semibold text-[#F36F21] bg-orange-50 px-1.5 py-0.5 rounded">
                            Visitor
                          </span>
                          <span className="font-medium text-gray-900 text-sm truncate">
                            {req.visitors?.[0]?.full_name || '—'}
                            {(req.visitors?.length ?? 0) > 1 ? ` +${req.visitors.length - 1}` : ''}
                          </span>
                          <Tag color={visitorStatusColor[req.status] || 'default'} className="text-xs">
                            {req.status}
                          </Tag>
                        </div>
                        <p className="text-xs text-gray-500">
                          {req.student?.full_name || req.user?.fullname || '—'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {req.createdAt ? dayjs(req.createdAt).format('DD/MM/YYYY HH:mm') : ''}
                        </p>
                      </div>

                      <button
                        onClick={() => navigate('/security/visitors')}
                        className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 flex-shrink-0"
                      >
                        Detail <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                }

                // checkout
                const req = item.data;
                return (
                  <div
                    key={`c-${req.id ?? idx}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-blue-100 hover:shadow-sm transition-shadow"
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <LogOut className="w-4 h-4 text-blue-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          Checkout
                        </span>
                        <span className="font-medium text-gray-900 text-sm truncate">
                          {req.student?.full_name || '—'}
                        </span>
                        <Tag color={checkoutStatusColor[req.status] || 'default'} className="text-xs">
                          {req.status}
                        </Tag>
                      </div>
                      <p className="text-xs text-gray-500">
                        {req.request_code}
                        {req.room ? ` · Room ${(req.room as any).room_number || ''}` : ''}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Expected: {req.expected_checkout_date
                          ? dayjs(req.expected_checkout_date).format('DD/MM/YYYY')
                          : '—'}
                      </p>
                    </div>

                    <button
                      onClick={() => navigate('/security/checkout-requests')}
                      className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 flex-shrink-0"
                    >
                      Detail <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Security Notifications Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-bold text-gray-900">Security Notifications</h2>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No notifications.</p>
            ) : (
              notifications.map((noti) => {
                const { Icon, iconColor, bgColor } = notificationIcon(noti.notification_type);
                return (
                  <div
                    key={noti.id}
                    className={cn(
                      'p-3 rounded-lg border border-transparent',
                      bgColor,
                      !noti.is_read && 'ring-1 ring-inset ring-blue-200'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', iconColor)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{noti.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{noti.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{dayjs(noti.created_at).fromNow()}</p>
                      </div>
                      {!noti.is_read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
