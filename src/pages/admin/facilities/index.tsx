import { useEffect, useState } from 'react';
import {
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
import { Layers, Box, Settings2, Plus, Package } from 'lucide-react';
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
  type EquipmentCategory,
  type EquipmentTemplate,
  type RoomTypeEquipmentConfig,
} from '@/lib/actions/admin';

// ==================== HELPERS ====================

const roomTypeLabels: Record<string, string> = {
  '2_person': '2-Person Room',
  '4_person': '4-Person Room',
  '6_person': '6-Person Room',
  '8_person': '8-Person Room',
};

const roomTypeColors: Record<string, string> = {
  '2_person': 'blue',
  '4_person': 'green',
  '6_person': 'orange',
  '8_person': 'purple',
};

// ==================== CATEGORIES TAB ====================

function CategoriesTab({ onDataChange }: { onDataChange: () => void }) {
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentCategory | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<EquipmentCategory | null>(null);
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
      message.error(errMsg);
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
          <Button danger size="small" onClick={() => { setDeleting(record); setDeleteModalOpen(true); }}>Delete</Button>
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
        onCancel={() => { setDeleteModalOpen(false); setDeleting(null); }}
        onOk={async () => {
          if (!deleting) return;
          try {
            await deleteEquipmentCategory(deleting.id);
            message.success('Category deleted successfully');
            setDeleteModalOpen(false);
            setDeleting(null);
            loadData();
            onDataChange();
          } catch (error: any) {
            const errMsg = Array.isArray(error?.message) ? error.message.join(', ') : error?.message || 'Failed to delete category';
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
              <p>Are you sure you want to delete category <span className="font-semibold text-red-600">"{deleting.category_name}"</span>?</p>
              <p className="text-xs text-gray-500 mt-1">Categories with linked templates cannot be deleted.</p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

// ==================== TEMPLATES TAB ====================

function TemplatesTab({ onDataChange, refreshKey }: { onDataChange: () => void; refreshKey: number }) {
  const [templates, setTemplates] = useState<EquipmentTemplate[]>([]);
  const [categories, setCategories] = useState<EquipmentCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentTemplate | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<EquipmentTemplate | null>(null);
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
      message.error(errMsg);
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
          <Button danger size="small" onClick={() => { setDeleting(record); setDeleteModalOpen(true); }}>Delete</Button>
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
          <Form.Item label="Specifications" name="specifications"><Input.TextArea rows={2} placeholder="Technical specifications or notes" /></Form.Item>
        </Form>
      </Modal>

      <Modal open={deleteModalOpen} title="Confirm Delete Template" onCancel={() => { setDeleteModalOpen(false); setDeleting(null); }} onOk={async () => {
        if (!deleting) return;
        try {
          await deleteEquipmentTemplate(deleting.id);
          message.success('Template deleted successfully');
          setDeleteModalOpen(false);
          setDeleting(null);
          loadData();
          onDataChange();
        } catch (error: any) {
          const errMsg = Array.isArray(error?.message) ? error.message.join(', ') : error?.message || 'Failed to delete template';
          message.error(errMsg);
        }
      }} okText="Delete" cancelText="Cancel" okButtonProps={{ danger: true }} centered>
        {deleting && (
          <div className="flex items-start gap-2">
            <ExclamationCircleOutlined className="mt-1 text-orange-500" />
            <div>
              <p>Are you sure you want to delete template <span className="font-semibold text-red-600">"{deleting.equipment_name}"</span>?</p>
              <p className="text-xs text-gray-500 mt-1">Templates used in room equipment or default room setup configs cannot be deleted.</p>
            </div>
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
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RoomTypeEquipmentConfig | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<RoomTypeEquipmentConfig | null>(null);
  const [filterRoomType, setFilterRoomType] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();

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
      render: (type: string) => <Tag color={roomTypeColors[type] || 'default'}>{roomTypeLabels[type] || type}</Tag>,
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
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'Optional'}</Tag>,
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
          options={Object.entries(roomTypeLabels).map(([value, label]) => ({ label, value }))}
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
              options={Object.entries(roomTypeLabels).map(([value, label]) => ({ label, value }))}
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
                <span className="font-semibold">{roomTypeLabels[deleting.room_type]}</span> defaults?
              </p>
              <p className="text-xs text-gray-500 mt-1">This won't affect equipment already assigned to rooms.</p>
            </div>
          </div>
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
