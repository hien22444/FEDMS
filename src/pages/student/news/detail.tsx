import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Space, Typography, Tag, Avatar, theme, Spin, Button, message } from 'antd';
import { CalendarOutlined, ArrowLeftOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getNewsById, type News } from '@/lib/actions/news';

const { Title, Paragraph, Text } = Typography;

const categoryDisplayMap: Record<string, string> = {
  announcement: 'Announcement',
  policy: 'Policy',
  event: 'Event',
  maintenance: 'Maintenance',
  general: 'General',
};

const mapCategoryToDisplay = (category: string) =>
  categoryDisplayMap[category] || category || 'General';

export default function StudentNewsDetailPage() {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [news, setNews] = useState<News | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadDetail = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await getNewsById(id);
        setNews(res);
      } catch (error: any) {
        console.error(error);
        message.error('Failed to load news detail');
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [id]);

  return (
    <div style={{ padding: '32px', backgroundColor: token.colorBgLayout }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{ borderRadius: 999 }}
          >
            Back
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            News Detail
          </Title>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Spin size="large" />
          </div>
        ) : !news ? (
          <Card style={{ borderRadius: 8 }}>
            <Text type="secondary">News not found.</Text>
          </Card>
        ) : (
          <Card style={{ borderRadius: 8 }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1 }}>
                  <Tag color={token.colorPrimary} style={{ marginBottom: 16 }}>
                    {mapCategoryToDisplay(news.category as string)}
                  </Tag>
                  <Title
                    level={2}
                    style={{
                      fontFamily:
                        '"InterTight-Bold","InterTight-SemiBold","InterTight-Medium","InterTight-Regular","Segoe UI",system-ui,-apple-system,sans-serif',
                    }}
                  >
                    {news.title}
                  </Title>
                  <Space size="large" style={{ marginTop: 8 }}>
                    <Space size="small">
                      <CalendarOutlined />
                      <Text type="secondary">
                        {news.published_at
                          ? dayjs(news.published_at).format('DD/MM/YYYY')
                          : dayjs(news.createdAt).format('DD/MM/YYYY')}
                      </Text>
                    </Space>
                  </Space>
                </div>
                <span style={{ fontSize: 56, lineHeight: 1 }}>📰</span>
              </div>

              <div>
                {news.content.split('\n\n').map((paragraph, idx) => (
                  <Paragraph
                    key={idx}
                    style={{
                      whiteSpace: 'pre-line',
                      color: token.colorTextSecondary,
                    }}
                  >
                    {paragraph}
                  </Paragraph>
                ))}
              </div>

              <div
                style={{
                  paddingTop: 24,
                  borderTop: `1px solid ${token.colorBorder}`,
                }}
              >
                <Space size="middle">
                  <Avatar
                    size={48}
                    style={{ backgroundColor: token.colorPrimaryBg }}
                    icon={<UserOutlined />}
                  />
                  <div>
                    <Text strong>Dormitory Management</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      FPT Dormitory
                    </Text>
                  </div>
                </Space>
              </div>
            </Space>
          </Card>
        )}
      </div>
    </div>
  );
}

