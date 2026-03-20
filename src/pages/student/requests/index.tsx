import React, { useState, useEffect, useCallback } from 'react';
import {
  App,
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
  Tabs,
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
  createOtherRequest,
  getMyOtherRequests,
} from '@/lib/actions';
import type { IVisitor } from '@/interfaces';
import { ViolationType, ReporterType, type IViolation } from '@/interfaces';
import violationActions from '@/lib/actions/violation';
const { getMyViolationReports, createViolationReport } = violationActions;
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

type RequestType = 'visitor' | 'maintenance' | 'report' | 'other' | null;
type RequestTabKey = 'visitor' | 'maintenance' | 'report' | 'other';


const Requests: React.FC = () => {
  const { token } = theme.useToken();
  const [selectedType, setSelectedType] = useState<RequestType>(null);
  const [activeTab, setActiveTab] = useState<RequestTabKey>('visitor');
  const [showForm, setShowForm] = useState(false);
  const [visitorRequests, setVisitorRequests] = useState<IVisitor.VisitorRequest[]>([]);
  const [violationReports, setViolationReports] = useState<IViolation.ViolationReport[]>([]);
  const [otherRequests, setOtherRequests] = useState<
    {
      id: string;
      request_code: string;
      title: string;
      description: string;
      status: string;
      createdAt: string;
      rejection_reason?: string | null;
      manager_response?: string | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const fetchMyRequests = useCallback(async () => {
    setLoading(true);
    try {
      const [visitorData, reportData, otherData] = await Promise.all([
        getMyVisitorRequests(),
        getMyViolationReports().catch(() => []),
        getMyOtherRequests().catch(() => []),
      ]);
      setVisitorRequests(visitorData);
      setViolationReports(Array.isArray(reportData) ? reportData : []);
      setOtherRequests(Array.isArray(otherData) ? otherData : []);
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
      // Violation report statuses
      case 'new':
        return <Tag color="processing">New</Tag>;
      case 'under_review':
        return <Tag color="warning">Under Review</Tag>;
      case 'resolved_penalized':
        return <Tag color="error">Penalized</Tag>;
      case 'resolved_no_action':
        return <Tag color="success">Resolved</Tag>;
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

  const relationshipLabel: Record<string, string> = {
    parent: 'Parent',
    sibling: 'Sibling',
    friend: 'Friend',
    other: 'Other',
  };

  // Map visitor requests and violation reports to a common display format
  const violationTypeLabel: Record<string, string> = {
    noise: 'Noise Disturbance',
    cleanliness: 'Cleanliness Issue',
    guest: 'Unauthorized Guest',
    alcohol: 'Alcohol / Smoking',
    other: 'Other',
  };
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
      manager_response: undefined,
      visitors: r.visitors,
      raw: r,
    })),
    ...violationReports.map((r) => ({
      id: r.id,
      type: 'report' as const,
      title: r.violation_other_detail || violationTypeLabel[r.violation_type] || r.violation_type || 'Violation Report',
      subtitle: r.report_code,
      status: r.status,
      date: dayjs(r.violation_date).format('DD/MM/YYYY'),
      detail: r.location || '—',
      rejection_reason: undefined,
      manager_response: undefined,
      visitors: undefined,
      raw: r,
    })),
    ...otherRequests.map((r) => ({
      id: r.id,
      type: 'other' as const,
      title: r.title,
      subtitle: r.request_code,
      status: r.status,
      date: dayjs(r.createdAt).format('DD/MM/YYYY'),
      detail: 'Other request',
      rejection_reason: r.rejection_reason,
      manager_response: r.manager_response,
      visitors: undefined,
      raw: r,
    })),
  ];

  const filteredRequestsByTab = (tab: RequestTabKey) => {
    return allRequests.filter((r) => r.type === tab);
  };

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

  const handleReportCreated = () => {
    handleCloseForm();
    fetchMyRequests();
  };

  const handleOtherCreated = () => {
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

  const renderRequestList = (requests: typeof allRequests) => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <Spin size="large" />
        </div>
      );
    }

    if (requests.length === 0) {
      return (
        <Card>
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <Text type="secondary">No requests found</Text>
          </div>
        </Card>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {requests.map((req) => (
          <Card key={`${req.type}-${req.id}`} size="small">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
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

              <div style={{ flex: 1, minWidth: 0 }}>
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

                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Code: {req.subtitle}
                </Text>

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

                {req.status === 'rejected' && req.rejection_reason && (
                  <Text
                    type="danger"
                    style={{ fontSize: '12px', display: 'block', marginTop: '6px' }}
                  >
                    Rejection reason: {req.rejection_reason}
                  </Text>
                )}
                {req.type === 'other' && req.manager_response && (
                  <Alert
                    type="info"
                    showIcon
                    style={{ marginTop: 8, padding: '6px 10px' }}
                    message={
                      <span style={{ fontSize: 12 }}>
                        <strong>Manager response:</strong> {req.manager_response}
                      </span>
                    }
                  />
                )}
              </div>

              {req.type === 'visitor' && req.status === 'pending' && (
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
      </div>
    );
  };

  const tabItems = [
    {
      key: 'visitor',
      label: (
        <span className="flex items-center gap-2">
          <TeamOutlined /> Visitor Request
        </span>
      ),
      children: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="primary" onClick={() => handleNewRequest('visitor')}>
              New Visitor Request
            </Button>
          </div>
          {renderRequestList(filteredRequestsByTab('visitor'))}
        </div>
      ),
    },
    {
      key: 'maintenance',
      label: (
        <span className="flex items-center gap-2">
          <ToolOutlined /> Maintenance Request
        </span>
      ),
      children: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="primary" onClick={() => handleNewRequest('maintenance')}>
              New Maintenance Request
            </Button>
          </div>
          {renderRequestList(filteredRequestsByTab('maintenance'))}
        </div>
      ),
    },
    {
      key: 'report',
      label: (
        <span className="flex items-center gap-2">
          <FlagOutlined /> Violation Report
        </span>
      ),
      children: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="primary" onClick={() => handleNewRequest('report')}>
              New Violation Report
            </Button>
          </div>
          {renderRequestList(filteredRequestsByTab('report'))}
        </div>
      ),
    },
    {
      key: 'other',
      label: (
        <span className="flex items-center gap-2">
          <FileSearchOutlined /> Other
        </span>
      ),
      children: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="primary" onClick={() => handleNewRequest('other')}>
              New Other Request
            </Button>
          </div>
          {renderRequestList(filteredRequestsByTab('other'))}
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '32px', background: token.colorBgLayout }}>
      <div style={{ maxWidth: '1360px', margin: '0 auto' }}>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="mb-4">
            <Title level={4} style={{ margin: 0 }}>
              My Requests
            </Title>
          </div>
          <Tabs
            activeKey={activeTab}
            onChange={(k) => setActiveTab(k as RequestTabKey)}
            items={tabItems}
            className="facility-tabs"
          />
        </div>

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
              {selectedType === 'other' && 'New Other Request'}
            </Space>
          }
        >
          {selectedType === 'visitor' && <VisitorForm onSuccess={handleVisitorCreated} />}
          {selectedType === 'maintenance' && <MaintenanceForm />}
          {selectedType === 'report' && <ReportForm onSuccess={handleReportCreated} />}
          {selectedType === 'other' && <OtherRequestForm onSuccess={handleOtherCreated} />}
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
const violationTypeOptions = [
  { label: 'Noise Disturbance', value: ViolationType.NOISE },
  { label: 'Cleanliness Issue', value: ViolationType.CLEANLINESS },
  { label: 'Unauthorized Guest', value: ViolationType.UNAUTHORIZED_GUEST },
  { label: 'Alcohol / Smoking', value: ViolationType.ALCOHOL },
  { label: 'Other', value: ViolationType.OTHER },
];

const ReportForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { modal } = App.useApp();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const violationLabel =
        violationTypeOptions.find((opt) => opt.value === values.violation_type)?.label ||
        values.violation_type;

      modal.confirm({
        title: 'Confirm violation report',
        content: (
          <div>
            <p>Are you sure you want to submit this violation report?</p>
            <p>
              <strong>Violation type:</strong> {violationLabel}
            </p>
            {values.location && (
              <p>
                <strong>Location:</strong> {values.location}
              </p>
            )}
            <p>
              <strong>Description:</strong> {values.description}
            </p>
            <p className="mt-2">
              Please make sure the details are correct before submitting. You cannot edit this
              report after it is sent.
            </p>
          </div>
        ),
        okText: 'Confirm & Submit',
        cancelText: 'Cancel',
        onOk: async () => {
          setSubmitting(true);
          try {
            const dto: IViolation.CreateViolationDto = {
              reporter_type: ReporterType.STUDENT,
              violation_type: values.violation_type,
              violation_other_detail: values.violation_other_detail,
              description: values.description,
              violation_date: values.violation_date
                ? values.violation_date.format('YYYY-MM-DD')
                : dayjs().format('YYYY-MM-DD'),
              location: values.location,
              evidence_urls: values.evidence_urls || [],
            };

            await createViolationReport(dto);
            message.success('Violation report submitted successfully');
            form.resetFields();
            onSuccess?.();
          } catch (err: any) {
            if (err?.message) {
              message.error(Array.isArray(err.message) ? err.message[0] : err.message);
            }
          } finally {
            setSubmitting(false);
          }
        },
      });
    } catch (err: any) {
      if (err?.message && !err.errorFields) {
        message.error(Array.isArray(err.message) ? err.message[0] : err.message);
      }
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        violation_type: ViolationType.NOISE,
        violation_date: dayjs(),
      }}
    >
      <Alert
        message="Use this form to report violations or safety concerns. Your identity will be visible to managers for follow‑up."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Form.Item
            name="violation_date"
            label="Violation Date"
            rules={[{ required: true, message: 'Please select violation date' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              disabledDate={(current) => current && current > dayjs().endOf('day')}
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="violation_type"
        label="Violation Type"
        rules={[{ required: true, message: 'Please select violation type' }]}
      >
        <Select
          placeholder="Select violation type..."
          style={{ width: '100%' }}
          size="large"
          options={violationTypeOptions}
        />
      </Form.Item>

      <Form.Item noStyle shouldUpdate>
        {({ getFieldValue }) =>
          getFieldValue('violation_type') === ViolationType.OTHER ? (
            <Form.Item
              name="violation_other_detail"
              label="Specify Violation Type"
              rules={[{ required: true, message: 'Please specify violation type' }]}
            >
              <Input placeholder="e.g. Fighting, Property Damage..." />
            </Form.Item>
          ) : null
        }
      </Form.Item>

      <Form.Item name="location" label="Location">
        <Input placeholder="E.g: A101-1" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[
          { required: true, message: 'Please enter description' },
          { min: 10, message: 'Description must be at least 10 characters' },
        ]}
      >
        <TextArea placeholder="Provide detailed description..." rows={4} size="large" />
      </Form.Item>

      <Form.Item name="evidence_urls" label="Evidence Links (images)">
        <Select
          mode="tags"
          placeholder="Paste image URLs and press Enter"
          tokenSeparators={[',']}
        />
      </Form.Item>

      <Button type="primary" size="large" onClick={handleSubmit} loading={submitting}>
        Submit Report
      </Button>
    </Form>
  );
};

const OtherRequestForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { modal } = App.useApp();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      modal.confirm({
        title: 'Confirm other request',
        content: (
          <div>
            <p>Are you sure you want to submit this request to manager?</p>
            <p>
              <strong>Title:</strong> {values.title}
            </p>
            <p>
              <strong>Description:</strong> {values.description}
            </p>
          </div>
        ),
        okText: 'Confirm & Submit',
        cancelText: 'Cancel',
        onOk: async () => {
          setSubmitting(true);
          try {
            await createOtherRequest({
              title: values.title,
              description: values.description,
            });
            message.success('Other request submitted successfully');
            form.resetFields();
            onSuccess?.();
          } catch (err: any) {
            if (err?.message) {
              message.error(Array.isArray(err.message) ? err.message[0] : err.message);
            }
          } finally {
            setSubmitting(false);
          }
        },
      });
    } catch (err: any) {
      if (err?.message && !err.errorFields) {
        message.error(Array.isArray(err.message) ? err.message[0] : err.message);
      }
    }
  };

  return (
    <Form form={form} layout="vertical">
      <Form.Item
        name="title"
        label="Title"
        rules={[
          { required: true, message: 'Please enter title' },
          { min: 3, message: 'Title must be at least 3 characters' },
        ]}
      >
        <Input placeholder="Enter request title" maxLength={150} />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[
          { required: true, message: 'Please enter description' },
          { min: 10, message: 'Description must be at least 10 characters' },
        ]}
      >
        <TextArea rows={5} placeholder="Describe your request in detail..." maxLength={3000} />
      </Form.Item>

      <Button type="primary" size="large" onClick={handleSubmit} loading={submitting}>
        Submit Request
      </Button>
    </Form>
  );
};

export default Requests;
