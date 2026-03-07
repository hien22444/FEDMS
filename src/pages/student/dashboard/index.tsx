import { Row, Col, Typography, theme } from 'antd';
import {
  ThunderboltOutlined,
  DropboxOutlined,
  CreditCardOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { StatCard, NewsSection, StudentInfo } from '@/components/unix';
import { useAuth } from '@/contexts';

const { Title, Text } = Typography;

const StudentDashboard = () => {
  const { token } = theme.useToken();
  const { user, profile } = useAuth();

  // Get display name from profile, user fullname, or email
  const displayName = profile?.full_name || user?.fullname || user?.email?.split('@')[0] || 'Student';

  return (
    <div>
      {/* Main Content */}
      <main
        style={{
          padding: '32px',
          backgroundColor: token.colorBgLayout,
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        {/* Greeting */}
        <div style={{ marginBottom: '32px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>
            Hello,{' '}
            <span style={{ color: token.colorPrimary }}>{displayName}</span>
          </Title>
          <Text type="secondary">
            Welcome back to the dormitory management system
          </Text>
        </div>

        {/* Stats Grid */}
        <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              icon={<ThunderboltOutlined style={{ fontSize: '24px' }} />}
              label="Electricity This Month"
              value="125 kWh"
              change="+12%"
              changeType="positive"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              icon={<DropboxOutlined style={{ fontSize: '24px' }} />}
              label="Water This Month"
              value="8 m³"
              change="-5%"
              changeType="negative"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              icon={<CreditCardOutlined style={{ fontSize: '24px' }} />}
              label="Payment"
              value="0 VND"
              change="Paid"
              changeType="success"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard
              icon={<CalendarOutlined style={{ fontSize: '24px' }} />}
              label="Contract"
              value="Spring 2026"
              change="Active"
              changeType="info"
            />
          </Col>
        </Row>

        {/* Bottom Section */}
        <Row gutter={[24, 24]}>
          {/* News Section */}
          <Col xs={24} lg={16}>
            <NewsSection />
          </Col>

          {/* Student Info */}
          <Col xs={24} lg={8}>
            <StudentInfo />
          </Col>
        </Row>
      </main>
    </div>
  );
};

export default StudentDashboard;
