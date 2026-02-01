import { Card, Row, Col, Space, Button, Typography, Tag, Avatar, theme } from 'antd';
import {
  CalendarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { FC } from 'react';

const { Title, Paragraph, Text } = Typography;

interface NewsItem {
  id: number;
  title: string;
  category: string;
  date: string;
  author: string;
  excerpt: string;
  image: string;
  content: string;
}

const newsData: NewsItem[] = [
  {
    id: 1,
    title: 'New Dormitory Quiet Hours Policy',
    category: 'Policy',
    date: '12/12/2024',
    author: 'Housing Office',
    excerpt:
      'Effective from January 2025, new quiet hours will be enforced. Quiet hours are from 22:00 to 08:00 on weekdays and 23:00 to 09:00 on weekends.',
    image: '📋',
    content: `Effective from January 1, 2025, the dormitory will implement new quiet hours to ensure all students can enjoy peaceful rest.

New Quiet Hours:
- Weekdays: 22:00 - 08:00
- Weekends: 23:00 - 09:00

During these hours, please keep noise to a minimum. Violations may result in warnings or fines.

For more information, please visit the Housing Office.`,
  },
  {
    id: 2,
    title: 'Dormitory WiFi Upgrade Completed',
    category: 'Announcement',
    date: '10/12/2024',
    author: 'IT Department',
    excerpt:
      'We are pleased to announce that the dormitory WiFi has been upgraded to provide faster and more stable internet connection for all students.',
    image: '📡',
    content: `Great news! The WiFi upgrade in all dormitory blocks is now complete.

What's new:
- 3x faster internet speed
- Better coverage in all areas
- More stable connection
- 24/7 technical support

All students should disconnect and reconnect to the new network. The default password is available at the Housing Office.`,
  },
  {
    id: 3,
    title: 'Sports Day Event - January 15',
    category: 'Event',
    date: '05/12/2024',
    author: 'Student Affairs',
    excerpt:
      "Join us for the annual dormitory sports day! We'll have various competitions, games, and prizes for all participants. Register now!",
    image: '⚽',
    content: `We're excited to announce the Annual Dormitory Sports Day!

Date: January 15, 2025
Time: 8:00 AM - 5:00 PM
Location: Sports Complex

Events:
- Football tournament
- Badminton championship
- Running race
- Volleyball match
- And much more!

Register your team at the Housing Office before January 10.`,
  },
];

const NewsPage: FC = () => {
  const { token } = theme.useToken();

  const categories = ['All', 'Announcement', 'Policy', 'Event', 'Maintenance'];

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

        {/* Filter Tabs */}
        <Space wrap style={{ marginBottom: '24px' }}>
          {categories.map((category, index) => (
            <Button
              key={category}
              type={index === 0 ? 'primary' : 'default'}
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
          {newsData.map((item) => (
            <Col xs={24} md={12} key={item.id}>
              <Card
                hoverable
                style={{
                  borderRadius: '8px',
                  height: '100%',
                }}
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '48px', lineHeight: 1 }}>{item.image}</span>
                    <div style={{ flex: 1 }}>
                      <Tag color={token.colorPrimary} style={{ marginBottom: '8px' }}>
                        {item.category}
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
                    {item.excerpt}
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
                        {item.date}
                      </Text>
                    </Space>
                    <Space size="small">
                      <UserOutlined style={{ fontSize: '12px' }} />
                      <Text style={{ fontSize: '12px' }} type="secondary">
                        {item.author}
                      </Text>
                    </Space>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Latest Article */}
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
                    {newsData[0].category}
                  </Tag>
                  <Title level={2}>{newsData[0].title}</Title>
                </div>
                <span style={{ fontSize: '64px', lineHeight: 1 }}>
                  {newsData[0].image}
                </span>
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
                    <Text type="secondary">{newsData[0].date}</Text>
                  </Space>
                  <Space size="small">
                    <UserOutlined />
                    <Text type="secondary">{newsData[0].author}</Text>
                  </Space>
                </Space>
              </div>

              <div>
                {newsData[0].content.split('\n\n').map((paragraph, idx) => (
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
                    <Text strong>{newsData[0].author}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Housing Management Office
                    </Text>
                  </div>
                </Space>
              </div>
            </Space>
          </Card>
        </div>

        {/* Load More */}
        <div style={{ textAlign: 'center' }}>
          <Button type="link" style={{ color: token.colorPrimary }}>
            Load More Articles
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewsPage;
