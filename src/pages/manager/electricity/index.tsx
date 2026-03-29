import { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Select, Input, Modal, Form, DatePicker, InputNumber,
  Space, Typography, Card, Upload, message, Popconfirm, Tag,
} from 'antd';
import {
  UploadOutlined, PlusOutlined, ExportOutlined, ReloadOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import dayjs from 'dayjs';
import {
  getEWUsages, createEWUsage, updateEWUsage, resetMeter,
  importEWUsages, exportEWUsages, recalculateEWUsages,
  type EWUsage, type EWUsageFilter, type CreateEWUsageDto, type UpdateEWUsageDto,
} from '@/lib/actions/ewUsage';
import { fetchBlocks, type Block } from '@/lib/actions';

const { Title, Text } = Typography;
const { Option } = Select;

const MONTHS = [
  { label: 'All', value: '' },
  ...Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}`, value: `${i + 1}` })),
];

const YEARS = [
  { label: 'All', value: '' },
  ...Array.from({ length: 5 }, (_, i) => {
    const y = new Date().getFullYear() - i;
    return { label: `${y}`, value: `${y}` };
  }),
];

export default function ElectricityPage() {
  const [data, setData] = useState<EWUsage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);

  // Filters
  const [blockName, setBlockName] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  // Modals
  const [importOpen, setImportOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importFile, setImportFile] = useState<UploadFile | null>(null);
  const [importResult, setImportResult] = useState<null | { created: number; duplicateInFile: number; duplicateInDB: number; failed: number; errors: { row: number; block: string; error: string }[] }>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<EWUsage | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchData = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const params: EWUsageFilter = { page: p, limit: 20 };
      if (blockName) params.block_name = blockName;
      if (filterType) params.type = filterType as 'electric' | 'water';
      if (filterMonth) params.month = filterMonth;
      if (filterYear) params.year = filterYear;

      const res = await getEWUsages(params);
      setData(res.data);
      setTotal(res.total);
    } catch {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [blockName, filterType, filterMonth, filterYear, page]);

  useEffect(() => { fetchData(1); setPage(1); }, []);

  useEffect(() => {
    fetchBlocks().then((res) => setBlocks(Array.isArray(res) ? res : (res as { data: Block[] }).data ?? [])).catch(() => {});
  }, []);

  const handleSearch = () => { setPage(1); fetchData(1); };

  const handleExport = async () => {
    try {
      const params: EWUsageFilter = {};
      if (blockName) params.block_name = blockName;
      if (filterType) params.type = filterType as 'electric' | 'water';
      if (filterMonth) params.month = filterMonth;
      if (filterYear) params.year = filterYear;
      await exportEWUsages(params);
    } catch {
      message.error('Export failed');
    }
  };

  const handleRecalculate = async () => {
    try {
      const res = await recalculateEWUsages();
      message.success(res.message);
    } catch {
      message.error('Recalculation failed');
    }
  };

  // ── Import ──────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!importFile?.originFileObj) { message.warning('Please select a file'); return; }
    setImportLoading(true);
    try {
      const result = await importEWUsages(importFile.originFileObj as File);
      setImportResult(result);
      fetchData(1);
    } catch {
      message.error('Import failed');
    } finally {
      setImportLoading(false);
    }
  };

  const closeImport = () => { setImportOpen(false); setImportFile(null); setImportResult(null); };

  // ── Create / Edit ────────────────────────────────────────────────
  const openCreate = () => {
    setEditRecord(null);
    form.resetFields();
    setFormOpen(true);
  };

  const openEdit = (record: EWUsage) => {
    setEditRecord(record);
    form.setFieldsValue({
      block: record.block,
      type: record.type,
      meter_left: record.meter_left,
      meter_right: record.meter_right,
      date: record.date ? dayjs(record.date) : null,
      term: record.term,
    });
    setFormOpen(true);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      setFormLoading(true);
      const payload = { ...values, date: values.date?.toISOString() };

      if (editRecord) {
        const body: UpdateEWUsageDto = {
          type: payload.type,
          meter_left: payload.meter_left,
          meter_right: payload.meter_right,
          date: payload.date,
          term: payload.term,
        };
        await updateEWUsage(editRecord.id, body);
        message.success('Updated successfully');
      } else {
        const body: CreateEWUsageDto = {
          block: payload.block,
          type: payload.type,
          meter_left: payload.meter_left,
          meter_right: payload.meter_right,
          date: payload.date,
          term: payload.term,
        };
        await createEWUsage(body);
        message.success('Created successfully');
      }

      setFormOpen(false);
      fetchData(1);
    } catch (err: unknown) {
      if (err instanceof Error) message.error(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // ── Reset meter ──────────────────────────────────────────────────
  const handleReset = async (id: string) => {
    try {
      await resetMeter(id);
      message.success('Meter reset');
      fetchData(page);
    } catch {
      message.error('Reset failed');
    }
  };

  // ── Table columns ────────────────────────────────────────────────
  const columns = [
    {
      title: 'Id',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (_: string, __: EWUsage, index: number) => (page - 1) * 20 + index + 1,
    },
    {
      title: 'Tên block',
      dataIndex: 'block_name',
      key: 'block_name',
      width: 100,
    },
    {
      title: 'Loại sử dụng',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type: string) => (
        <Tag color={type === 'electric' ? 'orange' : 'blue'}>
          {type === 'electric' ? 'Điện' : 'Nước'}
        </Tag>
      ),
    },
    {
      title: 'Ngày Tạo',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (d: string) => d ? new Date(d).toLocaleDateString('vi-VN') : '—',
    },
    {
      title: 'Học Kỳ',
      dataIndex: 'term',
      key: 'term',
      width: 100,
    },
    {
      title: 'Chỉ số công tơ',
      dataIndex: 'meter_left',
      key: 'meter_left',
      width: 120,
    },
    {
      title: 'Tiêu thụ',
      dataIndex: 'consumption',
      key: 'consumption',
      width: 80,
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
      width: 60,
    },
    {
      title: 'Reset',
      key: 'reset',
      width: 90,
      render: (r: EWUsage) => (
        <Popconfirm title="Reset công tơ này?" onConfirm={() => handleReset(r.id)} okText="Reset" cancelText="Huỷ">
          <Button size="small" danger>Reset</Button>
        </Popconfirm>
      ),
    },
    {
      title: 'Chỉnh',
      key: 'edit',
      width: 80,
      render: (r: EWUsage) => (
        <Button size="small" type="link" onClick={() => openEdit(r)}>Chỉnh</Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>EW Usages</Title>
      </div>

      {/* Action buttons */}
      <Space wrap style={{ marginBottom: 16 }}>
        <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>
          Import dữ liệu
        </Button>
        <Button icon={<PlusOutlined />} type="primary" onClick={openCreate}>
          Tạo bản ghi mới
        </Button>
        <Button icon={<ReloadOutlined />} onClick={() => fetchData(page)}>
          Reset công tơ (all)
        </Button>
        <Button icon={<ThunderboltOutlined />} onClick={handleRecalculate}>
          Tính lại điện nước mỗi sinh viên
        </Button>
        <Button icon={<ExportOutlined />} onClick={handleExport}>
          Export dữ liệu
        </Button>
      </Space>

      {/* Filters */}
      <Card title="Bộ lọc" style={{ marginBottom: 16 }}>
        <Space wrap>
          <div>
            <Text>Tên Block</Text>
            <br />
            <Input
              placeholder="A101"
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
              style={{ width: 160 }}
              onPressEnter={handleSearch}
            />
          </div>
          <div>
            <Text>Loại</Text>
            <br />
            <Select value={filterType} onChange={setFilterType} style={{ width: 160 }}>
              <Option value="">All</Option>
              <Option value="electric">Electric (Điện)</Option>
              <Option value="water">Water (Nước)</Option>
            </Select>
          </div>
          <div>
            <Text>Tháng</Text>
            <br />
            <Select value={filterMonth} onChange={setFilterMonth} style={{ width: 100 }}>
              {MONTHS.map((m) => <Option key={m.value} value={m.value}>{m.label}</Option>)}
            </Select>
          </div>
          <div>
            <Text>Năm</Text>
            <br />
            <Select value={filterYear} onChange={setFilterYear} style={{ width: 100 }}>
              {YEARS.map((y) => <Option key={y.value} value={y.value}>{y.label}</Option>)}
            </Select>
          </div>
          <div style={{ paddingTop: 20 }}>
            <Button type="primary" onClick={handleSearch}>Search</Button>
          </div>
        </Space>
        <div style={{ marginTop: 8 }}>
          <Text strong>Kết quả: {total}</Text>
        </div>
      </Card>

      {/* Table */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: page,
          pageSize: 20,
          total,
          onChange: (p) => { setPage(p); fetchData(p); },
          showTotal: (t) => `Total ${t}`,
        }}
        size="small"
        scroll={{ x: 900 }}
      />

      {/* Import Modal */}
      <Modal
        title="Import dữ liệu điện nước"
        open={importOpen}
        onCancel={closeImport}
        footer={
          importResult ? (
            <Button onClick={closeImport}>Đóng</Button>
          ) : (
            <Space>
              <Button onClick={closeImport}>Huỷ</Button>
              <Button type="primary" loading={importLoading} onClick={handleImport}>Import</Button>
            </Space>
          )
        }
      >
        {!importResult ? (
          <div>
            <p style={{ marginBottom: 12, color: '#666', fontSize: 13 }}>
              File Excel định dạng: <b>Dorm | Block | Type (E/W) | Date | Meter | Term</b>
              <br />
              <span style={{ color: '#999' }}>Type: E = Điện, W = Nước. Meter: số công tơ hiện tại (≥ 0).</span>
            </p>
            <Upload
              accept=".xlsx,.xls"
              maxCount={1}
              beforeUpload={() => false}
              onChange={({ fileList }) => setImportFile(fileList[0] ?? null)}
            >
              <Button icon={<UploadOutlined />}>Chọn file Excel</Button>
            </Upload>
          </div>
        ) : (
          <div>
            <p>✅ Tạo mới: <b>{importResult.created}</b></p>
            <p>⚠️ Trùng trong file: <b>{importResult.duplicateInFile}</b></p>
            <p>🔁 Đã tồn tại trong DB: <b>{importResult.duplicateInDB}</b></p>
            <p>❌ Lỗi khác: <b>{importResult.failed}</b></p>
            {importResult.errors.length > 0 && (
              <div style={{ maxHeight: 200, overflowY: 'auto', fontSize: 12, background: '#fff1f0', padding: 8, borderRadius: 4 }}>
                {importResult.errors.map((e, i) => (
                  <div key={i}>Row {e.row} ({e.block}): {e.error}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create / Edit Modal */}
      <Modal
        title={editRecord ? 'Chỉnh sửa bản ghi' : 'Tạo bản ghi mới'}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={handleFormSubmit}
        confirmLoading={formLoading}
        okText={editRecord ? 'Lưu' : 'Tạo'}
        cancelText="Huỷ"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {!editRecord && (
            <Form.Item name="block" label="Block" rules={[{ required: true, message: 'Chọn block' }]}>
              <Select showSearch placeholder="Chọn block" filterOption={(input, opt) => (opt?.children as string)?.toLowerCase().includes(input.toLowerCase())}>
                {blocks.map((b) => (
                  <Option key={b.id} value={b.id}>{b.block_name || b.block_code}</Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item name="type" label="Loại" rules={[{ required: true }]}>
            <Select>
              <Option value="electric">Điện (Electric)</Option>
              <Option value="water">Nước (Water)</Option>
            </Select>
          </Form.Item>
          <Form.Item name="meter_left" label="Công tơ L (cũ)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="meter_right" label="Công tơ R (mới)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="date" label="Ngày" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="term" label="Học kỳ" rules={[{ required: true }]}>
            <Input placeholder="Fall - 2025" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
