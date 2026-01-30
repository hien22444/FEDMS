import React from 'react';
import { Card, Button, Typography, Space, theme } from 'antd';
import {
  BellOutlined,
  DeleteOutlined,
  CheckOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  time: string;
  icon: string;
  read: boolean;
}

const Notifications: React.FC = () => {
  const { token } = theme.useToken();

  const tabs = ['All', 'Payments', 'Booking', 'Maintenance', 'Visitor', 'System'];

  const notifications: Notification[] = [
    {
      id: 1,
      type: 'Payment',
      title: 'Payment Due Reminder',
      message: 'Your room fee for December is due on 31/12/2024',
      time: '2 hours ago',
      icon: '💳',
      read: false,
    },
    {
      id: 2,
      type: 'System',
      title: 'Maintenance Completed',
      message: 'Water leak in common area has been fixed successfully',
      time: '1 day ago',
      icon: '✅',
      read: false,
    },
    {
      id: 3,
      type: 'Booking',
      title: 'Room Booking Approved',
      message: 'Your request for Room 205, Block A has been approved',
      time: '3 days ago',
      icon: '🏠',
      read: true,
    },
    {
      id: 4,
      type: 'Visitor',
      title: 'Visitor Request Approved',
      message: 'Visit request from Trần Thị B on 20/12/2024 has been approved',
      time: '4 days ago',
      icon: '👥',
      read: true,
    },
    {
      id: 5,
      type: 'System',
      title: 'New Dormitory Policy',
      message: 'Updated quiet hours policy effective from 01/01/2025',
      time: '1 week ago',
      icon: '📋',
      read: true,
    },
    {
      id: 6,
      type: 'Maintenance',
      title: 'Maintenance Request Received',
      message: 'Your AC repair request has been received and scheduled',
      time: '2 weeks ago',
      icon: '🔧',
      read: true,
    },
  ];

  return (
    <div style={{ padding: '32px', background: token.colorBgLayout }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>Notifications</Title>
          <Text type="secondary">Stay updated with your housing activities</Text>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {tabs.map((tab, idx) => (
            <Button
              key={tab}
              type={idx === 0 ? 'primary' : 'default'}
              style={{
                ...(idx !== 0 && {
                  background: token.colorBgTextHover,
                  borderColor: token.colorBorder,
                }),
              }}
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* Notifications List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              style={{
                ...(notification.read ? {} : {
                  borderLeft: `4px solid ${token.colorPrimary}`,
                  background: `${token.colorPrimary}05`,
                }),
                transition: 'all 0.3s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <span style={{ fontSize: '32px' }}>{notification.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <Text strong style={{ fontSize: '16px' }}>{notification.title}</Text>
                    {!notification.read && (
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: token.colorPrimary,
                        }}
                      />
                    )}
                  </div>
                  <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                    {notification.message}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {notification.time}
                  </Text>
                </div>
                <Space>
                  <Button
                    type="text"
                    icon={<CheckOutlined style={{ color: token.colorPrimary }} />}
                    style={{ padding: '8px' }}
                  />
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    danger
                    style={{ padding: '8px' }}
                  />
                </Space>
              </div>
            </Card>
          ))}
        </div>

        {/* Load More */}
        <div style={{ textAlign: 'center' }}>
          <Button type="link" style={{ color: token.colorPrimary, fontWeight: 600 }}>
            Load More Notifications
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
