import React from 'react';
import { Card, Input, Button, Typography, Badge, theme } from 'antd';
import {
  SendOutlined,
  MessageOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface Conversation {
  name: string;
  status: 'online' | 'offline';
  unread: number;
}

interface Message {
  content: string;
  time: string;
  sender: 'user' | 'staff';
}

const FAQ: React.FC = () => {
  const { token } = theme.useToken();

  const conversations: Conversation[] = [
    { name: 'Housing Manager', status: 'online', unread: 2 },
    { name: 'Maintenance Team', status: 'online', unread: 0 },
    { name: 'Student Affairs', status: 'offline', unread: 1 },
    { name: 'Security', status: 'online', unread: 0 },
  ];

  const messages: Message[] = [
    {
      content: 'Hello! How can I help you today?',
      time: '10:30 AM',
      sender: 'staff',
    },
    {
      content: 'Hi! I wanted to ask about extending my contract',
      time: '10:32 AM',
      sender: 'user',
    },
    {
      content: 'Sure! You can submit a contract extension request through the app. Just go to Room Management and click "Extend Contract".',
      time: '10:33 AM',
      sender: 'staff',
    },
    {
      content: 'Great! Thanks for your help',
      time: '10:34 AM',
      sender: 'user',
    },
  ];

  return (
    <div style={{ padding: '32px', background: token.colorBgLayout }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <Title level={2} style={{ marginBottom: '32px' }}>Chat with Staff</Title>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '24px', height: '600px' }}>
          {/* Conversations List */}
          <Card
            bodyStyle={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
            style={{ display: 'flex' }}
          >
            <div style={{ padding: '16px', borderBottom: `1px solid ${token.colorBorder}` }}>
              <Text strong>Conversations</Text>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {conversations.map((conv, idx) => (
                <button
                  key={idx}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '16px',
                    borderBottom: `1px solid ${token.colorBorder}`,
                    background: idx === 0 ? `${token.colorPrimary}10` : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    if (idx !== 0) e.currentTarget.style.background = token.colorBgTextHover;
                  }}
                  onMouseLeave={(e) => {
                    if (idx !== 0) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <Text strong={idx === 0}>{conv.name}</Text>
                    {conv.unread > 0 && (
                      <Badge
                        count={conv.unread}
                        style={{ backgroundColor: token.colorError }}
                      />
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: conv.status === 'online' ? token.colorSuccess : token.colorTextTertiary,
                      }}
                    />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {conv.status}
                    </Text>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Chat Window */}
          <Card
            bodyStyle={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px',
                borderBottom: `1px solid ${token.colorBorder}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <Text strong style={{ display: 'block' }}>Housing Manager</Text>
                <Text style={{ fontSize: '12px', color: token.colorSuccess }}>Online</Text>
              </div>
              <MessageOutlined style={{ fontSize: '20px', color: token.colorTextSecondary }} />
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '12px',
                      borderRadius: token.borderRadius,
                      background: message.sender === 'user' ? token.colorPrimary : token.colorBgTextHover,
                      color: message.sender === 'user' ? '#fff' : token.colorText,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: '14px',
                        color: message.sender === 'user' ? '#fff' : token.colorText,
                        display: 'block',
                        marginBottom: '4px',
                      }}
                    >
                      {message.content}
                    </Text>
                    <Text
                      style={{
                        fontSize: '12px',
                        opacity: 0.7,
                        color: message.sender === 'user' ? '#fff' : token.colorTextSecondary,
                      }}
                    >
                      {message.time}
                    </Text>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div
              style={{
                padding: '16px',
                borderTop: `1px solid ${token.colorBorder}`,
                display: 'flex',
                gap: '8px',
              }}
            >
              <Input
                placeholder="Type your message..."
                size="large"
                style={{ flex: 1 }}
              />
              <Button
                type="primary"
                size="large"
                icon={<SendOutlined />}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
