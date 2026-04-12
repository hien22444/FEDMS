import { useState, useEffect, useCallback } from 'react';
import { Button, Table, Tag, Tabs, message, Spin, Alert, Tooltip } from 'antd';
import {
  ReloadOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  BookOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { fetchDormRules, updateDormRules, type DormRule, type DormRulesKB } from '@/lib/actions/admin';

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

  useEffect(() => {
    loadRules();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  const rules = kb?.rules ?? [];

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
            ]}
          />
        </div>
      )}
    </div>
  );
}
