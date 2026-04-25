import { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Select, Input, Modal, Form, DatePicker, InputNumber,
  Space, Typography, Card, Upload, message, Popconfirm, Tag, Descriptions,
} from 'antd';
import {
  UploadOutlined, PlusOutlined, ExportOutlined, ThunderboltOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import {
  getEWUsages, createEWUsage, updateEWUsage, resetMeter,
  importEWUsages, exportEWUsages, recalculateEWUsages,
  type EWUsage, type EWUsageFilter, type CreateEWUsageDto, type UpdateEWUsageDto,
  type EWImportResult, type RecalculateResult,
} from '@/lib/actions/ewUsage';
import { fetchBlocks, type Block } from '@/lib/actions';
import { useWindowSize } from '@/hooks/useWindowSize';

const { Title, Text } = Typography;
const { Option } = Select;
const getErrorMessage = (error: unknown, fallback: string) =>
  (error as { message?: string })?.message || fallback;

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
  const { width } = useWindowSize();
  const isTablet = width >= 768;
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
  const [importResult, setImportResult] = useState<EWImportResult | null>(null);

  const [recalcLoading, setRecalcLoading] = useState(false);
  const [recalcResult, setRecalcResult] = useState<RecalculateResult | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<EWUsage | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form] = Form.useForm();

  // Reset modal
  const [resetOpen, setResetOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetForm] = Form.useForm();

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
    } catch (err) {
      message.error(getErrorMessage(err, 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  }, [blockName, filterType, filterMonth, filterYear, page]);

  useEffect(() => { fetchData(1); setPage(1); }, [fetchData]);

  useEffect(() => {
    fetchBlocks()
      .then((res) =>
        setBlocks(
          Array.isArray(res)
            ? res
            : ('items' in res && Array.isArray(res.items) ? res.items : [])
        )
      )
      .catch(() => {});
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
    } catch (err) {
      message.error(getErrorMessage(err, 'Export failed'));
    }
  };

  const handleRecalculate = async () => {
    setRecalcLoading(true);
    try {
      const normalizedBlockName = blockName.trim().toLowerCase();
      const matchedBlock = normalizedBlockName
        ? blocks.find((item) =>
          [item.block_name, item.block_code]
            .filter(Boolean)
            .some((value) => String(value).trim().toLowerCase() === normalizedBlockName)
        )
        : undefined;
      const res = await recalculateEWUsages({
        block: matchedBlock?.id,
        month: filterMonth || undefined,
        year: filterYear || undefined,
      });
      setRecalcResult(res);
      fetchData(page);
    } catch (err) {
      message.error(getErrorMessage(err, 'Recalculation failed'));
    } finally {
      setRecalcLoading(false);
    }
  };

  // ── Import ──────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!importFile?.originFileObj) { message.warning('Please select a file'); return; }
    setImportLoading(true);
    try {
      const result = await importEWUsages(importFile.originFileObj as File);
      setImportResult(result);
      message.success('Import completed successfully');
      fetchData(1);
    } catch (err) {
      message.error(getErrorMessage(err, 'Import failed'));
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
      meter_right: record.meter_right,
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
          meter_right: payload.meter_right,
        };
        await updateEWUsage(editRecord.id, body);
        message.success('Updated successfully');
      } else {
        const body: CreateEWUsageDto = {
          block: payload.block,
          type: payload.type,
          meter_right: payload.meter_right,
          date: payload.date,
        };
        await createEWUsage(body);
        message.success('Created successfully');
      }

      setFormOpen(false);
      fetchData(1);
    } catch (err: unknown) {
      message.error(getErrorMessage(err, 'Failed to save usage record'));
    } finally {
      setFormLoading(false);
    }
  };

  // ── Reset meter ──────────────────────────────────────────────────
  const handleResetSubmit = async () => {
    try {
      const { block, type, meter_right, date } = await resetForm.validateFields();
      setResetLoading(true);
      await resetMeter(block, type, meter_right, date.toISOString());
      message.success('Meter baseline reset record created successfully');
      setResetOpen(false);
      resetForm.resetFields();
      fetchData(page);
    } catch (err) {
      message.error(getErrorMessage(err, 'Meter reset failed'));
    } finally {
      setResetLoading(false);
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
      title: 'Block Name',
      dataIndex: 'block_name',
      key: 'block_name',
      width: 100,
    },
    {
      title: 'Usage Type',
      dataIndex: 'type',
      key: 'type',
      width: 160,
      render: (_type: string, record: EWUsage) => (
        <Space size={4} wrap>
          <Tag color={record.type === 'electric' ? 'orange' : 'blue'}>
            {record.type === 'electric' ? 'Electric' : 'Water'}
          </Tag>
          {record.is_reset && <Tag color="purple">Reset</Tag>}
        </Space>
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (d: string) => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC' }).format(new Date(d)),
    },
    {
      title: 'Meter Reading',
      dataIndex: 'meter_right',
      key: 'meter_right',
      width: 120,
    },
    {
      title: 'Consumption',
      dataIndex: 'consumption',
      key: 'consumption',
      width: 80,
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      width: 60,
    },
    {
      title: 'Edit',
      key: 'edit',
      width: 80,
      render: (r: EWUsage) => (
        <Button size="small" type="link" onClick={() => openEdit(r)} disabled={!r.is_latest_editable}>Edit</Button>
      ),
    },
  ];

  return (
    <div style={{ padding: isTablet ? 24 : 0 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isTablet ? 'center' : 'flex-start',
          flexDirection: isTablet ? 'row' : 'column',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>EW Usages</Title>
      </div>

      {/* Action buttons */}
      <Space wrap style={{ marginBottom: 16 }}>
        <Button icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>
          Import Data
        </Button>
        <Button icon={<PlusOutlined />} type="primary" onClick={openCreate}>
          Create New Record
        </Button>
        <Button danger onClick={() => { resetForm.resetFields(); setResetOpen(true); }}>
          Reset Meter
        </Button>
        <Popconfirm
          title="Recalculate EW usage?"
          description="The system will only recompute usage splits for the selected records. No invoices will be created."
          onConfirm={handleRecalculate}
          okText="Recalculate"
          cancelText="Cancel"
          okButtonProps={{ loading: recalcLoading }}
        >
          <Button icon={<ThunderboltOutlined />} loading={recalcLoading} type="primary">
            Recalculate EW
          </Button>
        </Popconfirm>
        <Button icon={<ExportOutlined />} onClick={handleExport}>
          Export Data
        </Button>
      </Space>

      {/* Filters */}
      <Card title="Filters" style={{ marginBottom: 16 }}>
        <Space wrap>
          <div>
            <Text>Block Name</Text>
            <br />
            <Input
              placeholder="A101"
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
              style={{ width: isTablet ? 160 : '100%' }}
              onPressEnter={handleSearch}
            />
          </div>
          <div>
            <Text>Type</Text>
            <br />
            <Select value={filterType} onChange={setFilterType} style={{ width: isTablet ? 160 : '100%' }}>
              <Option value="">All</Option>
              <Option value="electric">Electric</Option>
              <Option value="water">Water</Option>
            </Select>
          </div>
          <div>
            <Text>Month</Text>
            <br />
            <Select value={filterMonth} onChange={setFilterMonth} style={{ width: isTablet ? 100 : '100%' }}>
              {MONTHS.map((m) => <Option key={m.value} value={m.value}>{m.label}</Option>)}
            </Select>
          </div>
          <div>
            <Text>Year</Text>
            <br />
            <Select value={filterYear} onChange={setFilterYear} style={{ width: isTablet ? 100 : '100%' }}>
              {YEARS.map((y) => <Option key={y.value} value={y.value}>{y.label}</Option>)}
            </Select>
          </div>
          <div style={{ paddingTop: isTablet ? 20 : 0, width: isTablet ? 'auto' : '100%' }}>
            <Button type="primary" onClick={handleSearch} block={!isTablet}>Search</Button>
          </div>
        </Space>
        <div style={{ marginTop: 8 }}>
          <Text strong>Results: {total}</Text>
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
        title="Import Utility Data"
        open={importOpen}
        onCancel={closeImport}
        footer={
          importResult ? (
            <Button onClick={closeImport}>Close</Button>
          ) : (
            <Space>
              <Button onClick={closeImport}>Cancel</Button>
              <Button type="primary" loading={importLoading} onClick={handleImport}>Import</Button>
            </Space>
          )
        }
      >
        {!importResult ? (
          <div>
            <p style={{ marginBottom: 12, color: '#666', fontSize: 13 }}>
              Excel file format: <b>Dorm | Block | Type (E/W) | Date | Meter</b>
              <br />
              <span style={{ color: '#999' }}>
                Type: E = Electric, W = Water. Meter: current reading (&gt;= 0). Import only creates usage records. Use Recalculate EW here, then create invoices from the manager invoices page.
              </span>
            </p>
            <Upload
              accept=".xlsx,.xls"
              maxCount={1}
              beforeUpload={() => false}
              onChange={({ fileList }) => setImportFile(fileList[0] ?? null)}
            >
              <Button icon={<UploadOutlined />}>Choose Excel File</Button>
            </Upload>
          </div>
        ) : (
          <div>
            <p>Created: <b>{importResult.created}</b></p>
            <p>Duplicates in file: <b>{importResult.duplicateInFile}</b></p>
            <p>Already exists in database: <b>{importResult.duplicateInDB}</b></p>
            {importResult.warnings > 0 && <p>Meter decrease warnings: <b>{importResult.warnings}</b></p>}
            <p>Other errors: <b>{importResult.failed}</b></p>
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

      {/* Reset Modal */}
      <Modal
        title="Reset Meter"
        open={resetOpen}
        onCancel={() => { setResetOpen(false); resetForm.resetFields(); }}
        onOk={handleResetSubmit}
        confirmLoading={resetLoading}
        okText="Save"
        cancelText="Cancel"
      >
        <Form form={resetForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="block" label="Block" rules={[{ required: true, message: 'Please select a block' }]}>
            <Select
              showSearch
              placeholder="Select block"
              optionFilterProp="children"
            >
              {blocks.map((b) => (
                <Option key={b.id} value={b.id}>{b.block_name || b.block_code}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true, message: 'Please select a type' }]}>
            <Select placeholder="Select type">
              <Option value="electric">Electric</Option>
              <Option value="water">Water</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="meter_right"
            label="New Meter Reading"
            rules={[
              { required: true, message: 'Please enter the new reading' },
              { type: 'number', min: 0, message: 'Reading must be >= 0' },
            ]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="Enter new meter reading" min={0} />
          </Form.Item>
          <Form.Item
            name="date"
            label="Reset Date"
            rules={[{ required: true, message: 'Please select the reset date' }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Text type="secondary">
            Reset creates a new zero-consumption baseline record for the selected date. Use this when a meter is replaced mid-month.
          </Text>
        </Form>
      </Modal>

      {/* Create / Edit Modal */}
      <Modal
        title={editRecord ? 'Edit Record' : 'Create New Record'}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={handleFormSubmit}
        confirmLoading={formLoading}
        okText={editRecord ? 'Save' : 'Create'}
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {!editRecord && (
            <Form.Item name="block" label="Block" rules={[{ required: true, message: 'Please select a block' }]}>
              <Select showSearch placeholder="Select block" optionFilterProp="children">
                {blocks.map((b) => (
                  <Option key={b.id} value={b.id}>{b.block_name || b.block_code}</Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select>
              <Option value="electric">Electric</Option>
              <Option value="water">Water</Option>
            </Select>
          </Form.Item>
          <Form.Item name="meter_right" label="Meter Reading" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          {!editRecord && (
            <Form.Item name="date" label="Date" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Recalculate result modal */}
      <Modal
        title={<span><CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />Recalculation Result</span>}
        open={!!recalcResult}
        onOk={() => setRecalcResult(null)}
        onCancel={() => setRecalcResult(null)}
        cancelButtonProps={{ style: { display: 'none' } }}
        okText="Close"
      >
          {recalcResult && (
            <Descriptions column={1} bordered size="small" style={{ marginTop: 12 }}>
              <Descriptions.Item label="Calculated records">{recalcResult.recordsCalculated}</Descriptions.Item>
              <Descriptions.Item label="Processed groups">{recalcResult.groupsProcessed}</Descriptions.Item>
              <Descriptions.Item label="Unique students in recalculated month(s)">
                {recalcResult.totalStudents}
              </Descriptions.Item>
              <Descriptions.Item label="Message">{recalcResult.message}</Descriptions.Item>
            </Descriptions>
          )}
      </Modal>

    </div>
  );
}
