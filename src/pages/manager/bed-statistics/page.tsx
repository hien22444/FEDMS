import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Tag, Tooltip, Spin, Empty, Tabs, Input, Select, DatePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  BedDouble,
  Users,
  CheckCircle2,
  Wrench,
  Download,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  Search,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  fetchBedUsageStats,
  type BedUsageStatsResponse,
  type BedUsageRoomType,
} from '@/lib/actions/admin';
import {
  getAllBookings,
  type BookingRequestItem,
} from '@/lib/actions/booking';

const { RangePicker } = DatePicker;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

interface BedUsageBucket {
  totalBeds: number;
  usedBeds: number;
  freeBeds: number;
  maintenanceBeds: number;
}

const occupancyRate = (b: BedUsageBucket) =>
  b.totalBeds > 0 ? Math.round((b.usedBeds / b.totalBeds) * 100) : 0;

const rateColor = (rate: number) => {
  if (rate >= 90) return '#ef4444'; // red
  if (rate >= 70) return '#f97316'; // orange
  return '#22c55e'; // green
};

const OccupancyBar = ({ bucket }: { bucket: BedUsageBucket }) => {
  const rate = occupancyRate(bucket);
  const color = rateColor(rate);
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${rate}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color }}>
        {rate}%
      </span>
    </div>
  );
};

const exportToCSV = (rows: Record<string, string | number>[], filename: string) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]).join(',');
  const body = rows
    .map((r) =>
      Object.values(r)
        .map((v) => (typeof v === 'string' && v.includes(',') ? `"${v}"` : v))
        .join(',')
    )
    .join('\n');
  const blob = new Blob([`\uFEFF${headers}\n${body}`], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const fmtDate = (d?: string | null) =>
  d ? dayjs(d).format('DD/MM/YYYY') : '—';

// ─────────────────────────────────────────────
// Summary stat card
// ─────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  bg: string;
  iconBg: string;
  iconColor: string;
  sub?: string;
}

const SummaryCard = ({ label, value, icon, bg, iconBg, iconColor, sub }: SummaryCardProps) => (
  <div className={`${bg} rounded-2xl p-5 border flex items-center gap-4 shadow-sm`}>
    <div className={`${iconBg} ${iconColor} p-3 rounded-xl flex-shrink-0`}>{icon}</div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Flat row type for "by dorm + room type" table
// ─────────────────────────────────────────────

interface DormRow {
  key: string;
  dormCode: string;
  dormName: string;
  dormRowSpan: number;
  actionsRowSpan: number;
  roomType: string;
  totalBeds: number;
  usedBeds: number;
  freeBeds: number;
  maintenanceBeds: number;
  isGrandTotal?: boolean;
  isDormTotal?: boolean;
}

const buildDormRows = (data: BedUsageStatsResponse): DormRow[] => {
  const rows: DormRow[] = [];

  data.byDormAndRoomType.forEach((dorm) => {
    const rowCount = dorm.roomTypes.length + 1; // +1 for dorm subtotal

    dorm.roomTypes.forEach((rt, idx) => {
      rows.push({
        key: `${dorm.dormCode}-rt-${idx}`,
        dormCode: dorm.dormCode,
        dormName: dorm.dormName,
        dormRowSpan: idx === 0 ? rowCount : 0,
        actionsRowSpan: idx === 0 ? rowCount : 0,
        roomType: rt.roomType,
        totalBeds: rt.totalBeds,
        usedBeds: rt.usedBeds,
        freeBeds: rt.freeBeds,
        maintenanceBeds: rt.maintenanceBeds,
      });
    });

    // Subtotal row for this dorm
    rows.push({
      key: `${dorm.dormCode}-subtotal`,
      dormCode: dorm.dormCode,
      dormName: dorm.dormName,
      dormRowSpan: 0,
      actionsRowSpan: 0,
      roomType: 'Subtotal',
      totalBeds: dorm.dormTotal.totalBeds,
      usedBeds: dorm.dormTotal.usedBeds,
      freeBeds: dorm.dormTotal.freeBeds,
      maintenanceBeds: dorm.dormTotal.maintenanceBeds,
      isDormTotal: true,
    });
  });

  // Grand total
  const gt = data.grandTotal;
  rows.push({
    key: 'grand-total',
    dormCode: '',
    dormName: 'GRAND TOTAL',
    dormRowSpan: 1,
    actionsRowSpan: 1,
    roomType: '',
    totalBeds: gt.totalBeds,
    usedBeds: gt.usedBeds,
    freeBeds: gt.freeBeds,
    maintenanceBeds: gt.maintenanceBeds,
    isGrandTotal: true,
  });

  return rows;
};

// ─────────────────────────────────────────────
// Bed Usage Management tab
// ─────────────────────────────────────────────

const TERM_OPTIONS = [
  { label: 'Spring', value: 'Spring' },
  { label: 'Summer', value: 'Summer' },
  { label: 'Fall', value: 'Fall' },
];

const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => {
  const y = new Date().getFullYear() - 2 + i;
  return { label: String(y), value: String(y) };
});

