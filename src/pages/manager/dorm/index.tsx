import { useEffect, useState } from 'react';
import { connectSocket } from '@/lib/socket';
import { App, Button, Table, Tag, Modal, Drawer, Form, Input, InputNumber, Switch, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Activity } from 'lucide-react';
import { createDorm, deleteDorm, fetchDorms, updateDorm, fetchBlocks, type Dorm, type Block } from '@/lib/actions/admin';

const dormColumns = (
  onEdit: (record: Dorm) => void,
  onDeleteClick: (record: Dorm) => void,
  onDetails: (record: Dorm) => void,
): ColumnsType<Dorm> => [
  {
    title: 'Dorm Name',
    dataIndex: 'dorm_name',
    key: 'dorm_name',
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
    width: 210,
    render: (_, record) => (
      <div className="flex gap-2">
        <Button size="small" onClick={() => onDetails(record)}>
          Details
        </Button>
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

export default function ManagerDormsPage() {
  const { modal: appModal } = App.useApp();
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [loadingDorms, setLoadingDorms] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDorm, setEditingDorm] = useState<Dorm | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingDorm, setDeletingDorm] = useState<Dorm | null>(null);
  const [form] = Form.useForm();

  // Details drawer
  const [detailsDorm, setDetailsDorm] = useState<Dorm | null>(null);
  const [detailsBlocks, setDetailsBlocks] = useState<Block[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

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

  useEffect(() => {
    const socket = connectSocket();
    socket.on('dorm_updated', () => {
      loadDorms();
    });
    return () => {
      socket.off('dorm_updated');
    };
  }, []);

  const openDetails = async (record: Dorm) => {
    setDetailsDorm(record);
    setDetailsBlocks([]);
    setDetailsLoading(true);
    try {
      const res = await fetchBlocks({ dorm: record.id, page: 1, limit: 200 });
      setDetailsBlocks(res.items);
    } catch {
      message.error('Failed to load blocks');
    } finally {
      setDetailsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingDorm(null);
    setModalOpen(true);
  };

  const openEditModal = (record: Dorm) => {
    setEditingDorm(record);
    setModalOpen(true);
  };

  useEffect(() => {
    if (modalOpen) {
      if (editingDorm) {
        const shortName = editingDorm.dorm_name?.toLowerCase().startsWith('dorm ')
          ? editingDorm.dorm_name.replace(/^[Dd]orm\s+/, '')
          : editingDorm.dorm_name;
        form.setFieldsValue({
          dorm_name: shortName,
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
        await updateDorm(editingDorm.id, {
          total_floors: values.total_floors,
          description: values.description,
          is_active: values.is_active,
        });
        message.success('Dorm updated successfully');
      } else {
        const rawName = String(values.dorm_name || '').trim();
        const shortName = rawName.toLowerCase().startsWith('dorm ')
          ? rawName.replace(/^[Dd]orm\s+/, '').trim()
          : rawName;
        if (!shortName) {
          message.error('Please enter dorm name');
          return;
        }
        if (!/^[A-Za-z]$/.test(shortName)) {
          message.error('Dorm name must be 1 letter (A-Z)');
          return;
        }
        await createDorm({
          ...values,
          dorm_name: `Dorm ${shortName.toUpperCase()}`,
          dorm_code: shortName.toUpperCase(),
        });
        message.success('Dorm created successfully');
      }
      setModalOpen(false);
      loadDorms();
    } catch (error: any) {
      if (error?.errorFields) return;
      console.error(error);
      const errMsg = Array.isArray(error?.message)
        ? error.message.join(', ')
        : error?.message || 'Failed to save dorm';
      appModal.error({
        title: editingDorm ? 'Cannot Update Dorm' : 'Cannot Create Dorm',
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dorm List</h1>
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
          columns={dormColumns(openEditModal, handleDeleteDorm, openDetails)}
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
          {editingDorm ? (
            <Form.Item label="Dorm Name">
              <Input disabled value={editingDorm.dorm_name} />
            </Form.Item>
          ) : (
            <Form.Item
              label="Dorm Name"
              name="dorm_name"
              rules={[
                { required: true, message: 'Please enter dorm name' },
                {
                  validator: (_, value) => {
                    const raw = String(value || '').trim();
                    const short = raw.toLowerCase().startsWith('dorm ')
                      ? raw.replace(/^[Dd]orm\s+/, '')
                      : raw;
                    if (!short) return Promise.resolve();
                    if (!/^[A-Za-z]$/.test(short)) {
                      return Promise.reject(new Error('Dorm name must be 1 letter (A-Z)'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input maxLength={1} placeholder="A" />
            </Form.Item>
          )}
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
            appModal.error({
              title: 'Cannot Delete Dorm',
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

      {/* Details Drawer — Blocks in this dorm */}
      <Drawer
        title={detailsDorm ? `${detailsDorm.dorm_name} — Blocks` : 'Blocks'}
        open={!!detailsDorm}
        onClose={() => setDetailsDorm(null)}
        width={600}
      >
        <Table<Block>
          rowKey="id"
          loading={detailsLoading}
          size="small"
          pagination={false}
          dataSource={detailsBlocks}
          locale={{ emptyText: 'No blocks in this dorm.' }}
          columns={[
            { title: 'Block Name', dataIndex: 'block_name', key: 'block_name', width: 110 },
            { title: 'Floor', dataIndex: 'floor', key: 'floor', width: 70, render: (v) => v ?? '-' },
            { title: 'Total Rooms', dataIndex: 'total_rooms', key: 'total_rooms', width: 100, render: (v) => v ?? '-' },
            {
              title: 'Gender',
              dataIndex: 'gender_type',
              key: 'gender_type',
              width: 90,
              render: (v: string) => {
                const colorMap: Record<string, string> = { male: 'blue', female: 'pink', mixed: 'purple' };
                return <Tag color={colorMap[v] ?? 'default'}>{v?.toUpperCase()}</Tag>;
              },
            },
            {
              title: 'Status',
              dataIndex: 'is_active',
              key: 'is_active',
              width: 110,
              render: (v: boolean) => <Tag color={v ? 'green' : 'orange'}>{v ? 'Available' : 'Maintenance'}</Tag>,
            },
          ]}
        />
      </Drawer>
    </div>
  );
}
