import { useEffect, useState } from 'react';
import { Table, Tag, Select, Button, Alert, Modal, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { BedDouble } from 'lucide-react';
import {
  fetchBeds,
  fetchDorms,
  fetchBlocks,
  fetchRooms,
  updateBedStatus,
  type Bed,
  type BedStatus,
  type Dorm,
  type Block,
  type Room,
} from '@/lib/actions/admin';
import { brandPalette } from '@/themes/brandPalette';

const BED_STATUS_COLOR: Record<BedStatus, string> = {
  available: 'green',
  occupied: 'blue',
  maintenance: 'orange',
  reserved: 'purple',
};

const GENDER_COLOR: Record<string, string> = {
  male: 'blue',
  female: 'pink',
  mixed: 'purple',
};

const STUDENT_TYPE_COLOR: Record<string, string> = {
  vietnamese: 'cyan',
  international: 'gold',
};

const BED_STATUS_OPTIONS: { label: string; value: BedStatus }[] = [
  { label: 'Available', value: 'available' },
  { label: 'Occupied', value: 'occupied' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Reserved', value: 'reserved' },
];


export default function ManagerBedsPage() {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ bed: Bed; newStatus: BedStatus } | null>(null);

  // Filter state
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filterDorm, setFilterDorm] = useState<string | undefined>();
  const [filterBlock, setFilterBlock] = useState<string | undefined>();
  const [filterRoom, setFilterRoom] = useState<string | undefined>();
  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => {
    fetchDorms({ page: 1, limit: 100 }).then((r) => setDorms(r.items)).catch(() => {});
  }, []);

  useEffect(() => {
    setFilterBlock(undefined);
    setFilterRoom(undefined);
    if (filterDorm) {
      fetchBlocks({ dorm: filterDorm, page: 1, limit: 100 }).then((r) => setBlocks(r.items)).catch(() => {});
    } else {
      setBlocks([]);
    }
  }, [filterDorm]);

  useEffect(() => {
    setFilterRoom(undefined);
    if (filterBlock) {
      fetchRooms({ block: filterBlock, page: 1, limit: 200 }).then((r) => setRooms(r.items)).catch(() => {});
    } else {
      setRooms([]);
    }
  }, [filterBlock]);

  const loadBeds = async (p = page) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const params: Record<string, string | number> = { page: p, limit: PAGE_SIZE };
      if (filterRoom) params.room = filterRoom;
      else if (filterBlock) params.block = filterBlock;
      else if (filterDorm) params.dorm = filterDorm;
      if (filterStatus) params.status = filterStatus;

      const res = await fetchBeds(params);
      setBeds(res.items);
      setTotal(res.pagination.total);
    } catch {
      setErrorMsg('Failed to load beds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setPage(1); loadBeds(1); }, [filterDorm, filterBlock, filterRoom, filterStatus]);

  const handleStatusToggle = (bed: Bed, newStatus: BedStatus) => {
    setConfirmTarget({ bed, newStatus });
  };

  const handleConfirmOk = async () => {
    if (!confirmTarget) return;
    const { bed, newStatus } = confirmTarget;
    try {
      setUpdatingId(bed.id);
      setConfirmTarget(null);
      await updateBedStatus(bed.id, newStatus);
      message.success(`Bed #${bed.bed_id} → ${newStatus}`);
      loadBeds();
    } catch (err: any) {
      message.error(err?.message || 'Failed to update bed status');
    } finally {
      setUpdatingId(null);
    }
  };

  const columns: ColumnsType<Bed> = [
    {
      title: 'ID',
      dataIndex: 'bed_id',
      key: 'bed_id',
      width: 70,
      render: (v: number) => (
        <span className="font-mono text-xs text-gray-500">#{v}</span>
      ),
    },
    {
      title: 'Room',
      key: 'room',
      width: 110,
      render: (_, r) => (
        <span className="font-mono text-xs">
          {r.room?.block?.block_name}-{r.room?.room_number}
        </span>
      ),
    },
    {
      title: 'Bed',
      key: 'bed',
      width: 70,
      render: (_, r) => <span className="font-mono font-semibold">{r.bed_number}</span>,
    },
    {
      title: 'Student Type',
      key: 'student_type',
      width: 130,
      render: (_, r) => {
        const t = r.room?.student_type || '';
        return <Tag color={STUDENT_TYPE_COLOR[t] ?? 'default'} className="capitalize">{t || '-'}</Tag>;
      },
    },
    {
      title: 'Gender',
      key: 'gender',
      width: 100,
      render: (_, r) => {
        const g = r.room?.block?.gender_type || '';
        return <Tag color={GENDER_COLOR[g] ?? 'default'} className="capitalize">{g || '-'}</Tag>;
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, r) => (
        <Tag color={BED_STATUS_COLOR[r.status]} className="capitalize">{r.status}</Tag>
      ),
    },
    {
      title: 'Update Status',
      key: 'actions',
      width: 140,
      render: (_, r) => {
        if (r.status === 'occupied' || r.status === 'reserved') {
          return <span className="text-xs text-gray-400">Unassign first</span>;
        }
        const isUpdating = updatingId === r.id;
        if (r.status === 'available') {
          return (
            <Button
              size="small"
              loading={isUpdating}
              onClick={() => handleStatusToggle(r, 'maintenance')}
              style={{ borderColor: brandPalette.primary, color: brandPalette.primary }}
            >
              Set Maintenance
            </Button>
          );
        }
        return (
          <Button
            size="small"
            loading={isUpdating}
            onClick={() => handleStatusToggle(r, 'available')}
            style={{ borderColor: '#22c55e', color: '#22c55e' }}
          >
            Set Available
          </Button>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <BedDouble size={22} className="text-orange-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Bed Management</h1>
          <p className="text-sm text-gray-500">View and manage all beds across dormitories</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-4">
        <div className="flex flex-wrap gap-3">
          <Select
            placeholder="All Dorms"
            allowClear
            value={filterDorm}
            onChange={(v) => setFilterDorm(v)}
            options={dorms.map((d) => ({ label: d.dorm_name, value: d.id }))}
            style={{ minWidth: 160 }}
          />
          <Select
            placeholder="All Blocks"
            allowClear
            disabled={!filterDorm}
            value={filterBlock}
            onChange={(v) => setFilterBlock(v)}
            options={blocks.map((b) => ({ label: b.block_name, value: b.id }))}
            style={{ minWidth: 160 }}
          />
          <Select
            placeholder="All Rooms"
            allowClear
            disabled={!filterBlock}
            value={filterRoom}
            onChange={(v) => setFilterRoom(v)}
            options={rooms.map((r) => ({
              label: `${r.block && typeof r.block === 'object' ? (r.block as any).block_name : ''}-${r.room_number}`,
              value: r.id,
            }))}
            style={{ minWidth: 160 }}
          />
          <Select
            placeholder="All Statuses"
            allowClear
            value={filterStatus}
            onChange={(v) => setFilterStatus(v)}
            options={BED_STATUS_OPTIONS}
            style={{ minWidth: 150 }}
          />
          <Button onClick={() => loadBeds()}>Refresh</Button>
        </div>
      </div>

      {errorMsg && <Alert type="error" message={errorMsg} showIcon className="mb-4" />}

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {BED_STATUS_OPTIONS.map((opt) => {
          const count = beds.filter((b) => b.status === opt.value).length;
          return (
            <div key={opt.value} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm text-center">
              <Tag color={BED_STATUS_COLOR[opt.value]} className="mb-1">{opt.label}</Tag>
              <div className="text-2xl font-bold text-gray-800">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <Table<Bed>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={beds}
          size="small"
          pagination={{
            current: page,
            pageSize: PAGE_SIZE,
            total,
            showSizeChanger: false,
            showTotal: (t) => `Total ${t} beds`,
            onChange: (p) => { setPage(p); loadBeds(p); },
          }}
          scroll={{ x: 800 }}
          locale={{ emptyText: 'No beds found. Select a filter above or add beds via Room Management.' }}
        />
      </div>

      {/* Confirm status change modal */}
      <Modal
        open={!!confirmTarget}
        title="Confirm Status Change"
        okText="Confirm"
        cancelText="Cancel"
        centered
        confirmLoading={!!updatingId}
        onOk={handleConfirmOk}
        onCancel={() => setConfirmTarget(null)}
      >
        {confirmTarget && (
          <p className="text-sm mt-1">
            Change Bed <strong>#{confirmTarget.bed.bed_id}</strong>{' '}
            (Room {confirmTarget.bed.room?.block?.block_name}-{confirmTarget.bed.room?.room_number}) from{' '}
            <strong>{confirmTarget.bed.status}</strong> → <strong>{confirmTarget.newStatus}</strong>?
          </p>
        )}
      </Modal>
    </div>
  );
}
