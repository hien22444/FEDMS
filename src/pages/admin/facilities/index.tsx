import { useEffect, useState } from 'react';
import {
  App,
  Alert,
  Button,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  Tabs,
  message,
} from 'antd';
import {
  ExclamationCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Layers, Box, Settings2, Plus, Package, ClipboardList } from 'lucide-react';
import dayjs from 'dayjs';

import {
  fetchEquipmentCategories,
  createEquipmentCategory,
  updateEquipmentCategory,
  deleteEquipmentCategory,
  fetchEquipmentTemplates,
  createEquipmentTemplate,
  updateEquipmentTemplate,
  deleteEquipmentTemplate,
  fetchRoomTypeConfigs,
  createRoomTypeConfig,
  updateRoomTypeConfig,
  deleteRoomTypeConfig,
  fetchRoomTypePricing,
  fetchRoomEquipments,
  addRoomEquipment,
  updateRoomEquipment,
  deleteRoomEquipment,
  fetchRoomEquipmentHistory,
  fetchRooms,
  type EquipmentCategory,
  type EquipmentTemplate,
  type RoomTypeEquipmentConfig,
  type RoomEquipment,
  type EquipmentHistoryItem,
  type Room,
} from '@/lib/actions/admin';

// ==================== HELPERS ====================

const ROOM_TYPE_COLOR_PALETTE = ['blue', 'green', 'orange', 'purple', 'cyan', 'gold', 'magenta', 'volcano'];

interface RoomTypeOption {
  value: string;
  label: string;
  color: string;
}

const parseRoomTypeOptions = (prices: Record<string, number>): RoomTypeOption[] =>
  Object.keys(prices)
    .sort()
    .map((key, idx) => {
      const match = /^(\d+)_person$/i.exec(key);
      const num = match ? match[1] : key;
      return {
        value: key,
        label: `${num}-Person Room`,
        color: ROOM_TYPE_COLOR_PALETTE[idx % ROOM_TYPE_COLOR_PALETTE.length],
      };
    });

// ==================== CATEGORIES TAB ====================

function CategoriesTab({ onDataChange }: { onDataChange: () => void }) {
  const { modal: appModal } = App.useApp();
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentCategory | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<EquipmentCategory | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form] = Form.useForm();

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchEquipmentCategories({ page: 1, limit: 100, search });
      setCategories(res.items);
    } catch {
      message.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  useEffect(() => {
    if (modalOpen) {
      if (editing) {
        form.setFieldsValue({
          category_name: editing.category_name,
          description: editing.description,
        });
      } else {
        form.resetFields();
      }
    }
  }, [modalOpen, editing, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await updateEquipmentCategory(editing.id, values);
        message.success('Category updated successfully');
      } else {
        await createEquipmentCategory(values);
        message.success('Category created successfully');
      }
      setModalOpen(false);
      loadData();
      onDataChange();
    } catch (error: any) {
      if (error?.errorFields) return;
      const errMsg = Array.isArray(error?.message)
        ? error.message.join(', ')
        : error?.message || 'Failed to save category';
      appModal.error({
        title: editing ? 'Cannot Update Category' : 'Cannot Create Category',
        content: errMsg,
        okText: 'Close',
      });
    }
  };

  const columns: ColumnsType<EquipmentCategory> = [
    {
      title: 'Category Name',
      dataIndex: 'category_name',
      key: 'category_name',
      render: (name: string) => <span className="font-medium text-gray-900">{name}</span>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => <span className="text-gray-500">{desc || '-'}</span>,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 140,
      render: (date: string) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => { setEditing(record); setModalOpen(true); }}>Edit</Button>
          <Button danger size="small" onClick={() => { setDeleting(record); setDeleteError(null); setDeleteModalOpen(true); }}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <Input
          placeholder="Search categories..."
          prefix={<SearchOutlined className="text-gray-400" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
          allowClear
        />
        <Button type="primary" icon={<Plus size={14} />} onClick={() => { setEditing(null); setModalOpen(true); }}>
          Add Category
        </Button>
      </div>

      <Table<EquipmentCategory>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={categories}
        pagination={false}
        size="small"
      />

      <Modal
        open={modalOpen}
        title={editing ? 'Update Category' : 'Create New Category'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText="Save"
        cancelText="Cancel"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item label="Category Name" name="category_name" rules={[{ required: true, message: 'Please enter category name' }]}>
            <Input placeholder="e.g. Furniture, Electronics, Plumbing" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="Brief description of this category" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={deleteModalOpen}
        title="Confirm Delete Category"
        onCancel={() => { setDeleteModalOpen(false); setDeleting(null); setDeleteError(null); }}
        onOk={async () => {
          if (!deleting) return;
          setDeleteError(null);
          try {
            await deleteEquipmentCategory(deleting.id);
            message.success('Category deleted successfully');
            setDeleteModalOpen(false);
            setDeleting(null);
            loadData();
            onDataChange();
          } catch (error: any) {
            const errMsg = Array.isArray(error?.message) ? error.message.join(', ') : error?.message || 'Failed to delete category';
            setDeleteError(errMsg);
          }
        }}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        centered
      >
        {deleting && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <ExclamationCircleOutlined className="mt-1 text-orange-500" />
              <div>
                <p>Are you sure you want to delete category <span className="font-semibold text-red-600">"{deleting.category_name}"</span>?</p>
                <p className="text-xs text-gray-500 mt-1">Categories with linked templates cannot be deleted.</p>
              </div>
            </div>
            {deleteError && <Alert type="error" message={deleteError} showIcon />}
          </div>
        )}
      </Modal>
    </>
  );
}

