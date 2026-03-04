import { useEffect, useMemo, useState } from 'react';
import {
  App,
  Button,
  Table,
  Tag,
  Modal,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Space,
} from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { DoorClosed } from 'lucide-react';
import {
  createRoom,
  deleteRoom,
  fetchRooms,
  updateRoom,
  fetchDorms,
  fetchBlocks,
  fetchRoomTypePricing,
  fetchBedsByRoom,
  type Dorm,
  type Block,
  type Room,
  type RoomStatus,
  type RoomType,
  type Bed,
} from '@/lib/actions/admin';

const fallbackRoomTypeOptions: { label: string; value: RoomType }[] = [
  { label: '2 Person', value: '2_person' },
  { label: '4 Person', value: '4_person' },
  { label: '6 Person', value: '6_person' },
  { label: '8 Person', value: '8_person' },
];

const roomTypeToBeds = (roomType: RoomType): number => {
  const n = parseInt(roomType.split('_')[0], 10);
  return Number.isFinite(n) ? n : 4;
};

const roomStatusOptions: { label: string; value: RoomStatus }[] = [
  { label: 'Available', value: 'available' },
  { label: 'Full', value: 'full' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Inactive', value: 'inactive' },
];

const statusColorMap: Record<RoomStatus, string> = {
  available: 'green',
  full: 'red',
  maintenance: 'orange',
  inactive: 'default',
};

export default function ManagerRoomsPage() {
  const { modal } = App.useApp();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [roomTypePrices, setRoomTypePrices] = useState<Record<RoomType, number> | null>(null);

  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingDorms, setLoadingDorms] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [blockPickerOpen, setBlockPickerOpen] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);

  // Details drawer
  const [detailsRoom, setDetailsRoom] = useState<Room | null>(null);
  const [detailsBeds, setDetailsBeds] = useState<Bed[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Quick status change
  const [confirmStatusTarget, setConfirmStatusTarget] = useState<{
    room: Room;
    newStatus: RoomStatus;
  } | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const [form] = Form.useForm();

  // Filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterRoomType, setFilterRoomType] = useState<RoomType | undefined>(undefined);
  const [filterStudentType, setFilterStudentType] = useState<string | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<RoomStatus | undefined>(undefined);

  const loadDorms = async () => {
    try {
      setLoadingDorms(true);
      const res = await fetchDorms({ page: 1, limit: 200 });
      setDorms(res.items);
    } catch (error: any) {
      console.error(error);
      message.error('Failed to load dorm list');
    } finally {
      setLoadingDorms(false);
    }
  };

  const loadBlocks = async () => {
    try {
      setLoadingBlocks(true);
      const res = await fetchBlocks({ page: 1, limit: 500 });
      setBlocks(res.items);
    } catch (error: any) {
      console.error(error);
      message.error('Failed to load block list');
    } finally {
      setLoadingBlocks(false);
    }
  };

  const loadRooms = async () => {
    try {
      setLoadingRooms(true);
      const params: Record<string, string | number | boolean> = { page: 1, limit: 50 };
      if (filterSearch.trim()) params.search = filterSearch.trim();
      if (filterRoomType) params.room_type = filterRoomType;
      if (filterStudentType) params.student_type = filterStudentType;
      if (filterStatus) params.status = filterStatus;

      const res = await fetchRooms(params);
      const sorted = [...res.items].sort((a, b) => {
        const getBlockName = (r: Room) =>
          typeof r.block === 'object' && r.block !== null ? r.block.block_name : '';
        const aBlock = getBlockName(a);
        const bBlock = getBlockName(b);
        if (aBlock !== bBlock) return aBlock.localeCompare(bBlock);
        return String(a.room_number).localeCompare(String(b.room_number), undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      });
      setRooms(sorted);
    } catch (error: any) {
      console.error(error);
      message.error('Failed to load room list');
    } finally {
      setLoadingRooms(false);
    }
  };

  const loadAllRoomsForCapacity = async () => {
    try {
      const res = await fetchRooms({ page: 1, limit: 1000 });
      setAllRooms(res.items);
    } catch (error: any) {
      console.error(error);
    }
  };

  const loadRoomTypePrices = async () => {
    try {
      const res = await fetchRoomTypePricing();
      setRoomTypePrices(res.prices || null);
    } catch (error: any) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadDorms();
    loadBlocks();
    loadRooms();
    loadAllRoomsForCapacity();
    loadRoomTypePrices();
  }, []);

  const closeMainModal = () => {
    setModalOpen(false);
    // Always reset block picker to avoid z-index stacking issues on subsequent opens
    setBlockPickerOpen(false);
  };

  const openCreateModal = () => {
    setEditingRoom(null);
    setModalOpen(true);
  };

  const openEditModal = (record: Room) => {
    setEditingRoom(record);
    setModalOpen(true);
  };

  const selectedDormId = Form.useWatch('dorm', form) as string | undefined;
  const selectedBlockId = Form.useWatch('block', form) as string | undefined;
  const selectedRoomType = Form.useWatch('room_type', form) as RoomType | undefined;
  const totalBeds = Form.useWatch('total_beds', form) as number | undefined;

  const isRoomTypeChanged = editingRoom != null && selectedRoomType !== editingRoom.room_type;

  const roomTypeOptions = useMemo(() => {
    if (roomTypePrices && Object.keys(roomTypePrices).length > 0) {
      return Object.keys(roomTypePrices)
        .map((rt) => {
          const beds = roomTypeToBeds(rt);
          return { label: `${beds} Person`, value: rt as RoomType };
        })
        .sort((a, b) => roomTypeToBeds(a.value) - roomTypeToBeds(b.value));
    }
    return fallbackRoomTypeOptions;
  }, [roomTypePrices]);

  useEffect(() => {
    if (!modalOpen || !selectedRoomType) return;
    const beds = roomTypeToBeds(selectedRoomType);
    form.setFieldsValue({ total_beds: beds });
    const currentAvailable = form.getFieldValue('available_beds');
    if (currentAvailable == null || Number(currentAvailable) > beds) {
      form.setFieldValue('available_beds', beds);
    }
    const price = roomTypePrices?.[selectedRoomType];
    if (typeof price === 'number') {
      form.setFieldValue('price_per_semester', price);
    }
  }, [modalOpen, selectedRoomType, form, roomTypePrices]);

  const selectedBlock = useMemo(
    () => blocks.find((b) => b.id === selectedBlockId),
    [blocks, selectedBlockId],
  );

  const blocksOfSelectedDorm = useMemo(
    () =>
      selectedDormId
        ? blocks.filter(
            (b) => (typeof b.dorm === 'object' ? b.dorm.id : b.dorm) === selectedDormId,
          )
        : [],
    [blocks, selectedDormId],
  );

  const blockRoomCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allRooms.forEach((r) => {
      const blockId = typeof r.block === 'object' && r.block !== null ? r.block.id : r.block;
      if (!blockId) return;
      counts[blockId] = (counts[blockId] ?? 0) + 1;
    });
    return counts;
  }, [allRooms]);

  const isBlockFull = (block: Block) => {
    const capacity = typeof block.total_rooms === 'number' ? block.total_rooms : undefined;
    if (!capacity || capacity <= 0) return false;
    return (blockRoomCounts[block.id] ?? 0) >= capacity;
  };

  const availableRoomNumbers = useMemo(() => {
    if (!selectedBlockId) return [];
    const block = blocks.find((b) => b.id === selectedBlockId);
    if (!block) return [];

    const capacity =
      typeof block.total_rooms === 'number' && Number.isFinite(block.total_rooms)
        ? block.total_rooms
        : undefined;

    const roomsInBlock = allRooms.filter((r) => {
      const blockId = typeof r.block === 'object' && r.block !== null ? r.block.id : r.block;
      if (blockId !== selectedBlockId) return false;
      if (editingRoom && r.id === editingRoom.id) return false;
      return true;
    });

    let currentRoomNumber: number | undefined;
    let editingSameBlock = false;
    if (editingRoom) {
      const editingBlockId =
        typeof editingRoom.block === 'object' && editingRoom.block !== null
          ? editingRoom.block.id
          : editingRoom.block;
      if (editingBlockId === selectedBlockId) {
        const n = parseInt(String(editingRoom.room_number), 10);
        if (Number.isFinite(n) && n > 0) {
          currentRoomNumber = n;
          editingSameBlock = true;
        }
      }
    }

    if (editingSameBlock && currentRoomNumber) return [currentRoomNumber];

    const usedNumbers = new Set<number>();
    roomsInBlock.forEach((r) => {
      const n = parseInt(String(r.room_number), 10);
      if (Number.isFinite(n) && n > 0) usedNumbers.add(n);
    });

    if (roomsInBlock.length === 0) return [1];

    let next = 1;
    while (usedNumbers.has(next)) next += 1;

    if (capacity && capacity > 0 && next > capacity) return [];
    return [next];
  }, [selectedBlockId, blocks, allRooms, editingRoom]);

  useEffect(() => {
    if (!modalOpen || !selectedBlockId) return;
    const block = blocks.find((b) => b.id === selectedBlockId);
    if (block?.floor != null) form.setFieldValue('floor', block.floor);
  }, [modalOpen, selectedBlockId, blocks, form]);

  useEffect(() => {
    if (!modalOpen) return;
    if (editingRoom) {
      const blockId = typeof editingRoom.block === 'object' ? editingRoom.block.id : editingRoom.block;
      const dormId =
        typeof editingRoom.block === 'object' && typeof editingRoom.block.dorm === 'object'
          ? editingRoom.block.dorm.id
          : undefined;
      form.setFieldsValue({
        dorm: dormId,
        block: blockId,
        room_number: editingRoom.room_number,
        floor: editingRoom.floor,
        room_type: editingRoom.room_type,
        total_beds: editingRoom.total_beds,
        available_beds: editingRoom.available_beds,
        price_per_semester: editingRoom.price_per_semester,
        status: editingRoom.status,
        student_type: editingRoom.student_type ?? 'vietnamese',
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ status: 'available', student_type: 'vietnamese' });
    }
  }, [modalOpen, editingRoom, form]);

  useEffect(() => {
    if (!modalOpen) return;
    if (editingRoom) return; // block is fixed when editing, don't clear it
    if (!selectedDormId) {
      form.setFieldValue('block', undefined);
      return;
    }
    const currentBlockId = form.getFieldValue('block') as string | undefined;
    if (currentBlockId) {
      const inSameDorm = blocks.some(
        (b) =>
          b.id === currentBlockId &&
          (typeof b.dorm === 'object' ? b.dorm.id : b.dorm) === selectedDormId,
      );
      if (!inSameDorm) form.setFieldValue('block', undefined);
    }
  }, [modalOpen, selectedDormId, blocks, form, editingRoom]);

  const openDetails = async (record: Room) => {
    setDetailsRoom(record);
    setDetailsBeds([]);
    setDetailsLoading(true);
    try {
      const beds = await fetchBedsByRoom(record.id);
      setDetailsBeds(beds);
    } catch {
      message.error('Failed to load beds');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDeleteRoom = (record: Room) => {
    setDeletingRoom(record);
    setDeleteModalOpen(true);
  };

  const handleSubmitRoom = async () => {
    try {
      const values = await form.validateFields();
      const payload = { ...values };
      delete payload.dorm;

      if (editingRoom) {
        await updateRoom(editingRoom.id, payload);
        message.success('Room updated successfully');
      } else {
        await createRoom(payload);
        message.success('Room created successfully');
      }
      closeMainModal();
      loadRooms();
      loadAllRoomsForCapacity();
    } catch (error: any) {
      if (error?.errorFields) return;
      const raw = Array.isArray(error?.message) ? error.message.join(', ') : (error?.message || '');
      const errMsg =
        raw.includes('only allows') || raw.includes('Cannot create more rooms')
          ? 'Block has reached its room limit. Cannot create more rooms in this block.'
          : raw.includes('Target block only allows') || raw.includes('Cannot move this room')
            ? 'Target block has reached its room limit. Cannot move this room there.'
            : raw || 'Failed to save room.';
      modal.error({ title: 'Room save error', content: errMsg, okText: 'Close', zIndex: 2000 });
    }
  };

  const handleConfirmStatus = async () => {
    if (!confirmStatusTarget) return;
    const { room, newStatus } = confirmStatusTarget;
    try {
      setUpdatingStatusId(room.id);
      setConfirmStatusTarget(null);
      await updateRoom(room.id, { status: newStatus });
      const roomLabel =
        typeof room.block === 'object' && room.block
          ? `${room.block.block_name}-${room.room_number}`
          : String(room.room_number);
      message.success(`Room "${roomLabel}" → ${newStatus}`);
      loadRooms();
    } catch (err: any) {
      message.error(err?.message || 'Failed to update room status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const columns: ColumnsType<Room> = [
    {
      title: 'Block',
      dataIndex: 'block',
      key: 'block',
      width: 90,
      render: (b: Room['block']) => {
        if (typeof b === 'object' && b !== null) return b.block_name;
        return '-';
      },
    },
    {
      title: 'Room Name',
      key: 'room_name',
      width: 110,
      render: (r: Room) => {
        if (typeof r.block === 'object' && r.block !== null) {
          return (
            <span className="font-mono text-xs">
              {r.block.block_name}-{r.room_number}
            </span>
          );
        }
        return <span className="font-mono text-xs">{r.room_number}</span>;
      },
    },
    {
      title: 'Student Type',
      dataIndex: 'student_type',
      key: 'student_type',
      width: 150,
      render: (type: string) => {
        const label = type === 'international' ? 'International' : 'Vietnamese';
        return <Tag color={type === 'international' ? 'cyan' : 'green'}>{label}</Tag>;
      },
    },
    {
      title: 'Room Type',
      dataIndex: 'room_type',
      key: 'room_type',
      width: 100,
      render: (v: string) => <Tag>{v.replace('_', ' ')}</Tag>,
    },
    {
      title: 'Price/Sem',
      dataIndex: 'price_per_semester',
      key: 'price_per_semester',
      width: 120,
      render: (v: number) => <span className="text-xs">{Number(v).toLocaleString()}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (v: RoomStatus) => <Tag color={statusColorMap[v]}>{v.toUpperCase()}</Tag>,
    },
    {
      title: 'Set Status',
      key: 'set_status',
      width: 155,
      render: (_, record) => {
        const isUpdating = updatingStatusId === record.id;
        if (record.status === 'full') {
          return <span className="text-xs text-gray-400">Auto-managed</span>;
        }
        if (record.status === 'available') {
          return (
            <Button
              size="small"
              loading={isUpdating}
              onClick={() => setConfirmStatusTarget({ room: record, newStatus: 'maintenance' })}
              style={{ borderColor: '#f97316', color: '#f97316' }}
            >
              Set Maintenance
            </Button>
          );
        }
        return (
          <Button
            size="small"
            loading={isUpdating}
            onClick={() => setConfirmStatusTarget({ room: record, newStatus: 'available' })}
            style={{ borderColor: '#22c55e', color: '#22c55e' }}
          >
            Set Available
          </Button>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => openDetails(record)}>
            Details
          </Button>
          <Button size="small" onClick={() => openEditModal(record)}>
            Edit
          </Button>
          <Button danger size="small" onClick={() => handleDeleteRoom(record)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Room Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage rooms within blocks.</p>
        </div>
        <Button type="primary" onClick={openCreateModal}>
          Add Room
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <DoorClosed size={18} className="text-orange-600" />
          <div className="font-semibold text-gray-900">Room List</div>
        </div>

        <div className="mb-4 flex flex-wrap gap-3 items-center">
          <Input
            placeholder="Search by block or room name (e.g. A101 or A101-2)"
            style={{ minWidth: 240 }}
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            onPressEnter={loadRooms}
          />
          <Select
            allowClear
            placeholder="Filter by room type"
            style={{ minWidth: 160 }}
            value={filterRoomType}
            onChange={(v) => setFilterRoomType(v)}
            options={roomTypeOptions}
          />
          <Select
            allowClear
            placeholder="Filter by student type"
            style={{ minWidth: 180 }}
            value={filterStudentType}
            onChange={(v) => setFilterStudentType(v)}
            options={[
              { label: 'Vietnamese students', value: 'vietnamese' },
              { label: 'International students', value: 'international' },
            ]}
          />
          <Select
            allowClear
            placeholder="Filter by status"
            style={{ minWidth: 150 }}
            value={filterStatus}
            onChange={(v) => setFilterStatus(v)}
            options={roomStatusOptions}
          />
          <Space>
            <Button type="primary" onClick={loadRooms}>
              Apply
            </Button>
            <Button
              onClick={() => {
                setFilterSearch('');
                setFilterRoomType(undefined);
                setFilterStudentType(undefined);
                setFilterStatus(undefined);
                loadRooms();
              }}
            >
              Reset
            </Button>
          </Space>
        </div>

        <Table<Room>
          rowKey="id"
          loading={loadingRooms}
          columns={columns}
          dataSource={rooms}
          pagination={false}
          size="small"
          scroll={{ x: 1000 }}
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        title={editingRoom ? 'Update Room' : 'Create New Room'}
        onCancel={closeMainModal}
        onOk={handleSubmitRoom}
        okText="Save"
        cancelText="Cancel"
        destroyOnClose
        width={700}
      >
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              label="Dorm"
              name="dorm"
              rules={[{ required: true, message: 'Please select a dorm first' }]}
            >
              <Select
                placeholder="Select dorm to see blocks"
                loading={loadingDorms}
                disabled={!!editingRoom}
                options={dorms.map((d) => ({ label: d.dorm_name, value: d.id }))}
              />
            </Form.Item>

            <Form.Item label="Block" required>
              {editingRoom ? (
                // Edit mode: show block name directly, no picker button
                <Form.Item name="block" noStyle rules={[{ required: true, message: 'Please select a block' }]}>
                  <Select
                    disabled
                    suffixIcon={null}
                    style={{ width: '100%' }}
                    options={
                      typeof editingRoom.block === 'object' && editingRoom.block
                        ? [{ label: editingRoom.block.block_name, value: editingRoom.block.id }]
                        : blocks.map((b) => ({ label: b.block_name, value: b.id }))
                    }
                  />
                </Form.Item>
              ) : (
                // Create mode: picker button
                <div className="flex gap-2">
                  <Form.Item name="block" noStyle rules={[{ required: true, message: 'Please select a block' }]}>
                    <Select
                      style={{ flex: 1 }}
                      placeholder={selectedDormId ? 'Choose a block' : 'Select dorm first'}
                      disabled
                      options={blocks.map((b) => ({ label: b.block_name, value: b.id }))}
                      suffixIcon={null}
                    />
                  </Form.Item>
                  <Button
                    type="default"
                    onClick={() => setBlockPickerOpen(true)}
                    disabled={!selectedDormId || loadingBlocks}
                  >
                    Select Block
                  </Button>
                </div>
              )}
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              label="Room Number"
              name="room_number"
              rules={[{ required: true, message: 'Please select room number' }]}
            >
              {editingRoom ? (
                <Input disabled />
              ) : availableRoomNumbers.length > 0 && selectedBlockId ? (
                <Select
                  placeholder={selectedBlock ? 'Select room number' : 'Select block first'}
                  disabled={!selectedBlock}
                  options={availableRoomNumbers.map((n) => ({
                    label: String(n),
                    value: String(n),
                  }))}
                />
              ) : (
                <Input placeholder="e.g. 1" />
              )}
            </Form.Item>

            <Form.Item
              label="Floor"
              name="floor"
              rules={[{ required: true, message: 'Select a block to show floor' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                disabled
                placeholder={selectedBlock ? `Floor ${selectedBlock.floor}` : 'Select block first'}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              label="Room Type"
              name="room_type"
              rules={[{ required: true, message: 'Please select room type' }]}
            >
              <Select options={roomTypeOptions} />
            </Form.Item>

            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select options={roomStatusOptions} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Form.Item
              label="Total Beds"
              name="total_beds"
              rules={[{ required: true, message: 'Set by room type' }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} disabled />
            </Form.Item>

            <Form.Item
              label="Available Beds"
              name="available_beds"
              rules={[
                { required: true, message: 'Please enter available beds' },
                {
                  validator: (_, value) => {
                    const total = form.getFieldValue('total_beds') ?? 0;
                    if (value != null && Number(value) > Number(total)) {
                      return Promise.reject(new Error('Available beds cannot exceed total beds'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber style={{ width: '100%' }} min={0} max={totalBeds ?? 8} disabled={!!editingRoom && !isRoomTypeChanged} />
            </Form.Item>

            <Form.Item
              label="Price / Semester"
              name="price_per_semester"
              rules={[{ required: true, message: 'Price is set by room type' }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} disabled />
            </Form.Item>
          </div>

          <Form.Item
            label="Student type"
            name="student_type"
            rules={[{ required: true, message: 'Please select student type' }]}
          >
            <Select
              options={[
                { label: 'Vietnamese students', value: 'vietnamese' },
                { label: 'International students', value: 'international' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Block Picker Modal — destroyOnClose ensures fresh z-index on each open */}
      <Modal
        open={blockPickerOpen}
        title="Select Block"
        onCancel={() => setBlockPickerOpen(false)}
        footer={null}
        width={800}
        destroyOnClose
        zIndex={1010}
      >
        {!selectedDormId ? (
          <p className="text-sm text-gray-500">Please select a dorm first.</p>
        ) : blocksOfSelectedDorm.length === 0 ? (
          <p className="text-sm text-gray-500">No blocks found for this dorm.</p>
        ) : (
          <div className="space-y-6 max-h-[480px] overflow-y-auto pr-1">
            {Array.from(
              new Set(
                blocksOfSelectedDorm
                  .map((b) => b.floor ?? 0)
                  .filter((f) => typeof f === 'number' && f > 0),
              ),
            )
              .sort((a, b) => a - b)
              .map((floor) => (
                <div key={floor} className="space-y-3">
                  <div className="font-semibold text-gray-800">{`Floor ${floor}`}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {blocksOfSelectedDorm
                      .filter((b) => b.floor === floor)
                      .map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          disabled={isBlockFull(b)}
                          onClick={() => {
                            if (isBlockFull(b)) return;
                            form.setFieldValue('block', b.id);
                            if (b.floor != null) form.setFieldValue('floor', b.floor);
                            setBlockPickerOpen(false);
                          }}
                          className={`rounded-xl border px-3 py-3 text-left transition ${
                            isBlockFull(b)
                              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-70'
                              : selectedBlockId === b.id
                                ? 'border-orange-500 bg-orange-50 shadow-sm'
                                : 'border-gray-200 hover:border-orange-400 hover:bg-orange-50'
                          }`}
                        >
                          <div className="font-semibold text-gray-900 text-sm">{b.block_name}</div>
                          {isBlockFull(b) && (
                            <div className="mt-1 text-[11px] uppercase tracking-wide text-red-500">
                              Full rooms
                            </div>
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={deleteModalOpen}
        title="Confirm Delete Room"
        onCancel={() => {
          setDeleteModalOpen(false);
          setDeletingRoom(null);
        }}
        onOk={async () => {
          if (!deletingRoom) return;
          try {
            await deleteRoom(deletingRoom.id);
            message.success('Room deleted successfully');
            setDeleteModalOpen(false);
            setDeletingRoom(null);
            loadRooms();
            loadAllRoomsForCapacity();
          } catch (error: any) {
            console.error(error);
            const errMsg = Array.isArray(error?.message)
              ? error.message.join(', ')
              : error?.message || 'Failed to delete room';
            message.error(errMsg);
          }
        }}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        centered
      >
        {deletingRoom && (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <ExclamationCircleOutlined className="mt-1 text-orange-500" />
              <div>
                <p>
                  Are you sure you want to delete room{' '}
                  <span className="font-semibold text-red-600">
                    "{deletingRoom.room_number}"
                  </span>
                  ?
                </p>
                <p className="text-xs text-gray-500 mt-1">This action cannot be undone.</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Status Change Modal */}
      <Modal
        open={!!confirmStatusTarget}
        title="Confirm Status Change"
        okText="Confirm"
        cancelText="Cancel"
        centered
        confirmLoading={!!updatingStatusId}
        onOk={handleConfirmStatus}
        onCancel={() => setConfirmStatusTarget(null)}
      >
        {confirmStatusTarget && (() => {
          const r = confirmStatusTarget.room;
          const roomLabel =
            typeof r.block === 'object' && r.block
              ? `${r.block.block_name}-${r.room_number}`
              : String(r.room_number);
          return (
            <p className="text-sm mt-1">
              Change room <strong>"{roomLabel}"</strong> status from{' '}
              <strong>{r.status}</strong> → <strong>{confirmStatusTarget.newStatus}</strong>?
            </p>
          );
        })()}
      </Modal>

      {/* Details Drawer — Beds in this room */}
      <Drawer
        title={
          detailsRoom
            ? `${typeof detailsRoom.block === 'object' && detailsRoom.block ? `${detailsRoom.block.block_name}-` : ''}${detailsRoom.room_number} — Beds`
            : 'Beds'
        }
        open={!!detailsRoom}
        onClose={() => setDetailsRoom(null)}
        width={480}
      >
        <Table<Bed>
          rowKey="id"
          loading={detailsLoading}
          size="small"
          pagination={false}
          dataSource={detailsBeds}
          locale={{ emptyText: 'No beds in this room.' }}
          columns={[
            {
              title: 'ID',
              dataIndex: 'bed_id',
              key: 'bed_id',
              width: 70,
              render: (v: number) => <span className="font-mono text-xs text-gray-500">#{v}</span>,
            },
            { title: 'Bed', dataIndex: 'bed_number', key: 'bed_number', width: 70 },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (v: string) => {
                const colorMap: Record<string, string> = { available: 'green', occupied: 'red', reserved: 'blue', maintenance: 'orange' };
                return <Tag color={colorMap[v] ?? 'default'}>{v?.toUpperCase()}</Tag>;
              },
            },
          ]}
        />
      </Drawer>
    </div>
  );
}
