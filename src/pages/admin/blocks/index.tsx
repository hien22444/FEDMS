import { useEffect, useState } from 'react';
import { Button, Table, Tag, Modal, Form, Input, InputNumber, Switch, Select, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Building2 } from 'lucide-react';
import {
  createBlock,
  deleteBlock,
  fetchBlocks,
  updateBlock,
  fetchDorms,
  type Block,
  type Dorm,
} from '@/lib/actions/admin';

const blockColumns = (
  onEdit: (record: Block) => void,
  onDeleteClick: (record: Block) => void,
): ColumnsType<Block> => [
  {
    title: 'Block Name',
    dataIndex: 'block_name',
    key: 'block_name',
  },
  {
    title: 'Block Code',
    dataIndex: 'block_code',
    key: 'block_code',
    render: (code: string) => <span className="font-mono text-xs">{code}</span>,
  },
  {
    title: 'Dorm',
    dataIndex: 'dorm',
    key: 'dorm',
    render: (dorm: Block['dorm']) => {
      if (typeof dorm === 'object' && dorm !== null) {
        return `${dorm.dorm_name} (${dorm.dorm_code})`;
      }
      return '-';
    },
  },
  {
    title: 'Floors',
    dataIndex: 'floor_count',
    key: 'floor_count',
    width: 80,
    render: (count?: number) => count ?? '-',
  },
  {
    title: 'Total Rooms',
    dataIndex: 'total_rooms',
    key: 'total_rooms',
    width: 100,
    render: (count?: number) => count ?? '-',
  },
  {
    title: 'Gender Type',
    dataIndex: 'gender_type',
    key: 'gender_type',
    width: 100,
    render: (type: string) => {
      const colorMap: Record<string, string> = {
        male: 'blue',
        female: 'pink',
        mixed: 'purple',
      };
      return <Tag color={colorMap[type] || 'default'}>{type.toUpperCase()}</Tag>;
    },
  },
  {
    title: 'Status',
    dataIndex: 'is_active',
    key: 'is_active',
    width: 110,
    render: (is_active: boolean) => (
      <Tag color={is_active ? 'green' : 'red'}>{is_active ? 'Active' : 'Inactive'}</Tag>
    ),
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

export default function AdminBlocksPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [loadingDorms, setLoadingDorms] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingBlock, setDeletingBlock] = useState<Block | null>(null);
  const [form] = Form.useForm();

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

  const loadBlocks = async () => {
    try {
      setLoadingBlocks(true);
      const res = await fetchBlocks({ page: 1, limit: 50 });
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

  const openCreateModal = () => {
    setEditingBlock(null);
    setModalOpen(true);
  };

  const openEditModal = (record: Block) => {
    setEditingBlock(record);
    setModalOpen(true);
  };

  // Set form values when modal opens
  useEffect(() => {
    if (modalOpen) {
      if (editingBlock) {
        // Edit mode: set values from record
        const dormId = typeof editingBlock.dorm === 'object' ? editingBlock.dorm.id : editingBlock.dorm;
        form.setFieldsValue({
          dorm: dormId,
          block_name: editingBlock.block_name,
          block_code: editingBlock.block_code,
          floor_count: editingBlock.floor_count,
          total_rooms: editingBlock.total_rooms,
          gender_type: editingBlock.gender_type,
          is_active: editingBlock.is_active,
        });
      } else {
        // Create mode: reset and set defaults
        form.resetFields();
        form.setFieldsValue({ is_active: true, gender_type: 'mixed' });
      }
    }
  }, [modalOpen, editingBlock, form]);

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
      message.error(errMsg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Block Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage blocks within dormitory buildings.
          </p>
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

        <Table<Block>
          rowKey="id"
          loading={loadingBlocks}
          columns={blockColumns(openEditModal, handleDeleteBlock)}
          dataSource={blocks}
          pagination={false}
          size="small"
        />
      </div>

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
              options={dorms.map((dorm) => ({
                label: `${dorm.dorm_name} (${dorm.dorm_code})`,
                value: dorm.id,
              }))}
            />
          </Form.Item>
          <Form.Item
            label="Block Name"
            name="block_name"
            rules={[{ required: true, message: 'Please enter block name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Block Code"
            name="block_code"
            rules={[{ required: true, message: 'Please enter block code' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Floor Count" name="floor_count" rules={[{ type: 'number', min: 0 }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item label="Total Rooms" name="total_rooms" rules={[{ type: 'number', min: 0 }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item
            label="Gender Type"
            name="gender_type"
            rules={[{ required: true, message: 'Please select gender type' }]}
          >
            <Select
              options={[
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Mixed', value: 'mixed' },
              ]}
            />
          </Form.Item>
          <Form.Item label="Active" name="is_active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

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
            console.log('Deleting block id =', deletingBlock.id);
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
            message.error(errMsg);
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
                <p className="text-xs text-gray-500 mt-1">
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
