import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Space, Tag, Typography, Button, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { CalendarDays, FileText } from 'lucide-react';
import dayjs from 'dayjs';
import { getNewsById, type News } from '@/lib/actions/news';

const { Title, Paragraph, Text } = Typography;

const categoryOptions = [
  { label: 'Announcement', value: 'announcement' },
  { label: 'Event', value: 'event' },
  { label: 'Policy', value: 'policy' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'General', value: 'general' },
];

const getCategoryLabel = (value: string) =>
  categoryOptions.find((c) => c.value === value)?.label || value || 'General';

export default function ManagerNewsDetailPage() {
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
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/manager/news')}
          className="flex items-center"
        >
          Back to list
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">News Detail</h1>
          <p className="text-sm text-gray-500">
            View full content of the selected news item.
          </p>
        </div>
      </div>

      <Card
        loading={loading}
        className="rounded-2xl border border-gray-200 shadow-sm"
        bodyStyle={{ padding: 24 }}
      >
        {!loading && !news && (
          <Text type="secondary">News not found.</Text>
        )}

        {news && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag color="blue">{getCategoryLabel(news.category as string)}</Tag>
                  <Tag color={news.is_published ? 'green' : 'orange'}>
                    {news.is_published ? 'Published' : 'Draft'}
                  </Tag>
                </div>
                <Title level={3} style={{ margin: 0 }}>
                  {news.title}
                </Title>
                <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={14} />
                    <span>
                      Published:{' '}
                      {news.published_at
                        ? dayjs(news.published_at).format('DD/MM/YYYY HH:mm')
                        : 'N/A'}
                    </span>
                  </span>
                  <span>
                    Last updated: {dayjs(news.updatedAt).format('DD/MM/YYYY HH:mm')}
                  </span>
                </div>
              </div>
              <FileText size={40} className="text-orange-500 shrink-0" />
            </div>

            <div>
              {news.content.split('\n\n').map((paragraph, idx) => (
                <Paragraph key={idx} style={{ whiteSpace: 'pre-line', marginBottom: 12 }}>
                  {paragraph}
                </Paragraph>
              ))}
            </div>
          </Space>
        )}
      </Card>
    </div>
  );
}

