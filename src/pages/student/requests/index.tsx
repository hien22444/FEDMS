import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Typography,
  Tag,
  Space,
  Input,
  Select,
  DatePicker,
  Upload,
  Row,
  Col,
  theme,
  Modal,
  message,
  Form,
  Spin,
  Alert,
} from 'antd';
import {
  FileSearchOutlined,
  ClockCircleOutlined,
  UploadOutlined,
  TeamOutlined,
  ToolOutlined,
  FlagOutlined,
  ArrowLeftOutlined,
  CloseOutlined,
  PlusOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import {
  createVisitorRequest,
  getMyVisitorRequests,
  cancelVisitorRequest as cancelVisitorRequestAction,
} from '@/lib/actions';
import type { IVisitor } from '@/interfaces';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

type RequestType = 'visitor' | 'maintenance' | 'report' | null;

const REQUEST_TYPES = [
  {
    key: 'visitor' as const,
    icon: <TeamOutlined style={{ fontSize: '32px' }} />,
    title: 'Visitor Request',
    description: 'Request permission for visitors to enter the dormitory',
    color: '#1890ff',
  },
  {
    key: 'maintenance' as const,
    icon: <ToolOutlined style={{ fontSize: '32px' }} />,
    title: 'Maintenance Request',
    description: 'Report facility issues and request repairs',
    color: '#52c41a',
  },
  {
    key: 'report' as const,
    icon: <FlagOutlined style={{ fontSize: '32px' }} />,
    title: 'Violation Report',
    description: 'Report violations or safety concerns in the dormitory',
    color: '#fa541c',
  },
];

const Requests: React.FC = () => {
  const { token } = theme.useToken();
  const [selectedType, setSelectedType] = useState<RequestType>(null);
  const [filterType, setFilterType] = useState<RequestType | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [visitorRequests, setVisitorRequests] = useState<IVisitor.VisitorRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMyRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyVisitorRequests();
      setVisitorRequests(data);
    } catch {
      // silent — API may not be ready
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="processing">Pending</Tag>;
      case 'approved':
        return <Tag color="success">Approved</Tag>;
      case 'in_progress':
        return <Tag color="warning">In Progress</Tag>;
      case 'completed':
        return <Tag color="cyan">Completed</Tag>;
      case 'rejected':
        return <Tag color="error">Rejected</Tag>;
      case 'cancelled':
        return <Tag color="default">Cancelled</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'visitor':
        return <TeamOutlined style={{ fontSize: '24px', color: '#1890ff' }} />;
      case 'maintenance':
        return <ToolOutlined style={{ fontSize: '24px', color: '#52c41a' }} />;
      case 'report':
        return <FlagOutlined style={{ fontSize: '24px', color: '#fa541c' }} />;
      default:
        return <FileSearchOutlined />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'visitor':
        return 'Visitor';
      case 'maintenance':
        return 'Maintenance';
      case 'report':
        return 'Report';
      default:
        return type;
    }
  };

  const relationshipLabel: Record<string, string> = {
    parent: 'Parent',
    sibling: 'Sibling',
    friend: 'Friend',
    other: 'Other',
  };

  // Map visitor requests to a common display format
  const allRequests = [
    ...visitorRequests.map((r) => ({
      id: r.id,
      type: 'visitor' as const,
      title: r.purpose || 'Visitor Request',
      subtitle: r.request_code,
      status: r.status,
      date: dayjs(r.visit_date).format('DD/MM/YYYY'),
      detail: `${r.visit_time_from ?? '07:00'} - ${r.visit_time_to ?? '17:00'}`,
      rejection_reason: r.rejection_reason,
      visitors: r.visitors,
      raw: r,
    })),
  ];

  const filteredRequests =
    filterType === 'all'
      ? allRequests
      : allRequests.filter((r) => r.type === filterType);

  const handleNewRequest = (type: RequestType) => {
    setSelectedType(type);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedType(null);
  };

  const handleVisitorCreated = () => {
    handleCloseForm();
    fetchMyRequests();
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelVisitorRequestAction(id);
      message.success('Request cancelled');
      fetchMyRequests();
    } catch {
      message.error('Failed to cancel request');
    }
  };

  return (
    <div style={{ padding: '32px', background: token.colorBgLayout }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <Title level={2} style={{ marginBottom: '8px' }}>
            Requests
          </Title>
          <Text type="secondary">
            Submit and track all your requests in one place
          </Text>
        </div>

        {/* Request Type Selection Cards */}
        <Title level={4} style={{ marginBottom: '16px' }}>
          New Request
        </Title>
        <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
          {REQUEST_TYPES.map((type) => (
            <Col xs={24} md={8} key={type.key}>
              <Card
                hoverable
                onClick={() => handleNewRequest(type.key)}
                style={{ textAlign: 'center', cursor: 'pointer' }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    background: `${type.color}15`,
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: type.color,
                  }}
                >
                  {type.icon}
                </div>
                <Title level={5} style={{ marginBottom: '4px' }}>
                  {type.title}
                </Title>
                <Text type="secondary" style={{ fontSize: '13px' }}>
                  {type.description}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Request History */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            My Requests
          </Title>
          <Space>
            {(['all', 'visitor', 'maintenance', 'report'] as const).map((f) => (
              <Button
                key={f}
                type={filterType === f ? 'primary' : 'default'}
                size="small"
                onClick={() => setFilterType(f)}
              >
                {f === 'all' ? 'All' : getTypeLabel(f)}
              </Button>
            ))}
          </Space>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredRequests.map((req) => (
              <Card key={`${req.type}-${req.id}`} size="small">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  {/* Icon */}
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      background: token.colorBgTextHover,
                      borderRadius: token.borderRadius,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {getTypeIcon(req.type)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Row 1: purpose + status */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '8px',
                        marginBottom: '4px',
                      }}
                    >
                      <Text strong style={{ fontSize: '14px', lineHeight: '22px' }}>
                        {req.title}
                      </Text>
                      {getStatusTag(req.status)}
                    </div>

                    {/* Row 2: request code */}
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Code: {req.subtitle}
                    </Text>

                    {/* Row 3: date + time */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {req.date}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {req.detail}
                      </Text>
                      {req.visitors && req.visitors.length > 0 && (
                        <Tag color="blue" style={{ fontSize: '11px', lineHeight: '18px' }}>
                          {req.visitors.length} visitor{req.visitors.length > 1 ? 's' : ''}
                        </Tag>
                      )}
                    </div>

                    {/* Row 4: visitor names + relationships */}
                    {req.visitors && req.visitors.length > 0 && (
                      <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {req.visitors.map((v, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: '12px',
                              color: token.colorTextSecondary,
                              background: token.colorBgTextHover,
                              borderRadius: '4px',
                              padding: '1px 8px',
                            }}
                          >
                            {v.full_name}
                            <span style={{ color: token.colorTextQuaternary, marginLeft: 4 }}>
                              ({relationshipLabel[v.relationship] ?? v.relationship})
                            </span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Row 5: rejection reason */}
                    {req.status === 'rejected' && req.rejection_reason && (
                      <Text
                        type="danger"
                        style={{ fontSize: '12px', display: 'block', marginTop: '6px' }}
                      >
                        Rejection reason: {req.rejection_reason}
                      </Text>
                    )}
                  </div>

                  {/* Cancel button */}
                  {req.status === 'pending' && (
                    <Button
                      danger
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={() => handleCancel(req.id)}
                      style={{ flexShrink: 0 }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </Card>
            ))}

            {filteredRequests.length === 0 && (
              <Card>
                <div style={{ textAlign: 'center', padding: '32px' }}>
                  <Text type="secondary">No requests found</Text>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* New Request Form Modal */}
        <Modal
          open={showForm}
          onCancel={handleCloseForm}
          footer={null}
          width={720}
          destroyOnClose
          title={
            <Space>
              <ArrowLeftOutlined onClick={handleCloseForm} style={{ cursor: 'pointer' }} />
              {selectedType === 'visitor' && 'New Visitor Request'}
              {selectedType === 'maintenance' && 'New Maintenance Request'}
              {selectedType === 'report' && 'New Violation Report'}
            </Space>
          }
        >
          {selectedType === 'visitor' && <VisitorForm onSuccess={handleVisitorCreated} />}
          {selectedType === 'maintenance' && <MaintenanceForm />}
          {selectedType === 'report' && <ReportForm />}
        </Modal>
      </div>
    </div>
  );
};

// ─── Visitor Request Form (connected to API) ───
const VisitorForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const dto: IVisitor.CreateVisitorRequestDto = {
        visit_date: values.visit_date.format('YYYY-MM-DD'),
        purpose: values.purpose,
        visitors: values.visitors.map((v: any) => ({
          full_name: v.full_name,
          citizen_id: v.citizen_id,
          phone: v.phone,
          relationship: v.relationship,
          relationship_other: v.relationship_other,
        })),
      };

      await createVisitorRequest(dto);
      message.success('Visitor request submitted successfully');
      onSuccess();
    } catch (err: any) {
      if (err?.message) {
        message.error(Array.isArray(err.message) ? err.message[0] : err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form form={form} layout="vertical" initialValues={{ visitors: [{}] }}>
      <Alert
        message="Khung giờ tiếp khách: 07:00 – 17:00 hằng ngày. Người thân có thể đến và về bất kỳ lúc nào trong khung giờ này."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Title level={5}>Visit Details</Title>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="visit_date"
            label="Visit Date"
            rules={[{ required: true, message: 'Required' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              disabledDate={(d) => d.isBefore(dayjs().startOf('day'))}
            />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item
        name="purpose"
        label="Purpose of Visit"
        rules={[{ required: true, message: 'Required' }]}
      >
        <TextArea placeholder="Briefly describe the purpose..." rows={2} />
      </Form.Item>

      <Title level={5}>Visitors (max 5)</Title>
      <Form.List name="visitors">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Card
                key={key}
                size="small"
                style={{ marginBottom: 12 }}
                extra={
                  fields.length > 1 ? (
                    <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                  ) : null
                }
                title={`Visitor ${name + 1}`}
              >
                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      {...restField}
                      name={[name, 'full_name']}
                      label="Full Name"
                      rules={[{ required: true, message: 'Required' }]}
                    >
                      <Input placeholder="Full name" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      {...restField}
                      name={[name, 'citizen_id']}
                      label="Citizen ID (CCCD)"
                      rules={[{ required: true, message: 'Required' }]}
                    >
                      <Input placeholder="ID card number" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      {...restField}
                      name={[name, 'phone']}
                      label="Phone"
                      rules={[{ required: true, message: 'Required' }]}
                    >
                      <Input placeholder="0123 456 789" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      {...restField}
                      name={[name, 'relationship']}
                      label="Relationship"
                      rules={[{ required: true, message: 'Required' }]}
                    >
                      <Select
                        placeholder="Select..."
                        options={[
                          { label: 'Parent', value: 'parent' },
                          { label: 'Sibling', value: 'sibling' },
                          { label: 'Friend', value: 'friend' },
                          { label: 'Other', value: 'other' },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item noStyle shouldUpdate>
                      {({ getFieldValue }) =>
                        getFieldValue(['visitors', name, 'relationship']) === 'other' ? (
                          <Form.Item
                            {...restField}
                            name={[name, 'relationship_other']}
                            label="Specify relationship"
                            rules={[{ required: true, message: 'Please specify' }]}
                          >
                            <Input placeholder="e.g. Cousin, Aunt..." />
                          </Form.Item>
                        ) : null
                      }
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            ))}
            {fields.length < 5 && (
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Add Visitor
              </Button>
            )}
          </>
        )}
      </Form.List>

      <div style={{ marginTop: 16 }}>
        <Button type="primary" onClick={handleSubmit} loading={submitting} size="large">
          Submit Request
        </Button>
      </div>
    </Form>
  );
};

// ─── Maintenance Request Form (placeholder — no API yet) ───
const MaintenanceForm: React.FC = () => (
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
          { label: 'Internet/WiFi', value: 'internet' },
          { label: 'Other', value: 'other' },
        ]}
      />
    </div>
    <div>
      <Text strong style={{ display: 'block', marginBottom: '8px' }}>
        Location <Text type="danger">*</Text>
      </Text>
      <Input placeholder="e.g., Room 205, Block A" size="large" />
    </div>
    <div>
      <Text strong style={{ display: 'block', marginBottom: '8px' }}>
        Description <Text type="danger">*</Text>
      </Text>
      <TextArea placeholder="Describe the issue..." rows={4} size="large" />
    </div>
    <div>
      <Text strong style={{ display: 'block', marginBottom: '8px' }}>
        Upload Photos
      </Text>
      <Upload.Dragger multiple listType="picture" beforeUpload={() => false}>
        <p className="ant-upload-drag-icon">
          <UploadOutlined style={{ fontSize: '36px', color: '#52c41a' }} />
        </p>
        <Text>Click to upload or drag and drop</Text>
      </Upload.Dragger>
    </div>
    <Button type="primary" size="large" disabled>
      Coming Soon
    </Button>
  </Space>
);

// ─── Violation Report Form (placeholder — no API yet) ───
const ReportForm: React.FC = () => (
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
          { label: 'Other', value: 'other' },
        ]}
      />
    </div>
    <div>
      <Text strong style={{ display: 'block', marginBottom: '8px' }}>
        Description <Text type="danger">*</Text>
      </Text>
      <TextArea placeholder="Provide detailed description..." rows={4} size="large" />
    </div>
    <div>
      <Text strong style={{ display: 'block', marginBottom: '8px' }}>
        Evidence Photos
      </Text>
      <Upload.Dragger multiple listType="picture" beforeUpload={() => false}>
        <p className="ant-upload-drag-icon">
          <UploadOutlined style={{ fontSize: '36px', color: '#fa541c' }} />
        </p>
        <Text>Click to upload or drag and drop</Text>
      </Upload.Dragger>
    </div>
    <Button type="primary" size="large" disabled>
      Coming Soon
    </Button>
  </Space>
);

export default Requests;
