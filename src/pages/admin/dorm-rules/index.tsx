import { useState, useEffect, useCallback } from 'react';
import { Button, Table, Tag, Tabs, message, Spin, Alert, Tooltip, Upload, Popconfirm, Space, Card } from 'antd';
import {
  ReloadOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  BookOutlined,
  CodeOutlined,
  UploadOutlined,
  DownloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  StarFilled,
  StarOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import {
  fetchDormRules,
  updateDormRules,
  fetchDormRuleFiles,
  uploadDormRuleFile,
  setDormRuleFileFeatured,
  deleteDormRuleFile,
  type DormRule,
  type DormRulesKB,
  type DormRuleFile,
} from '@/lib/actions/admin';

const { Dragger } = Upload;
const MAX_RULE_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const ALLOWED_RULE_FILE_EXTENSIONS = '.pdf,.doc,.docx';

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

const getDormRuleFileIcon = (file: DormRuleFile) => {
  const mime = file.mime_type.toLowerCase();
  const ext = file.file_extension.toLowerCase();

  if (mime.includes('pdf') || ext === 'pdf') {
    return <FilePdfOutlined className="text-red-500" />;
  }
  if (mime.includes('word') || ext === 'doc' || ext === 'docx') {
    return <FileWordOutlined className="text-blue-500" />;
  }
  return <FileTextOutlined className="text-gray-500" />;
};

const CATEGORY_COLORS: Record<string, string> = {
  general: 'blue',
  living_rules: 'green',
  security: 'red',
  room_management: 'orange',
  equipment: 'purple',
  safety: 'volcano',
};

const previewColumns: ColumnsType<DormRule> = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 200,
    render: (id: string) => <span className="font-mono text-xs">{id}</span>,
  },
  {
    title: 'Category',
    dataIndex: 'category',
    key: 'category',
    width: 130,
    render: (cat: string) => (
      <Tag color={CATEGORY_COLORS[cat] || 'default'}>{cat}</Tag>
    ),
  },
  {
    title: 'Title',
    dataIndex: 'title',
    key: 'title',
    ellipsis: true,
  },
  {
    title: 'Penalty (VND)',
    key: 'penalty',
    width: 130,
    render: (_: unknown, record: DormRule) => {
      const fine = record.penalty?.fine_vnd;
      if (!fine) return <span className="text-gray-400">—</span>;
      return (
        <Tooltip title={record.penalty?.description || record.penalty?.repeat_penalty}>
          <span className="text-red-600 font-medium">
            {new Intl.NumberFormat('vi-VN').format(fine)}
          </span>
        </Tooltip>
      );
    },
  },
  {
    title: 'Keywords',
    key: 'keywords',
    width: 180,
    render: (_: unknown, record: DormRule) => (
      <div className="flex flex-wrap gap-1">
        {(record.keywords || []).slice(0, 3).map((kw) => (
          <Tag key={kw} className="text-xs">{kw}</Tag>
        ))}
        {(record.keywords || []).length > 3 && (
          <Tag className="text-xs text-gray-400">+{(record.keywords || []).length - 3}</Tag>
        )}
      </div>
    ),
  },
];