// ==================== TEMPLATES TAB ====================

function TemplatesTab({ onDataChange, refreshKey }: { onDataChange: () => void; refreshKey: number }) {
  const { modal: appModal } = App.useApp();
  const [templates, setTemplates] = useState<EquipmentTemplate[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentTemplate | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<EquipmentTemplate | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();

  const loadCategories = async () => {
    try {
      const res = await fetchEquipmentCategories({ page: 1, limit: 200 });
      setCategories(res.items);
    } catch { /* silent */ }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number | boolean> = { page: 1, limit: 100 };
      if (search) params.search = search;
      if (filterCategory) params.category = filterCategory;
      const res = await fetchEquipmentTemplates(params);
      setTemplates(res.items);
    } catch {
      message.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCategories(); }, [refreshKey]);
  useEffect(() => { loadData(); }, [search, filterCategory, refreshKey]);

  useEffect(() => {
    if (modalOpen) {
      if (editing) {
        const categoryId = typeof editing.category === 'object' ? editing.category.id : editing.category;
        form.setFieldsValue({
          category: categoryId,
          equipment_name: editing.equipment_name,
          brand: editing.brand,
          model: editing.model,
          specifications: editing.specifications,
          estimated_lifespan_years: editing.estimated_lifespan_years,
          unit_price: editing.unit_price,
          is_active: editing.is_active,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ is_active: true });
      }
    }
  }, [modalOpen, editing, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Client-side duplicate check: same name + same category (excluding self when editing)
      if (!editing) {
        const duplicate = templates.find((t) => {
          const tCatId = typeof t.category === 'object' ? t.category.id : t.category;
          return (
            t.equipment_name.trim().toLowerCase() === values.equipment_name.trim().toLowerCase() &&
            String(tCatId) === String(values.category)
          );
        });
        if (duplicate) {
          const catName = categories.find((c) => String(c.id) === String(values.category))?.category_name || 'this category';
          appModal.error({
            title: 'Cannot Create Template',
            content: `A template named "${values.equipment_name}" already exists in category "${catName}". Please use a different name.`,
            okText: 'Close',
          });
          return;
        }
      }

      if (editing) {
        await updateEquipmentTemplate(editing.id, values);
        message.success('Template updated successfully');
      } else {
        await createEquipmentTemplate(values);
        message.success('Template created successfully');
      }
      setModalOpen(false);
      loadData();
      onDataChange();
    } catch (error: any) {
      if (error?.errorFields) return;
      const errMsg = Array.isArray(error?.message) ? error.message.join(', ') : error?.message || 'Failed to save template';
      appModal.error({
        title: editing ? 'Cannot Update Template' : 'Cannot Create Template',
        content: errMsg,
        okText: 'Close',
      });
    }
  };

  const columns: ColumnsType<EquipmentTemplate> = [
    {
      title: 'Equipment Name',
      dataIndex: 'equipment_name',
      key: 'equipment_name',
      render: (name: string) => <span className="font-medium text-gray-900">{name}</span>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (cat: EquipmentTemplate['category']) =>
        typeof cat === 'object' && cat !== null ? <Tag color="geekblue">{cat.category_name}</Tag> : '-',
    },
    { title: 'Brand', dataIndex: 'brand', key: 'brand', width: 120, render: (v: string) => v || '-' },
    { title: 'Model', dataIndex: 'model', key: 'model', width: 120, render: (v: string) => v || '-' },
    {
      title: 'Price',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 120,
      render: (price: number) => price != null ? <span className="font-mono text-xs">{price.toLocaleString('en-US')} VND</span> : '-',
    },
    {
      title: 'Lifespan',
      dataIndex: 'estimated_lifespan_years',
      key: 'estimated_lifespan_years',
      width: 90,
      render: (y: number) => (y ? `${y} yr${y > 1 ? 's' : ''}` : '-'),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 90,
      render: (is_active: boolean) => <Tag color={is_active ? 'green' : 'red'}>{is_active ? 'Active' : 'Inactive'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => { setEditing(record); setModalOpen(true); }}>Edit</Button>
          <Button danger size="small" onClick={() => { setDeleting(record); setDeleteError(null); setDeleteModalOpen(true); }}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex gap-3 flex-wrap">
          <Input placeholder="Search templates..." prefix={<SearchOutlined className="text-gray-400" />} value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" allowClear />
          <Select placeholder="All Categories" value={filterCategory} onChange={(v) => setFilterCategory(v)} allowClear className="w-48" options={categories.map((c) => ({ label: c.category_name, value: c.id }))} />
        </div>
        <Button type="primary" icon={<Plus size={14} />} onClick={() => { setEditing(null); setModalOpen(true); }}>Add Template</Button>
      </div>

      <Table<EquipmentTemplate> rowKey="id" loading={loading} columns={columns} dataSource={templates} pagination={false} size="small" scroll={{ x: 900 }} />

      <Modal open={modalOpen} title={editing ? 'Update Template' : 'Create New Template'} onCancel={() => setModalOpen(false)} onOk={handleSubmit} okText="Save" cancelText="Cancel" destroyOnHidden width={640}>
        <Form form={form} layout="vertical" className="mt-4">
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item label="Equipment Name" name="equipment_name" rules={[{ required: true, message: 'Please enter equipment name' }]} className="col-span-2">
              <Input placeholder="e.g. Air Conditioner Panasonic 9000BTU" />
            </Form.Item>
            <Form.Item label="Category" name="category" rules={[{ required: true, message: 'Please select a category' }]}>
              <Select placeholder="Select category..." showSearch optionFilterProp="label" options={categories.map((c) => ({ label: c.category_name, value: c.id }))} />
            </Form.Item>
            <Form.Item label="Brand" name="brand"><Input placeholder="e.g. Panasonic, Samsung" /></Form.Item>
            <Form.Item label="Model" name="model"><Input placeholder="e.g. CS-N9WKH" /></Form.Item>
            <Form.Item label="Unit Price (VND)" name="unit_price">
              <InputNumber style={{ width: '100%' }} min={0} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => Number(v?.replace(/,/g, '') || 0) as 0} placeholder="0" />
            </Form.Item>
            <Form.Item label="Est. Lifespan (years)" name="estimated_lifespan_years">
              <InputNumber style={{ width: '100%' }} min={0} max={100} placeholder="0" />
            </Form.Item>
            <Form.Item label="Active" name="is_active" valuePropName="checked"><Switch /></Form.Item>
          </div>

        </Form>
      </Modal>

      <Modal open={deleteModalOpen} title="Confirm Delete Template" onCancel={() => { setDeleteModalOpen(false); setDeleting(null); setDeleteError(null); }} onOk={async () => {
        if (!deleting) return;
        setDeleteError(null);
        try {
          await deleteEquipmentTemplate(deleting.id);
          message.success('Template deleted successfully');
          setDeleteModalOpen(false);
          setDeleting(null);
          loadData();
          onDataChange();
        } catch (error: any) {
          const errMsg = Array.isArray(error?.message) ? error.message.join(', ') : error?.message || 'Failed to delete template';
          setDeleteError(errMsg);
        }
      }} okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }} centered>
        {deleting && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <ExclamationCircleOutlined className="mt-1 text-orange-500" />
              <div>
                <p>Are you sure you want to delete template <span className="font-semibold text-red-600">"{deleting.equipment_name}"</span>?</p>
                <p className="text-xs text-gray-500 mt-1">Templates used in room equipment or default room setup configs cannot be deleted.</p>
              </div>
            </div>
            {deleteError && <Alert type="error" message={deleteError} showIcon />}
          </div>
        )}
      </Modal>
    </>
  );
}

