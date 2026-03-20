import { useCallback, useEffect, useState } from 'react';
import { Alert, App, Button, Card, Form, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { getAllOtherRequests, reviewOtherRequest, type OtherRequestItem } from '@/lib/actions/otherRequest';

const { Title, Text } = Typography;

const statusColor: Record<string, string> = {
  pending: 'processing',
  in_review: 'warning',
  resolved: 'success',
  rejected: 'error',
};

export default function ManagerRequestsPage() {
  const { message } = App.useApp();
  const [items, setItems] = useState<OtherRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<OtherRequestItem | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [form] = Form.useForm();
  const isSelectedFinalized = selected?.status === 'resolved' || selected?.status === 'rejected';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllOtherRequests({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: 1,
        limit: 100,
      });
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      message.error(e?.message || 'Failed to load other requests');
    } finally {
      setLoading(false);
    }
  }, [message, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openReview = (item: OtherRequestItem) => {
    setSelected(item);
    form.setFieldsValue({
      status: item.status === 'pending' ? 'in_review' : item.status,
      rejection_reason: item.rejection_reason || '',
      manager_response: item.manager_response || '',
    });
    setReviewOpen(true);
  };

  const submitReview = async () => {
    if (!selected) return;
    if (selected.status === 'resolved' || selected.status === 'rejected') {
      message.error('This request has been finalized and cannot be edited');
      return;
    }
    try {
      const values = await form.validateFields();
      setReviewLoading(true);
      await reviewOtherRequest(selected.id, {
        status: values.status,
        rejection_reason: values.rejection_reason,
        manager_response: values.manager_response,
      });
      message.success('Request status updated');
      setReviewOpen(false);
      setSelected(null);
      loadData();
    } catch (e: any) {
      if (!e?.errorFields) {
        message.error(e?.message || 'Failed to update request');
      }
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>
            Request Management
          </Title>
          <Text type="secondary">Review student Other Requests and update status.</Text>
        </div>
        <Space>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 180 }}
            options={[
              { label: 'All statuses', value: 'all' },
              { label: 'Pending', value: 'pending' },
              { label: 'In Review', value: 'in_review' },
              { label: 'Resolved', value: 'resolved' },
              { label: 'Rejected', value: 'rejected' },
            ]}
          />
          <Button onClick={loadData}>Refresh</Button>
        </Space>
      </div>

      <Card className="rounded-2xl border border-gray-200 shadow-sm">
        <Alert
          type="info"
          showIcon
          message="This page currently manages Other Requests created by students."
          className="mb-4"
        />
        <Table
          rowKey="id"
          loading={loading}
          dataSource={items}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: 'Request Code',
              dataIndex: 'request_code',
              width: 170,
            },
            {
              title: 'Student',
              render: (_, r) => r.user?.fullname || r.user?.email || '-',
              width: 220,
            },
            {
              title: 'Student Code',
              render: (_, r) => r.user?.student_code || '-',
              width: 170,
            },
            {
              title: 'Request',
              dataIndex: 'title',
            },
            {
              title: 'Status',
              dataIndex: 'status',
              width: 130,
              render: (v: string) => <Tag color={statusColor[v] || 'default'}>{v}</Tag>,
            },
            {
              title: 'Created',
              dataIndex: 'createdAt',
              width: 150,
              render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
            },
            {
              title: 'Action',
              width: 120,
              render: (_, r) => (
                <Space>
                  <Button
                    size="small"
                    onClick={() => openReview(r)}
                  >
                    Review
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={reviewOpen}
        onCancel={() => {
          setReviewOpen(false);
          setSelected(null);
        }}
        onOk={
          isSelectedFinalized
            ? () => {
                setReviewOpen(false);
                setSelected(null);
              }
            : submitReview
        }
        okText={isSelectedFinalized ? 'Close' : 'Save'}
        cancelButtonProps={{ style: isSelectedFinalized ? { display: 'none' } : undefined }}
        confirmLoading={reviewLoading}
        title={`Review Request ${selected?.request_code || ''}`}
      >
        {isSelectedFinalized && (
          <Alert
            type="info"
            showIcon
            className="mb-4"
            message="This request is finalized. You can view details but cannot edit."
          />
        )}
        <Form form={form} layout="vertical">
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select
              disabled={isSelectedFinalized}
              options={[
                { label: 'In Review', value: 'in_review' },
                { label: 'Resolved', value: 'resolved' },
                { label: 'Rejected', value: 'rejected' },
              ]}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate>
            {({ getFieldValue }) =>
              getFieldValue('status') === 'rejected' ? (
                <Form.Item
                  name="rejection_reason"
                  label="Rejection Reason"
                  rules={[{ required: true, message: 'Please enter rejection reason' }]}
                >
                  <Input.TextArea rows={3} disabled={isSelectedFinalized} />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item name="manager_response" label="Response to Student">
            <Input.TextArea
              rows={4}
              placeholder="Write guidance / response for student..."
              disabled={isSelectedFinalized}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
