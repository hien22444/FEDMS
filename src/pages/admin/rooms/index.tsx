import { useEffect, useMemo, useState } from 'react';
import {
  App,
  Button,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  message,
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
  type Dorm,
  type Block,
  type Room,
  type RoomStatus,
  type RoomType,
} from '@/lib/actions/admin';

const roomTypeOptions: { label: string; value: RoomType }[] = [
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

const roomColumns = (
  onEdit: (record: Room) => void,
  onDeleteClick: (record: Room) => void,
): ColumnsType<Room> => [
  {
    title: 'Room',
    dataIndex: 'room_number',
    key: 'room_number',
    render: (v: string) => <span className="font-mono text-xs">{v}</span>,
  },
  {
    title: 'Floor',
    dataIndex: 'floor',
    key: 'floor',
    width: 70,
  },
  {
    title: 'Type',
    dataIndex: 'room_type',
    key: 'room_type',
    width: 110,
    render: (v: string) => <Tag>{v.replace('_', ' ')}</Tag>,
  },
  {
    title: 'Beds',
    key: 'beds',
    width: 110,
    render: (_, r) => (
      <span className="text-xs">
        {r.available_beds}/{r.total_beds}
      </span>
    ),
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
    width: 120,
    render: (v: RoomStatus) => <Tag color={statusColorMap[v]}>{v.toUpperCase()}</Tag>,
  },
  {
    title: 'Block',
    dataIndex: 'block',
    key: 'block',
    render: (b: Room['block']) => {
      if (typeof b === 'object' && b !== null) {
        return `${b.block_name} (${b.block_code})`;
      }
      return '-';
    },
  },
  {
    title: 'Student type',
    dataIndex: 'student_type',
    key: 'student_type',
    width: 140,
    render: (type: string) => {
      const label = type === 'international' ? 'International students' : 'Vietnamese students';
      return <Tag color={type === 'international' ? 'cyan' : 'green'}>{label}</Tag>;
    },
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 160,
    render: (_, record) => (
      <div className="flex gap-2">
        <Button size="small" onClick={() => onEdit(record)}>
          Edit
        </Button>
        <Button danger size="small" onClick={() => onDeleteClick(record)}>
          Delete
        </Button>
      </div>
    ),
  },
];

export default function AdminRoomsPage() {
  const { modal } = App.useApp();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);

  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingDorms, setLoadingDorms] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);

  const [form] = Form.useForm();

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
      const res = await fetchRooms({ page: 1, limit: 50 });
      setRooms(res.items);
    } catch (error: any) {
      console.error(error);
      message.error('Failed to load room list');
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    loadDorms();
    loadBlocks();
    loadRooms();
  }, []);

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

  useEffect(() => {
    if (!modalOpen || !selectedRoomType) return;
    const beds = roomTypeToBeds(selectedRoomType);
    form.setFieldsValue({ total_beds: beds });
    const currentAvailable = form.getFieldValue('available_beds');
    if (currentAvailable == null || Number(currentAvailable) > beds) {
      form.setFieldValue('available_beds', beds);
    }
  }, [modalOpen, selectedRoomType, form]);

  const selectedBlock = useMemo(
    () => blocks.find((b) => b.id === selectedBlockId),
    [blocks, selectedBlockId],
  );

  const blockOptions = useMemo(() => {
    const filtered =
      selectedDormId && selectedDormId !== 'all'
        ? blocks.filter((b) => (typeof b.dorm === 'object' ? b.dorm.id : b.dorm) === selectedDormId)
        : blocks;

    return filtered.map((b) => ({
      label: `${b.block_name} (${b.block_code})`,
      value: b.id,
    }));
  }, [blocks, selectedDormId]);

  useEffect(() => {
    if (!modalOpen || !selectedBlockId) return;
    const block = blocks.find((b) => b.id === selectedBlockId);
    if (block?.floor != null) {
      form.setFieldValue('floor', block.floor);
    }
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
        has_private_bathroom: editingRoom.has_private_bathroom,
        student_type: editingRoom.student_type ?? 'vietnamese',
        description: editingRoom.description,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        status: 'available',
        room_type: '4_person',
        total_beds: 4,
        available_beds: 4,
        has_private_bathroom: false,
        student_type: 'vietnamese',
      });
    }
  }, [modalOpen, editingRoom, form]);

  const handleDeleteRoom = (record: Room) => {
    setDeletingRoom(record);
    setDeleteModalOpen(true);
  };

  const handleSubmitRoom = async () => {
    try {
      const values = await form.validateFields();
      const payload = { ...values };
      delete payload.dorm; // FE-only field for filtering blocks

      if (editingRoom) {
        await updateRoom(editingRoom.id, payload);
        message.success('Room updated successfully');
      } else {
        await createRoom(payload);
        message.success('Room created successfully');
      }
      setModalOpen(false);
      loadRooms();
    } catch (error: any) {
      if (error?.errorFields) return;
      const raw = Array.isArray(error?.message) ? error.message.join(', ') : (error?.message || '');
      const errMsg = raw.includes('only allows') || raw.includes('Cannot create more rooms')
        ? 'Block has reached its room limit. Cannot create more rooms in this block.'
        : raw.includes('Target block only allows') || raw.includes('Cannot move this room')
          ? 'Target block has reached its room limit. Cannot move this room there.'
          : raw || 'Failed to save room.';
      modal.error({
        title: 'Room save error',
        content: errMsg,
        okText: 'Close',
        zIndex: 2000,
      });
    }
  };

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

        <Table<Room>
          rowKey="id"
          loading={loadingRooms}
          columns={roomColumns(openEditModal, handleDeleteRoom)}
          dataSource={rooms}
          pagination={false}
          size="small"
        />
      </div>

      <Modal
        open={modalOpen}
        title={editingRoom ? 'Update Room' : 'Create New Room'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmitRoom}
        okText="Save"
        cancelText="Cancel"
        destroyOnClose
        width={700}
      >
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item label="Dorm (optional)" name="dorm">
              <Select
                placeholder="Filter blocks by dorm..."
                allowClear
                loading={loadingDorms}
                options={dorms.map((d) => ({
                  label: `${d.dorm_name} (${d.dorm_code})`,
                  value: d.id,
                }))}
              />
            </Form.Item>

            <Form.Item
              label="Block"
              name="block"
              rules={[{ required: true, message: 'Please select a block' }]}
            >
              <Select
                placeholder="Select block..."
                loading={loadingBlocks}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={blockOptions}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              label="Room Number"
              name="room_number"
              rules={[{ required: true, message: 'Please enter room number' }]}
            >
              <Input placeholder="e.g. 301" />
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
              <InputNumber style={{ width: '100%' }} min={0} max={totalBeds ?? 8} />
            </Form.Item>

            <Form.Item
              label="Price / Semester"
              name="price_per_semester"
              rules={[{ required: true, message: 'Please enter price' }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} />
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

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item
            label="Private Bathroom"
            name="has_private_bathroom"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

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
    </div>
  );
}