// ==================== DEFAULT ROOM SETUP TAB ====================

function DefaultRoomSetupTab({ onDataChange, refreshKey }: { onDataChange: () => void; refreshKey: number }) {
  const [configs, setConfigs] = useState<RoomTypeEquipmentConfig[]>([]);
  const [templates, setTemplates] = useState<EquipmentTemplate[]>([]);
  const [roomTypeOptions, setRoomTypeOptions] = useState<RoomTypeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RoomTypeEquipmentConfig | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<RoomTypeEquipmentConfig | null>(null);
  const [filterRoomType, setFilterRoomType] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();

  const getRoomTypeLabel = (key: string) => roomTypeOptions.find((o) => o.value === key)?.label || key;
  const getRoomTypeColor = (key: string) => roomTypeOptions.find((o) => o.value === key)?.color || 'default';

  const loadRoomTypes = async () => {
    try {
      const res = await fetchRoomTypePricing();
      setRoomTypeOptions(parseRoomTypeOptions(res.prices || {}));
    } catch { /* silent */ }
  };

  const loadTemplates = async () => {
    try {
      const res = await fetchEquipmentTemplates({ page: 1, limit: 200, is_active: true });
      setTemplates(res.items);
    } catch { /* silent */ }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number | boolean> = { page: 1, limit: 200 };
      if (filterRoomType) params.room_type = filterRoomType;
      const res = await fetchRoomTypeConfigs(params);
      setConfigs(res.items);
    } catch {
      message.error('Failed to load room type configs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRoomTypes(); }, []);
  useEffect(() => { loadTemplates(); }, [refreshKey]);
  useEffect(() => { loadData(); }, [filterRoomType, refreshKey]);

  useEffect(() => {
    if (modalOpen) {
      if (editing) {
        const templateId = typeof editing.template === 'object' ? editing.template.id : editing.template;
        form.setFieldsValue({
          room_type: editing.room_type,
          template: templateId,
          standard_quantity: editing.standard_quantity,
          is_mandatory: editing.is_mandatory,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ is_mandatory: true, standard_quantity: 1 });
      }
    }
  }, [modalOpen, editing, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await updateRoomTypeConfig(editing.id, values);
        message.success('Config updated successfully');
      } else {
        await createRoomTypeConfig(values);
        message.success('Config created successfully');
      }
      setModalOpen(false);
      loadData();
      onDataChange();
    } catch (error: any) {
      if (error?.errorFields) return;
      const errMsg = Array.isArray(error?.message) ? error.message.join(', ') : error?.message || 'Failed to save config';
      message.error(errMsg);
    }
  };

  const getTemplateName = (tpl: RoomTypeEquipmentConfig['template']) => {
    if (typeof tpl === 'object' && tpl !== null) {
      return tpl.equipment_name + (tpl.brand ? ` (${tpl.brand})` : '');
    }
    return '-';
  };

  const columns: ColumnsType<RoomTypeEquipmentConfig> = [
    {
      title: 'Room Type',
      dataIndex: 'room_type',
      key: 'room_type',
      width: 150,
      render: (type: string) => <Tag color={getRoomTypeColor(type)}>{getRoomTypeLabel(type)}</Tag>,
    },
    {
      title: 'Equipment',
      dataIndex: 'template',
      key: 'template',
      render: (tpl: RoomTypeEquipmentConfig['template']) => {
        if (typeof tpl === 'object' && tpl !== null) {
          return (
            <div>
              <div className="font-medium text-gray-900">{tpl.equipment_name}</div>
              {tpl.brand && <div className="text-xs text-gray-400">{tpl.brand}{tpl.model ? ` - ${tpl.model}` : ''}</div>}
            </div>
          );
        }
        return '-';
      },
    },
    {
      title: 'Category',
      dataIndex: 'template',
      key: 'category',
      width: 130,
      render: (tpl: RoomTypeEquipmentConfig['template']) => {
        if (typeof tpl === 'object' && tpl?.category && typeof tpl.category === 'object') {
          return <Tag color="geekblue">{tpl.category.category_name}</Tag>;
        }
        return '-';
      },
    },
    {
      title: 'Qty',
      dataIndex: 'standard_quantity',
      key: 'standard_quantity',
      width: 70,
      align: 'center',
      render: (qty: number) => <span className="font-semibold">{qty}</span>,
    },
    {
      title: 'Mandatory',
      dataIndex: 'is_mandatory',
      key: 'is_mandatory',
      width: 100,
      render: (v: boolean) => <Tag color={v ? 'green' : 'orange'}>{v ? 'Yes' : 'Optional'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => { setEditing(record); setModalOpen(true); }}>Edit</Button>
          <Button danger size="small" onClick={() => { setDeleting(record); setDeleteModalOpen(true); }}>Delete</Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <Select
          placeholder="All Room Types"
          value={filterRoomType}
          onChange={(v) => setFilterRoomType(v)}
          allowClear
          className="w-48"
          options={roomTypeOptions}
        />
        <Button type="primary" icon={<Plus size={14} />} onClick={() => { setEditing(null); setModalOpen(true); }}>
          Add Default Equipment
        </Button>
      </div>

      <Table<RoomTypeEquipmentConfig>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={configs}
        pagination={false}
        size="small"
        scroll={{ x: 800 }}
      />

      <Modal
        open={modalOpen}
        title={editing ? 'Update Default Equipment' : 'Add Default Equipment to Room Type'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText="Save"
        cancelText="Cancel"
        destroyOnHidden
        width={500}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item label="Room Type" name="room_type" rules={[{ required: true, message: 'Please select room type' }]}>
            <Select
              placeholder="Select room type..."
              options={roomTypeOptions}
            />
          </Form.Item>
          <Form.Item label="Equipment Template" name="template" rules={[{ required: true, message: 'Please select a template' }]}>
            <Select
              placeholder="Select equipment..."
              showSearch
              optionFilterProp="label"
              options={templates.map((t) => ({
                label: t.equipment_name + (t.brand ? ` (${t.brand})` : ''),
                value: t.id,
              }))}
            />
          </Form.Item>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item label="Standard Quantity" name="standard_quantity" rules={[{ required: true, message: 'Please enter quantity' }]}>
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
            <Form.Item label="Mandatory" name="is_mandatory" valuePropName="checked">
              <Switch checkedChildren="Yes" unCheckedChildren="Optional" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        open={deleteModalOpen}
        title="Confirm Delete Config"
        onCancel={() => { setDeleteModalOpen(false); setDeleting(null); }}
        onOk={async () => {
          if (!deleting) return;
          try {
            await deleteRoomTypeConfig(deleting.id);
            message.success('Config deleted successfully');
            setDeleteModalOpen(false);
            setDeleting(null);
            loadData();
            onDataChange();
          } catch (error: any) {
            const errMsg = Array.isArray(error?.message) ? error.message.join(', ') : error?.message || 'Failed to delete config';
            message.error(errMsg);
          }
        }}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        centered
      >
        {deleting && (
          <div className="flex items-start gap-2">
            <ExclamationCircleOutlined className="mt-1 text-orange-500" />
            <div>
              <p>
                Remove <span className="font-semibold text-red-600">"{getTemplateName(deleting.template)}"</span> from{' '}
                <span className="font-semibold">{getRoomTypeLabel(deleting.room_type)}</span> defaults?
              </p>
              <p className="text-xs text-gray-500 mt-1">This won't affect equipment already assigned to rooms.</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

// ==================== ROOM EQUIPMENT TAB ====================

const STATUS_COLORS: Record<string, string> = {
  good: 'green', normal: 'blue', damaged: 'orange', broken: 'red', missing: 'default',
};

function RoomEquipmentTab() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | undefined>(undefined);
  const [equipments, setEquipments] = useState<RoomEquipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyEquipment, setHistoryEquipment] = useState<RoomEquipment | null>(null);
  const [historyItems, setHistoryItems] = useState<EquipmentHistoryItem[]>([]);
  const [repairedCount, setRepairedCount] = useState<number>(0);
  // Add optional modal
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<RoomEquipment | null>(null);
  const [editing, setEditing] = useState<RoomEquipment | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [optionalConfigs, setOptionalConfigs] = useState<RoomTypeEquipmentConfig[]>([]);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);

  const loadRooms = async () => {
    try {
      const res = await fetchRooms({ page: 1, limit: 500 });
      setRooms(res.items || []);
    } catch { /* silent */ }
  };

  const loadEquipments = async (roomId: string) => {
    try {
      setLoading(true);
      const res = await fetchRoomEquipments({ room: roomId, page: 1, limit: 100 });
      console.log('loadEquipments - fetched for room:', roomId, 'equipments:', res.items);
      setEquipments(res.items);
    } catch {
      message.error('Failed to load room equipment');
    } finally {
      setLoading(false);
    }
  };

  const loadAllConfigs = async (roomType: string) => {
    try {
      const res = await fetchRoomTypeConfigs({ room_type: roomType, page: 1, limit: 100 });
      // Load all configs (both Mandatory and Optional)
      setOptionalConfigs(res.items);
    } catch { /* silent */ }
  };

  useEffect(() => { loadRooms(); }, []);

  useEffect(() => {
    if (selectedRoomId) loadEquipments(selectedRoomId);
    else setEquipments([]);
  }, [selectedRoomId]);

  const handleOpenModal = () => {
    if (!selectedRoom) return;
    form.resetFields();
    form.setFieldsValue({ quantity: 1 });
    setAddError(null);
    loadAllConfigs(selectedRoom.room_type as string);
    setModalOpen(true);
  };

  const handleAddOptional = async () => {
    try {
      const values = await form.validateFields();
      const selectedTemplateId = values.template;

      console.log('handleAddOptional - selectedTemplateId:', selectedTemplateId);
      console.log('handleAddOptional - equipments:', equipments);

      // Get the selected equipment name for display
      const selectedConfig = optionalConfigs.find((c) => {
        const tpl = typeof c.template === 'object' ? c.template : null;
        return tpl && String(tpl.id) === String(selectedTemplateId);
      });

      const selectedEquipmentName = selectedConfig
        ? (typeof selectedConfig.template === 'object' ? selectedConfig.template.equipment_name : 'Unknown')
        : 'Unknown';

      // Check if equipment already exists in this room
      const existingEquipment = equipments.find((e) => {
        const tpl = typeof e.template === 'object' ? e.template : null;
        return tpl && String(tpl.id) === String(selectedTemplateId);
      });

      if (existingEquipment) {
        setAddError(`"${selectedEquipmentName}" already exists in this room (current quantity: ${existingEquipment.quantity}). Use the Edit button to update the quantity instead.`);
        return;
      }

      setAddError(null);
      // Proceed with adding equipment
      await performAddEquipment(values);
    } catch (error: any) {
      if (error?.errorFields) return;
      const errMsg = Array.isArray(error?.message) ? error.message.join(', ') : error?.message || 'Failed to add equipment';
      setAddError(errMsg);
    }
  };

  const performAddEquipment = async (values: any) => {
    try {
      setAddLoading(true);
      await addRoomEquipment({ room: selectedRoomId!, template: values.template, quantity: values.quantity });
      message.success('Equipment added successfully');
      setModalOpen(false);
      setAddError(null);
      form.resetFields();
      loadEquipments(selectedRoomId!);
    } catch (error: any) {
      const errMsg = Array.isArray(error?.message) ? error.message.join(', ') : error?.message || 'Failed to add equipment';
      setAddError(errMsg);
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditEquipment = (equipment: RoomEquipment) => {
    setEditing(equipment);
    editForm.setFieldsValue({
      quantity: equipment.quantity,
      status: equipment.status,
      condition_notes: equipment.condition_notes,
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    try {
      const values = await editForm.validateFields();
      setEditLoading(true);
      await updateRoomEquipment(editing.id, {
        quantity: values.quantity,
        status: values.status,
        condition_notes: values.condition_notes,
      });
      message.success('Equipment updated successfully');
      setEditModalOpen(false);
      setEditing(null);
      loadEquipments(selectedRoomId!);
    } catch (error: any) {
      if (error?.errorFields) return;
      const errMsg = Array.isArray(error?.message) ? error.message.join(', ') : error?.message || 'Failed to update equipment';
      message.error(errMsg);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteEquipment = async () => {
    if (!deleting) return;
    try {
      setDeleteLoading(true);
      await deleteRoomEquipment(deleting.id);
      message.success('Equipment removed successfully');
      setDeleteModalOpen(false);
      setDeleting(null);
      loadEquipments(selectedRoomId!);
    } catch (error: any) {
      const errMsg = Array.isArray(error?.message) ? error.message.join(', ') : error?.message || 'Failed to remove equipment';
      message.error(errMsg);
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDeleteModal = (equipment: RoomEquipment) => {
    setDeleting(equipment);
    setDeleteModalOpen(true);
  };

  const roomCode = (() => {
    if (!selectedRoom) return '';
    const blockName = typeof selectedRoom.block === 'object' && selectedRoom.block !== null
      ? (selectedRoom.block as any).block_name
      : '';
    return blockName ? `${blockName}-${selectedRoom.room_number}` : selectedRoom.room_number;
  })();

  const columns: ColumnsType<RoomEquipment> = [
    {
      title: 'Equipment Code',
      key: 'equipment_code',
      width: 220,
      render: (_: any, record: RoomEquipment) => {
        const equipName = typeof record.template === 'object' ? record.template.equipment_name : '';
        const code = roomCode && equipName ? `${roomCode}-${equipName}` : (equipName || '-');
        return <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{code}</span>;
      },
    },
    {
      title: 'Equipment',
      dataIndex: 'template',
      key: 'template',
      render: (tpl: RoomEquipment['template']) => {
        if (typeof tpl === 'object' && tpl !== null) {
          return (
            <div>
              <div className="font-medium text-gray-900">{tpl.equipment_name}</div>
              {tpl.brand && <div className="text-xs text-gray-400">{tpl.brand}{tpl.model ? ` - ${tpl.model}` : ''}</div>}
            </div>
          );
        }
        return '-';
      },
    },
    {
      title: 'Category',
      dataIndex: 'template',
      key: 'category',
      width: 130,
      render: (tpl: RoomEquipment['template']) => {
        if (typeof tpl === 'object' && tpl?.category && typeof tpl.category === 'object') {
          return <Tag color="geekblue">{tpl.category.category_name}</Tag>;
        }
        return '-';
      },
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 60,
      align: 'center',
      render: (qty: number) => <span className="font-semibold">{qty}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] || 'default'} className="capitalize">{status}</Tag>
      ),
    },
    {
      title: 'Assigned At',
      dataIndex: 'assigned_at',
      key: 'assigned_at',
      width: 120,
      render: (date: string) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'Action',
      key: 'action',
      width: 180,
      align: 'center',
      render: (_: any, record: RoomEquipment) => (
        <div className="flex gap-2">
          <Button
            size="small"
            onClick={async () => {
              setHistoryEquipment(record);
              setHistoryOpen(true);
              setHistoryLoading(true);
              try {
                const allItems: EquipmentHistoryItem[] = [];
                let reqPage = 1;
                const pageSize = 500;
                let repairedTotal = 0;
                let totalPages = 1;
                do {
                  const res = await fetchRoomEquipmentHistory(record.id, { page: reqPage, limit: pageSize });
                  if (reqPage === 1) {
                    repairedTotal = Number(res.repairedCount) || 0;
                  }
                  allItems.push(...(Array.isArray(res.items) ? res.items : []));
                  totalPages = res.pagination?.totalPages ?? 1;
                  reqPage += 1;
                } while (reqPage <= totalPages);
                setHistoryItems(allItems);
                setRepairedCount(repairedTotal);
              } catch (error: any) {
                setHistoryItems([]);
                setRepairedCount(0);
                const errMsg = Array.isArray(error?.message)
                  ? error.message.join(', ')
                  : error?.message || 'Failed to load equipment history';
                message.error(errMsg);
              } finally {
                setHistoryLoading(false);
              }
            }}
          >
            History
          </Button>
          <Button size="small" onClick={() => handleEditEquipment(record)}>Edit</Button>
          <Button danger size="small" onClick={() => openDeleteModal(record)}>Delete</Button>
        </div>
      ),
    },
  ];

  const roomOptions = rooms
    .map((r) => {
      const blockName = typeof r.block === 'object' && r.block !== null ? (r.block as any).block_name : '';
      return {
        value: r.id,
        label: blockName ? `${blockName}-${r.room_number}` : r.room_number,
        blockName,
        roomNumber: r.room_number,
      };
    })
    .sort((a, b) => {
      if (a.blockName !== b.blockName) return a.blockName.localeCompare(b.blockName);
      return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
    })
    .map(({ value, label }) => ({ value, label }));

  const optionalTemplateOptions = optionalConfigs.map((c) => {
    const tpl = typeof c.template === 'object' && c.template !== null ? c.template : null;
    if (!tpl) return null;
    return {
      value: tpl.id,
      label: tpl.equipment_name,
    };
  }).filter(Boolean) as { value: string; label: string }[];

  return (
    <>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Select
            placeholder="Select a room to view equipment..."
            value={selectedRoomId}
            onChange={(v) => setSelectedRoomId(v)}
            showSearch
            optionFilterProp="label"
            allowClear
            className="w-80"
            options={roomOptions}
          />
          {selectedRoomId && (
            <span className="text-xs text-gray-400">{equipments.length} item(s)</span>
          )}
        </div>
        {selectedRoomId && (
          <Button type="primary" icon={<Plus size={14} />} onClick={handleOpenModal}>
            Add Equipment
          </Button>
        )}
      </div>

      {!selectedRoomId ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a room above to view its equipment</p>
        </div>
      ) : (
        <Table<RoomEquipment>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={equipments}
          pagination={false}
          size="small"
          scroll={{ x: 800 }}
          locale={{ emptyText: 'No equipment assigned to this room yet.' }}
        />
      )}

      <Modal
        open={modalOpen}
        title="Add Equipment to Room"
        onCancel={() => { setModalOpen(false); setAddError(null); }}
        onOk={handleAddOptional}
        okText="Add"
        okButtonProps={{ loading: addLoading }}
        cancelText="Cancel"
        destroyOnHidden
        width={460}
      >
        {optionalTemplateOptions.length === 0 ? (
          <div className="py-6 text-center text-gray-400 text-sm">
            No equipment configured for this room type.<br />
            <span className="text-xs">Go to "Default Room Setup" tab to configure equipment.</span>
          </div>
        ) : (
          <Form form={form} layout="vertical" className="mt-4">
            <Form.Item
              label="Equipment"
              name="template"
              rules={[{ required: true, message: 'Please select equipment' }]}
            >
              <Select
                placeholder="Select equipment (Mandatory or Optional)..."
                showSearch
                optionFilterProp="label"
                options={optionalTemplateOptions}
                onChange={() => setAddError(null)}
              />
            </Form.Item>
            <Form.Item
              label="Quantity"
              name="quantity"
              rules={[{ required: true, message: 'Please enter quantity' }]}
            >
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
            {addError && <Alert type="error" message={addError} showIcon className="mt-1" />}
          </Form>
        )}
      </Modal>

      <Modal
        open={deleteModalOpen}
        title="Remove Equipment"
        onCancel={() => setDeleteModalOpen(false)}
        onOk={handleDeleteEquipment}
        okText="Remove"
        okButtonProps={{ danger: true, loading: deleteLoading }}
        cancelText="Cancel"
        destroyOnHidden
      >
        <div className="flex gap-3">
          <ExclamationCircleOutlined className="text-lg text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Are you sure you want to remove this equipment?</p>
            {deleting && (
              <div className="text-sm text-gray-600 mt-2">
                <p><strong>Equipment:</strong> {typeof deleting.template === 'object' ? deleting.template.equipment_name : 'Unknown'}</p>
                <p><strong>Code:</strong> <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">{(() => { const n = typeof deleting.template === 'object' ? deleting.template.equipment_name : ''; return roomCode && n ? `${roomCode}-${n}` : (n || '-'); })()}</span></p>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">This action cannot be undone.</p>
          </div>
        </div>
      </Modal>

      <Modal
        open={historyOpen}
        title={
          <div className="space-y-1">
            <div>Equipment repair history</div>
            <div className="text-xs text-gray-500">
              Repairs: <span className="font-semibold">{repairedCount}</span>
              {historyEquipment && typeof historyEquipment.template === 'object'
                ? ` · ${historyEquipment.template.equipment_name}`
                : ''}
            </div>
          </div>
        }
        onCancel={() => {
          setHistoryOpen(false);
          setHistoryEquipment(null);
          setHistoryItems([]);
          setRepairedCount(0);
        }}
        footer={null}
        destroyOnHidden
        width={860}
      >
        <Table<EquipmentHistoryItem>
          rowKey="id"
          loading={historyLoading}
          dataSource={historyItems}
          pagination={false}
          size="small"
          columns={[
            {
              title: 'Action',
              dataIndex: 'action_type',
              width: 120,
              render: (v: string) => <Tag className="capitalize">{v}</Tag>,
            },
            {
              title: 'Performed at',
              dataIndex: 'performed_at',
              width: 170,
              render: (v: string) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '-'),
            },
            {
              title: 'Performed by',
              dataIndex: 'performed_by',
              width: 200,
              render: (p: any) => (p?.full_name ? `${p.full_name}${p.staff_code ? ` (${p.staff_code})` : ''}` : '-'),
            },
            {
              title: 'Notes',
              dataIndex: 'notes',
              render: (v: string) => v || '-',
            },
          ]}
        />
      </Modal>

      <Modal
        open={editModalOpen}
        title="Edit Equipment"
        onCancel={() => {
          setEditModalOpen(false);
          setEditing(null);
        }}
        onOk={handleSaveEdit}
        okText="Save"
        okButtonProps={{ loading: editLoading }}
        cancelText="Cancel"
        destroyOnHidden
        width={480}
      >
        {editing && (
          <>
            <div className="mb-4 pb-4 border-b">
              <p className="text-sm text-gray-600">
                <strong>Equipment:</strong> {typeof editing.template === 'object' ? editing.template.equipment_name : 'Unknown'}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Code:</strong> <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">{(() => { const n = typeof editing.template === 'object' ? editing.template.equipment_name : ''; return roomCode && n ? `${roomCode}-${n}` : (n || '-'); })()}</span>
              </p>
            </div>
            <Form form={editForm} layout="vertical">
              <Form.Item
                label="Quantity"
                name="quantity"
                rules={[{ required: true, message: 'Please enter quantity' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select
                  placeholder="Select status..."
                  options={[
                    { label: 'Good', value: 'good' },
                    { label: 'Normal', value: 'normal' },
                    { label: 'Damaged', value: 'damaged' },
                    { label: 'Broken', value: 'broken' },
                    { label: 'Missing', value: 'missing' },
                  ]}
                />
              </Form.Item>
              <Form.Item
                label="Condition Notes"
                name="condition_notes"
              >
                <Input.TextArea rows={3} placeholder="Add any notes about the equipment condition..." />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

    </>
  );
}

// ==================== MAIN PAGE ====================

export default function AdminFacilitiesPage() {
  const [activeTab, setActiveTab] = useState('categories');
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  const tabItems = [
    {
      key: 'categories',
      label: (<span className="flex items-center gap-2"><Layers size={15} />Categories</span>),
      children: (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Layers size={18} className="text-orange-600" />
            <div className="font-semibold text-gray-900">Equipment Categories</div>
          </div>
          <CategoriesTab onDataChange={triggerRefresh} />
        </div>
      ),
    },
    {
      key: 'templates',
      label: (<span className="flex items-center gap-2"><Box size={15} />Device Templates</span>),
      children: (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Box size={18} className="text-orange-600" />
            <div className="font-semibold text-gray-900">Device Templates</div>
          </div>
          <TemplatesTab onDataChange={triggerRefresh} refreshKey={refreshKey} />
        </div>
      ),
    },
    {
      key: 'room-defaults',
      label: (<span className="flex items-center gap-2"><Settings2 size={15} />Default Room Setup</span>),
      children: (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 size={18} className="text-orange-600" />
            <div className="font-semibold text-gray-900">Default Equipment per Room Type</div>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Define which equipment is automatically assigned when a room of this type is created.
          </p>
          <DefaultRoomSetupTab onDataChange={triggerRefresh} refreshKey={refreshKey} />
        </div>
      ),
    },
    {
      key: 'room-equipment',
      label: (<span className="flex items-center gap-2"><ClipboardList size={15} />Room Equipment</span>),
      children: (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList size={18} className="text-orange-600" />
            <div className="font-semibold text-gray-900">Equipment in Room</div>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            View all equipment assigned to a specific room (auto-assigned on room creation).
          </p>
          <RoomEquipmentTab />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Package size={20} className="text-orange-600" />
            </div>
            Facility Management
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-[52px]">
            Manage equipment categories, device templates, and default room setup.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-gray-500 font-medium">Categories</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                <CountDisplay fetchFn={() => fetchEquipmentCategories({ page: 1, limit: 1 })} refreshKey={refreshKey} />
              </div>
            </div>
            <div className="bg-blue-50 text-blue-600 w-10 h-10 rounded-xl flex items-center justify-center"><Layers size={20} /></div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-gray-500 font-medium">Device Templates</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                <CountDisplay fetchFn={() => fetchEquipmentTemplates({ page: 1, limit: 1 })} refreshKey={refreshKey} />
              </div>
            </div>
            <div className="bg-purple-50 text-purple-600 w-10 h-10 rounded-xl flex items-center justify-center"><Box size={20} /></div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-gray-500 font-medium">Room Type Configs</div>
              <div className="mt-1 text-2xl font-bold text-gray-900">
                <CountDisplay fetchFn={() => fetchRoomTypeConfigs({ page: 1, limit: 1 })} refreshKey={refreshKey} />
              </div>
            </div>
            <div className="bg-orange-50 text-orange-600 w-10 h-10 rounded-xl flex items-center justify-center"><Settings2 size={20} /></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} className="facility-tabs" />
    </div>
  );
}

// Small helper to display total count from API
function CountDisplay({ fetchFn, refreshKey }: { fetchFn: () => Promise<{ pagination: { total: number } }>; refreshKey: number }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetchFn()
      .then((res) => setCount(res.pagination.total))
      .catch(() => setCount(0));
  }, [refreshKey]);

  if (count === null) return <span className="text-gray-300">--</span>;
  return <>{count}</>;
}
