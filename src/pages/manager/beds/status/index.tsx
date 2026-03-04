import { useEffect, useState } from 'react';
import { Select, Tag, Alert, Spin, message } from 'antd';
import { Settings2, BedDouble, User } from 'lucide-react';
import {
  fetchDorms,
  fetchBlocks,
  fetchRooms,
  fetchBedsByRoom,
  updateBedStatus,
  type Bed,
  type BedStatus,
  type Dorm,
  type Block,
  type Room,
} from '@/lib/actions/admin';

const STATUS_COLOR: Record<BedStatus, string> = {
  available: '#22c55e',
  occupied: '#3b82f6',
  maintenance: '#f97316',
  reserved: '#a855f7',
};

const STATUS_BG: Record<BedStatus, string> = {
  available: '#f0fdf4',
  occupied: '#eff6ff',
  maintenance: '#fff7ed',
  reserved: '#faf5ff',
};

const STATUS_BORDER: Record<BedStatus, string> = {
  available: '#bbf7d0',
  occupied: '#bfdbfe',
  maintenance: '#fed7aa',
  reserved: '#e9d5ff',
};

const CHANGEABLE: { label: string; value: BedStatus }[] = [
  { label: 'Available', value: 'available' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Reserved', value: 'reserved' },
];

export default function UpdateBedStatusPage() {
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filterDorm, setFilterDorm] = useState<string | undefined>();
  const [filterBlock, setFilterBlock] = useState<string | undefined>();
  const [selectedRoom, setSelectedRoom] = useState<string | undefined>();

  const [beds, setBeds] = useState<Bed[]>([]);
  const [loadingBeds, setLoadingBeds] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchDorms({ page: 1, limit: 100 }).then((r) => setDorms(r.items)).catch(() => {});
  }, []);

  useEffect(() => {
    setFilterBlock(undefined);
    setSelectedRoom(undefined);
    setBeds([]);
    if (filterDorm) {
      fetchBlocks({ dorm: filterDorm, page: 1, limit: 100 }).then((r) => setBlocks(r.items)).catch(() => {});
    } else {
      setBlocks([]);
    }
  }, [filterDorm]);

  useEffect(() => {
    setSelectedRoom(undefined);
    setBeds([]);
    if (filterBlock) {
      fetchRooms({ block: filterBlock, page: 1, limit: 200 }).then((r) => setRooms(r.items)).catch(() => {});
    } else {
      setRooms([]);
    }
  }, [filterBlock]);

  const loadBeds = async (roomId: string) => {
    try {
      setLoadingBeds(true);
      setErrorMsg(null);
      const data = await fetchBedsByRoom(roomId);
      setBeds(data);
    } catch {
      setErrorMsg('Failed to load beds for this room');
    } finally {
      setLoadingBeds(false);
    }
  };

  useEffect(() => {
    if (selectedRoom) loadBeds(selectedRoom);
    else setBeds([]);
  }, [selectedRoom]);

  const handleStatusChange = async (bed: Bed, newStatus: BedStatus) => {
    if (newStatus === bed.status) return;
    try {
      setUpdatingId(bed.id);
      await updateBedStatus(bed.id, newStatus);
      message.success(`Bed #${bed.bed_number} → ${newStatus}`);
      setBeds((prev) => prev.map((b) => b.id === bed.id ? { ...b, status: newStatus } : b));
    } catch (err: any) {
      message.error(err?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const selectedRoomObj = rooms.find((r) => r.id === selectedRoom);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Settings2 size={22} className="text-orange-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">Update Bed Status</h1>
          <p className="text-sm text-gray-500">Select a room to view and update bed statuses</p>
        </div>
      </div>

      {/* Room selector */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Select
            placeholder="Select Dorm"
            allowClear
            value={filterDorm}
            onChange={(v) => setFilterDorm(v)}
            options={dorms.map((d) => ({ label: d.dorm_name, value: d.id }))}
            style={{ minWidth: 160 }}
          />
          <Select
            placeholder="Select Block"
            allowClear
            disabled={!filterDorm}
            value={filterBlock}
            onChange={(v) => setFilterBlock(v)}
            options={blocks.map((b) => ({ label: b.block_name, value: b.id }))}
            style={{ minWidth: 160 }}
          />
          <Select
            placeholder="Select Room *"
            allowClear
            disabled={!filterBlock}
            value={selectedRoom}
            onChange={(v) => setSelectedRoom(v)}
            options={rooms.map((r) => {
              const bn = typeof r.block === 'object' && r.block ? (r.block as any).block_name : '';
              return { label: `${bn}-${r.room_number}`, value: r.id };
            })}
            style={{ minWidth: 180 }}
          />
          {selectedRoomObj && (
            <span className="text-sm text-gray-500">
              {beds.length} beds · {beds.filter((b) => b.status === 'available').length} available
            </span>
          )}
        </div>
      </div>

      {errorMsg && <Alert type="error" message={errorMsg} showIcon className="mb-4" />}

      {/* Bed grid */}
      {!selectedRoom ? (
        <div className="text-center py-16 text-gray-400">
          <BedDouble size={48} className="mx-auto mb-3 opacity-30" />
          <p>Select a room above to manage its beds</p>
        </div>
      ) : loadingBeds ? (
        <div className="text-center py-16"><Spin size="large" /></div>
      ) : beds.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No beds found in this room</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {beds.map((bed) => {
            const isOccupied = bed.status === 'occupied';
            const isUpdating = updatingId === bed.id;
            return (
              <div
                key={bed.id}
                className="rounded-2xl border p-3 flex flex-col gap-2 shadow-sm transition-all"
                style={{
                  background: STATUS_BG[bed.status],
                  borderColor: STATUS_BORDER[bed.status],
                }}
              >
                {/* Bed number */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800 text-sm">#{bed.bed_number}</span>
                  <Tag
                    style={{ color: STATUS_COLOR[bed.status], borderColor: STATUS_BORDER[bed.status], background: 'transparent' }}
                    className="text-xs capitalize m-0"
                  >
                    {bed.status}
                  </Tag>
                </div>

                {/* Occupant */}
                {bed.contract ? (
                  <div className="flex items-start gap-1 text-xs text-gray-600">
                    <User size={12} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium leading-tight">{bed.contract.student.full_name}</div>
                      <div className="text-gray-400">{bed.contract.student.student_code}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">Empty</div>
                )}

                {/* Status changer */}
                {isOccupied ? (
                  <div className="text-xs text-gray-400 italic">Unassign first</div>
                ) : (
                  <Select
                    size="small"
                    value={bed.status}
                    loading={isUpdating}
                    disabled={isUpdating}
                    onChange={(val) => handleStatusChange(bed, val)}
                    options={CHANGEABLE}
                    style={{ width: '100%' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
