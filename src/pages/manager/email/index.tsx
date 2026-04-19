import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Button, Collapse, Form, Input, InputNumber, message, Modal, Select, Table, Tabs, Tag, Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Edit, Eye, Image as ImageIcon, Mail, Trash2 } from 'lucide-react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TiptapImage from '@tiptap/extension-image';
import dayjs from 'dayjs';

import {
  createEmailTemplate,
  deleteEmailTemplate,
  getEmailFilterOptions,
  getEmailHistory,
  getEmailTemplates,
  previewEmailRecipients,
  sendEmailCampaign,
  updateEmailTemplate,
  uploadInlineImage,
  type EmailFilterOptions,
  type EmailFilters,
  type EmailLog,
  type EmailStudentPreview,
  type EmailTemplate,
} from '@/lib/actions/email';
import { fetchBlocks, fetchDorms, type Block, type Dorm } from '@/lib/actions';

// ── TipTap Toolbar ──────────────────────────────────────────────────────
const Toolbar = ({
  editor, onPickImage,
}: {
  editor: Editor | null;
  onPickImage?: () => void;
}) => {
  if (!editor) return null;
  const btn = (label: React.ReactNode, active: boolean, onClick: () => void, key?: string) => (
    <button
      key={key ?? String(label)}
      type="button"
      onClick={onClick}
      className={`px-2 py-1 text-sm rounded border transition-colors ${
        active
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white border-gray-300 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
  return (
    <div className="flex flex-wrap gap-1 p-2 border border-b-0 border-gray-300 rounded-t-md bg-gray-50">
      {btn('B', editor.isActive('bold'), () => editor.chain().focus().toggleBold().run())}
      {btn('I', editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run())}
      {btn('U', editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run())}
      {btn('H2', editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run())}
      {btn('• List', editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run())}
      {btn('1. List', editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run())}
      {btn('"', editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), 'quote')}
      {btn('—', false, () => editor.chain().focus().setHorizontalRule().run(), 'hr')}
      {onPickImage && btn(<ImageIcon className="w-3.5 h-3.5 inline" />, false, onPickImage, 'img')}
      {btn('Clear', false, () => editor.chain().focus().clearContent().run())}
    </div>
  );
};

const EDITOR_ATTRS = 'min-h-[240px] p-3 border border-gray-300 rounded-b-md focus:outline-none prose max-w-none';
const MODAL_EDITOR_ATTRS = 'min-h-[180px] p-3 border border-gray-300 rounded-b-md focus:outline-none prose max-w-none';

const parseEmailList = (raw: string): string[] => {
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
};

// ── Page ─────────────────────────────────────────────────────────────────
export default function ManagerEmailCenterPage() {
  // Compose state
  const [filters, setFilters] = useState<EmailFilters>({});
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [recipientList, setRecipientList] = useState<EmailStudentPreview[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [manualEmailsText, setManualEmailsText] = useState('');
  const [composeForm] = Form.useForm();

  // Filter option lists
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [filterOptions, setFilterOptions] = useState<EmailFilterOptions>({ room_types: [], semesters: [] });

  // Templates state
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateModal, setTemplateModal] = useState<{ open: boolean; item?: EmailTemplate }>({ open: false });
  const [templateForm] = Form.useForm();

  // History state
  const [history, setHistory] = useState<EmailLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [detailModal, setDetailModal] = useState<{ open: boolean; item?: EmailLog }>({ open: false });

  // Image upload refs
  const composeImageInputRef = useRef<HTMLInputElement>(null);
  const templateImageInputRef = useRef<HTMLInputElement>(null);

  // TipTap editors
  const composeEditor = useEditor({
    extensions: [StarterKit, Link, Underline, TiptapImage.configure({ HTMLAttributes: { class: 'max-w-full h-auto rounded' } })],
    content: '',
    editorProps: { attributes: { class: EDITOR_ATTRS } },
  });
  const templateEditor = useEditor({
    extensions: [StarterKit, Link, Underline, TiptapImage.configure({ HTMLAttributes: { class: 'max-w-full h-auto rounded' } })],
    content: '',
    editorProps: { attributes: { class: MODAL_EDITOR_ATTRS } },
  });

  // Init
  useEffect(() => {
    fetchRecipients({});
    loadTemplates();
    loadHistory(1);
    fetchDorms({ page: 1, limit: 100 }).then((res) => setDorms(res.items)).catch(() => {});
    getEmailFilterOptions().then(setFilterOptions).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Preview
  const fetchRecipients = useCallback(async (f: EmailFilters) => {
    setPreviewLoading(true);
    try {
      const res = await previewEmailRecipients(f);
      setRecipientCount(res.count);
      setRecipientList(res.students ?? []);
    } catch {
      setRecipientCount(null);
      setRecipientList([]);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const applyFilters = (next: EmailFilters) => {
    setFilters(next);
    fetchRecipients(next);
  };

  const handleFilterChange = (key: keyof EmailFilters, value?: string | number) => {
    const next = { ...filters };
    if (value === undefined || value === null || value === '') delete next[key];
    else next[key] = String(value);
    applyFilters(next);
  };

  const handleDormChange = async (dormId?: string) => {
    const next = { ...filters };
    if (dormId) next.dorm_id = dormId;
    else delete next.dorm_id;
    delete next.block_id;
    applyFilters(next);
    if (dormId) {
      try {
        const res = await fetchBlocks({ dorm: dormId, page: 1, limit: 100 });
        setBlocks(res.items);
      } catch {
        setBlocks([]);
      }
    } else {
      setBlocks([]);
    }
  };

  const clearFilters = () => {
    setBlocks([]);
    applyFilters({});
  };

  // Manual emails (dedupe count)
  const manualEmails = useMemo(() => parseEmailList(manualEmailsText), [manualEmailsText]);
  const totalRecipientCount = useMemo(() => {
    const set = new Set<string>([
      ...(recipientList.length ? recipientList.map((s) => s.email.toLowerCase()) : []),
      ...manualEmails,
    ]);
    // fallback when filtered count > returned list (list capped at 500)
    const filtered = recipientCount ?? 0;
    const inList = recipientList.length;
    const manualOnly = manualEmails.filter((e) => !(new Set(recipientList.map((s) => s.email.toLowerCase()))).has(e)).length;
    if (filtered > inList) return filtered + manualOnly;
    return set.size;
  }, [recipientList, manualEmails, recipientCount]);

  // Send
  const handleSend = async () => {
    try {
      await composeForm.validateFields();
    } catch {
      return;
    }
    const subject = composeForm.getFieldValue('subject') as string;
    const body = composeEditor?.getHTML() ?? '';
    if (!body || body === '<p></p>') {
      message.error('Email body is required');
      return;
    }
    setSendLoading(true);
    try {
      const res = await sendEmailCampaign({ subject, body, filters, extra_emails: manualEmails });
      message.success(`Sent to ${res.count} recipient${res.count !== 1 ? 's' : ''}`);
      composeForm.resetFields();
      composeEditor?.commands.clearContent();
      setManualEmailsText('');
      loadHistory(1);
      fetchRecipients(filters);
    } catch {
      message.error('Failed to send email');
    } finally {
      setSendLoading(false);
    }
  };

  // Image upload
  const handleImageUpload = async (editor: Editor | null, file: File) => {
    if (!editor || !file) return;
    const hide = message.loading('Uploading image…', 0);
    try {
      const url = await uploadInlineImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      message.error('Image upload failed');
    } finally {
      hide();
    }
  };

  // Templates
  const loadTemplates = async () => {
    setTemplateLoading(true);
    try {
      const res = await getEmailTemplates();
      setTemplates(res.items);
    } catch {
      message.error('Failed to load templates');
    } finally {
      setTemplateLoading(false);
    }
  };

  const openTemplateModal = (item?: EmailTemplate) => {
    setTemplateModal({ open: true, item });
    if (item) {
      templateForm.setFieldsValue({ name: item.name, subject: item.subject });
      templateEditor?.commands.setContent(item.body);
    } else {
      templateForm.resetFields();
      templateEditor?.commands.clearContent();
    }
  };

  const handleTemplateSave = async () => {
    let values: { name: string; subject: string };
    try {
      values = await templateForm.validateFields();
    } catch {
      return;
    }
    const body = templateEditor?.getHTML() ?? '';
    if (!body || body === '<p></p>') {
      message.error('Template body is required');
      return;
    }
    try {
      if (templateModal.item) {
        await updateEmailTemplate(templateModal.item._id, { ...values, body });
        message.success('Template updated');
      } else {
        await createEmailTemplate({ ...values, body });
        message.success('Template created');
      }
      setTemplateModal({ open: false });
      loadTemplates();
    } catch {
      message.error('Failed to save template');
    }
  };

  const applyTemplate = (tpl: EmailTemplate) => {
    composeForm.setFieldsValue({ subject: tpl.subject });
    composeEditor?.commands.setContent(tpl.body);
    message.success(`Template "${tpl.name}" applied to compose`);
  };

  const handleDeleteTemplate = (id: string) => {
    Modal.confirm({
      title: 'Delete this template?',
      okType: 'danger',
      onOk: async () => {
        await deleteEmailTemplate(id);
        message.success('Deleted');
        loadTemplates();
      },
    });
  };

  // History
  const loadHistory = async (page: number) => {
    setHistoryLoading(true);
    try {
      const res = await getEmailHistory(page);
      setHistory(res.items);
      setHistoryTotal(res.pagination.total);
      setHistoryPage(page);
    } catch {
      message.error('Failed to load history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Columns
  const recipientColumns: ColumnsType<EmailStudentPreview> = [
    { title: 'Code', dataIndex: 'student_code', key: 'student_code', width: 120 },
    { title: 'Name', dataIndex: 'full_name', key: 'full_name' },
    { title: 'Email', dataIndex: 'email', key: 'email', ellipsis: true },
    {
      title: 'CFD',
      dataIndex: 'behavioral_score',
      key: 'behavioral_score',
      width: 70,
      render: (v?: number) => (v === undefined ? '—' : v.toFixed(1)),
    },
  ];

  const templateColumns: ColumnsType<EmailTemplate> = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Subject', dataIndex: 'subject', key: 'subject', ellipsis: true },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 130,
      render: (_, record) => (
        <div className="flex gap-2">
          <Tooltip title="Apply to compose">
            <Button size="small" icon={<Mail className="w-3.5 h-3.5" />} onClick={() => applyTemplate(record)} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button size="small" icon={<Edit className="w-3.5 h-3.5" />} onClick={() => openTemplateModal(record)} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              size="small"
              danger
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => handleDeleteTemplate(record._id)}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  const historyColumns: ColumnsType<EmailLog> = [
    {
      title: 'Sent At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
    },
    { title: 'Subject', dataIndex: 'subject', key: 'subject', ellipsis: true },
    { title: 'Recipients', dataIndex: 'recipient_count', key: 'recipient_count', width: 100 },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v: string) => (
        <Tag color={v === 'sent' ? 'green' : 'red'}>{v.toUpperCase()}</Tag>
      ),
    },
    {
      title: '',
      key: 'detail',
      width: 50,
      render: (_, record) => (
        <Button
          size="small"
          icon={<Eye className="w-3.5 h-3.5" />}
          onClick={() => setDetailModal({ open: true, item: record })}
        />
      ),
    },
  ];

  // Render
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold mb-4">Email Center</h1>

      <Tabs
        defaultActiveKey="compose"
        items={[
          {
            key: 'compose',
            label: 'Compose',
            children: (
              <div className="max-w-4xl">
                {/* Recipients */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700">Recipients</p>
                    {Object.keys(filters).length > 0 && (
                      <Button size="small" type="link" onClick={clearFilters}>Clear filters</Button>
                    )}
                  </div>

                  {/* Primary filters */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Select
                      placeholder="Dorm" allowClear
                      value={filters.dorm_id}
                      options={dorms.map((d) => ({ value: d.id, label: d.dorm_name }))}
                      onChange={(v) => handleDormChange(v)}
                      className="w-full"
                    />
                    <Select
                      placeholder="Block" allowClear
                      disabled={!filters.dorm_id}
                      value={filters.block_id}
                      options={blocks.map((b) => ({ value: b.id, label: b.block_name }))}
                      onChange={(v) => handleFilterChange('block_id', v)}
                      className="w-full"
                    />
                    <Select
                      placeholder="Gender" allowClear
                      value={filters.gender}
                      onChange={(v) => handleFilterChange('gender', v)}
                      options={[
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                        { value: 'other', label: 'Other' },
                      ]}
                      className="w-full"
                    />
                    <Select
                      placeholder="Student type" allowClear
                      value={filters.student_type}
                      onChange={(v) => handleFilterChange('student_type', v)}
                      options={[
                        { value: 'domestic', label: 'Domestic' },
                        { value: 'international', label: 'International' },
                      ]}
                      className="w-full"
                    />
                  </div>

                  {/* Advanced filters */}
                  <Collapse
                    ghost
                    size="small"
                    className="mt-2 -ml-3"
                    items={[{
                      key: 'more',
                      label: 'More filters',
                      children: (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          <Input
                            placeholder="Student code prefix (e.g. DE16)"
                            allowClear
                            value={filters.student_code_prefix}
                            onChange={(e) => handleFilterChange('student_code_prefix', e.target.value)}
                            onBlur={(e) => handleFilterChange('student_code_prefix', e.target.value)}
                          />
                          <Select
                            placeholder="Room type" allowClear
                            value={filters.room_type}
                            options={filterOptions.room_types.map((v) => ({ value: v, label: v }))}
                            onChange={(v) => handleFilterChange('room_type', v)}
                            showSearch
                          />
                          <Select
                            placeholder="Semester" allowClear
                            value={filters.semester}
                            options={filterOptions.semesters.map((v) => ({ value: v, label: v }))}
                            onChange={(v) => handleFilterChange('semester', v)}
                            showSearch
                          />
                          <Select
                            placeholder="Invoice status" allowClear
                            value={filters.invoice_status}
                            options={[
                              { value: 'unpaid', label: 'Unpaid' },
                              { value: 'paid', label: 'Paid' },
                              { value: 'overdue', label: 'Overdue' },
                              { value: 'cancelled', label: 'Cancelled' },
                            ]}
                            onChange={(v) => handleFilterChange('invoice_status', v)}
                          />
                          <InputNumber
                            placeholder="CFD ≤"
                            min={0} max={10} step={0.1}
                            value={filters.behavioral_score_max ? Number(filters.behavioral_score_max) : undefined}
                            onChange={(v) => handleFilterChange('behavioral_score_max', v ?? undefined)}
                            className="w-full"
                          />
                        </div>
                      ),
                    }]}
                  />

                  {/* Manual emails */}
                  <div className="mt-3">
                    <label className="text-xs text-gray-600 block mb-1">
                      Manual recipients (extra emails, separated by comma/newline)
                    </label>
                    <Input.TextArea
                      rows={2}
                      placeholder="student1@example.com, student2@example.com"
                      value={manualEmailsText}
                      onChange={(e) => setManualEmailsText(e.target.value)}
                    />
                    {manualEmailsText && (
                      <p className="text-xs text-gray-500 mt-1">{manualEmails.length} valid email(s) detected</p>
                    )}
                  </div>

                  {/* Summary + expandable list */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-700">
                      {previewLoading ? (
                        'Counting…'
                      ) : (
                        <>
                          <b>{totalRecipientCount}</b> recipient{totalRecipientCount !== 1 ? 's' : ''} will receive this email
                          {recipientCount !== null && (
                            <span className="text-gray-500"> ({recipientCount} from filters + {manualEmails.length} manual)</span>
                          )}
                        </>
                      )}
                    </p>

                    {recipientList.length > 0 && (
                      <Collapse
                        ghost
                        size="small"
                        className="mt-2 -ml-3"
                        items={[{
                          key: 'list',
                          label: `Show recipient list (${recipientList.length}${recipientCount && recipientCount > recipientList.length ? ` of ${recipientCount}` : ''})`,
                          children: (
                            <Table
                              dataSource={recipientList}
                              columns={recipientColumns}
                              rowKey="_id"
                              size="small"
                              pagination={{ pageSize: 10, size: 'small' }}
                              scroll={{ x: 500, y: 320 }}
                            />
                          ),
                        }]}
                      />
                    )}
                  </div>
                </div>

                {/* Compose form */}
                <Form form={composeForm} layout="vertical">
                  <Form.Item
                    name="subject"
                    label="Subject"
                    rules={[{ required: true, message: 'Subject is required' }]}
                  >
                    <Input placeholder="Email subject..." />
                  </Form.Item>
                  <Form.Item label="Body" required>
                    <Toolbar
                      editor={composeEditor}
                      onPickImage={() => composeImageInputRef.current?.click()}
                    />
                    <EditorContent editor={composeEditor} />
                    <input
                      ref={composeImageInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleImageUpload(composeEditor, f);
                        e.target.value = '';
                      }}
                    />
                  </Form.Item>
                </Form>

                <div className="flex gap-3 mt-4">
                  <Button
                    type="primary"
                    icon={<Mail className="w-4 h-4" />}
                    loading={sendLoading}
                    onClick={handleSend}
                    disabled={totalRecipientCount === 0}
                  >
                    Send ({totalRecipientCount})
                  </Button>
                </div>
              </div>
            ),
          },
          {
            key: 'templates',
            label: 'Templates',
            children: (
              <>
                <div className="flex justify-end mb-3">
                  <Button type="primary" onClick={() => openTemplateModal()}>
                    New Template
                  </Button>
                </div>
                <Table
                  dataSource={templates}
                  columns={templateColumns}
                  rowKey="_id"
                  loading={templateLoading}
                  pagination={false}
                  scroll={{ x: 600 }}
                />
              </>
            ),
          },
          {
            key: 'history',
            label: 'Sent History',
            children: (
              <Table
                dataSource={history}
                columns={historyColumns}
                rowKey="_id"
                loading={historyLoading}
                scroll={{ x: 600 }}
                pagination={{
                  current: historyPage,
                  total: historyTotal,
                  pageSize: 20,
                  onChange: loadHistory,
                }}
              />
            ),
          },
        ]}
      />

      {/* Template modal */}
      <Modal
        title={templateModal.item ? 'Edit Template' : 'New Template'}
        open={templateModal.open}
        onCancel={() => setTemplateModal({ open: false })}
        onOk={handleTemplateSave}
        width={680}
        destroyOnClose
      >
        <Form form={templateForm} layout="vertical">
          <Form.Item name="name" label="Template Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Payment Reminder" />
          </Form.Item>
          <Form.Item name="subject" label="Subject" rules={[{ required: true }]}>
            <Input placeholder="Email subject..." />
          </Form.Item>
          <Form.Item label="Body" required>
            <Toolbar
              editor={templateEditor}
              onPickImage={() => templateImageInputRef.current?.click()}
            />
            <EditorContent editor={templateEditor} />
            <input
              ref={templateImageInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageUpload(templateEditor, f);
                e.target.value = '';
              }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* History detail modal */}
      <Modal
        title="Email Details"
        open={detailModal.open}
        onCancel={() => setDetailModal({ open: false })}
        footer={null}
      >
        {detailModal.item && (
          <div className="space-y-2 text-sm">
            <p><b>Subject:</b> {detailModal.item.subject}</p>
            <p><b>Sent at:</b> {dayjs(detailModal.item.createdAt).format('DD/MM/YYYY HH:mm')}</p>
            <p><b>Recipients:</b> {detailModal.item.recipient_count}</p>
            <p>
              <b>Status:</b>{' '}
              <Tag color={detailModal.item.status === 'sent' ? 'green' : 'red'}>
                {detailModal.item.status.toUpperCase()}
              </Tag>
            </p>
            {Object.keys(detailModal.item.filters_used ?? {}).length > 0 && (
              <p><b>Filters:</b> {JSON.stringify(detailModal.item.filters_used)}</p>
            )}
            {detailModal.item.recipients_preview?.length > 0 && (
              <div>
                <b>First {detailModal.item.recipients_preview.length} recipients:</b>
                <ul className="mt-1 list-disc pl-5 text-gray-600">
                  {detailModal.item.recipients_preview.map((e) => <li key={e}>{e}</li>)}
                </ul>
              </div>
            )}
            {detailModal.item.error && (
              <p className="text-red-500"><b>Error:</b> {detailModal.item.error}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
