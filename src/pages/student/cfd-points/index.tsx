import React from 'react';
import { Card, Row, Col, Typography, Progress, theme } from 'antd';
import {
  ExclamationCircleOutlined,
  RiseOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const CFDPoints: React.FC = () => {
  const { token } = theme.useToken();

  const violations = [
    { title: 'Noise Violation', description: 'Noise after quiet hours', date: '15/11/2024', points: '-0.5' },
    { title: 'Poor Hygiene', description: 'Room not clean', date: '10/10/2024', points: '-1.0' },
    { title: 'Prohibited Items', description: 'Hidden water heater', date: '05/09/2024', points: '-0.75' }
  ];

  const rewards = [
    { title: 'Group Activity Participation', description: 'Life skills training course', date: '20/12/2024', points: '+0.5' },
    { title: 'Excellent Hygiene', description: 'Room met cleanliness standard for 3 consecutive months', date: '15/12/2024', points: '+1.0' },
    { title: 'Volunteer Work', description: 'Participated in volunteer activities', date: '10/11/2024', points: '+0.75' },
    { title: 'Academic Excellence', description: 'Achieved honor student title', date: '05/10/2024', points: '+1.5' }
  ];

  return (
    <div style={{ padding: '32px', background: token.colorBgLayout }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>CFD Points</Title>
          <Text type="secondary">Manage and track your behavioral score</Text>
        </div>

        {/* Score Display */}
        <Card
          style={{
            marginBottom: '32px',
            background: `linear-gradient(135deg, ${token.colorPrimary}10 0%, ${token.colorSuccess}10 100%)`,
            borderLeft: `4px solid ${token.colorPrimary}`,
            textAlign: 'center',
          }}
        >
          <Text type="secondary" style={{ textTransform: 'uppercase', letterSpacing: '2px', fontSize: '14px', fontWeight: 600 }}>
            Current CFD Score
          </Text>
          <div style={{ margin: '24px 0', display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
            <span style={{ fontSize: '96px', fontWeight: 'bold', color: token.colorPrimary, lineHeight: 1 }}>
              8.5
            </span>
            <span style={{ fontSize: '36px', color: token.colorPrimary, marginLeft: '8px' }}>
              /10
            </span>
          </div>
          <Progress
            percent={85}
            showInfo={false}
            strokeColor={token.colorPrimary}
            style={{ maxWidth: '400px', margin: '0 auto 24px' }}
          />
          <Text style={{ fontSize: '18px', color: token.colorSuccess, fontWeight: 600, display: 'block', marginBottom: '8px' }}>
            Good Score
          </Text>
          <Text type="secondary">You are maintaining a sufficient behavioral score</Text>
        </Card>

        {/* Score Breakdown */}
        <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
          <Col xs={24} md={8}>
            <Card style={{ borderLeft: `4px solid ${token.colorSuccess}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                    Conduct Rank
                  </Text>
                  <Title level={3} style={{ color: token.colorSuccess, margin: 0 }}>
                    ⭐ Good
                  </Title>
                </div>
                <TrophyOutlined style={{ fontSize: '32px', color: token.colorSuccess, opacity: 0.5 }} />
              </div>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '16px' }}>
                Current semester rank
              </Text>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card style={{ borderLeft: `4px solid ${token.colorPrimary}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                    Violations
                  </Text>
                  <Title level={3} style={{ color: token.colorPrimary, margin: 0 }}>
                    1/3
                  </Title>
                </div>
                <ExclamationCircleOutlined style={{ fontSize: '32px', color: token.colorPrimary, opacity: 0.5 }} />
              </div>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '16px' }}>
                You are in good standing
              </Text>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card style={{ borderLeft: `4px solid ${token.colorText}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                    Last Updated
                  </Text>
                  <Title level={3} style={{ margin: 0 }}>
                    Today
                  </Title>
                </div>
                <RiseOutlined style={{ fontSize: '32px', color: token.colorText, opacity: 0.5 }} />
              </div>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '16px' }}>
                Updated regularly
              </Text>
            </Card>
          </Col>
        </Row>

        {/* Deducted Points */}
        <Title level={3} style={{ marginBottom: '16px' }}>Deducted Points</Title>
        <Card style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {violations.map((violation, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: `${token.colorError}10`,
                  borderRadius: token.borderRadius,
                  borderLeft: `4px solid ${token.colorError}`,
                }}
              >
                <div>
                  <Text strong style={{ display: 'block', marginBottom: '4px' }}>
                    {violation.title}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    {violation.description}
                  </Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    {violation.date}
                  </Text>
                  <Text strong style={{ color: token.colorError, fontSize: '14px' }}>
                    {violation.points} pts
                  </Text>
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: `1px solid ${token.colorBorder}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text strong>Total deducted</Text>
            <Title level={4} style={{ color: token.colorError, margin: 0 }}>
              -2.25 pts
            </Title>
          </div>
        </Card>

        {/* Earned Points */}
        <Title level={3} style={{ marginBottom: '16px' }}>Earned Points</Title>
        <Card style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rewards.map((reward, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: `${token.colorSuccess}10`,
                  borderRadius: token.borderRadius,
                  borderLeft: `4px solid ${token.colorSuccess}`,
                }}
              >
                <div>
                  <Text strong style={{ display: 'block', marginBottom: '4px' }}>
                    {reward.title}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    {reward.description}
                  </Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                    {reward.date}
                  </Text>
                  <Text strong style={{ color: token.colorSuccess, fontSize: '14px' }}>
                    {reward.points} pts
                  </Text>
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: '24px',
              paddingTop: '24px',
              borderTop: `1px solid ${token.colorBorder}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text strong>Total earned</Text>
            <Title level={4} style={{ color: token.colorSuccess, margin: 0 }}>
              +3.75 pts
            </Title>
          </div>
        </Card>

        {/* Score Factors */}
        <Title level={3} style={{ marginBottom: '16px' }}>CFD Score Factors</Title>
        <Card style={{ marginBottom: '32px' }}>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <div
                style={{
                  padding: '16px',
                  background: token.colorBgTextHover,
                  borderRadius: token.borderRadius,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <CheckCircleOutlined style={{ fontSize: '20px', color: token.colorSuccess }} />
                  <Text strong>Room Cleanliness</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Progress
                    percent={90}
                    showInfo={false}
                    strokeColor={token.colorSuccess}
                    style={{ flex: 1 }}
                  />
                  <Text strong style={{ fontSize: '14px' }}>9/10</Text>
                </div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Always keeps room clean
                </Text>
              </div>
            </Col>

            <Col xs={24} md={8}>
              <div
                style={{
                  padding: '16px',
                  background: token.colorBgTextHover,
                  borderRadius: token.borderRadius,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <CheckCircleOutlined style={{ fontSize: '20px', color: token.colorSuccess }} />
                  <Text strong>Rule Compliance</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Progress
                    percent={85}
                    showInfo={false}
                    strokeColor={token.colorSuccess}
                    style={{ flex: 1 }}
                  />
                  <Text strong style={{ fontSize: '14px' }}>8.5/10</Text>
                </div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Mostly compliant with regulations
                </Text>
              </div>
            </Col>

            <Col xs={24} md={8}>
              <div
                style={{
                  padding: '16px',
                  background: token.colorBgTextHover,
                  borderRadius: token.borderRadius,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <CheckCircleOutlined style={{ fontSize: '20px', color: token.colorSuccess }} />
                  <Text strong>Activity Participation</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Progress
                    percent={80}
                    showInfo={false}
                    strokeColor={token.colorSuccess}
                    style={{ flex: 1 }}
                  />
                  <Text strong style={{ fontSize: '14px' }}>8/10</Text>
                </div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Participated in some activities
                </Text>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Tips for Improvement */}
        <Card
          style={{
            background: `${token.colorSuccess}10`,
            borderLeft: `4px solid ${token.colorSuccess}`,
          }}
        >
          <Title level={4} style={{ marginBottom: '16px' }}>How to Improve Your CFD Score</Title>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>
              <Text>Always comply with dormitory rules</Text>
            </li>
            <li>
              <Text>Keep your room and common areas clean</Text>
            </li>
            <li>
              <Text>Participate in group activities</Text>
            </li>
            <li>
              <Text>Actively help other students</Text>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default CFDPoints;
