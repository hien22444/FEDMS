import React from 'react';
import { Card, Button, Row, Col, Avatar, Typography, theme } from 'antd';
import {
  CameraOutlined,
  MailOutlined,
  PhoneOutlined,
  BookOutlined,
  CalendarOutlined,
  EditOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const Schedule: React.FC = () => {
  const { token } = theme.useToken();

  return (
    <div style={{ padding: '32px', background: token.colorBgLayout }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Title level={2} style={{ marginBottom: '32px' }}>My Profile</Title>

        {/* Profile Header */}
        <Card style={{ marginBottom: '32px', padding: '16px' }}>
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} sm={8} md={6}>
              <div style={{ position: 'relative', width: 'fit-content' }}>
                <Avatar
                  size={96}
                  style={{
                    backgroundColor: `${token.colorPrimary}20`,
                    fontSize: '48px',
                  }}
                >
                  👤
                </Avatar>
                <Button
                  type="primary"
                  shape="circle"
                  icon={<CameraOutlined />}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                  }}
                />
              </div>
            </Col>
            <Col xs={24} sm={16} md={18}>
              <Title level={3} style={{ marginBottom: '8px' }}>Nguyen Van A</Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
                Student ID: SE170001
              </Text>
              <Button
                type="primary"
                icon={<EditOutlined />}
                style={{ backgroundColor: token.colorPrimary }}
              >
                Edit Profile
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Personal and Contact Information */}
        <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
          <Col xs={24} md={12}>
            <Card>
              <Title level={4} style={{ marginBottom: '24px' }}>Personal Information</Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                    Full Name
                  </Text>
                  <Text strong>Nguyen Van A</Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                    Date of Birth
                  </Text>
                  <Text strong>15/01/2004</Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                    Gender
                  </Text>
                  <Text strong>Male</Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                    ID Number
                  </Text>
                  <Text strong>012345678901</Text>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card>
              <Title level={4} style={{ marginBottom: '24px' }}>Contact Information</Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <MailOutlined style={{ color: token.colorTextSecondary }} />
                    <Text type="secondary" style={{ fontSize: '14px' }}>Email</Text>
                  </div>
                  <Text strong>a.nguyen@student.fpt.edu.vn</Text>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <PhoneOutlined style={{ color: token.colorTextSecondary }} />
                    <Text type="secondary" style={{ fontSize: '14px' }}>Phone</Text>
                  </div>
                  <Text strong>0123 456 789</Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                    Address
                  </Text>
                  <Text strong>123 Lang Street, Hanoi</Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Academic and Housing Information */}
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <BookOutlined style={{ fontSize: '20px', color: token.colorPrimary }} />
                <Title level={4} style={{ margin: 0 }}>Academic Information</Title>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                    Student ID
                  </Text>
                  <Text strong>SE170001</Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                    Major
                  </Text>
                  <Text strong>Software Engineering</Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                    Class
                  </Text>
                  <Text strong>SE17A1</Text>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                <CalendarOutlined style={{ fontSize: '20px', color: token.colorPrimary }} />
                <Title level={4} style={{ margin: 0 }}>Housing Information</Title>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                    Room
                  </Text>
                  <Text strong>Block A - 205</Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                    Move-in Date
                  </Text>
                  <Text strong>01/09/2023</Text>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                    Contract Expiry
                  </Text>
                  <Text strong>31/08/2024</Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Schedule;
