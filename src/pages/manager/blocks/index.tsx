import { useEffect, useMemo, useState } from 'react';
import { connectSocket } from '@/lib/socket';
import { App, Button, Table, Tag, Modal, Drawer, Form, Input, InputNumber, Switch, Select, message, Space } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Building2 } from 'lucide-react';
import {
  createBlock,
  deleteBlock,
  fetchBlocks,
  updateBlock,
  fetchDorms,
  fetchRooms,
  type Block,
  type Dorm,
  type Room,
} from '@/lib/actions/admin';

type GenderType = Exclude<Block['gender_type'], undefined>;

export default function ManagerBlocksPage() {
  const { modal: appModal } = App.useApp();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingDorms, setLoadingDorms] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingBlock, setDeletingBlock] = useState<Block | null>(null);

  // Status & Gender quick-change
  const [confirmStatusTarget, setConfirmStatusTarget] = useState<{ block: Block; newIsActive: boolean } | null>(null);
  const [confirmGenderTarget, setConfirmGenderTarget] = useState<{ block: Block; newGender: GenderType } | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [updatingGenderId, setUpdatingGenderId] = useState<string | null>(null);

  const [form] = Form.useForm();

  // Details drawer
  const [detailsBlock, setDetailsBlock] = useState<Block | null>(null);
  const [detailsRooms, setDetailsRooms] = useState<Room[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Filters
  const [filterDormId, setFilterDormId] = useState<string | undefined>(undefined);
  const [filterGender, setFilterGender] = useState<string | undefined>(undefined);
  const [filterSearch, setFilterSearch] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);

  const selectedDormId = Form.useWatch('dorm', form) as string | undefined;
  const blockCode = Form.useWatch('block_code', form) as string | undefined;
  const selectedDorm = useMemo(
    () => dorms.find((d) => d.id === selectedDormId),
    [dorms, selectedDormId],
  );
  const floorOptions = useMemo(() => {
    const n = Math.max(1, selectedDorm?.total_floors ?? 1);
    return Array.from({ length: n }, (_, i) => ({
      label: `Floor ${i + 1}`,
      value: i + 1,
    }));
  }, [selectedDorm?.total_floors]);

  useEffect(() => {
    if (!selectedDormId || floorOptions.length === 0) return;
    const currentFloor = form.getFieldValue('floor');
    const validFloors = floorOptions.map((o) => o.value);
    if (currentFloor != null && !validFloors.includes(currentFloor)) {
      form.setFieldValue('floor', undefined);
    }
  }, [selectedDormId, floorOptions, form]);

  const loadDorms = async () => {
    try {
      setLoadingDorms(true);
      const res = await fetchDorms({ page: 1, limit: 100 });
      setDorms(res.items);
    } catch (error: any) {
      console.error(error);
      message.error('Failed to load dorm list');
    } finally {
      setLoadingDorms(false);
    }
  };

  const loadBlocks = async (overrides?: { page?: number }) => {
    try {
      setLoadingBlocks(true);
      const params: Record<string, string | number | boolean> = {
        page: overrides?.page ?? 1,
        limit: 50,
      };
      if (filterDormId) params.dorm = filterDormId;
      if (filterGender) params.gender_type = filterGender;
      if (filterSearch.trim()) params.search = filterSearch.trim();
      if (filterStatus) params.is_active = filterStatus === 'active';

      const res = await fetchBlocks(params);
      setBlocks(res.items);
    } catch (error: any) {
      console.error(error);
      message.error('Failed to load block list');
    } finally {
      setLoadingBlocks(false);
    }
  };

  useEffect(() => {
    loadDorms();
    loadBlocks();
  }, []);

  useEffect(() => {
    const socket = connectSocket();
    socket.on('block_updated', () => {
      loadBlocks();
    });
    return () => {
      socket.off('block_updated');
    };
  }, []);

  const handleApplyFilter = () => {
    loadBlocks({ page: 1 });
  };

  const handleResetFilter = () => {
    setFilterDormId(undefined);
    setFilterGender(undefined);
    setFilterSearch('');
    setFilterStatus(undefined);
    loadBlocks({ page: 1 });
  };

  const openDetails = async (record: Block) => {
    setDetailsBlock(record);
    setDetailsRooms([]);
    setDetailsLoading(true);
    try {
      const res = await fetchRooms({ block: record.id, page: 1, limit: 200 });
      setDetailsRooms(res.items);
    } catch {
      message.error('Failed to load rooms');
    } finally {
      setDetailsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingBlock(null);
    setModalOpen(true);
  };

  const openEditModal = (record: Block) => {
    setEditingBlock(record);
    setModalOpen(true);
  };

  useEffect(() => {
    if (modalOpen) {
      if (editingBlock) {
        const dormId = typeof editingBlock.dorm === 'object' ? editingBlock.dorm.id : editingBlock.dorm;
        form.setFieldsValue({
          dorm: dormId,
          block_name: editingBlock.block_name,
          block_code: editingBlock.block_code,
          floor: editingBlock.floor ?? 1,
          total_rooms: editingBlock.total_rooms,
          gender_type: editingBlock.gender_type,
          is_active: editingBlock.is_active,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ is_active: true, gender_type: 'male' });
      }
    }
  }, [modalOpen, editingBlock, form]);

  // Auto-generate block_name = <dorm_code><block_code> and keep it read-only
  useEffect(() => {
    const dorm = dorms.find((d) => d.id === selectedDormId);
    const code = (blockCode || '').trim();
    const firstDigit = code[0];

    if (!dorm || !code) {
      form.setFieldValue('block_name', '');
      form.setFieldValue('floor', undefined);
      return;
    }

    form.setFieldValue('block_name', `${dorm.dorm_code}${code}`);

    const derivedFloor = Number(firstDigit);
    if (!Number.isFinite(derivedFloor) || derivedFloor < 1) {
      form.setFieldValue('floor', undefined);
      return;
    }

    const maxFloor = dorm.total_floors ?? 0;
    if (derivedFloor > maxFloor) {
      message.error(
        `Block code implies floor ${derivedFloor}, but dorm "${dorm.dorm_name}" only has ${maxFloor} floor(s).`,
      );
      form.setFieldValue('floor', undefined);
      return;
    }

    form.setFieldValue('floor', derivedFloor);
  }, [selectedDormId, blockCode, dorms, form]);

  const handleDeleteBlock = (record: Block) => {
    setDeletingBlock(record);
    setDeleteModalOpen(true);
  };

  const handleSubmitBlock = async () => {
    try {
      const values = await form.validateFields();
      if (editingBlock) {
        await updateBlock(editingBlock.id, values);
        message.success('Block updated successfully');
      } else {
        await createBlock(values);
        message.success('Block created successfully');
      }
      setModalOpen(false);
      loadBlocks();
    } catch (error: any) {
      if (error?.errorFields) return;
      console.error(error);
      const errMsg = Array.isArray(error?.message)
        ? error.message.join(', ')
        : error?.message || 'Failed to save block';
      appModal.error({
        title: 'Block save error',
        content: errMsg,
        okText: 'Close',
        zIndex: 2000,
      });
    }
  };

  const handleConfirmStatus = async () => {
    if (!confirmStatusTarget) return;
    const { block, newIsActive } = confirmStatusTarget;
    try {
      setUpdatingStatusId(block.id);
      setConfirmStatusTarget(null);
      await updateBlock(block.id, { is_active: newIsActive });
      message.success(`Block "${block.block_name}" → ${newIsActive ? 'Available' : 'Maintenance'}`);
      loadBlocks();
    } catch (err: any) {
      message.error(err?.message || 'Failed to update block status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleConfirmGender = async () => {
    if (!confirmGenderTarget) return;
    const { block, newGender } = confirmGenderTarget;
    try {
      setUpdatingGenderId(block.id);
      setConfirmGenderTarget(null);
      await updateBlock(block.id, { gender_type: newGender });
      message.success(`Block "${block.block_name}" gender → ${newGender}`);
      loadBlocks();
    } catch (err: any) {
      message.error(err?.message || 'Failed to update block gender');
    } finally {
      setUpdatingGenderId(null);
    }
  };

  const columns: ColumnsType<Block> = [
    {
      title: 'Dorm',
      dataIndex: 'dorm',
      key: 'dorm',
      width: 120,
      render: (dorm: Block['dorm']) => {
        if (typeof dorm === 'object' && dorm !== null) return dorm.dorm_name;
        return '-';
      },
    },
    {
      title: 'Block Name',
      dataIndex: 'block_name',
      key: 'block_name',
      width: 110,
    },
    {
      title: 'Floor',
      dataIndex: 'floor',
      key: 'floor',
      width: 65,
      render: (floor?: number) => floor ?? '-',
    },
    {
      title: 'Total Rooms',
      dataIndex: 'total_rooms',
      key: 'total_rooms',
      width: 95,
      render: (count?: number) => count ?? '-',
    },
    {
      title: 'Gender',
      dataIndex: 'gender_type',
      key: 'gender_type',
      width: 85,
      render: (type: string) => {
        const colorMap: Record<string, string> = { male: 'blue', female: 'pink' };
        return <Tag color={colorMap[type] || 'default'}>{type?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 110,
      render: (is_active: boolean) => (
        <Tag color={is_active ? 'green' : 'orange'}>{is_active ? 'Available' : 'Maintenance'}</Tag>
      ),
    },
    {
      title: 'Set Status',
      key: 'set_status',
      width: 150,
      render: (_, record) => {
        const isUpdating = updatingStatusId === record.id;
        if (record.is_active) {
          return (
            <Button
              size="small"
              loading={isUpdating}
              onClick={() => setConfirmStatusTarget({ block: record, newIsActive: false })}
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
            onClick={() => setConfirmStatusTarget({ block: record, newIsActive: true })}
            style={{ borderColor: '#22c55e', color: '#22c55e' }}
          >
            Set Available
          </Button>
        );
      },
    },
    {
      title: 'Change Gender',
      key: 'change_gender',
      width: 140,
      render: (_, record) => {
        const isUpdating = updatingGenderId === record.id;
        const isMale = record.gender_type === 'male';
        return (
          <Button
            size="small"
            loading={isUpdating}
            onClick={() =>
              setConfirmGenderTarget({ block: record, newGender: isMale ? 'female' : 'male' })
            }
            style={isMale ? { borderColor: '#ec4899', color: '#ec4899' } : { borderColor: '#3b82f6', color: '#3b82f6' }}
          >
            {isMale ? 'Set Female' : 'Set Male'}
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
          <Button danger size="small" onClick={() => handleDeleteBlock(record)}>
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Block Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage blocks within dormitory buildings.</p>
        </div>
        <Button type="primary" onClick={openCreateModal}>
          Add Block
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={18} className="text-orange-600" />
          <div className="font-semibold text-gray-900">Block List</div>
        </div>

        <div className="mb-4 flex flex-wrap gap-3 items-center">
          <Select
            allowClear
            placeholder="Filter by dorm"
            style={{ minWidth: 200 }}
            value={filterDormId}
            onChange={(v) => setFilterDormId(v)}
            options={dorms.map((dorm) => ({ label: dorm.dorm_name, value: dorm.id }))}
          />
          <Select
            allowClear
            placeholder="Filter by gender"
            style={{ minWidth: 150 }}
            value={filterGender}
            onChange={(v) => setFilterGender(v)}
            options={[
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
            ]}
          />
          <Input
            placeholder="Search by block name/code"
            style={{ minWidth: 200 }}
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            onPressEnter={handleApplyFilter}
          />
          <Select
            allowClear
            placeholder="Filter by status"
            style={{ minWidth: 150 }}
            value={filterStatus}
            onChange={(v) => setFilterStatus(v)}
            options={[
              { label: 'Available', value: 'active' },
              { label: 'Maintenance', value: 'inactive' },
            ]}
          />
          <Space>
            <Button type="primary" onClick={handleApplyFilter}>
              Apply
            </Button>
            <Button onClick={handleResetFilter}>Reset</Button>
          </Space>
        </div>

        <Table<Block>
          rowKey="id"
          loading={loadingBlocks}
          columns={columns}
          dataSource={blocks}
          pagination={false}
          size="small"
          scroll={{ x: 1100 }}
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        title={editingBlock ? 'Update Block' : 'Create New Block'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmitBlock}
        okText="Save"
        cancelText="Cancel"
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Dorm"
            name="dorm"
            rules={[{ required: true, message: 'Please select a dorm' }]}
          >
            <Select
              placeholder="Select dorm..."
              loading={loadingDorms}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={dorms.map((dorm) => ({ label: dorm.dorm_name, value: dorm.id }))}
              disabled={!!editingBlock}
            />
          </Form.Item>
          <Form.Item label="Block Name" name="block_name">
            <Input disabled />
          </Form.Item>
          <Form.Item
            label="Block Code"
            name="block_code"
            rules={[
              { required: true, message: 'Please enter block code' },
              { pattern: /^\d{3}$/, message: 'Block code must be exactly 3 digits' },
            ]}
          >
            <Input
              placeholder="e.g. 101"
              maxLength={3}
              onChange={(e) => {
                const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 3);
                form.setFieldValue('block_code', numericOnly);
              }}
            />
          </Form.Item>
          <Form.Item
            label="Floor"
            name="floor"
            rules={[{ required: true, message: 'Please select floor' }]}
          >
            <Select
              placeholder="Floor is derived from block code"
              options={floorOptions}
              disabled
            />
          </Form.Item>
          <Form.Item
            label="Total Rooms"
            name="total_rooms"
            rules={[
              { type: 'number', min: 0, max: 10, message: 'Total rooms must be between 0 and 10' },
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={0} max={10} />
          </Form.Item>
          {!editingBlock && (
            <Form.Item
              label="Gender Type"
              name="gender_type"
              rules={[{ required: true, message: 'Please select gender type' }]}
            >
              <Select
                options={[
                  { label: 'Male', value: 'male' },
                  { label: 'Female', value: 'female' },
                ]}
              />
            </Form.Item>
          )}
          {!editingBlock && (
            <Form.Item label="Active" name="is_active" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={deleteModalOpen}
        title="Confirm Delete Block"
        onCancel={() => {
          setDeleteModalOpen(false);
          setDeletingBlock(null);
        }}
        onOk={async () => {
          if (!deletingBlock) return;
          try {
            await deleteBlock(deletingBlock.id);
            message.success('Block deleted successfully');
            setDeleteModalOpen(false);
            setDeletingBlock(null);
            loadBlocks();
          } catch (error: any) {
            console.error(error);
            const errMsg = Array.isArray(error?.message)
              ? error.message.join(', ')
              : error?.message || 'Failed to delete block';
            appModal.error({
              title: 'Cannot Delete Block',
              content: errMsg,
              okText: 'Close',
              centered: true,
            });
          }
        }}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        centered
      >
        {deletingBlock && (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <ExclamationCircleOutlined className="mt-1 text-orange-500" />
              <div>
                <p>
                  Are you sure you want to delete block{' '}
                  <span className="font-semibold text-red-600">
                    "{deletingBlock.block_name}" ({deletingBlock.block_code})
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
        {confirmStatusTarget && (
          <p className="text-sm mt-1">
            Change block <strong>"{confirmStatusTarget.block.block_name}"</strong> status from{' '}
            <strong>{confirmStatusTarget.block.is_active ? 'Available' : 'Maintenance'}</strong>
            {' → '}
            <strong>{confirmStatusTarget.newIsActive ? 'Available' : 'Maintenance'}</strong>?
          </p>
        )}
      </Modal>

      {/* Confirm Gender Change Modal */}
      <Modal
        open={!!confirmGenderTarget}
        title="Confirm Gender Change"
        okText="Confirm"
        cancelText="Cancel"
        centered
        confirmLoading={!!updatingGenderId}
        onOk={handleConfirmGender}
        onCancel={() => setConfirmGenderTarget(null)}
      >
        {confirmGenderTarget && (
          <p className="text-sm mt-1">
            Change block <strong>"{confirmGenderTarget.block.block_name}"</strong> gender from{' '}
            <strong className="capitalize">{confirmGenderTarget.block.gender_type}</strong>
            {' → '}
            <strong className="capitalize">{confirmGenderTarget.newGender}</strong>?
          </p>
        )}
      </Modal>

      {/* Details Drawer — Rooms in this block */}
      <Drawer
        title={detailsBlock ? `${detailsBlock.block_name} — Rooms` : 'Rooms'}
        open={!!detailsBlock}
        onClose={() => setDetailsBlock(null)}
        width={640}
      >
        <Table<Room>
          rowKey="id"
          loading={detailsLoading}
          size="small"
          pagination={false}
          dataSource={detailsRooms}
          locale={{ emptyText: 'No rooms in this block.' }}
          columns={[
            {
              title: 'Room Name',
              key: 'room_name',
              width: 110,
              render: (r: Room) =>
                typeof r.block === 'object' && r.block
                  ? `${r.block.block_name}-${r.room_number}`
                  : String(r.room_number),
            },
            { title: 'Room Type', dataIndex: 'room_type', key: 'room_type', width: 100, render: (v: string) => <Tag>{v.replace('_', ' ')}</Tag> },
            { title: 'Total Beds', dataIndex: 'total_beds', key: 'total_beds', width: 90, render: (v) => v ?? '-' },
            { title: 'Available', dataIndex: 'available_beds', key: 'available_beds', width: 85, render: (v) => v ?? '-' },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              width: 110,
              render: (v: string) => {
                const colorMap: Record<string, string> = { available: 'green', full: 'red', maintenance: 'orange', inactive: 'default' };
                return <Tag color={colorMap[v] ?? 'default'}>{v?.toUpperCase()}</Tag>;
              },
            },
          ]}
        />
      </Drawer>
    </div>
  );
}
