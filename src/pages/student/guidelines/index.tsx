import React from 'react';
import { FileTextOutlined } from '@ant-design/icons';
import { theme, Typography } from 'antd';

const { Title, Text } = Typography;

const Guidelines: React.FC = () => {
  const { token } = theme.useToken();

  return (
    <div style={{ padding: '32px', background: token.colorBgLayout }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>Dorm Guidelines</Title>
          <Text type="secondary">Rules and regulations for dormitory residents</Text>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 32px',
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG,
            border: `1px solid ${token.colorBorder}`,
          }}
        >
          <FileTextOutlined style={{ fontSize: '48px', color: token.colorTextQuaternary, marginBottom: '16px' }} />
          <Title level={4} style={{ color: token.colorTextSecondary, marginBottom: '8px' }}>
            Coming Soon
          </Title>
          <Text type="secondary">Dormitory guidelines and regulations will be available here.</Text>
        </div>
      </div>
    </div>
  );
};

export default Guidelines;
