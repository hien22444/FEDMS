import { useCallback, useEffect, useState } from 'react';
import { Alert, App, Button, Card, Form, Input, Modal, Select, Space, Table, Tabs, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { getAllOtherRequests, reviewOtherRequest, type OtherRequestItem } from '@/lib/actions/otherRequest';

const { Title, Text } = Typography;

const statusColor: Record<string, string> = {
  pending: 'processing',
  in_review: 'warning',
  resolved: 'success',
  rejected: 'error',
};

type TabKey = 'list' | 'detail';

export default function ManagerRequestsPage() {
  const { message } = App.useApp();
  const [items, setItems] = useState<OtherRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<OtherRequestItem | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('list');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [form] = Form.useForm();
  const [rejectForm] = Form.useForm();
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

  /** Sync selected row after list refresh (same request still open in detail tab) */
  useEffect(() => {
    if (!selected?.id) return;
    const updated = items.find((i) => i.id === selected.id);
    if (updated) setSelected(updated);
  }, [items, selected?.id]);

  const openDetailTab = (item: OtherRequestItem) => {
    setSelected(item);
    form.setFieldsValue({
      manager_response: item.manager_response || '',
    });
    rejectForm.resetFields();
    setRejectOpen(false);
    setActiveTab('detail');
  };

  const backToList = () => {
    setActiveTab('list');
  };

  const resetAfterAction = () => {
    setActiveTab('list');
    setSelected(null);
    rejectForm.resetFields();
    form.resetFields();
  };

  /** Save response and mark request as resolved */
  const submitResolve = async () => {
    if (!selected) return;
    if (selected.status === 'resolved' || selected.status === 'rejected') {
      message.error('This request has been finalized and cannot be edited');
      return;
    }
    try {
      const values = await form.validateFields(['manager_response']);
      setReviewLoading(true);
      await reviewOtherRequest(selected.id, {
        status: 'resolved',
        manager_response: values.manager_response,
      });
      message.success('Request marked as resolved');
      resetAfterAction();
      loadData();
    } catch (e: any) {
      if (!e?.errorFields) {
        message.error(e?.message || 'Failed to update request');
      }
    } finally {
      setReviewLoading(false);
    }
  };

  const openRejectFlow = () => {
    rejectForm.resetFields();
    setRejectOpen(true);
  };

  /** Mark as spam / invalid — requires rejection reason */
  const submitReject = async () => {
    if (!selected) return Promise.reject();
    try {
      const values = await rejectForm.validateFields();
      setRejectLoading(true);
      await reviewOtherRequest(selected.id, {
        status: 'rejected',
        rejection_reason: values.rejection_reason,
        manager_response: '',
      });
      message.success('Request rejected');
      setRejectOpen(false);
      resetAfterAction();
      loadData();
    } catch (e: any) {
      if (e?.errorFields) return Promise.reject();
      message.error(e?.message || 'Failed to reject request');
      return Promise.reject();
    } finally {
      setRejectLoading(false);
    }
  };

  const detailTabLabel = selected ? `Detail · ${selected.request_code}` : 'Request detail';

  const tabItems = [
    {
      key: 'list',
      label: 'Request list',
      children: (
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
                  <Button size="small" type="link" onClick={() => openDetailTab(r)} style={{ padding: 0 }}>
                    Details
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      ),
    },
    {
      key: 'detail',
      label: detailTabLabel,
      disabled: !selected,
      children: selected ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button onClick={backToList}>← Back to list</Button>
            {!isSelectedFinalized && (
              <Space>
                <Button onClick={backToList}>Cancel</Button>
                <Button danger onClick={openRejectFlow}>
                  Rejected
                </Button>
                <Button type="primary" loading={reviewLoading} onClick={submitResolve}>
                  Save
                </Button>
              </Space>
            )}
            {isSelectedFinalized && (
              <Button type="primary" onClick={backToList}>
                Back to list
              </Button>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2.5">
            <div>
              <Text type="secondary">Request Code:</Text> <Text strong>{selected.request_code}</Text>
            </div>
            <div>
              <Text type="secondary">Student:</Text>{' '}
              <Text>{selected.user?.fullname || selected.user?.email || '-'}</Text>
            </div>
            <div>
              <Text type="secondary">Student Code:</Text> <Text>{selected.user?.student_code || '-'}</Text>
            </div>
            <div>
              <Text type="secondary">Request:</Text> <Text strong>{selected.title}</Text>
            </div>
            <div>
              <Text type="secondary">Description:</Text>
              <div className="mt-1 whitespace-pre-wrap rounded border border-gray-200 bg-white p-3 text-sm min-h-[140px]">
                {selected.description || '-'}
              </div>
            </div>
            <div>
              <Text type="secondary">Current Status:</Text>{' '}
              <Tag color={statusColor[selected.status] || 'default'}>{selected.status}</Tag>
            </div>
            {selected.status === 'rejected' && selected.rejection_reason && (
              <div>
                <Text type="secondary">Rejection reason:</Text>
                <div className="mt-1 rounded border border-red-100 bg-red-50 p-2 text-sm text-red-800">
                  {selected.rejection_reason}
                </div>
              </div>
            )}
            {selected.manager_response && (
              <div>
                <Text type="secondary">Manager response:</Text>
                <div className="mt-1 whitespace-pre-wrap rounded border border-gray-200 bg-white p-2 text-sm">
                  {selected.manager_response}
                </div>
              </div>
            )}
            <div>
              <Text type="secondary">Created:</Text>{' '}
              <Text>{selected.createdAt ? dayjs(selected.createdAt).format('DD/MM/YYYY HH:mm') : '-'}</Text>
            </div>
          </div>

          <Form form={form} layout="vertical" className="max-w-3xl">
            <Form.Item
              name="manager_response"
              label="Response to Student"
              rules={
                isSelectedFinalized
                  ? []
                  : [{ required: true, message: 'Please enter a response before marking as resolved' }]
              }
            >
              <Input.TextArea
                rows={5}
                placeholder="Write guidance / response for student..."
                disabled={isSelectedFinalized}
              />
            </Form.Item>
          </Form>
        </div>
      ) : (
        <Alert type="info" message="Select a request from the list and click Review to open details here." />
      ),
    },
  ];

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
        <Tabs
          activeKey={activeTab}
          onChange={(k) => {
            const key = k as TabKey;
            if (key === 'detail' && !selected) return;
            setActiveTab(key);
          }}
          items={tabItems}
          destroyInactiveTabPane={false}
        />
      </Card>

      <Modal
        open={rejectOpen}
        title="Reject request"
        okText="Confirm reject"
        okButtonProps={{ danger: true, loading: rejectLoading }}
        onCancel={() => setRejectOpen(false)}
        onOk={submitReject}
        destroyOnClose
      >
        <p className="mb-3 text-gray-600 text-sm">
          Use this if the request is spam or invalid. The student will see the reason you provide.
        </p>
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="rejection_reason"
            label="Rejection reason"
            rules={[{ required: true, message: 'Please enter a rejection reason' }]}
          >
            <Input.TextArea rows={4} placeholder="e.g. Spam, duplicate request, not applicable..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
