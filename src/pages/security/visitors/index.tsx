import { useState, useEffect, useCallback } from 'react';
import {
  RiGroupLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiTimeLine,
  RiCheckDoubleLine,
  RiFileListLine,
  RiLoginCircleLine,
  RiLogoutCircleLine,
} from 'react-icons/ri';
import { cn } from '@/utils';
import {
  getAllVisitorRequests,
  approveVisitorRequest,
  rejectVisitorRequest,
  getActiveVisitors,
  checkinVisitor,
  checkoutVisitor,
} from '@/lib/actions';
import type { IVisitor } from '@/interfaces';

type Tab = 'requests' | 'active';
type NoticeType = 'warning' | 'error' | 'success';

const VisitorsPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('requests');
  const [requests, setRequests] = useState<IVisitor.VisitorRequest[]>([]);
  const [activeVisitors, setActiveVisitors] = useState<IVisitor.ActiveVisitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [checkoutModal, setCheckoutModal] = useState<{
    checkinId: string;
    visitorName: string;
  } | null>(null);
  const [notice, setNotice] = useState<{ type: NoticeType; message: string } | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllVisitorRequests();
      setRequests(res.data || []);
    } catch {
      // API may not be ready
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActive = useCallback(async () => {
    try {
      const data = await getActiveVisitors();
      setActiveVisitors(data || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    fetchActive();
  }, [fetchRequests, fetchActive]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const activeCount = activeVisitors.length;

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const handleApprove = async (id: string) => {
    try {
      await approveVisitorRequest(id);
      fetchRequests();
      setNotice({ type: 'success', message: 'Visitor request approved.' });
    } catch (err: any) {
      setNotice({ type: 'error', message: err?.message || 'Failed to approve.' });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectVisitorRequest(id, rejectReason);
      setRejectModal(null);
      setRejectReason('');
      fetchRequests();
      setNotice({ type: 'success', message: 'Visitor request rejected.' });
    } catch (err: any) {
      setNotice({ type: 'error', message: err?.message || 'Failed to reject.' });
    }
  };

  const handleCheckin = async (requestId: string, visitorId: string, timeFrom: string, timeTo: string) => {
    const now = new Date();
    const [fh, fm] = timeFrom.split(':').map(Number);
    const [th, tm] = timeTo.split(':').map(Number);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (nowMin < fh * 60 + fm || nowMin > th * 60 + tm) {
      setNotice({
        type: 'warning',
        message: `Check-in is only allowed between ${timeFrom} and ${timeTo}.`,
      });
      return;
    }
    try {
      await checkinVisitor(requestId, visitorId);
      fetchRequests();
      fetchActive();
      setNotice({ type: 'success', message: 'Visitor checked in successfully.' });
    } catch (err: any) {
      setNotice({ type: 'error', message: err?.message || 'Failed to check in.' });
    }
  };

  const confirmCheckout = async () => {
    if (!checkoutModal) return;
    try {
      await checkoutVisitor(checkoutModal.checkinId);
      setCheckoutModal(null);
      fetchActive();
      fetchRequests();
      setNotice({
        type: 'success',
        message: 'Visitor checked out successfully. The request is completed when no active visitors remain.',
      });
    } catch (err: any) {
      setNotice({ type: 'error', message: err?.message || 'Failed to check out.' });
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB');
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const isVisitDateToday = (dateStr: string) => {
    const visitDate = new Date(dateStr);
    const today = new Date();
    return (
      visitDate.getFullYear() === today.getFullYear() &&
      visitDate.getMonth() === today.getMonth() &&
      visitDate.getDate() === today.getDate()
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RiGroupLine className="w-6 h-6 text-[#F36F21]" />
          <h1 className="text-2xl font-bold text-gray-900">Visitor Management</h1>
        </div>
      </div>

      {notice && (
        <div className="fixed inset-x-0 top-20 z-50 flex justify-center px-4 pointer-events-none">
          <div
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-lg backdrop-blur-sm',
              notice.type === 'warning' && 'border-amber-200 bg-white/95 text-amber-800',
              notice.type === 'error' && 'border-red-200 bg-white/95 text-red-700',
              notice.type === 'success' && 'border-emerald-200 bg-white/95 text-emerald-700'
            )}
          >
            <div
              className={cn(
                'mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                notice.type === 'warning' && 'bg-amber-100 text-amber-700',
                notice.type === 'error' && 'bg-red-100 text-red-600',
                notice.type === 'success' && 'bg-emerald-100 text-emerald-600'
              )}
            >
              <RiTimeLine className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {notice.type === 'warning' && 'Check-in Warning'}
                {notice.type === 'error' && 'Action Failed'}
                {notice.type === 'success' && 'Success'}
              </p>
              <p className="mt-1 leading-5">{notice.message}</p>
            </div>
            <button
              onClick={() => setNotice(null)}
              className="text-current/70 hover:text-current transition-colors"
              aria-label="Dismiss notice"
            >
              <RiCloseCircleLine className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('requests')}
          className={cn(
            'px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
            activeTab === 'requests'
              ? 'border-[#F36F21] text-[#F36F21]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <RiFileListLine className="w-4 h-4" />
          Visitor Requests
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={cn(
            'px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
            activeTab === 'active'
              ? 'border-[#F36F21] text-[#F36F21]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <RiGroupLine className="w-4 h-4" />
          Active Visitors
          {activeCount > 0 && (
            <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      )}

      {/* ─── Tab: Visitor Requests ─── */}
      {!loading && activeTab === 'requests' && (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className={cn(
                'rounded-xl p-6 border-2 transition-shadow',
                req.status === 'pending' && 'bg-yellow-50 border-yellow-200',
                req.status === 'approved' && 'bg-green-50 border-green-200',
                req.status === 'rejected' && 'bg-red-50 border-red-200',
                req.status === 'completed' && 'bg-blue-50 border-blue-200',
                req.status === 'cancelled' && 'bg-gray-50 border-gray-200'
              )}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-[#F36F21] rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {req.visitors[0]
                    ? getInitials(req.visitors[0].full_name)
                    : 'VR'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {req.visitors.map((v) => v.full_name).join(', ') || 'No visitors'}
                    </h3>
                    <span
                      className={cn(
                        'text-xs px-2 py-1 rounded-full font-medium',
                        req.status === 'pending' && 'bg-yellow-200 text-yellow-800',
                        req.status === 'approved' && 'bg-green-200 text-green-800',
                        req.status === 'rejected' && 'bg-red-200 text-red-800',
                        req.status === 'completed' && 'bg-blue-200 text-blue-800',
                        req.status === 'cancelled' && 'bg-gray-200 text-gray-600'
                      )}
                    >
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Student:{' '}
                    <span className="font-medium">
                      {req.student?.full_name || req.user?.fullname || req.user?.email}
                    </span>
                    {req.student?.student_code && ` (${req.student.student_code})`}
                    {' — '}Code: {req.request_code}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-2">
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="font-medium">{formatDate(req.visit_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Time</p>
                      <p className="font-medium">
                        {req.visit_time_from} - {req.visit_time_to}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Visitors</p>
                      <p className="font-medium">{req.visitors.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Purpose</p>
                      <p className="font-medium">{req.purpose}</p>
                    </div>
                  </div>

                  {/* Visitor details for pending requests — show before approve/reject */}
                  {req.status === 'pending' && req.visitors.length > 0 && (
                    <div className="mt-3 border-t pt-3">
                      <p className="text-xs text-gray-500 mb-2">Visitors:</p>
                      <div className="space-y-1">
                        {req.visitors.map((v) => (
                          <div
                            key={v.id}
                            className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm py-1 border-b border-gray-100 last:border-0"
                          >
                            <span className="font-medium">{v.full_name}</span>
                            <span className="text-gray-500 capitalize">{v.relationship}</span>
                            <span className="text-gray-600">ID: {v.citizen_id}</span>
                            {v.phone && (
                              <span className="text-gray-500">📞 {v.phone}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Visitor details for approved requests — show checkin buttons */}
                  {req.status === 'approved' && req.visitors.length > 0 && (
                    <div className="mt-3 border-t pt-3">
                      <p className="text-xs text-gray-500 mb-2">Visitor Check-in:</p>
                      {req.visitors.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between py-1.5 text-sm border-b border-gray-100 last:border-0"
                        >
                          <span>
                            {v.full_name} ({v.relationship}) — {v.citizen_id}
                            {v.phone && (
                              <span className="text-gray-400 ml-2">📞 {v.phone}</span>
                            )}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            {v.checkin && !v.checkin.check_out_time ? (
                              <>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <RiTimeLine className="w-3 h-3" />
                                  {formatTime(v.checkin.check_in_time)}
                                </span>
                                <button
                                  onClick={() =>
                                    setCheckoutModal({
                                      checkinId: v.checkin!.id,
                                      visitorName: v.full_name,
                                    })
                                  }
                                  className="bg-red-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-red-600 flex items-center gap-1"
                                >
                                  <RiLogoutCircleLine />
                                  Check Out
                                </button>
                              </>
                            ) : v.checkin ? (
                              <span className="text-gray-400 text-xs flex items-center gap-1">
                                <RiCheckDoubleLine className="w-3 h-3" /> Checked out
                              </span>
                            ) : !isVisitDateToday(req.visit_date) ? (
                              <span className="text-gray-400 text-xs">
                                Check-in available on {formatDate(req.visit_date)}
                              </span>
                            ) : (
                              <button
                                onClick={() => handleCheckin(req.id, v.id, req.visit_time_from, req.visit_time_to)}
                                className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-600 flex items-center gap-1"
                              >
                                <RiLoginCircleLine />
                                Check In
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {req.status === 'completed' && req.visitors.length > 0 && (
                    <div className="mt-3 border-t pt-3">
                      <p className="text-xs text-gray-500 mb-2">Visitor Visit Details:</p>
                      <div className="space-y-2">
                        {req.visitors.map((v) => (
                          <div
                            key={v.id}
                            className="rounded-lg border border-blue-100 bg-white/70 px-3 py-2 text-sm"
                          >
                            <div className="font-medium text-gray-900">{v.full_name}</div>
                            <div className="mt-1 grid grid-cols-1 gap-1 text-gray-600 md:grid-cols-2">
                              <span>
                                Check-in:{' '}
                                <span className="font-medium text-gray-800">
                                  {v.checkin?.check_in_time ? formatTime(v.checkin.check_in_time) : '-'}
                                </span>
                              </span>
                              <span>
                                Check-out:{' '}
                                <span className="font-medium text-gray-800">
                                  {v.checkin?.check_out_time ? formatTime(v.checkin.check_out_time) : '-'}
                                </span>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {req.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 flex items-center gap-1"
                      >
                        <RiCheckboxCircleLine className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectModal(req.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 flex items-center gap-1"
                      >
                        <RiCloseCircleLine className="w-4 h-4" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {requests.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              No visitor requests
            </div>
          )}
        </div>
      )}

      {/* ─── Tab: Active Visitors ─── */}
      {!loading && activeTab === 'active' && (
        <div className="space-y-4">
          {activeVisitors.map((av) => (
            <div
              key={av.id}
              className="rounded-xl p-6 border-2 bg-green-50 border-green-200"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-[#F36F21] rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {av.visitor ? getInitials(av.visitor.full_name) : 'V'}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {av.visitor?.full_name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-1">
                    {av.visitor?.relationship && (
                      <span className="mr-3">{av.visitor.relationship}</span>
                    )}
                    {av.visitor?.phone && <span>📞 {av.visitor.phone}</span>}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Student: {av.student?.full_name || av.request?.user?.fullname}{' '}
                    — {av.request?.request_code}
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <RiTimeLine className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Check-in:</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatTime(av.check_in_time)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RiTimeLine className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Expected out:</p>
                        <p className="text-sm font-medium text-gray-900">
                          {av.request?.visit_time_to || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RiCheckboxCircleLine className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-green-600">Present</span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setCheckoutModal({
                      checkinId: av.id,
                      visitorName: av.visitor?.full_name || 'this visitor',
                    })
                  }
                  className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 whitespace-nowrap flex items-center gap-1"
                >
                  <RiLogoutCircleLine className="w-4 h-4" />
                  Check Out
                </button>
              </div>
            </div>
          ))}

          {activeVisitors.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              No visitors currently in dormitory
            </div>
          )}
        </div>
      )}

      {checkoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="text-lg font-bold text-gray-900">Confirm Visitor Check-out</h3>
            <p className="mt-2 text-sm text-gray-600">
              Check out <span className="font-medium text-gray-900">{checkoutModal.visitorName}</span> now.
              The request will be marked as completed when no active visitors remain.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setCheckoutModal(null)}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmCheckout}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                Confirm Check Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Reject Visitor Request</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)..."
              className="w-full border rounded-lg p-3 mb-4 h-24 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setRejectModal(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(rejectModal)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorsPage;
