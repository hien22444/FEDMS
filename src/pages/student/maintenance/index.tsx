import React from 'react';
import { Card, Button, Typography, Tag, Space, Input, Select, DatePicker, Upload, Row, Col, theme } from 'antd';
import {
  ToolOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  UploadOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Maintenance: React.FC = () => {
  const { token } = theme.useToken();

  return (
    <div style={{ padding: '32px', background: token.colorBgLayout }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <Title level={2} style={{ marginBottom: '8px' }}>Maintenance Requests</Title>
            <Text type="secondary">Report and track facility maintenance issues</Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
          >
            New Request
          </Button>
        </div>

        {/* My Requests */}
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
                  <ToolOutlined style={{ fontSize: '24px', color: token.colorPrimary }} />
                </div>
                <div>
                  <Title level={4} style={{ margin: '0 0 4px 0' }}>Broken Air Conditioner</Title>
                  <Text type="secondary">Room 205, Block A</Text>
                </div>
              </div>
              <Tag color="processing">In Progress</Tag>
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
                  Priority
                </Text>
                <Text strong style={{ color: token.colorError }}>High</Text>
              </Col>
              <Col xs={12}>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  Submitted
                </Text>
                <Text strong>2 days ago</Text>
              </Col>
            </Row>
            <Space style={{ marginBottom: '16px' }}>
              <ClockCircleOutlined style={{ color: token.colorTextSecondary }} />
              <Text type="secondary" style={{ fontSize: '14px' }}>
                Estimated completion: Tomorrow
              </Text>
            </Space>
            <Button block>View Details</Button>
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
                  <ToolOutlined style={{ fontSize: '24px', color: token.colorSuccess }} />
                </div>
                <div>
                  <Title level={4} style={{ margin: '0 0 4px 0' }}>Water Leak</Title>
                  <Text type="secondary">Common Area - Ground Floor</Text>
                </div>
              </div>
              <Tag color="success">Completed</Tag>
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
                  Priority
                </Text>
                <Text strong style={{ color: token.colorError }}>Critical</Text>
              </Col>
              <Col xs={12}>
                <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  Submitted
                </Text>
                <Text strong>5 days ago</Text>
              </Col>
            </Row>
            <Space style={{ marginBottom: '16px' }}>
              <CheckCircleOutlined style={{ color: token.colorSuccess }} />
              <Text style={{ fontSize: '14px', color: token.colorSuccess }}>
                Completed on 10/12/2024
              </Text>
            </Space>
            <Button
              block
              style={{
                borderColor: token.colorSuccess,
                color: token.colorSuccess,
              }}
            >
              Leave Feedback
            </Button>
          </Card>
        </div>

        {/* Create New Request Form */}
        <Title level={3} style={{ marginBottom: '16px' }}>Create New Request</Title>
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                Issue Type <Text type="danger">*</Text>
              </Text>
              <Select
                placeholder="Select issue type..."
                style={{ width: '100%' }}
                size="large"
                options={[
                  { label: 'Air Conditioning', value: 'ac' },
                  { label: 'Plumbing', value: 'plumbing' },
                  { label: 'Electrical', value: 'electrical' },
                  { label: 'Furniture/Fixture', value: 'furniture' },
                  { label: 'Cleaning/Pest', value: 'cleaning' },
                  { label: 'Internet/WiFi', value: 'internet' },
                  { label: 'Other', value: 'other' },
                ]}
              />
            </div>

            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                Location <Text type="danger">*</Text>
              </Text>
              <Input
                placeholder="e.g., Room 205, Block A"
                size="large"
              />
            </div>

            <Row gutter={24}>
              <Col xs={24} md={12}>
                <div>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                    Priority Level <Text type="danger">*</Text>
                  </Text>
                  <Select
                    placeholder="Select priority..."
                    style={{ width: '100%' }}
                    size="large"
                    options={[
                      { label: 'Low - Can wait', value: 'low' },
                      { label: 'Medium - Should fix soon', value: 'medium' },
                      { label: 'High - Fix ASAP', value: 'high' },
                      { label: 'Critical - Emergency', value: 'critical' },
                    ]}
                  />
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                    Preferred Date <Text type="danger">*</Text>
                  </Text>
                  <DatePicker
                    style={{ width: '100%' }}
                    size="large"
                  />
                </div>
              </Col>
            </Row>

            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                Detailed Description <Text type="danger">*</Text>
              </Text>
              <TextArea
                placeholder="Describe the issue in detail..."
                rows={5}
                size="large"
              />
            </div>

            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                Upload Photos
              </Text>
              <Upload.Dragger
                multiple
                listType="picture"
                beforeUpload={() => false}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined style={{ fontSize: '48px', color: token.colorPrimary }} />
                </p>
                <Text>Click to upload or drag and drop</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  PNG, JPG, GIF up to 10MB
                </Text>
              </Upload.Dragger>
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

export default Maintenance;
