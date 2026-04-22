import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Empty, List, Space, Spin, Tag, Typography, theme } from 'antd';
import {
  DownloadOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FileWordOutlined,
  ReloadOutlined,
  StarFilled,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchDormRuleFiles, type DormRuleFile } from '@/lib/actions/admin';

const { Title, Text } = Typography;

const getDormRuleFileIcon = (file: DormRuleFile) => {
  const mime = file.mime_type.toLowerCase();
  const ext = file.file_extension.toLowerCase();

  if (mime.includes('pdf') || ext === 'pdf') {
    return <FilePdfOutlined style={{ fontSize: 22, color: '#dc2626' }} />;
  }

  if (mime.includes('word') || ext === 'doc' || ext === 'docx') {
    return <FileWordOutlined style={{ fontSize: 22, color: '#2563eb' }} />;
  }

  return <FileTextOutlined style={{ fontSize: 22, color: '#6b7280' }} />;
};

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

export default function StudentDormRulesPage() {
  const { token } = theme.useToken();
  const [files, setFiles] = useState<DormRuleFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDormRuleFiles();
      setFiles(data.items ?? []);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || 'Failed to load dorm rule files');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  const featuredFile = useMemo(
    () => files.find((file) => file.is_featured) || files[0] || null,
    [files]
  );

  const openFile = (file: DormRuleFile) => {
    window.open(file.file_url, '_blank', 'noopener,noreferrer');
  };

  const downloadFile = (file: DormRuleFile) => {
    const link = document.createElement('a');
    link.href = file.file_url;
    link.download = file.original_name;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div style={{ padding: '32px', background: token.colorBgLayout, minHeight: '100%' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Card
          bordered
          style={{
            borderRadius: 24,
            borderColor: 'rgba(243, 112, 33, 0.18)',
            background: 'linear-gradient(135deg, rgba(243,112,33,0.08), rgba(255,255,255,0.96))',
            marginBottom: 24,
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)',
          }}
          bodyStyle={{ padding: 0 }}
        >
          <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div style={{ maxWidth: 760 }}>
                <Tag color="orange" style={{ marginBottom: 12, borderRadius: 999 }}>
                  Student resources
                </Tag>
                <Title level={2} style={{ marginBottom: 8 }}>
                  Dorm Rules
                </Title>
                <Text type="secondary" style={{ fontSize: 15, lineHeight: 1.7 }}>
                  Read the latest dormitory rule documents published by the administration team.
                  The newest upload is highlighted as the featured document.
                </Text>
              </div>

              <Button icon={<ReloadOutlined />} onClick={loadFiles} loading={loading}>
                Reload
              </Button>
            </div>

            <Alert
              type="info"
              showIcon
              message="Document access"
              description="Open or download the files below. PDFs will usually open in the browser, while Word documents may download automatically depending on your device."
            />
          </div>
        </Card>

        {error && (
          <Alert
            type="error"
            showIcon
            message="Unable to load dorm rules"
            description={error}
            style={{ marginBottom: 24 }}
          />
        )}

        {loading ? (
          <div
            style={{
              minHeight: 280,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 24,
              background: token.colorBgContainer,
              border: `1px solid ${token.colorBorder}`,
            }}
          >
            <Spin size="large" />
          </div>
        ) : files.length === 0 ? (
          <Card
            style={{ borderRadius: 24, borderColor: token.colorBorder }}
            bodyStyle={{ padding: 32 }}
          >
            <Empty
              description="No dorm rule files have been uploaded yet."
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        ) : (
          <div style={{ display: 'grid', gap: 24 }}>
            {featuredFile && (
              <Card
                style={{
                  borderRadius: 24,
                  borderColor: 'rgba(234, 88, 12, 0.18)',
                  background: 'linear-gradient(135deg, rgba(255, 247, 237, 1), rgba(255, 255, 255, 1))',
                  boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
                }}
                bodyStyle={{ padding: 24 }}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-4">
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 18,
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
                        flexShrink: 0,
                      }}
                    >
                      {getDormRuleFileIcon(featuredFile)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                        <Tag color="gold" icon={<StarFilled />}>
                          Featured
                        </Tag>
                        <Tag>{featuredFile.file_extension.toUpperCase()}</Tag>
                        <Text type="secondary">
                          {formatBytes(featuredFile.file_size)} • {featuredFile.mime_type}
                        </Text>
                      </div>
                      <Title level={4} style={{ marginTop: 8, marginBottom: 6 }}>
                        {featuredFile.original_name}
                      </Title>
                      <Text type="secondary" style={{ display: 'block', lineHeight: 1.7 }}>
                        Published {dayjs(featuredFile.createdAt).format('DD/MM/YYYY HH:mm')}
                      </Text>
                    </div>
                  </div>

                  <Space wrap>
                    <Button type="primary" icon={<EyeOutlined />} onClick={() => openFile(featuredFile)}>
                      Open
                    </Button>
                    <Button icon={<DownloadOutlined />} onClick={() => downloadFile(featuredFile)}>
                      Download
                    </Button>
                  </Space>
                </div>
              </Card>
            )}

            <Card
              title={
                <span style={{ fontWeight: 600 }}>
                  Rule Library <span style={{ color: token.colorTextSecondary }}>({files.length})</span>
                </span>
              }
              style={{ borderRadius: 24, borderColor: token.colorBorder, boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)' }}
              bodyStyle={{ padding: 0 }}
            >
              <List
                itemLayout="horizontal"
                dataSource={files}
                pagination={{ pageSize: 6, hideOnSinglePage: true }}
                renderItem={(file) => {
                  const isFeatured = file.is_featured;

                  return (
                    <List.Item
                      className={isFeatured ? 'bg-orange-50/60' : ''}
                      style={{
                        padding: '18px 24px',
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                      }}
                      actions={[
                        <Button key={`open-${file.id}`} type="link" icon={<EyeOutlined />} onClick={() => openFile(file)}>
                          Open
                        </Button>,
                        <Button
                          key={`download-${file.id}`}
                          type="link"
                          icon={<DownloadOutlined />}
                          onClick={() => downloadFile(file)}
                        >
                          Download
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 16,
                              background: isFeatured ? 'rgba(249, 115, 22, 0.14)' : token.colorFillAlter,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {getDormRuleFileIcon(file)}
                          </div>
                        }
                        title={
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: 600, color: token.colorText }}>{file.original_name}</span>
                            {isFeatured && (
                              <Tag color="gold" icon={<StarFilled />}>
                                Featured
                              </Tag>
                            )}
                          </div>
                        }
                        description={
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                            <Tag>{file.file_extension.toUpperCase()}</Tag>
                            <Tag color="blue">{formatBytes(file.file_size)}</Tag>
                            <Tag color="default">{file.mime_type}</Tag>
                            <span style={{ color: token.colorTextTertiary, fontSize: 12 }}>
                              Updated {dayjs(file.createdAt).format('DD/MM/YYYY HH:mm')}
                            </span>
                          </div>
                        }
                      />
                    </List.Item>
                  );
                }}
              />
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
