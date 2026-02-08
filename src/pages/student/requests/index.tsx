import React from 'react';
import { Card, Button, Typography, Tag, Space, Input, Select, DatePicker, Upload, theme } from 'antd';
import {
  FlagOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  UploadOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Requests: React.FC = () => {
  const { token } = theme.useToken();

  return (
    <div style={{ padding: '32px', background: token.colorBgLayout }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <Title level={2} style={{ marginBottom: '8px' }}>Reports</Title>
            <Text type="secondary">Report violations and track your submissions</Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
          >

            New Report
          </Button>

        </div>

        {/* My Reports */}
        <Title level={3} style={{ marginBottom: '16px' }}>My Reports</Title>
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
                  <FlagOutlined style={{ fontSize: '24px', color: token.colorPrimary }} />
                </div>
                <div>
                  <Title level={4} style={{ margin: '0 0 4px 0' }}>Noise Disturbance</Title>
                  <Text type="secondary">Room 301 - Block B</Text>
                </div>
              </div>
              <Tag color="processing">Pending</Tag>
            </div>
            <Text style={{ display: 'block', marginBottom: '16px' }}>
              Excessive noise late at night affecting other students' study time.
            </Text>
            <Space>
              <ClockCircleOutlined style={{ color: token.colorTextSecondary }} />
              <Text type="secondary" style={{ fontSize: '12px' }}>Submitted 2 days ago</Text>
            </Space>
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
                  <FlagOutlined style={{ fontSize: '24px', color: token.colorSuccess }} />
                </div>
                <div>
                  <Title level={4} style={{ margin: '0 0 4px 0' }}>Unauthorized Guest</Title>
                  <Text type="secondary">Lobby - Block A</Text>
                </div>
              </div>
              <Tag color="success">Resolved</Tag>
            </div>
            <Text style={{ display: 'block', marginBottom: '16px' }}>
              Found unauthorized person in dormitory common area without visitor pass.
            </Text>
            <Space>
              <CheckCircleOutlined style={{ color: token.colorSuccess }} />
              <Text type="secondary" style={{ fontSize: '12px' }}>Resolved 5 days ago</Text>
            </Space>
          </Card>
        </div>

        {/* Create New Report Form */}
        <Title level={3} style={{ marginBottom: '16px' }}>Create New Report</Title>
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                Violation Type <Text type="danger">*</Text>
              </Text>
              <Select
                placeholder="Select violation type..."
                style={{ width: '100%' }}
                size="large"
                options={[
                  { label: 'Noise Disturbance', value: 'noise' },
                  { label: 'Cleanliness Issue', value: 'cleanliness' },
                  { label: 'Unauthorized Guest', value: 'guest' },
                  { label: 'Alcohol/Smoking', value: 'alcohol' },
                  { label: 'Harassment', value: 'harassment' },
                  { label: 'Other', value: 'other' },
                ]}
              />
            </div>

            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                Location <Text type="danger">*</Text>
              </Text>
              <Input
                placeholder="e.g., Room 305, Block B"
                size="large"
              />
            </div>

            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                Date & Time <Text type="danger">*</Text>
              </Text>
              <DatePicker
                showTime
                style={{ width: '100%' }}
                size="large"
              />
            </div>

            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                Description <Text type="danger">*</Text>
              </Text>
              <TextArea
                placeholder="Provide detailed description of the violation..."
                rows={5}
                size="large"
              />
            </div>

            <div>
              <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                Evidence Photos
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
                Submit Report
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

export default Requests;
