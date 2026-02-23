import { useState } from 'react';
import { Button, Table, Tag, Upload, message, Card, Alert } from 'antd';
import { InboxOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import { Users } from 'lucide-react';
import {
  importUsersFromExcel,
  type ImportExcelResponse,
  type ImportedRecord,
  type ImportError,
} from '@/lib/actions/admin';

const { Dragger } = Upload;

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

export default function AdminUsersPage() {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportExcelResponse | null>(null);

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
        message.success(`Import successful: ${res.summary.success}/${res.summary.total} accounts`);
      } else {
        message.warning(
          `Import: ${res.summary.success} succeeded, ${res.summary.failed} failed`,
        );
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

  const handleReset = () => {
    setFileList([]);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Import student and staff accounts from Excel file.
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-orange-600" />
          <div className="font-semibold text-gray-900">Import Excel</div>
        </div>

        <Dragger
          fileList={fileList}
          beforeUpload={(file) => {
            const isExcel =
              file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
              file.type === 'application/vnd.ms-excel';
            if (!isExcel) {
              message.error('Only Excel files (.xlsx, .xls) are accepted');
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
          <p className="ant-upload-text">Click or drag and drop Excel file here</p>
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
            <Button onClick={handleReset}>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Result Section */}
      {result && (
        <>
          {/* Summary Cards */}
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
                <div className="text-sm text-gray-500">Success</div>
              </div>
            </Card>
            <Card size="small">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{result.summary.failed}</div>
                <div className="text-sm text-gray-500">Failed</div>
              </div>
            </Card>
          </div>

          {/* Warnings */}
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

          {/* Imported Table */}
          {result.imported.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircleOutlined className="text-green-600" />
                <div className="font-semibold text-gray-900">
                  Imported successfully ({result.imported.length})
                </div>
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

          {/* Errors Table */}
          {result.errors.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CloseCircleOutlined className="text-red-600" />
                <div className="font-semibold text-gray-900">
                  Errors ({result.errors.length})
                </div>
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
        </>
      )}
    </div>
  );
}
