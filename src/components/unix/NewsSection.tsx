import { Card, List, Badge, Space, theme } from 'antd';
import {
  CalendarOutlined,
  MessageOutlined,
  NotificationOutlined,
} from '@ant-design/icons';
import type { FC } from 'react';

interface NewsItem {
  id: number;
  badge?: string;
  title: string;
  date: string;
  comments?: number;
}

const newsItems: NewsItem[] = [
  {
    id: 1,
    badge: 'New',
    title: 'Room cancellation & registration schedule for Spring 2026 semester',
    date: '2025-12-09',
    comments: 8,
  },
  {
    id: 2,
    title: 'Decision No. 138 - Dormitory Rules for Da Nang Campus',
    date: '2025-10-23',
    comments: 8,
  },
  {
    id: 3,
    title: 'Room cancellation & registration schedule for Summer 2025 semester',
    date: '2025-04-05',
    comments: 8,
  },
];

export const NewsSection: FC = () => {
  const { token } = theme.useToken();

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
      <List
        itemLayout="vertical"
        dataSource={newsItems}
        renderItem={(item) => (
          <List.Item
            style={{
              padding: '24px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
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
                  <MessageOutlined />
                  <span>{item.comments} comments</span>
                </Space>
                <Space size="small">
                  <CalendarOutlined />
                  <span>{item.date}</span>
                </Space>
              </Space>
            </div>
          </List.Item>
        )}
      />
    </Card>
  );
};
