import { useCallback, useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  LogIn,
  LogOut,
  Users,
  Hand,
  Download,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { DatePicker, Select, message } from 'antd';
import dayjs from 'dayjs';
import { cn } from '@/utils';
import {
  getAccessLogs,
  getReportStats,
  exportAccessLogs,
} from '@/lib/actions/accessLog';
import type { IFaceRecognition } from '@/interfaces';

const { RangePicker } = DatePicker;

const PAGE_SIZE_OPTIONS = [50, 70, 100];

const SecurityReportsPage = () => {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [methodFilter, setMethodFilter] = useState<string | undefined>();
  const [exportRange, setExportRange] = useState<[string, string] | null>(null);
  const [pageSize, setPageSize] = useState(50);

  const [stats, setStats] = useState<IFaceRecognition.ReportStats>({
    totalCheckIns: 0,
    totalCheckOuts: 0,
    currentlyInside: 0,
    manualOverrides: 0,
  });
  const [logs, setLogs] = useState<IFaceRecognition.AccessLog[]>([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const [statsData, logsData] = await Promise.all([
          getReportStats(date),
          getAccessLogs({
            page,
            limit: pageSize,
            type: typeFilter,
            method: methodFilter,
            date,
          }),
        ]);
        if (statsData) setStats(statsData);
        if (logsData) {
          setLogs(logsData.logs || []);
          setPagination({
            page: logsData.pagination?.page || 1,
            total: logsData.pagination?.total || 0,
            totalPages: logsData.pagination?.totalPages || 0,
          });
        }
      } catch {
        message.error('Failed to load report data');
      } finally {
        setLoading(false);
      }
    },
    [date, typeFilter, methodFilter, pageSize],
  );

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const startDate = exportRange ? exportRange[0] : date;
      const endDate = exportRange ? exportRange[1] : date;
      await exportAccessLogs({
        startDate,
        endDate,
        type: typeFilter,
        method: methodFilter,
      });
      message.success('Report downloaded');
    } catch {
      message.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    loadData(newPage);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="w-6 h-6 text-[#FF5C00]" />
        <h1 className="text-2xl font-bold text-gray-900">Daily Reports</h1>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
            <DatePicker
              value={dayjs(date)}
              onChange={(d) => d && setDate(d.format('YYYY-MM-DD'))}
              allowClear={false}
              className="w-40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
            <Select
              value={typeFilter || 'all'}
              onChange={(v) => setTypeFilter(v === 'all' ? undefined : v)}
              className="w-36"
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'check_in', label: 'Check In' },
                { value: 'check_out', label: 'Check Out' },
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Method</label>
            <Select
              value={methodFilter || 'all'}
              onChange={(v) => setMethodFilter(v === 'all' ? undefined : v)}
              className="w-44"
              options={[
                { value: 'all', label: 'All Methods' },
                { value: 'face_recognition', label: 'Face Recognition' },
                { value: 'manual', label: 'Manual' },
              ]}
            />
          </div>
          <div className="ml-auto flex items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Export Range
              </label>
              <RangePicker
                value={
                  exportRange
                    ? [dayjs(exportRange[0]), dayjs(exportRange[1])]
                    : null
                }
                onChange={(dates) => {
                  if (dates && dates[0] && dates[1]) {
                    setExportRange([
                      dates[0].format('YYYY-MM-DD'),
                      dates[1].format('YYYY-MM-DD'),
                    ]);
                  } else {
                    setExportRange(null);
                  }
                }}
                placeholder={['Start', 'End']}
                className="w-56"
              />
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-[#FF5C00] text-white rounded-lg text-sm font-medium hover:bg-[#e65300] transition-colors disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl p-6 border-2 bg-green-50 border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <LogIn className="w-5 h-5 text-green-600" />
            <p className="text-3xl font-bold text-green-600">{stats.totalCheckIns}</p>
          </div>
          <p className="text-sm text-gray-600">Check-ins</p>
        </div>
        <div className="rounded-xl p-6 border-2 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <LogOut className="w-5 h-5 text-blue-600" />
            <p className="text-3xl font-bold text-blue-600">{stats.totalCheckOuts}</p>
          </div>
          <p className="text-sm text-gray-600">Check-outs</p>
        </div>
        <div className="rounded-xl p-6 border-2 bg-orange-50 border-orange-200">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-orange-600" />
            <p className="text-3xl font-bold text-orange-600">{stats.currentlyInside}</p>
          </div>
          <p className="text-sm text-gray-600">Currently Inside</p>
        </div>
        <div className="rounded-xl p-6 border-2 bg-purple-50 border-purple-200">
          <div className="flex items-center gap-2 mb-1">
            <Hand className="w-5 h-5 text-purple-600" />
            <p className="text-3xl font-bold text-purple-600">{stats.manualOverrides}</p>
          </div>
          <p className="text-sm text-gray-600">Manual Overrides</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">Access Logs</h2>
            <button
              onClick={() => loadData(pagination.page)}
              disabled={loading}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-40"
              title="Reload"
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={pageSize}
              onChange={(v) => setPageSize(v)}
              className="w-28"
              options={PAGE_SIZE_OPTIONS.map((s) => ({
                value: s,
                label: `${s} / page`,
              }))}
            />
            <span className="text-sm text-gray-500">
              {pagination.total} record{pagination.total !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-gray-500">Time</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">Snapshot</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">Code / ID</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">Method</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">Confidence</th>
                <th className="text-left py-3 px-2 font-medium text-gray-500">Camera</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    No records found for this date
                  </td>
                </tr>
              ) : (
                logs.map((log, i) => (
                  <tr
                    key={log.id || i}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-3 px-2">
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2 px-2">
                      {log.face_snapshot_url ? (
                        <a href={log.face_snapshot_url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={log.face_snapshot_url}
                            alt="snapshot"
                            className="w-12 h-9 object-cover rounded border border-gray-200 hover:opacity-80 transition-opacity"
                          />
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs">{'\u2014'}</span>
                      )}
                    </td>
                    <td className="py-3 px-2 font-medium">
                      {log.student?.full_name || log.visitor_name || 'Unknown'}
                    </td>
                    <td className="py-3 px-2 text-gray-500">
                      {log.student?.student_code || log.id_card || '\u2014'}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          log.type === 'check_in'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700',
                        )}
                      >
                        {log.type === 'check_in' ? 'Check In' : 'Check Out'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          log.method === 'face_recognition'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-orange-100 text-orange-700',
                        )}
                      >
                        {log.method === 'face_recognition' ? 'Face' : 'Manual'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {log.confidence
                        ? `${(log.confidence * 100).toFixed(1)}%`
                        : '\u2014'}
                    </td>
                    <td className="py-3 px-2 text-gray-500">
                      {log.camera_id || '\u2014'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
              const startPage = Math.max(
                1,
                Math.min(pagination.page - 2, pagination.totalPages - 4),
              );
              const page = startPage + i;
              if (page > pagination.totalPages) return null;
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-lg border',
                    page === pagination.page
                      ? 'bg-[#FF5C00] text-white border-[#FF5C00]'
                      : 'border-gray-200 hover:bg-gray-50',
                  )}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityReportsPage;
