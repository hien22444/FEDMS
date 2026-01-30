import React from 'react';
import { Card, Button, Typography, Tag, Space, Input, Select, TimePicker, Row, Col, theme } from 'antd';
import {
  TeamOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  CloseOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Guidelines: React.FC = () => {
  const { token } = theme.useToken();

  return (
    <div style={{ padding: '32px', background: token.colorBgLayout }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <Title level={2} style={{ marginBottom: '8px' }}>Visitor Management</Title>
            <Text type="secondary">Manage visitor requests and registrations</Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
          >
            New Visitor Request
          </Button>
        </div>

        {/* Visitor Requests */}
        <Title level={3} style={{ marginBottom: '16px' }}>My Requests</Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '48px' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    background: `${token.colorPrimary}20`,
                    borderRadius: token.borderRadius,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TeamOutlined style={{ fontSize: '24px', color: token.colorPrimary }} />
                </div>
                <div>
                  <Title level={4} style={{ margin: '0 0 4px 0' }}>Trần Thị B</Title>
                  <Text type="secondary">Phone: 098 765 4321</Text>
                </div>
              </div>
              <Tag color="processing">Pending</Tag>
            </div>
            <Row
              gutter={[16, 16]}
              style={{
                padding: '16px',
                background: token.colorBgTextHover,
                borderRadius: token.borderRadius,
                marginBottom: '16px',
              }}
            >
              <Col xs={12}>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  Visit Date
                </Text>
                <Text strong>20/12/2024</Text>
              </Col>
              <Col xs={12}>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  Visit Time
                </Text>
                <Text strong>14:00 - 16:00</Text>
              </Col>
            </Row>
            <Button
              danger
              icon={<CloseOutlined />}
              block
            >
              Cancel Request
            </Button>
          </Card>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    background: `${token.colorSuccess}20`,
                    borderRadius: token.borderRadius,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TeamOutlined style={{ fontSize: '24px', color: token.colorSuccess }} />
                </div>
                <div>
                  <Title level={4} style={{ margin: '0 0 4px 0' }}>Phạm Văn C & Family</Title>
                  <Text type="secondary">Relation: Family</Text>
                </div>
              </div>
              <Tag color="success">Approved</Tag>
            </div>
            <Row
              gutter={[16, 16]}
              style={{
                padding: '16px',
                background: token.colorBgTextHover,
                borderRadius: token.borderRadius,
                marginBottom: '16px',
              }}
            >
              <Col xs={12}>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  Visit Date
                </Text>
                <Text strong>15/12/2024</Text>
              </Col>
              <Col xs={12}>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  Visit Time
                </Text>
                <Text strong>10:00 - 18:00</Text>
              </Col>
            </Row>
            <Space>
              <CheckCircleOutlined style={{ color: token.colorSuccess }} />
              <Text style={{ color: token.colorSuccess, fontSize: '14px' }}>
                Approved on 10/12/2024
              </Text>
            </Space>
          </Card>
        </div>

        {/* Create New Request Form */}
        <Title level={3} style={{ marginBottom: '16px' }}>Create New Visitor Request</Title>
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Title level={5}>Visitor Information</Title>

            <Row gutter={24}>
              <Col xs={24} md={12}>
                <div>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                    Visitor Name <Text type="danger">*</Text>
                  </Text>
                  <Input
                    placeholder="Full name"
                    size="large"
                  />
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                    Phone Number <Text type="danger">*</Text>
                  </Text>
                  <Input
                    placeholder="0123 456 789"
                    size="large"
                  />
                </div>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col xs={24} md={12}>
                <div>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                    Relation <Text type="danger">*</Text>
                  </Text>
                  <Select
                    placeholder="Select relation..."
                    style={{ width: '100%' }}
                    size="large"
                    options={[
                      { label: 'Family', value: 'family' },
                      { label: 'Friend', value: 'friend' },
                      { label: 'Girlfriend/Boyfriend', value: 'partner' },
                      { label: 'Other', value: 'other' },
                    ]}
                  />
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                    ID Card Number
                  </Text>
                  <Input
                    placeholder="Optional"
                    size="large"
                  />
                </div>
              </Col>
            </Row>

            <div style={{ borderTop: `1px solid ${token.colorBorder}`, paddingTop: '24px' }}>
              <Title level={5} style={{ marginBottom: '16px' }}>Visit Details</Title>
            </div>

            <Row gutter={24}>
              <Col xs={24} md={12}>
                <div>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                    Visit Date <Text type="danger">*</Text>
                  </Text>
                  <Input
                    type="date"
                    size="large"
                    style={{ width: '100%' }}
                  />
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                    Visit Time <Text type="danger">*</Text>
                  </Text>
                  <Space.Compact style={{ width: '100%' }}>
                    <TimePicker
                      placeholder="From"
                      size="large"
                      style={{ flex: 1 }}
                      format="HH:mm"
                    />
                    <TimePicker
                      placeholder="To"
                      size="large"
                      style={{ flex: 1 }}
                      format="HH:mm"
                    />
                  </Space.Compact>
                </div>
              </Col>
            </Row>

            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                Purpose of Visit <Text type="danger">*</Text>
              </Text>
              <TextArea
                placeholder="Briefly describe the purpose of visit..."
                rows={3}
                size="large"
              />
            </div>

            <Space style={{ width: '100%' }}>
              <Button type="primary" size="large" style={{ flex: 1 }}>
                Submit Request
              </Button>
              <Button size="large" style={{ flex: 1 }}>
                Cancel
              </Button>
            </Space>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default Guidelines;
