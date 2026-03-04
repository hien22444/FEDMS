import { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Space, Button, Typography, Tag, Avatar, theme, Spin, Empty, message } from 'antd';
import { CalendarOutlined, UserOutlined } from '@ant-design/icons';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { fetchNews, type News } from '@/lib/actions/news';

const { Title, Paragraph, Text } = Typography;

const categoryFilters = ['All', 'Announcement', 'Policy', 'Event', 'Maintenance', 'General'];

const categoryDisplayMap: Record<string, string> = {
  announcement: 'Announcement',
  policy: 'Policy',
  event: 'Event',
  maintenance: 'Maintenance',
  general: 'General',
};

const mapCategoryToDisplay = (category: string) =>
  categoryDisplayMap[category] || category || 'General';

const mapDisplayToCategory = (display: string): string | undefined => {
  const entry = Object.entries(categoryDisplayMap).find(([, label]) => label === display);
  return entry?.[0];
};

const NewsPage: FC = () => {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const loadNews = async () => {
    try {
      setLoading(true);
      const res = await fetchNews({ page: 1, limit: 50 });
      setNews(res.items || []);
    } catch (error: any) {
      console.error(error);
      message.error('Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const filteredNews = useMemo(() => {
    if (selectedCategory === 'All') return news;
    const backendCategory = mapDisplayToCategory(selectedCategory);
    if (!backendCategory) return news;
    return news.filter((item) => item.category === backendCategory);
  }, [news, selectedCategory]);

  const latestArticle = news[0];

  return (
    <div style={{ padding: '32px', backgroundColor: token.colorBgLayout }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>
            News & Announcements
          </Title>
          <Text type="secondary">Stay updated with dormitory news and events</Text>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
            <Spin size="large" />
          </div>
        ) : news.length === 0 ? (
          <Card style={{ borderRadius: '8px' }}>
            <Empty description="No news published yet" />
          </Card>
        ) : (
          <>
            {/* Filter Tabs */}
            <Space wrap style={{ marginBottom: '24px' }}>
              {categoryFilters.map((category) => (
                <Button
                  key={category}
                  type={selectedCategory === category ? 'primary' : 'default'}
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    borderRadius: '8px',
                  }}
                >
                  {category}
                </Button>
              ))}
            </Space>

            {/* News Grid */}
            <Row gutter={[24, 24]} style={{ marginBottom: '48px' }}>
              {filteredNews.map((item) => (
                <Col xs={24} md={12} key={item.id}>
                  <Card
                    hoverable
                    onClick={() => navigate(`/student/news/${item.id}`)}
                    style={{
                      borderRadius: '8px',
                      height: '100%',
                    }}
                  >
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '48px', lineHeight: 1 }}>📰</span>
                        <div style={{ flex: 1 }}>
                          <Tag color={token.colorPrimary} style={{ marginBottom: '8px' }}>
                            {mapCategoryToDisplay(item.category)}
                          </Tag>
                          <Title
                            level={4}
                            style={{
                              margin: 0,
                              color: token.colorText,
                            }}
                          >
                            {item.title}
                          </Title>
                        </div>
                      </div>

                      <Paragraph
                        type="secondary"
                        style={{ marginBottom: 0 }}
                        ellipsis={{ rows: 3 }}
                      >
                        {item.content}
                      </Paragraph>

                      <div
                        style={{
                          display: 'flex',
                          gap: '16px',
                          paddingTop: '16px',
                          borderTop: `1px solid ${token.colorBorder}`,
                        }}
                      >
                        <Space size="small">
                          <CalendarOutlined style={{ fontSize: '12px' }} />
                          <Text style={{ fontSize: '12px' }} type="secondary">
                            {item.published_at
                              ? dayjs(item.published_at).format('DD/MM/YYYY')
                              : dayjs(item.createdAt).format('DD/MM/YYYY')}
                          </Text>
                        </Space>
                      </div>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Latest Article */}
            {latestArticle && (
              <div style={{ marginBottom: '48px' }}>
                <Title level={3} style={{ marginBottom: '24px' }}>
                  Latest Article
                </Title>
                <Card style={{ borderRadius: '8px' }}>
                  <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <Tag color={token.colorPrimary} style={{ marginBottom: '16px' }}>
                          {mapCategoryToDisplay(latestArticle.category)}
                        </Tag>
                        <Title level={2}>{latestArticle.title}</Title>
                      </div>
                      <span style={{ fontSize: '64px', lineHeight: 1 }}>📰</span>
                    </div>

                    <div
                      style={{
                        paddingBottom: '24px',
                        borderBottom: `1px solid ${token.colorBorder}`,
                      }}
                    >
                      <Space size="large">
                        <Space size="small">
                          <CalendarOutlined />
                          <Text type="secondary">
                            {latestArticle.published_at
                              ? dayjs(latestArticle.published_at).format('DD/MM/YYYY')
                              : dayjs(latestArticle.createdAt).format('DD/MM/YYYY')}
                          </Text>
                        </Space>
                      </Space>
                    </div>

                    <div>
                      {latestArticle.content.split('\n\n').map((paragraph, idx) => (
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

                    <div style={{ textAlign: 'right' }}>
                      <Button type="link" onClick={() => navigate(`/student/news/${latestArticle.id}`)}>
                        View details
                      </Button>
                    </div>

                    <div
                      style={{
                        paddingTop: '24px',
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
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            FPT Dormitory
                          </Text>
                        </div>
                      </Space>
                    </div>
                  </Space>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NewsPage;
