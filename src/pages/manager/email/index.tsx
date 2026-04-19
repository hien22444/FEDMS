import { useCallback, useEffect, useState } from 'react';
import { Button, Form, Input, message, Modal, Select, Table, Tabs, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Edit, Eye, Mail, Trash2 } from 'lucide-react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import dayjs from 'dayjs';

import {
  createEmailTemplate,
  deleteEmailTemplate,
  getEmailHistory,
  getEmailTemplates,
  previewEmailRecipients,
  sendEmailCampaign,
  updateEmailTemplate,
  type EmailFilters,
  type EmailLog,
  type EmailTemplate,
} from '@/lib/actions/email';
import { fetchBlocks, fetchDorms, type Block, type Dorm } from '@/lib/actions';

// ── TipTap Toolbar ──────────────────────────────────────────────────────
const Toolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;
  const btn = (label: string, active: boolean, onClick: () => void) => (
    <button
      key={label}
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
      {btn('• List', editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run())}
      {btn('1. List', editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run())}
      {btn('Clear', false, () => editor.chain().focus().clearContent().run())}
    </div>
  );
};

const EDITOR_ATTRS = 'min-h-[200px] p-3 border border-gray-300 rounded-b-md focus:outline-none prose max-w-none';
const MODAL_EDITOR_ATTRS = 'min-h-[160px] p-3 border border-gray-300 rounded-b-md focus:outline-none prose max-w-none';

// ── Page ─────────────────────────────────────────────────────────────────
export default function ManagerEmailCenterPage() {
  // ── Compose state
  const [filters, setFilters] = useState<EmailFilters>({});
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [composeForm] = Form.useForm();

  // ── Filter options
  const [dorms, setDorms] = useState<Dorm[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);

  // ── Templates state
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateModal, setTemplateModal] = useState<{ open: boolean; item?: EmailTemplate }>({ open: false });
  const [templateForm] = Form.useForm();

  // ── History state
  const [history, setHistory] = useState<EmailLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [detailModal, setDetailModal] = useState<{ open: boolean; item?: EmailLog }>({ open: false });

  // ── TipTap editors
  const composeEditor = useEditor({
    extensions: [StarterKit, Link, Underline],
    content: '',
    editorProps: { attributes: { class: EDITOR_ATTRS } },
  });
  const templateEditor = useEditor({
    extensions: [StarterKit, Link, Underline],
    content: '',
    editorProps: { attributes: { class: MODAL_EDITOR_ATTRS } },
  });

  // ── Init
  useEffect(() => {
    fetchRecipientCount({});
    loadTemplates();
    loadHistory(1);
    fetchDorms({ page: 1, limit: 100 }).then((res) => setDorms(res.items)).catch(() => {});
  }, []);

  // ── Recipients preview
  const fetchRecipientCount = useCallback(async (f: EmailFilters) => {
    setPreviewLoading(true);
    try {
      const res = await previewEmailRecipients(f);
      setRecipientCount(res.count);
    } catch {
      setRecipientCount(null);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const handleFilterChange = (key: keyof EmailFilters, value?: string) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (!value) delete next[key];
      fetchRecipientCount(next);
      return next;
    });
  };

  const handleDormChange = async (dormId?: string) => {
    handleFilterChange('dorm_id', dormId);
    handleFilterChange('block_id', undefined);
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

  // ── Send
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
      const res = await sendEmailCampaign({ subject, body, filters });
      message.success(`Sent to ${res.count} student${res.count !== 1 ? 's' : ''}`);
      composeForm.resetFields();
      composeEditor?.commands.clearContent();
      loadHistory(1);
      fetchRecipientCount(filters);
    } catch {
      message.error('Failed to send email');
    } finally {
      setSendLoading(false);
    }
  };

  // ── Templates
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

  // ── History
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

  // ── Columns
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

  // ── Render
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
              <div className="max-w-3xl">
                {/* Recipient filters */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
                  <p className="text-sm font-medium text-gray-700 mb-3">Recipients</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Select
                      placeholder="Dorm"
                      allowClear
                      options={dorms.map((d) => ({ value: d.id, label: d.dorm_name }))}
                      onChange={(v) => handleDormChange(v)}
                      className="w-full"
                    />
                    <Select
                      placeholder="Block"
                      allowClear
                      disabled={!filters.dorm_id}
                      options={blocks.map((b) => ({ value: b.id, label: b.block_name }))}
                      onChange={(v) => handleFilterChange('block_id', v)}
                      value={filters.block_id}
                      className="w-full"
                    />
                    <Select
                      placeholder="Gender"
                      allowClear
                      onChange={(v) => handleFilterChange('gender', v)}
                      options={[
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' },
                        { value: 'other', label: 'Other' },
                      ]}
                      className="w-full"
                    />
                    <Select
                      placeholder="Student type"
                      allowClear
                      onChange={(v) => handleFilterChange('student_type', v)}
                      options={[
                        { value: 'domestic', label: 'Domestic' },
                        { value: 'international', label: 'International' },
                      ]}
                      className="w-full"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-3">
                    {previewLoading ? (
                      'Counting...'
                    ) : recipientCount !== null ? (
                      <>
                        <b>{recipientCount}</b> student{recipientCount !== 1 ? 's' : ''} will receive this email
                      </>
                    ) : (
                      '—'
                    )}
                  </p>
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
                    <Toolbar editor={composeEditor} />
                    <EditorContent editor={composeEditor} />
                  </Form.Item>
                </Form>

                <div className="flex gap-3 mt-4">
                  <Button
                    type="primary"
                    icon={<Mail className="w-4 h-4" />}
                    loading={sendLoading}
                    onClick={handleSend}
                    disabled={recipientCount === 0}
                  >
                    Send{recipientCount !== null ? ` (${recipientCount})` : ''}
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
        width={640}
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
            <Toolbar editor={templateEditor} />
            <EditorContent editor={templateEditor} />
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
            <p>
              <b>Subject:</b> {detailModal.item.subject}
            </p>
            <p>
              <b>Sent at:</b> {dayjs(detailModal.item.createdAt).format('DD/MM/YYYY HH:mm')}
            </p>
            <p>
              <b>Recipients:</b> {detailModal.item.recipient_count}
            </p>
            <p>
              <b>Status:</b>{' '}
              <Tag color={detailModal.item.status === 'sent' ? 'green' : 'red'}>
                {detailModal.item.status.toUpperCase()}
              </Tag>
            </p>
            {Object.keys(detailModal.item.filters_used ?? {}).length > 0 && (
              <p>
                <b>Filters:</b> {JSON.stringify(detailModal.item.filters_used)}
              </p>
            )}
            {detailModal.item.recipients_preview?.length > 0 && (
              <div>
                <b>First {detailModal.item.recipients_preview.length} recipients:</b>
                <ul className="mt-1 list-disc pl-5 text-gray-600">
                  {detailModal.item.recipients_preview.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </div>
            )}
            {detailModal.item.error && (
              <p className="text-red-500">
                <b>Error:</b> {detailModal.item.error}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
