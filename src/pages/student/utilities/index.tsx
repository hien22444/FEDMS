import React from 'react';
import { Card, Row, Col, Typography, theme } from 'antd';
import {
  ThunderboltOutlined,
  DropboxOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface UtilityData {
  month: string;
  usage: number;
  cost: string;
  unit: string;
  trend: number;
}

const Utilities: React.FC = () => {
  const { token } = theme.useToken();

  const electricityData: UtilityData[] = [
    { month: 'October 2024', usage: 120, cost: '50,000', unit: 'kWh', trend: -5 },
    { month: 'November 2024', usage: 135, cost: '65,000', unit: 'kWh', trend: 12 },
    { month: 'December 2024', usage: 125, cost: '55,000', unit: 'kWh', trend: -7 },
  ];

  const waterData: UtilityData[] = [
    { month: 'October 2024', usage: 7.5, cost: '28,000', unit: 'm³', trend: 2 },
    { month: 'November 2024', usage: 8.2, cost: '32,000', unit: 'm³', trend: 9 },
    { month: 'December 2024', usage: 8.0, cost: '30,000', unit: 'm³', trend: -2 },
  ];

  return (
    <div style={{ padding: '32px', background: token.colorBgLayout }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>Utilities</Title>
          <Text type="secondary">View monthly electricity and water usage</Text>
        </div>

        {/* Current Month Summary */}
        <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
          <Col xs={24} md={12}>
            <Card
              style={{
                borderLeft: `4px solid #faad14`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                    Electricity Usage This Month
                  </Text>
                  <Title level={2} style={{ margin: '0 0 8px 0' }}>125 kWh</Title>
                  <Text type="secondary" style={{ fontSize: '14px' }}>December 2024</Text>
                </div>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    background: '#fffbe6',
                    borderRadius: token.borderRadius,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ThunderboltOutlined style={{ fontSize: '32px', color: '#faad14' }} />
                </div>
              </div>
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: `1px solid ${token.colorBorder}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowDownOutlined style={{ color: token.colorSuccess }} />
                  <Text style={{ color: token.colorSuccess, fontWeight: 500 }}>
                    -7% vs last month
                  </Text>
                </div>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  Saved 9 kWh
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card
              style={{
                borderLeft: `4px solid #1890ff`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                    Water Usage This Month
                  </Text>
                  <Title level={2} style={{ margin: '0 0 8px 0' }}>8 m³</Title>
                  <Text type="secondary" style={{ fontSize: '14px' }}>December 2024</Text>
                </div>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    background: '#e6f7ff',
                    borderRadius: token.borderRadius,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <DropboxOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
                </div>
              </div>
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: `1px solid ${token.colorBorder}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowDownOutlined style={{ color: token.colorSuccess }} />
                  <Text style={{ color: token.colorSuccess, fontWeight: 500 }}>
                    -2% vs last month
                  </Text>
                </div>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  Saved 0.2 m³
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Electricity Usage History */}
        <Title level={3} style={{ marginBottom: '16px' }}>Electricity Usage History</Title>
        <Card style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {electricityData.map((data, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: token.colorBgTextHover,
                  borderRadius: token.borderRadius,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = token.colorBgTextActive;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = token.colorBgTextHover;
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      background: '#fffbe6',
                      borderRadius: token.borderRadius,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ThunderboltOutlined style={{ fontSize: '24px', color: '#faad14' }} />
                  </div>
                  <div>
                    <Text strong style={{ display: 'block' }}>{data.month}</Text>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                      {data.usage} {data.unit}
                    </Text>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text strong style={{ display: 'block', fontSize: '16px' }}>₫{data.cost}</Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', justifyContent: 'flex-end' }}>
                    {data.trend < 0 ? (
                      <ArrowDownOutlined style={{ fontSize: '12px', color: token.colorSuccess }} />
                    ) : (
                      <ArrowUpOutlined style={{ fontSize: '12px', color: token.colorError }} />
                    )}
                    <Text
                      style={{
                        fontSize: '12px',
                        color: data.trend < 0 ? token.colorSuccess : token.colorError,
                        fontWeight: 500,
                      }}
                    >
                      {data.trend > 0 ? '+' : ''}{data.trend}%
                    </Text>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Water Usage History */}
        <Title level={3} style={{ marginBottom: '16px' }}>Water Usage History</Title>
        <Card style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {waterData.map((data, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: token.colorBgTextHover,
                  borderRadius: token.borderRadius,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = token.colorBgTextActive;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = token.colorBgTextHover;
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      background: '#e6f7ff',
                      borderRadius: token.borderRadius,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <DropboxOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                  </div>
                  <div>
                    <Text strong style={{ display: 'block' }}>{data.month}</Text>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                      {data.usage} {data.unit}
                    </Text>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Text strong style={{ display: 'block', fontSize: '16px' }}>₫{data.cost}</Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', justifyContent: 'flex-end' }}>
                    {data.trend < 0 ? (
                      <ArrowDownOutlined style={{ fontSize: '12px', color: token.colorSuccess }} />
                    ) : (
                      <ArrowUpOutlined style={{ fontSize: '12px', color: token.colorError }} />
                    )}
                    <Text
                      style={{
                        fontSize: '12px',
                        color: data.trend < 0 ? token.colorSuccess : token.colorError,
                        fontWeight: 500,
                      }}
                    >
                      {data.trend > 0 ? '+' : ''}{data.trend}%
                    </Text>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Tips for Saving */}
        <Card
          style={{
            background: `${token.colorSuccess}10`,
            borderLeft: `4px solid ${token.colorSuccess}`,
          }}
        >
          <Title level={4} style={{ marginBottom: '16px' }}>Tips for Saving Electricity & Water</Title>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>
              <Text>Turn off lights when not in use</Text>
            </li>
            <li>
              <Text>Use energy-saving light bulbs</Text>
            </li>
            <li>
              <Text>Turn off the faucet when brushing teeth or washing dishes</Text>
            </li>
            <li>
              <Text>Check faucets regularly to prevent leaks</Text>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Utilities;
