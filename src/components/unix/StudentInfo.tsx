import { Card, Avatar, Space, Divider, theme } from 'antd';
import { UserOutlined, PhoneOutlined } from '@ant-design/icons';
import type { FC } from 'react';
import { useAuth } from '@/contexts';

export const StudentInfo: FC = () => {
  const { token } = theme.useToken();
  const { user, profile } = useAuth();

  // Get display data from profile or user
  const displayName = profile?.full_name || user?.fullname || user?.email?.split('@')[0] || 'Student';
  const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'default'}`;
  const gender = profile?.gender === 'male' ? 'Nam' : profile?.gender === 'female' ? 'Nữ' : 'Chưa cập nhật';
  const dateOfBirth = profile?.date_of_birth
    ? new Date(profile.date_of_birth).toLocaleDateString('vi-VN')
    : 'Chưa cập nhật';
  const phone = profile?.phone || 'Chưa cập nhật';

  return (
    <Card
      title={
        <Space>
          <UserOutlined style={{ fontSize: '20px' }} />
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
            Thông tin cá nhân
          </span>
        </Space>
      }
      bordered
      style={{ borderRadius: '8px' }}
      headStyle={{
        backgroundColor: token.colorPrimary,
        color: 'white',
        borderRadius: '8px 8px 0 0',
      }}
      bodyStyle={{ padding: '24px' }}
    >
      <div style={{ textAlign: 'center' }}>
        <Avatar
          size={96}
          src={avatarUrl}
          icon={<UserOutlined />}
          style={{ border: `4px solid ${token.colorBorder}`, marginBottom: '16px' }}
        />
        <h4
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '16px',
            color: token.colorText,
          }}
        >
          {displayName}
        </h4>
        <Space
          direction="vertical"
          size="small"
          style={{ color: token.colorTextSecondary, fontSize: '14px' }}
        >
          <div>
            <span style={{ fontWeight: 500, color: token.colorText }}>{gender}</span>
          </div>
          <div>
            <span style={{ fontWeight: 500, color: token.colorText }}>
              {dateOfBirth}
            </span>
          </div>
        </Space>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Space size="small" style={{ color: token.colorPrimary }}>
            <PhoneOutlined style={{ fontSize: '20px' }} />
            <div>
              <div style={{ fontSize: '12px', color: token.colorTextSecondary }}>
                Điện thoại
              </div>
              <div style={{ fontWeight: 600, color: token.colorText }}>
                {phone}
              </div>
            </div>
          </Space>
        </div>
      </div>
    </Card>
  );
};