function BedUsageManagementTab() {
  const [bookings, setBookings] = useState<BookingRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  // Filter state
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [termFilter, setTermFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const buildSemester = (term: string, year: string) =>
    term && year ? `${term}-${year}` : '';

  const load = useCallback(
    async (p = 1, q = search, term = termFilter, year = yearFilter) => {
      try {
        setLoading(true);
        const params: Parameters<typeof getAllBookings>[0] = { page: p, limit: PAGE_SIZE };
        if (q) params.search = q;
        const sem = buildSemester(term, year);
        if (sem) params.semester = sem;
        const res = await getAllBookings(params);
        setBookings(res.items);
        setTotal(res.pagination.total);
        setPage(p);
      } catch {
        setBookings([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [search, termFilter, yearFilter]
  );

  useEffect(() => {
    load(1, search, termFilter, yearFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, termFilter, yearFilter]);

  const handleSearch = () => {
    setSearch(searchInput);
  };

  const handleClear = () => {
    setSearchInput('');
    setSearch('');
    setTermFilter('');
    setYearFilter('');
    setDateRange(null);
  };

  // Client-side date filter on top of server results
  const filtered = dateRange
    ? bookings.filter((b) => {
        const start = dateRange[0] ? dateRange[0].startOf('day') : null;
        const end = dateRange[1] ? dateRange[1].endOf('day') : null;
        const checkIn = b.start_date ? dayjs(b.start_date) : null;
        if (!checkIn) return true;
        if (start && checkIn.isBefore(start)) return false;
        if (end && checkIn.isAfter(end)) return false;
        return true;
      })
    : bookings;

  const exportManagement = () => {
    const rows = filtered.map((b) => {
      const room = b.room;
      const block = room?.block;
      const dormCode = (block?.dorm as any)?.dorm_code ?? '';
      const blockCode = block?.block_code ?? block?.block_name ?? '';
      const roomLabel = `${dormCode}${blockCode}-${room?.room_number ?? ''}`;
      return {
        'Student ID': b.student?.student_code ?? '—',
        'Student Name': b.student?.full_name ?? '—',
        'Phone': b.student?.phone ?? '—',
        'Room': roomLabel,
        'Bed': b.bed?.bed_number ?? '—',
        'Semester': b.semester ?? '—',
        'Check In Date': fmtDate(b.start_date),
        'Check Out Date': fmtDate(b.checkout_date),
      };
    });
    exportToCSV(rows, `bed-usage-management-${dayjs().format('YYYY-MM-DD')}.csv`);
  };

  const columns: ColumnsType<BookingRequestItem> = [
    {
      title: 'Student ID',
      key: 'student_code',
      width: 130,
      render: (_, r) => (
        <span className="font-mono text-sm text-gray-700">{r.student?.student_code ?? '—'}</span>
      ),
    },
    {
      title: 'Student Name',
      key: 'full_name',
      width: 180,
      render: (_, r) => (
        <span className="font-medium text-gray-800">{r.student?.full_name ?? '—'}</span>
      ),
    },
    {
      title: 'Phone',
      key: 'phone',
      width: 130,
      render: (_, r) => (
        <span className="text-sm text-gray-700">{r.student?.phone ?? '—'}</span>
      ),
    },
    {
      title: 'Room - Bed',
      key: 'room',
      width: 150,
      render: (_, r) => {
        const room = r.room;
        const block = room?.block;
        const dormCode = (block?.dorm as any)?.dorm_code ?? '';
        const blockCode = block?.block_code ?? block?.block_name ?? '';
        const roomLabel = `${dormCode}${blockCode}-${room?.room_number ?? '—'}`;
        const bedNumber = r.bed?.bed_number ?? '—';
        return (
          <div>
            <div className="font-mono text-sm font-medium text-gray-800">{roomLabel}</div>
            <div className="text-xs text-gray-400 mt-0.5">Bed: {bedNumber}</div>
          </div>
        );
      },
    },
    {
      title: 'Semester',
      key: 'semester',
      width: 130,
      render: (_, r) => (
        <span className="text-sm text-gray-700">{r.semester ?? '—'}</span>
      ),
    },
    {
      title: 'Check In Date',
      key: 'start_date',
      width: 120,
      render: (_, r) => <span className="text-sm">{fmtDate(r.start_date)}</span>,
    },
    {
      title: 'Check Out Date',
      key: 'checkout_date',
      width: 130,
      render: (_, r) => (
        <span className="text-sm">{r.checkout_date ? fmtDate(r.checkout_date) : '—'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Filters</p>
        <div className="flex flex-wrap gap-3 items-end">
          <Input
            placeholder="Student name / ID"
            prefix={<Search size={14} className="text-gray-400" />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 220 }}
          />
          <Select
            placeholder="Term"
            value={termFilter || undefined}
            onChange={(v) => setTermFilter(v ?? '')}
            allowClear
            options={TERM_OPTIONS}
            style={{ width: 120 }}
          />
          <Select
            placeholder="Year"
            value={yearFilter || undefined}
            onChange={(v) => setYearFilter(v ?? '')}
            allowClear
            options={YEAR_OPTIONS}
            style={{ width: 100 }}
          />
          <RangePicker
            placeholder={['From date', 'To date']}
            value={dateRange ?? undefined}
            onChange={(val) => setDateRange(val as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
            format="DD/MM/YYYY"
            style={{ width: 240 }}
          />
          <Button
            type="primary"
            icon={<Search size={14} />}
            onClick={handleSearch}
            className="bg-orange-500 border-orange-500 hover:bg-orange-600"
          >
            Search
          </Button>
          <Button icon={<X size={14} />} onClick={handleClear}>
            Clear
          </Button>
          <Button
            icon={<Download size={14} />}
            onClick={exportManagement}
            disabled={filtered.length === 0}
          >
            Export Excel
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            Results: <span className="text-orange-500">{total}</span> records
          </span>
          <Button size="small" icon={<RefreshCw size={13} />} onClick={() => load(1)}>
            Refresh
          </Button>
        </div>
        <Table<BookingRequestItem>
          rowKey="id"
          loading={loading}
          dataSource={filtered}
          columns={columns}
          size="small"
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total,
            showSizeChanger: false,
            showTotal: (t) => `Total ${t} records`,
            onChange: (p) => load(p),
          }}
          locale={{ emptyText: <Empty description="No data" /> }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────

export default function BedStatisticsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<BedUsageStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('statistics');

  const load = () => {
    setLoading(true);
    setError(null);
    fetchBedUsageStats()
      .then(setData)
      .catch((err) => setError(err?.message ?? 'Failed to load statistics'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // ── Export helpers ──────────────────────────
  const exportAll = () => {
    if (!data) return;
    const rows: Record<string, string | number>[] = [];
    data.byDormAndRoomType.forEach((dorm) => {
      dorm.roomTypes.forEach((rt) => {
        rows.push({
          Dorm: dorm.dormName,
          'Room Type': rt.roomType,
          'Total Beds': rt.totalBeds,
          'Used Beds': rt.usedBeds,
          'Free Beds': rt.freeBeds,
          'Maintenance': rt.maintenanceBeds,
          'Occupancy %': occupancyRate(rt),
        });
      });
      rows.push({
        Dorm: `${dorm.dormName} — Subtotal`,
        'Room Type': '',
        'Total Beds': dorm.dormTotal.totalBeds,
        'Used Beds': dorm.dormTotal.usedBeds,
        'Free Beds': dorm.dormTotal.freeBeds,
        'Maintenance': dorm.dormTotal.maintenanceBeds,
        'Occupancy %': occupancyRate(dorm.dormTotal),
      });
    });
    rows.push({
      Dorm: 'GRAND TOTAL',
      'Room Type': '',
      'Total Beds': data.grandTotal.totalBeds,
      'Used Beds': data.grandTotal.usedBeds,
      'Free Beds': data.grandTotal.freeBeds,
      'Maintenance': data.grandTotal.maintenanceBeds,
      'Occupancy %': occupancyRate(data.grandTotal),
    });
    exportToCSV(rows, `bed-usage-all-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportDorm = (dormCode: string, dormName: string) => {
    if (!data) return;
    const dorm = data.byDormAndRoomType.find((d) => d.dormCode === dormCode);
    if (!dorm) return;
    const rows = dorm.roomTypes.map((rt) => ({
      Dorm: dormName,
      'Room Type': rt.roomType,
      'Total Beds': rt.totalBeds,
      'Used Beds': rt.usedBeds,
      'Free Beds': rt.freeBeds,
      'Maintenance': rt.maintenanceBeds,
      'Occupancy %': occupancyRate(rt),
    }));
    exportToCSV(rows, `bed-usage-${dormCode}-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportRoomType = () => {
    if (!data) return;
    const rows = data.byRoomType.map((rt) => ({
      'Room Type': rt.roomType,
      'Total Beds': rt.totalBeds,
      'Used Beds': rt.usedBeds,
      'Free Beds': rt.freeBeds,
      'Maintenance': rt.maintenanceBeds,
      'Occupancy %': occupancyRate(rt),
    }));
    exportToCSV(rows, `bed-usage-by-roomtype-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  // ── Table columns: by dorm + room type ──────

  const dormRows: DormRow[] = data ? buildDormRows(data) : [];

  const dormColumns: ColumnsType<DormRow> = [
    {
      title: 'Dorm Name',
      dataIndex: 'dormName',
      key: 'dormName',
      width: 130,
      onCell: (record) => ({ rowSpan: record.dormRowSpan }),
      render: (name: string, record) =>
        record.isGrandTotal ? null : (
          <span className="font-semibold text-gray-800">{name}</span>
        ),
    },
    {
      title: 'Room Type',
      dataIndex: 'roomType',
      key: 'roomType',
      width: 240,
      render: (rt: string, record) => {
        if (record.isGrandTotal)
          return (
            <span className="font-bold text-orange-700 uppercase tracking-wide text-sm">
              Grand Total
            </span>
          );
        if (record.isDormTotal)
          return (
            <span className="font-semibold text-gray-600 italic text-sm">Subtotal</span>
          );
        return <span className="text-gray-700">{rt}</span>;
      },
    },
    {
      title: 'Total Beds',
      dataIndex: 'totalBeds',
      key: 'totalBeds',
      width: 110,
      align: 'center',
      render: (v: number, record) => (
        <span
          className={`font-bold tabular-nums ${
            record.isGrandTotal
              ? 'text-orange-700 text-base'
              : record.isDormTotal
              ? 'text-gray-700'
              : 'text-gray-800'
          }`}
        >
          {v.toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Used Beds',
      dataIndex: 'usedBeds',
      key: 'usedBeds',
      width: 110,
      align: 'center',
      render: (v: number, record) => (
        <Tag
          color="blue"
          className={`font-semibold tabular-nums ${record.isGrandTotal ? 'text-sm' : ''}`}
        >
          {v.toLocaleString()}
        </Tag>
      ),
    },
    {
      title: 'Free Beds',
      dataIndex: 'freeBeds',
      key: 'freeBeds',
      width: 110,
      align: 'center',
      render: (v: number, record) => (
        <Tag
          color="green"
          className={`font-semibold tabular-nums ${record.isGrandTotal ? 'text-sm' : ''}`}
        >
          {v.toLocaleString()}
        </Tag>
      ),
    },
    {
      title: 'Maintenance',
      dataIndex: 'maintenanceBeds',
      key: 'maintenanceBeds',
      width: 110,
      align: 'center',
      render: (v: number, record) => (
        <Tag
          color="orange"
          className={`font-semibold tabular-nums ${record.isGrandTotal ? 'text-sm' : ''}`}
        >
          {v.toLocaleString()}
        </Tag>
      ),
    },
    {
      title: 'Occupancy',
      key: 'occupancy',
      width: 160,
      render: (_, record) => {
        if (record.isGrandTotal || record.roomType === '') return null;
        return <OccupancyBar bucket={record} />;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      align: 'center',
      onCell: (record) => ({ rowSpan: record.actionsRowSpan }),
      render: (_, record) => {
        if (record.isGrandTotal) return null;
        return (
          <div className="flex flex-col gap-2 items-center">
            <Tooltip title="View beds for this dorm">
              <Button
                size="small"
                icon={<ExternalLink size={13} />}
                onClick={() => navigate(`/manager/beds?dorm=${record.dormCode}`)}
                className="w-full"
              >
                Detail
              </Button>
            </Tooltip>
            <Button
              size="small"
              type="primary"
              icon={<Download size={13} />}
              onClick={() => exportDorm(record.dormCode, record.dormName)}
              className="w-full bg-orange-500 border-orange-500 hover:bg-orange-600"
            >
              Export
            </Button>
          </div>
        );
      },
    },
  ];

  // ── Table columns: by room type ─────────────

  const roomTypeColumns: ColumnsType<BedUsageRoomType> = [
    {
      title: 'Room Type',
      dataIndex: 'roomType',
      key: 'roomType',
      render: (v: string) => <span className="text-gray-700 font-medium">{v}</span>,
    },
    {
      title: 'Total Beds',
      dataIndex: 'totalBeds',
      key: 'totalBeds',
      width: 120,
      align: 'center',
      render: (v: number) => (
        <span className="font-bold text-gray-800 tabular-nums">{v.toLocaleString()}</span>
      ),
    },
    {
      title: 'Used Beds',
      dataIndex: 'usedBeds',
      key: 'usedBeds',
      width: 120,
      align: 'center',
      render: (v: number) => (
        <Tag color="blue" className="font-semibold tabular-nums">
          {v.toLocaleString()}
        </Tag>
      ),
    },
    {
      title: 'Free Beds',
      dataIndex: 'freeBeds',
      key: 'freeBeds',
      width: 120,
      align: 'center',
      render: (v: number) => (
        <Tag color="green" className="font-semibold tabular-nums">
          {v.toLocaleString()}
        </Tag>
      ),
    },
    {
      title: 'Maintenance',
      dataIndex: 'maintenanceBeds',
      key: 'maintenanceBeds',
      width: 120,
      align: 'center',
      render: (v: number) => (
        <Tag color="orange" className="font-semibold tabular-nums">
          {v.toLocaleString()}
        </Tag>
      ),
    },
    {
      title: 'Occupancy',
      key: 'occupancy',
      width: 160,
      render: (_, record) => <OccupancyBar bucket={record} />,
    },
  ];

  // ── Statistics tab content ──────────────────

  const gt = data?.grandTotal;

  const statisticsContent = (
    <div className="space-y-6 pt-4">
      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Beds"
          value={gt?.totalBeds ?? 0}
          sub="All dormitories"
          icon={<BedDouble size={22} />}
          bg="bg-blue-50 border-blue-100"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <SummaryCard
          label="Used Beds"
          value={gt?.usedBeds ?? 0}
          sub={`${gt ? occupancyRate(gt) : 0}% occupancy rate`}
          icon={<Users size={22} />}
          bg="bg-emerald-50 border-emerald-100"
          iconBg="bg-emerald-500"
          iconColor="text-white"
        />
        <SummaryCard
          label="Free Beds"
          value={gt?.freeBeds ?? 0}
          sub="Ready for booking"
          icon={<CheckCircle2 size={22} />}
          bg="bg-amber-50 border-amber-100"
          iconBg="bg-amber-400"
          iconColor="text-white"
        />
        <SummaryCard
          label="Under Maintenance"
          value={gt?.maintenanceBeds ?? 0}
          sub="Temporarily unavailable"
          icon={<Wrench size={22} />}
          bg="bg-rose-50 border-rose-100"
          iconBg="bg-rose-500"
          iconColor="text-white"
        />
      </div>

      {/* ── Occupancy rate overview ── */}
      {gt && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-orange-500" />
            <span className="font-semibold text-gray-700">Overall Occupancy</span>
            <span
              className="ml-auto text-lg font-bold"
              style={{ color: rateColor(occupancyRate(gt)) }}
            >
              {occupancyRate(gt)}%
            </span>
          </div>
          <div className="flex rounded-full h-4 overflow-hidden bg-gray-100 gap-px">
            {gt.usedBeds > 0 && (
              <Tooltip title={`Used: ${gt.usedBeds.toLocaleString()}`}>
                <div
                  className="bg-blue-500 h-full transition-all"
                  style={{ width: `${(gt.usedBeds / gt.totalBeds) * 100}%` }}
                />
              </Tooltip>
            )}
            {gt.freeBeds > 0 && (
              <Tooltip title={`Free: ${gt.freeBeds.toLocaleString()}`}>
                <div
                  className="bg-emerald-400 h-full transition-all"
                  style={{ width: `${(gt.freeBeds / gt.totalBeds) * 100}%` }}
                />
              </Tooltip>
            )}
            {gt.maintenanceBeds > 0 && (
              <Tooltip title={`Maintenance: ${gt.maintenanceBeds.toLocaleString()}`}>
                <div
                  className="bg-orange-400 h-full transition-all"
                  style={{ width: `${(gt.maintenanceBeds / gt.totalBeds) * 100}%` }}
                />
              </Tooltip>
            )}
          </div>
          <div className="flex items-center gap-6 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
              Used ({gt.usedBeds.toLocaleString()})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
              Free ({gt.freeBeds.toLocaleString()})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />
              Maintenance ({gt.maintenanceBeds.toLocaleString()})
            </span>
          </div>
        </div>
      )}

      {/* ── Main table: by Dorm + Room Type ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              Details by Dormitory &amp; Room Type
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Bed status breakdown per dormitory and room category
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spin size="large" />
          </div>
        ) : error ? (
          <div className="py-12 px-6">
            <Empty description={<span className="text-red-500">{error}</span>} />
          </div>
        ) : !data || data.byDormAndRoomType.length === 0 ? (
          <div className="py-12">
            <Empty description="No bed data available" />
          </div>
        ) : (
          <Table<DormRow>
            dataSource={dormRows}
            columns={dormColumns}
            pagination={false}
            size="middle"
            bordered
            rowClassName={(record) => {
              if (record.isGrandTotal)
                return 'bg-orange-50 font-bold [&>td]:!bg-orange-50 [&>td]:!border-orange-200';
              if (record.isDormTotal)
                return 'bg-gray-50 [&>td]:!bg-gray-50';
              return '';
            }}
            scroll={{ x: 900 }}
          />
        )}
      </div>

      {/* ── Summary table: by Room Type ── */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-800">Summary by Room Type</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Aggregated totals across all dormitories
            </p>
          </div>
          <Button
            size="small"
            icon={<Download size={13} />}
            onClick={exportRoomType}
            disabled={!data}
          >
            Export
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Spin />
          </div>
        ) : (
          <Table<BedUsageRoomType>
            dataSource={(data?.byRoomType ?? []).map((r, i) => ({ ...r, key: i }))}
            columns={roomTypeColumns}
            pagination={false}
            size="middle"
            bordered
            scroll={{ x: 700 }}
            summary={() =>
              data ? (
                <Table.Summary.Row className="bg-orange-50 font-bold">
                  <Table.Summary.Cell index={0} className="font-bold text-orange-700">
                    Grand Total
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} className="text-center font-bold">
                    {data.grandTotal.totalBeds.toLocaleString()}
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} className="text-center">
                    <Tag color="blue" className="font-bold">
                      {data.grandTotal.usedBeds.toLocaleString()}
                    </Tag>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} className="text-center">
                    <Tag color="green" className="font-bold">
                      {data.grandTotal.freeBeds.toLocaleString()}
                    </Tag>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} className="text-center">
                    <Tag color="orange" className="font-bold">
                      {data.grandTotal.maintenanceBeds.toLocaleString()}
                    </Tag>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>
                    <OccupancyBar bucket={data.grandTotal} />
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              ) : null
            }
          />
        )}
      </div>
    </div>
  );

  // ── Render ──────────────────────────────────

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BedDouble size={26} className="text-orange-500" />
            Bed Usage Statistics
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Real-time occupancy breakdown by dormitory and room type
          </p>
        </div>
        {activeTab === 'statistics' && (
          <div className="flex items-center gap-2">
            <Button
              icon={<RefreshCw size={15} />}
              onClick={load}
              loading={loading}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<Download size={15} />}
              onClick={exportAll}
              disabled={!data}
              className="bg-orange-500 border-orange-500 hover:bg-orange-600"
            >
              Export All
            </Button>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'statistics',
            label: 'Bed Usage Statistics',
            children: statisticsContent,
          },
          {
            key: 'management',
            label: 'Bed Usage Management',
            children: <BedUsageManagementTab />,
          },
        ]}
      />
    </div>
  );
}
