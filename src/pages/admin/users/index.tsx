import { useState, useEffect, useCallback } from 'react';
import { Button, Table, Tag, Upload, message, Card, Alert, Input, Select, Popconfirm } from 'antd';
import {
  InboxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import { Users, Upload as UploadIcon } from 'lucide-react';
import {
  importUsersFromExcel,
  fetchUsers,
  deleteUser,
  type ImportExcelResponse,
  type ImportedRecord,
  type ImportError,
  type UserRecord,
  type UserListResponse,
} from '@/lib/actions/admin';

const { Dragger } = Upload;

// ─── Import result table columns ──────────────────────────

const importedColumns: ColumnsType<ImportedRecord> = [
  {
    title: 'Sheet',
    dataIndex: 'sheet',
    key: 'sheet',
    width: 120,
  },
  {
    title: 'Row',
    dataIndex: 'row',
    key: 'row',
    width: 70,
  },
  {
    title: 'Email',
    dataIndex: 'email',
    key: 'email',
  },
  {
    title: 'Role',
    dataIndex: 'role',
    key: 'role',
    width: 120,
    render: (role: string) => {
      const colorMap: Record<string, string> = {
        student: 'blue',
        manager: 'orange',
        security: 'green',
      };
      return <Tag color={colorMap[role] || 'default'}>{role}</Tag>;
    },
  },
  {
    title: 'Code',
    dataIndex: 'code',
    key: 'code',
    width: 140,
    render: (code: string) => <span className="font-mono text-xs">{code}</span>,
  },
];

const errorColumns: ColumnsType<ImportError> = [
  {
    title: 'Sheet',
    dataIndex: 'sheet',
    key: 'sheet',
    width: 120,
  },
  {
    title: 'Row',
    dataIndex: 'row',
    key: 'row',
    width: 70,
  },
  {
    title: 'Email',
    dataIndex: 'email',
    key: 'email',
    width: 200,
  },
  {
    title: 'Error',
    dataIndex: 'error',
    key: 'error',
    render: (error: string) => <span className="text-red-600">{error}</span>,
  },
];

// ─── Role color/label map ─────────────────────────────────

const roleConfig: Record<string, { color: string; label: string }> = {
  admin: { color: 'red', label: 'Admin' },
  manager: { color: 'orange', label: 'Manager' },
  security: { color: 'green', label: 'Security' },
  student: { color: 'blue', label: 'Student' },
};

// ─── Component ────────────────────────────────────────────

export default function AdminUsersPage() {
  // Import states
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportExcelResponse | null>(null);
  const [showImport, setShowImport] = useState(false);

  // User list states
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // ─── Fetch users ──────────────────────────────────────────

  const loadUsers = useCallback(async (page = 1, search = searchText, role = roleFilter) => {
    try {
      setLoading(true);
      const res = await fetchUsers({ page, limit: pagination.limit, search, role }) as UserListResponse;
      setUsers(res.items);
      setPagination(res.pagination);
    } catch (error) {
      console.error(error);
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [searchText, roleFilter, pagination.limit]);

  useEffect(() => {
    loadUsers();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Import handlers ──────────────────────────────────────

  const handleUpload = async () => {
    if (!fileList.length) {
      message.warning('Please select an Excel file');
      return;
    }

    const file = fileList[0];
    const actualFile = (file as UploadFile & { originFileObj?: File }).originFileObj || (file as unknown as File);

    try {
      setUploading(true);
      const res = await importUsersFromExcel(actualFile);
      setResult(res);

      if (res.summary.failed === 0) {
        message.success(`Successfully imported ${res.summary.success}/${res.summary.total} accounts`);
      } else {
        message.warning(
          `Import: ${res.summary.success} succeeded, ${res.summary.failed} failed`,
        );
      }

      // Reload user list after import
      if (res.summary.success > 0) {
        loadUsers(1);
      }
    } catch (error: unknown) {
      console.error(error);
      const err = error as { message?: string | string[] };
      const errMsg = Array.isArray(err?.message)
        ? err.message.join(', ')
        : err?.message || 'Import failed';
      message.error(errMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleResetImport = () => {
    setFileList([]);
    setResult(null);
  };

  // ─── Delete handler ───────────────────────────────────────

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id);
      message.success('User deleted successfully');
      loadUsers(pagination.page);
    } catch (error: unknown) {
      const err = error as { message?: string };
      message.error(err?.message || 'Failed to delete user');
    }
  };

  // ─── User list columns ───────────────────────────────────

  const userColumns: ColumnsType<UserRecord> = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: 'Full Name',
      dataIndex: 'fullname',
      key: 'fullname',
      ellipsis: true,
      render: (name: string | null) => name || <span className="text-gray-400">-</span>,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 110,
      render: (role: string) => {
        const cfg = roleConfig[role] || { color: 'default', label: role };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string | null) =>
        code ? <span className="font-mono text-xs">{code}</span> : <span className="text-gray-400">-</span>,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (phone: string | null) => phone || <span className="text-gray-400">-</span>,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 110,
      render: (active: boolean) =>
        active ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>,
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, record: UserRecord) => {
        if (record.role === 'admin') return null;
        return (
          <Popconfirm
            title="Delete this user?"
            description={`Are you sure you want to delete ${record.email}?`}
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage student and staff accounts.
          </p>
        </div>
        <Button
          type={showImport ? 'default' : 'primary'}
          icon={<UploadIcon size={14} />}
          onClick={() => setShowImport(!showImport)}
        >
          {showImport ? 'Hide Import' : 'Import Excel'}
        </Button>
      </div>

      {/* ─── Import Section (collapsible) ────────────────── */}
      {showImport && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <UploadIcon size={18} className="text-orange-600" />
            <div className="font-semibold text-gray-900">Import Excel</div>
          </div>

          <Dragger
            fileList={fileList}
            beforeUpload={(file) => {
              const isExcel =
                file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                file.type === 'application/vnd.ms-excel';
              if (!isExcel) {
                message.error('Only Excel files are accepted (.xlsx, .xls)');
                return Upload.LIST_IGNORE;
              }
              setFileList([file as unknown as UploadFile]);
              return false;
            }}
            onRemove={() => {
              setFileList([]);
            }}
            maxCount={1}
            accept=".xlsx,.xls"
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag an Excel file here</p>
            <p className="ant-upload-hint">Supports .xlsx, .xls (max 5MB)</p>
          </Dragger>

          <div className="flex gap-3 mt-4">
            <Button
              type="primary"
              onClick={handleUpload}
              loading={uploading}
              disabled={!fileList.length}
            >
              {uploading ? 'Importing...' : 'Import'}
            </Button>
            {result && (
              <Button onClick={handleResetImport}>
                Reset
              </Button>
            )}
          </div>

          {/* Import Result */}
          {result && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card size="small">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{result.summary.total}</div>
                    <div className="text-sm text-gray-500">Total</div>
                  </div>
                </Card>
                <Card size="small">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{result.summary.success}</div>
                    <div className="text-sm text-gray-500">Succeeded</div>
                  </div>
                </Card>
                <Card size="small">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{result.summary.failed}</div>
                    <div className="text-sm text-gray-500">Failed</div>
                  </div>
                </Card>
              </div>

              {result.warnings && result.warnings.length > 0 && (
                <div className="space-y-2">
                  {result.warnings.map((warning, index) => (
                    <Alert
                      key={index}
                      message="Warning"
                      description={warning}
                      type="warning"
                      showIcon
                      icon={<WarningOutlined />}
                    />
                  ))}
                </div>
              )}

              {result.imported.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircleOutlined className="text-green-600" />
                    <span className="font-semibold text-gray-900">
                      Imported successfully ({result.imported.length})
                    </span>
                  </div>
                  <Table<ImportedRecord>
                    rowKey="row"
                    columns={importedColumns}
                    dataSource={result.imported}
                    pagination={false}
                    size="small"
                  />
                </div>
              )}

              {result.errors.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CloseCircleOutlined className="text-red-600" />
                    <span className="font-semibold text-gray-900">
                      Errors ({result.errors.length})
                    </span>
                  </div>
                  <Table<ImportError>
                    rowKey="row"
                    columns={errorColumns}
                    dataSource={result.errors}
                    pagination={false}
                    size="small"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── User List Section ────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-orange-600" />
          <div className="font-semibold text-gray-900">User List ({pagination.total})</div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <Input
            placeholder="Search by email or name..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={() => loadUsers(1, searchText, roleFilter)}
            className="w-64"
            allowClear
            onClear={() => {
              setSearchText('');
              loadUsers(1, '', roleFilter);
            }}
          />
          <Select
            value={roleFilter}
            onChange={(val) => {
              setRoleFilter(val);
              loadUsers(1, searchText, val);
            }}
            className="w-36"
            options={[
              { value: 'all', label: 'All Roles' },
              { value: 'admin', label: 'Admin' },
              { value: 'manager', label: 'Manager' },
              { value: 'security', label: 'Security' },
              { value: 'student', label: 'Student' },
            ]}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => loadUsers(1, searchText, roleFilter)}
          >
            Reload
          </Button>
        </div>

        {/* Table */}
        <Table<UserRecord>
          rowKey="id"
          columns={userColumns}
          dataSource={users}
          loading={loading}
          size="small"
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, limit: pageSize }));
              loadUsers(page, searchText, roleFilter);
            },
          }}
        />
      </div>
    </div>
  );
}
