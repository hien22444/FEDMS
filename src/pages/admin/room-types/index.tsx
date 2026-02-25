import { useEffect, useState } from 'react';
import {
  App,
  Button,
  Form,
  InputNumber,
  Table,
  Tag,
  Modal,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DoorClosed } from 'lucide-react';
import {
  fetchRoomTypePricing,
  updateRoomTypePricing,
  type RoomType,
  type RoomTypePriceMap,
} from '@/lib/actions/admin';

interface RoomTypeRow {
  id?: string; // backend key, e.g. "3_person"
  beds: number;
  price: number;
}

export default function AdminRoomTypesPage() {
  const { modal } = App.useApp();
  const [data, setData] = useState<RoomTypeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // null = add
  const [form] = Form.useForm();

  const loadPrices = async () => {
    try {
      setLoading(true);
      const res = await fetchRoomTypePricing();
      const rows = Object.entries(res.prices || {}).map(([key, price]) => {
        const match = /^(\d+)_person$/i.exec(key);
        const beds = match ? Number(match[1]) : 2;
        return { id: key, beds, price };
      });
      setData(rows);
    } catch (error: any) {
      console.error(error);
      message.error('Failed to load room type pricing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrices();
  }, []);

  const openAddModal = () => {
    setEditingIndex(null);
    form.resetFields();
    form.setFieldsValue({ beds: 2, price: 0 });
    setEditorOpen(true);
  };

  const openEditModal = (record: RoomTypeRow, index: number) => {
    setEditingIndex(index);
    form.resetFields();
    form.setFieldsValue({ id: record.id, beds: record.beds, price: record.price });
    setEditorOpen(true);
  };

  const persistRoomTypePrices = async (rows: RoomTypeRow[], showSuccess = false) => {
    try {
      setSaving(true);
      const prices: RoomTypePriceMap = {};
      const seenKeys = new Set<string>();

      rows.forEach((row) => {
        const beds = Number(row.beds);
        const price = Number(row.price);
        if (!Number.isFinite(beds) || beds <= 1) {
          throw new Error('Each room type must have beds > 1');
        }
        if (!Number.isFinite(price) || price < 0) {
          throw new Error('Price must be a non-negative number');
        }
        const key = `${beds}_person` as RoomType;
        if (seenKeys.has(key)) {
          throw new Error(`Room type "${key}" is duplicated. Please remove duplicates.`);
        }
        seenKeys.add(key);
        prices[key] = price;
      });

      const res = await updateRoomTypePricing(prices);

      // Refresh from backend to ensure we have the latest ids/prices
      const normalized = Object.entries(res.prices || {}).map(([key, price]) => {
        const match = /^(\d+)_person$/i.exec(key);
        const beds = match ? Number(match[1]) : 2;
        return { id: key, beds, price };
      });
      setData(normalized);

      if (showSuccess) {
        modal.success({
          title: 'Saved successfully',
          content: 'Room type pricing has been updated.',
          okText: 'OK',
        });
      }
    } catch (error: any) {
      const raw = Array.isArray(error?.message) ? error.message.join(', ') : (error?.message || '');
      // eslint-disable-next-line no-console
      console.error('Failed to persist room type prices', error, raw);
      modal.error({
        title: 'Failed to update room type pricing',
        content: raw || 'Failed to update room type pricing.',
        okText: 'OK',
        zIndex: 2000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (record: RoomTypeRow, index: number) => {
    // eslint-disable-next-line no-console
    console.log('RoomType delete clicked', { record, index });

    modal.confirm({
      title: 'Delete room type',
      content: `Are you sure you want to delete type "${record.beds}_person"?`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      async onOk() {
        try {
          const next = data.filter((_, i) => i !== index);
          await persistRoomTypePrices(next, false);
        } catch (error: any) {
          const raw = Array.isArray(error?.message)
            ? error.message.join(', ')
            : error?.message || '';
          // eslint-disable-next-line no-console
          console.error('Failed to delete room type', error, raw);
          modal.error({
            title: 'Cannot delete room type',
            content: raw || 'Failed to delete room type.',
            okText: 'OK',
            zIndex: 2000,
          });
        }
      },
    });
  };

  const handleSaveAll = async () => {
    await persistRoomTypePrices(data, true);
  };

  const handleEditorOk = async () => {
    try {
      const values = await form.validateFields();
      const beds = Number(values.beds);
      const price = Number(values.price);

      if (editingIndex === null) {
        const next = [...data, { beds, price }];
        await persistRoomTypePrices(next, false);
      } else {
        const next = [...data];
        next[editingIndex] = { ...next[editingIndex], price };
        await persistRoomTypePrices(next, false);
      }

      setEditorOpen(false);
    } catch (error: any) {
      if (error?.errorFields) {
        // AntD form validation error, already highlighted in form
        return;
      }
      const raw = Array.isArray(error?.message) ? error.message.join(', ') : (error?.message || '');
      message.error(raw || 'Failed to save room type');
    }
  };

  const columns: ColumnsType<RoomTypeRow> = [
    {
      title: 'Type',
      dataIndex: 'beds',
      key: 'type',
      render: (beds: number) => <Tag>{`${beds} person`}</Tag>,
    },
    // {
    //   title: 'Beds',
    //   dataIndex: 'beds',
    //   key: 'beds',
    //   width: 100,
    // },
    {
      title: 'Price / Semester',
      dataIndex: 'price',
      key: 'price',
      render: (value: number) => (
        <span className="text-xs">{Number(value).toLocaleString()}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_: unknown, record: RoomTypeRow, index: number) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => openEditModal(record, index)}>
            Edit
          </Button>
          <Button danger size="small" onClick={() => handleDelete(record, index)}>
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Room Type Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Define room types and their default price per semester.
          </p>
        </div>
        <Button type="primary" onClick={openAddModal}>
          Add Room Type
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <DoorClosed size={18} className="text-orange-600" />
          <div className="font-semibold text-gray-900">Room Type List</div>
        </div>

        <Table<RoomTypeRow>
          rowKey={(row) => row.id || `${row.beds}`}
          dataSource={data}
          columns={columns}
          loading={loading}
          pagination={false}
        />

        <div className="mt-4 flex justify-end">
        </div>
      </div>

      <Modal
        open={editorOpen}
        title={editingIndex === null ? 'Add Room Type' : 'Edit Room Type'}
        onCancel={() => setEditorOpen(false)}
        onOk={handleEditorOk}
        okText="Save"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="id" hidden>
            <input type="hidden" />
          </Form.Item>
          <Form.Item
            label="Persons"
            name="beds"
            rules={[
              { required: true, message: 'Please enter number of beds' },
              {
                validator: (_, value) => {
                  const n = Number(value);
                  if (!Number.isFinite(n) || n <= 1) {
                    return Promise.reject(new Error('Beds must be greater than 1'));
                  }
                  const currentIndex = editingIndex ?? -1;
                  const duplicated = data.some(
                    (row, idx) => row.beds === n && idx !== currentIndex,
                  );
                  if (duplicated) {
                    return Promise.reject(new Error('This room type already exists.'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              min={2}
              style={{ width: '100%' }}
              disabled={Boolean(form.getFieldValue('id'))}
            />
          </Form.Item>
          <Form.Item
            label="Price / Semester"
            name="price"
            rules={[{ required: true, message: 'Please enter price' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