export default function AdminDormRulesPage() {
  const [kb, setKb] = useState<DormRulesKB | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const [ruleFiles, setRuleFiles] = useState<DormRuleFile[]>([]);
  const [ruleFileList, setRuleFileList] = useState<UploadFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [featureLoadingId, setFeatureLoadingId] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  const loadRules = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchDormRules();
      setKb(data);
      setJsonText(data ? JSON.stringify(data, null, 2) : '');
      setJsonError(null);
    } catch (err: unknown) {
      const e = err as { message?: string };
      message.error(e?.message || 'Failed to load dorm rules');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFiles = useCallback(async () => {
    try {
      setFilesLoading(true);
      const data = await fetchDormRuleFiles();
      setRuleFiles(data.items ?? []);
    } catch (err: unknown) {
      const e = err as { message?: string };
      message.error(e?.message || 'Failed to load dorm rule files');
    } finally {
      setFilesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRules();
    void loadFiles();
  }, [loadFiles, loadRules]);

  const handleJsonChange = (value: string) => {
    setJsonText(value);
    setSaved(false);
    try {
      JSON.parse(value);
      setJsonError(null);
    } catch (e: unknown) {
      setJsonError((e as Error).message);
    }
  };

  const handleSave = async () => {
    if (jsonError) {
      message.error('Fix JSON errors before saving');
      return;
    }

    let parsed: DormRulesKB;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      message.error('Invalid JSON');
      return;
    }

    if (!Array.isArray(parsed.rules)) {
      message.error('"rules" must be an array');
      return;
    }

    try {
      setSaving(true);
      await updateDormRules(parsed);
      setKb(parsed);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      message.success('Dorm rules saved successfully');
    } catch (err: unknown) {
      const e = err as { message?: string };
      message.error(e?.message || 'Failed to save dorm rules');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDormRuleFile = async () => {
    if (!ruleFileList.length) {
      message.warning('Please select a PDF or Word file');
      return;
    }

    const selected = ruleFileList[0];
    const actualFile =
      (selected as UploadFile & { originFileObj?: File }).originFileObj ||
      (selected as unknown as File);

    try {
      setUploadingFile(true);
      await uploadDormRuleFile(actualFile);
      setRuleFileList([]);
      await loadFiles();
      message.success('Dorm rule file uploaded successfully');
    } catch (err: unknown) {
      const e = err as { message?: string };
      message.error(e?.message || 'Failed to upload dorm rule file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleOpenFile = (file: DormRuleFile) => {
    window.open(file.file_url, '_blank', 'noopener,noreferrer');
  };

  const handleDownloadFile = (file: DormRuleFile) => {
    const link = document.createElement('a');
    link.href = file.file_url;
    link.download = file.original_name;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleSetFeatured = async (file: DormRuleFile) => {
    try {
      setFeatureLoadingId(file.id);
      await setDormRuleFileFeatured(file.id);
      await loadFiles();
      message.success('Featured dorm rule file updated');
    } catch (err: unknown) {
      const e = err as { message?: string };
      message.error(e?.message || 'Failed to feature dorm rule file');
    } finally {
      setFeatureLoadingId(null);
    }
  };

  const handleDeleteFile = async (file: DormRuleFile) => {
    try {
      setDeletingFileId(file.id);
      await deleteDormRuleFile(file.id);
      await loadFiles();
      message.success('Dorm rule file deleted');
    } catch (err: unknown) {
      const e = err as { message?: string };
      message.error(e?.message || 'Failed to delete dorm rule file');
    } finally {
      setDeletingFileId(null);
    }
  };

  const rules = kb?.rules ?? [];
  const featuredFile = ruleFiles.find((file) => file.is_featured) || ruleFiles[0] || null;

  const fileColumns: ColumnsType<DormRuleFile> = [
    {
      title: 'File',
      dataIndex: 'original_name',
      key: 'original_name',
      ellipsis: true,
      render: (_: string, record: DormRuleFile) => (
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-lg">
            {getDormRuleFileIcon(record)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-gray-900">{record.original_name}</span>
              {record.is_featured && <Tag color="gold">Featured</Tag>}
            </div>
            <div className="mt-0.5 text-xs text-gray-500 font-mono">{record.cloudinary_public_id}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'mime_type',
      key: 'mime_type',
      width: 220,
      render: (mime: string, record: DormRuleFile) => (
        <div className="flex flex-wrap gap-1.5">
          <Tag>{record.file_extension.toUpperCase()}</Tag>
          <Tag color="blue">{mime}</Tag>
        </div>
      ),
    },
    {
      title: 'Size',
      dataIndex: 'file_size',
      key: 'file_size',
      width: 120,
      render: (size: number) => <span>{formatBytes(size)}</span>,
    },
    {
      title: 'Uploaded',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => (
        <span className="text-sm text-gray-600">
          {date ? new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(date)) : '—'}
        </span>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_: unknown, record: DormRuleFile) => (
        record.is_featured ? <Tag color="gold">Featured</Tag> : <Tag>Archived</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 240,
      render: (_: unknown, record: DormRuleFile) => (
        <Space size="small" wrap>
          <Button type="text" icon={<EyeOutlined />} onClick={() => handleOpenFile(record)}>
            Open
          </Button>
          <Button type="text" icon={<DownloadOutlined />} onClick={() => handleDownloadFile(record)}>
            Download
          </Button>
          {!record.is_featured && (
            <Button
              type="text"
              icon={<StarOutlined />}
              onClick={() => handleSetFeatured(record)}
              loading={featureLoadingId === record.id}
            >
              Feature
            </Button>
          )}
          <Popconfirm
            title="Delete this file?"
            description="The file will be removed from the dorm rules library."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDeleteFile(record)}
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              loading={deletingFileId === record.id}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dorm Rules Knowledge Base</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage the AI assistant's dormitory rules — changes take effect immediately.
          </p>
        </div>
        <div className="flex gap-2">
          <Button icon={<ReloadOutlined />} onClick={loadRules} loading={loading}>
            Reload
          </Button>
          <Button
            type="primary"
            icon={saved ? <CheckCircleOutlined /> : <SaveOutlined />}
            onClick={handleSave}
            loading={saving}
            disabled={!!jsonError || loading}
            className={saved ? '!bg-green-600 !border-green-600 hover:!bg-green-700' : ''}
          >
            {saved ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Spin size="large" />
        </div>
      )}

      {!loading && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className="px-5 pt-2"
            items={[
              {
                key: 'editor',
                label: (
                  <span className="flex items-center gap-1.5">
                    <CodeOutlined />
                    JSON Editor
                    {jsonError && <WarningOutlined className="text-red-500" />}
                    {!jsonError && jsonText && <CheckCircleOutlined className="text-green-500" />}
                  </span>
                ),
                children: (
                  <div className="pb-5 space-y-3">
                    {jsonError && (
                      <Alert
                        type="error"
                        showIcon
                        message="Invalid JSON"
                        description={jsonError}
                        className="font-mono text-xs"
                      />
                    )}
                    {!kb && !jsonError && (
                      <Alert
                        type="warning"
                        showIcon
                        message="No dorm rules found in the database. Paste the JSON structure below and save to initialise."
                      />
                    )}
                    <textarea
                      className="w-full font-mono text-xs border border-gray-200 rounded-xl p-4 resize-y focus:outline-none focus:ring-2 focus:ring-orange-400"
                      style={{ minHeight: 520 }}
                      value={jsonText}
                      onChange={(e) => handleJsonChange(e.target.value)}
                      spellCheck={false}
                      placeholder='{ "rules": [] }'
                    />
                    <p className="text-xs text-gray-400">
                      Expected shape: <code>{'{ "knowledge_base": {...}, "rules": [...], "system_instructions": {...} }'}</code>
                    </p>
                  </div>
                ),
              },
              {
                key: 'preview',
                label: (
                  <span className="flex items-center gap-1.5">
                    <BookOutlined />
                    Preview {rules.length > 0 ? `(${rules.length})` : ''}
                  </span>
                ),
                children: (
                  <div className="pb-5">
                    {rules.length === 0 ? (
                      <div className="py-12 text-center text-gray-400">No rules to preview.</div>
                    ) : (
                      <Table<DormRule>
                        rowKey="id"
                        columns={previewColumns}
                        dataSource={rules}
                        size="small"
                        pagination={false}
                        scroll={{ x: 900 }}
                        expandable={{
                          expandedRowRender: (record) => (
                            <div className="py-2 space-y-1 text-sm text-gray-700">
                              {record.details && <p><span className="font-medium">Details:</span> {record.details}</p>}
                              {record.allowed_devices && record.allowed_devices.length > 0 && (
                                <p>
                                  <span className="font-medium">Allowed devices:</span>{' '}
                                  {record.allowed_devices.join(', ')}
                                </p>
                              )}
                              {record.example_questions && record.example_questions.length > 0 && (
                                <div>
                                  <span className="font-medium">Example questions:</span>
                                  <ul className="list-disc ml-5 mt-1">
                                    {record.example_questions.map((q, i) => <li key={i}>{q}</li>)}
                                  </ul>
                                </div>
                              )}
                              {record.penalty?.repeat_penalty && (
                                <p><span className="font-medium">Repeat penalty:</span> {record.penalty.repeat_penalty}</p>
                              )}
                            </div>
                          ),
                          rowExpandable: (record) =>
                            !!(record.details || record.allowed_devices?.length || record.example_questions?.length || record.penalty?.repeat_penalty),
                        }}
                      />
                    )}
                  </div>
                ),
              },
              {
                key: 'files',
                label: (
                  <span className="flex items-center gap-1.5">
                    <UploadOutlined />
                    Files {ruleFiles.length > 0 ? `(${ruleFiles.length})` : ''}
                  </span>
                ),
                children: (
                  <div className="pb-5 space-y-4">
                    <Alert
                      type="info"
                      showIcon
                      message="Upload dorm rule documents"
                      description={`Accepted file types: PDF, DOC, and DOCX. Each file can be up to ${MAX_RULE_FILE_SIZE_BYTES / (1024 * 1024)}MB. The newest upload becomes featured automatically.`}
                    />

                    <Card
                      size="small"
                      className="border-orange-100 shadow-sm"
                      bodyStyle={{ padding: 16 }}
                    >
                      <Dragger
                        fileList={ruleFileList}
                        accept={ALLOWED_RULE_FILE_EXTENSIONS}
                        maxCount={1}
                        beforeUpload={(file) => {
                          const allowedTypes = new Set([
                            'application/pdf',
                            'application/msword',
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                          ]);
                          const allowedExts = new Set(['.pdf', '.doc', '.docx']);
                          const dotIndex = file.name.lastIndexOf('.');
                          const extension = dotIndex >= 0 ? file.name.slice(dotIndex).toLowerCase() : '';

                          if (!allowedTypes.has(file.type) && !allowedExts.has(extension)) {
                            message.error('Only PDF, DOC, and DOCX files are accepted');
                            return Upload.LIST_IGNORE;
                          }

                          if (file.size > MAX_RULE_FILE_SIZE_BYTES) {
                            message.error('Dorm rule file must be 20MB or smaller');
                            return Upload.LIST_IGNORE;
                          }

                          setRuleFileList([file as unknown as UploadFile]);
                          return false;
                        }}
                        onRemove={() => {
                          setRuleFileList([]);
                        }}
                      >
                        <p className="ant-upload-drag-icon">
                          <UploadOutlined />
                        </p>
                        <p className="ant-upload-text">Click or drag a document here</p>
                        <p className="ant-upload-hint">
                          PDFs and Word documents only. The latest upload becomes the featured rule file.
                        </p>
                      </Dragger>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button
                          type="primary"
                          icon={<UploadOutlined />}
                          onClick={handleUploadDormRuleFile}
                          loading={uploadingFile}
                          disabled={!ruleFileList.length}
                        >
                          Upload File
                        </Button>
                        <Button
                          onClick={() => setRuleFileList([])}
                          disabled={!ruleFileList.length || uploadingFile}
                        >
                          Clear
                        </Button>
                        <Button icon={<ReloadOutlined />} onClick={loadFiles} loading={filesLoading}>
                          Reload Library
                        </Button>
                      </div>
                    </Card>

                    {featuredFile && (
                      <Card
                        size="small"
                        className="border-orange-200 bg-orange-50/70 shadow-sm"
                        bodyStyle={{ padding: 16 }}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-4 min-w-0">
                            <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                              {getDormRuleFileIcon(featuredFile)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <Tag color="gold" icon={<StarFilled />}>Featured</Tag>
                                <span className="text-sm text-gray-500">
                                  {formatBytes(featuredFile.file_size)} • {featuredFile.file_extension.toUpperCase()}
                                </span>
                              </div>
                              <h3 className="mt-1 truncate text-lg font-semibold text-gray-900">
                                {featuredFile.original_name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Uploaded on {new Intl.DateTimeFormat('en-GB', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }).format(new Date(featuredFile.createdAt))}
                              </p>
                            </div>
                          </div>

                          <Space wrap>
                            <Button type="primary" icon={<EyeOutlined />} onClick={() => handleOpenFile(featuredFile)}>
                              Open
                            </Button>
                            <Button icon={<DownloadOutlined />} onClick={() => handleDownloadFile(featuredFile)}>
                              Download
                            </Button>
                          </Space>
                        </div>
                      </Card>
                    )}

                    <div>
                      {filesLoading ? (
                        <div className="flex justify-center py-12">
                          <Spin size="large" />
                        </div>
                      ) : ruleFiles.length === 0 ? (
                        <div className="py-12">
                          <Alert
                            type="warning"
                            showIcon
                            message="No dorm rule files yet"
                            description="Upload a PDF or Word document to publish the first version of the dorm rules library."
                          />
                        </div>
                      ) : (
                        <Table<DormRuleFile>
                          rowKey="id"
                          columns={fileColumns}
                          dataSource={ruleFiles}
                          size="small"
                          pagination={{ pageSize: 8, showSizeChanger: false }}
                          rowClassName={(record) =>
                            record.is_featured ? 'bg-orange-50/60' : ''
                          }
                          scroll={{ x: 980 }}
                        />
                      )}
                    </div>
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
