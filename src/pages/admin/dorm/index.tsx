import { useEffect, useState } from 'react';
import { Button, Table, Tag, Modal, Form, Input, InputNumber, Switch, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Activity } from 'lucide-react';
import { createDorm, deleteDorm, fetchDorms, updateDorm, type Dorm } from '@/lib/actions/admin';

const dormColumns = (
  onEdit: (record: Dorm) => void,
  onDeleteClick: (record: Dorm) => void,
): ColumnsType<Dorm> => [
  {
    title: 'Dorm Name',
    dataIndex: 'dorm_name',
    key: 'dorm_name',
  },
  {
    title: 'Code',
    dataIndex: 'dorm_code',
    key: 'dorm_code',
    render: (code: string) => <span className="font-mono text-xs">{code}</span>,
  },
  {
    title: 'Floors',
    dataIndex: 'total_floors',
    key: 'total_floors',
    width: 80,
    render: (n: number) => n ?? '-',
  },
  {
    title: 'Blocks',
    dataIndex: 'total_blocks',
    key: 'total_blocks',
    width: 80,
    render: (n: number) => n ?? 0,
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

export default function AdminDormsPage() {
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [loadingDorms, setLoadingDorms] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDorm, setEditingDorm] = useState<Dorm | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingDorm, setDeletingDorm] = useState<Dorm | null>(null);
  const [form] = Form.useForm();

  const loadDorms = async () => {
    try {
      setLoadingDorms(true);
      const res = await fetchDorms({ page: 1, limit: 50 });
      setDorms(res.items);
    } catch (error: any) {
      console.error(error);
      message.error('Failed to load dorm list');
    } finally {
      setLoadingDorms(false);
    }
  };

  useEffect(() => {
    loadDorms();
  }, []);

  const openCreateModal = () => {
    setEditingDorm(null);
    setModalOpen(true);
  };

  const openEditModal = (record: Dorm) => {
    setEditingDorm(record);
    setModalOpen(true);
  };

  // Set form values when modal opens
  useEffect(() => {
    if (modalOpen) {
      if (editingDorm) {
        form.setFieldsValue({
          dorm_name: editingDorm.dorm_name,
          dorm_code: editingDorm.dorm_code,
          total_floors: editingDorm.total_floors ?? 1,
          description: editingDorm.description,
          is_active: editingDorm.is_active,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ is_active: true, total_floors: 1 });
      }
    }
  }, [modalOpen, editingDorm, form]);

  const handleDeleteDorm = (record: Dorm) => {
    setDeletingDorm(record);
    setDeleteModalOpen(true);
  };

  const handleSubmitDorm = async () => {
    try {
      const values = await form.validateFields();
      if (editingDorm) {
        await updateDorm(editingDorm.id, values);
        message.success('Dorm updated successfully');
      } else {
        await createDorm(values);
        message.success('Dorm created successfully');
      }
      setModalOpen(false);
      loadDorms();
    } catch (error: any) {
      if (error?.errorFields) return;
      console.error(error);
      message.error('Failed to save dorm');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dorm Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage dormitory buildings in the system.
          </p>
        </div>
        <Button type="primary" onClick={openCreateModal}>
          Add Dorm
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-orange-600" />
          <div className="font-semibold text-gray-900">Dorm List</div>
        </div>

        <Table<Dorm>
          rowKey="id"
          loading={loadingDorms}
          columns={dormColumns(openEditModal, handleDeleteDorm)}
          dataSource={dorms}
          pagination={false}
          size="small"
        />
      </div>

      <Modal
        open={modalOpen}
        title={editingDorm ? 'Update Dorm' : 'Create New Dorm'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmitDorm}
        okText="Save"
        cancelText="Cancel"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Dorm Name"
            name="dorm_name"
            rules={[{ required: true, message: 'Please enter dorm name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Dorm Code"
            name="dorm_code"
            rules={[{ required: true, message: 'Please enter dorm code' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Number of floors"
            name="total_floors"
            rules={[{ required: true, message: 'Please enter number of floors' }, { type: 'number', min: 1, message: 'Minimum 1 floor' }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Active" name="is_active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={deleteModalOpen}
        title="Confirm Delete Dorm"
        onCancel={() => {
          setDeleteModalOpen(false);
          setDeletingDorm(null);
        }}
        onOk={async () => {
          if (!deletingDorm) return;
          try {
            console.log('Deleting dorm id =', deletingDorm.id);
            await deleteDorm(deletingDorm.id);
            message.success('Dorm deleted successfully');
            setDeleteModalOpen(false);
            setDeletingDorm(null);
            loadDorms();
          } catch (error: any) {
            console.error(error);
            const errMsg = Array.isArray(error?.message)
              ? error.message.join(', ')
              : error?.message || 'Failed to delete dorm';
            message.error(errMsg);
          }
        }}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        centered
      >
        {deletingDorm && (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <ExclamationCircleOutlined className="mt-1 text-orange-500" />
              <div>
                <p>
                  Are you sure you want to delete dorm{' '}
                  <span className="font-semibold text-red-600">
                    "{deletingDorm.dorm_name}"
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
