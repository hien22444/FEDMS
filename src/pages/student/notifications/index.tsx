import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Typography, Space, theme, Spin, Empty } from 'antd';
import { DeleteOutlined, CheckOutlined, BellOutlined } from '@ant-design/icons';
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsRead,
  deleteNotification,
  type INotification,
} from '@/lib/actions';

const { Title, Text } = Typography;

const CATEGORY_TABS = ['All', 'Payments', 'Booking', 'Maintenance', 'Visitor', 'System'] as const;
type CategoryTab = (typeof CATEGORY_TABS)[number];

const categoryMap: Record<CategoryTab, string | null> = {
  All: null,
  Payments: 'payment',
  Booking: 'booking',
  Maintenance: 'maintenance',
  Visitor: 'visitor',
  System: 'general',
};

const typeIcon: Record<INotification['notification_type'], string> = {
  success: '✅',
  warning: '⚠️',
  error: '🚨',
  info: '📢',
};

const categoryIcon: Record<string, string> = {
  payment: '💳',
  booking: '🏠',
  maintenance: '🔧',
  visitor: '👥',
  violation: '⚠️',
  equipment: '🛠️',
  general: '📋',
};

const formatRelativeTime = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString('en-GB');
};

const Notifications: React.FC = () => {
  const { token } = theme.useToken();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<CategoryTab>('All');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyNotifications();
      setNotifications(data || []);
    } catch {
      // silent — user may not have notifications yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // silent
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // silent
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    const cat = categoryMap[activeTab];
    return cat === null || n.category === cat;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div style={{ padding: '32px', background: token.colorBgLayout }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <Title level={2} style={{ marginBottom: '8px' }}>Notifications</Title>
            <Text type="secondary">Stay updated with your housing activities</Text>
          </div>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllRead} icon={<CheckOutlined />}>
              Mark all as read ({unreadCount})
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {CATEGORY_TABS.map((tab) => (
            <Button
              key={tab}
              type={activeTab === tab ? 'primary' : 'default'}
              style={
                activeTab !== tab
                  ? { background: token.colorBgTextHover, borderColor: token.colorBorder }
                  : {}
              }
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <Spin size="large" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Empty
            image={<BellOutlined style={{ fontSize: 64, color: token.colorTextDisabled }} />}
            description={<Text type="secondary">No notifications</Text>}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            {filteredNotifications.map((notif) => (
              <Card
                key={notif.id}
                style={{
                  ...(!notif.is_read
                    ? { borderLeft: `4px solid ${token.colorPrimary}`, background: `${token.colorPrimary}05` }
                    : {}),
                  transition: 'all 0.3s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <span style={{ fontSize: '32px' }}>
                    {categoryIcon[notif.category] || typeIcon[notif.notification_type]}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <Text strong style={{ fontSize: '16px' }}>{notif.title}</Text>
                      {!notif.is_read && (
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: token.colorPrimary,
                            flexShrink: 0,
                            marginTop: '6px',
                          }}
                        />
                      )}
                    </div>
                    <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                      {notif.message}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {formatRelativeTime(notif.created_at)}
                    </Text>
                  </div>
                  <Space>
                    {!notif.is_read && (
                      <Button
                        type="text"
                        icon={<CheckOutlined style={{ color: token.colorPrimary }} />}
                        style={{ padding: '8px' }}
                        title="Mark as read"
                        onClick={() => handleMarkRead(notif.id)}
                      />
                    )}
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      danger
                      style={{ padding: '8px' }}
                      title="Delete"
                      onClick={() => handleDelete(notif.id)}
                    />
                  </Space>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
