import { Card, List, Badge, Empty, Skeleton, Space, theme } from 'antd';
import {
  CalendarOutlined,
  NotificationOutlined,
} from '@ant-design/icons';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';

interface NewsItem {
  id: string;
  badge?: string;
  title: string;
  date: string;
  category?: string;
}

interface NewsSectionProps {
  items?: NewsItem[];
  loading?: boolean;
}

const formatDate = (value?: string) =>
  value ? new Intl.DateTimeFormat('en-GB').format(new Date(value)) : '-';

export const NewsSection: FC<NewsSectionProps> = ({ items = [], loading = false }) => {
  const { token } = theme.useToken();
  const navigate = useNavigate();

  return (
    <Card
      title={
        <Space>
          <NotificationOutlined style={{ fontSize: '20px' }} />
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
            News & Announcements
          </span>
        </Space>
      }
      bordered
      style={{ borderRadius: '8px' }}
      headStyle={{
        backgroundColor: token.colorPrimary, // #146EF5
        color: 'white',
        borderRadius: '8px 8px 0 0',
      }}
      bodyStyle={{ padding: 0 }}
    >
      {loading ? (
        <div style={{ padding: '24px' }}>
          <Skeleton active paragraph={{ rows: 3 }} />
          <Skeleton active paragraph={{ rows: 3 }} />
        </div>
      ) : items.length === 0 ? (
        <div style={{ padding: '32px 24px' }}>
          <Empty description="No news available" />
        </div>
      ) : (
        <List
          itemLayout="vertical"
          dataSource={items}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: '24px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onClick={() => navigate(`/student/news/${item.id}`)}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = token.colorBgTextHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'transparent')
              }
            >
              <div>
                {item.badge && (
                  <Badge
                    count={item.badge}
                    style={{
                      backgroundColor: token.colorPrimary,
                      marginBottom: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  />
                )}
                <h4
                  style={{
                    fontWeight: 600,
                    marginBottom: '12px',
                    lineHeight: '1.5',
                    color: token.colorText,
                  }}
                >
                  {item.title}
                </h4>
                <Space
                  size="large"
                  style={{ color: token.colorTextSecondary, fontSize: '12px' }}
                >
                  <Space size="small">
                    <CalendarOutlined />
                    <span>{formatDate(item.date)}</span>
                  </Space>
                  {item.category ? (
                    <span style={{ textTransform: 'capitalize' }}>{item.category}</span>
                  ) : null}
                </Space>
              </div>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};
