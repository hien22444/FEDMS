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
  completeVisitorRequest,
  getActiveVisitors,
  checkinVisitor,
  checkoutVisitor,
} from '@/lib/actions';
import type { IVisitor } from '@/interfaces';

type Tab = 'requests' | 'active';

const VisitorsPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('requests');
  const [requests, setRequests] = useState<IVisitor.VisitorRequest[]>([]);
  const [activeVisitors, setActiveVisitors] = useState<IVisitor.ActiveVisitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

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
    } catch (err: any) {
      alert(err?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectVisitorRequest(id, rejectReason);
      setRejectModal(null);
      setRejectReason('');
      fetchRequests();
    } catch (err: any) {
      alert(err?.message || 'Failed to reject');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeVisitorRequest(id);
      fetchRequests();
      fetchActive();
    } catch (err: any) {
      alert(err?.message || 'Failed to complete');
    }
  };

  const handleCheckin = async (requestId: string, visitorId: string) => {
    try {
      await checkinVisitor(requestId, visitorId);
      fetchRequests();
      fetchActive();
    } catch (err: any) {
      alert(err?.message || 'Failed to check in');
    }
  };

  const handleCheckout = async (checkinId: string) => {
    try {
      await checkoutVisitor(checkinId);
      fetchActive();
      fetchRequests();
    } catch (err: any) {
      alert(err?.message || 'Failed to check out');
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RiGroupLine className="w-6 h-6 text-[#FF5C00]" />
          <h1 className="text-2xl font-bold text-gray-900">Visitor Management</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('requests')}
          className={cn(
            'px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
            activeTab === 'requests'
              ? 'border-[#FF5C00] text-[#FF5C00]'
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
              ? 'border-[#FF5C00] text-[#FF5C00]'
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
                <div className="w-14 h-14 bg-[#FF5C00] rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
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

                  {/* Visitor details for approved requests — show checkin buttons */}
                  {req.status === 'approved' && req.visitors.length > 0 && (
                    <div className="mt-3 border-t pt-3">
                      <p className="text-xs text-gray-500 mb-2">Visitor Check-in:</p>
                      {req.visitors.map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between py-1 text-sm"
                        >
                          <span>
                            {v.full_name} ({v.relationship}) — {v.citizen_id}
                          </span>
                          {v.checkin ? (
                            <span className="text-green-600 text-xs flex items-center gap-1">
                              <RiCheckboxCircleLine /> Checked in
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCheckin(req.id, v.id)}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-600 flex items-center gap-1"
                            >
                              <RiLoginCircleLine />
                              Check In
                            </button>
                          )}
                        </div>
                      ))}
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
                  {req.status === 'approved' && (
                    <button
                      onClick={() => handleComplete(req.id)}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center gap-1"
                    >
                      <RiCheckDoubleLine className="w-4 h-4" />
                      Complete
                    </button>
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
                <div className="w-14 h-14 bg-[#FF5C00] rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {av.visitor ? getInitials(av.visitor.full_name) : 'V'}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {av.visitor?.full_name}
                  </h3>
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
                  onClick={() => handleCheckout(av.id)}
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
