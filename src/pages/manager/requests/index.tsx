import { useCallback, useEffect, useState } from 'react';
import { Alert, App, Button, Card, DatePicker, Form, Input, Modal, Select, Space, Table, Tabs, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { getAllOtherRequests, reviewOtherRequest, type OtherRequestItem } from '@/lib/actions/otherRequest';
import {
  getAllMaintenanceRequests,
  reviewMaintenanceRequest,
  type StudentMaintenanceRequest,
} from '@/lib/actions/maintenanceRequest';

const { Title, Text } = Typography;

const statusColor: Record<string, string> = {
  pending: 'processing',
  in_review: 'warning',
  resolved: 'success',
  rejected: 'error',
};

const maintenanceStatusColor: Record<string, string> = {
  pending: 'processing',
  approved: 'success',
  assigned: 'blue',
  in_progress: 'warning',
  completed: 'cyan',
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

  // Toggle between Other Requests and Maintenance Requests
  type RequestModeKey = 'other' | 'maintenance';
  const [mode, setMode] = useState<RequestModeKey>('other');

  // ===== Maintenance states (manager) =====
  type MaintenanceTabKey = 'list' | 'detail';
  const terminalMaintenanceStatuses = ['completed', 'done', 'cannot_fix', 'cancelled', 'rejected'];
  const [maintenanceItems, setMaintenanceItems] = useState<StudentMaintenanceRequest[]>([]);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceStatusFilter, setMaintenanceStatusFilter] = useState<string>('all');
  const [maintenanceSelected, setMaintenanceSelected] = useState<StudentMaintenanceRequest | null>(null);
  const [maintenanceActiveTab, setMaintenanceActiveTab] = useState<MaintenanceTabKey>('list');
  const [maintenanceReviewLoading, setMaintenanceReviewLoading] = useState(false);
  const [maintenanceForm] = Form.useForm();
  const selectedMaintenanceStatus = Form.useWatch('status', maintenanceForm);
  const isMaintenanceTerminal = maintenanceSelected
    ? terminalMaintenanceStatuses.includes(String(maintenanceSelected.status))
    : false;

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

  const loadMaintenanceData = useCallback(async () => {
    setMaintenanceLoading(true);
    try {
      const res = await getAllMaintenanceRequests({
        status: maintenanceStatusFilter === 'all' ? undefined : maintenanceStatusFilter,
        page: 1,
        limit: 100,
      });
      setMaintenanceItems(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      message.error(e?.message || 'Failed to load maintenance requests');
    } finally {
      setMaintenanceLoading(false);
    }
  }, [message, maintenanceStatusFilter]);

  useEffect(() => {
    loadMaintenanceData();
  }, [loadMaintenanceData]);

  /** Sync selected row after list refresh (same request still open in detail tab) */
  useEffect(() => {
    if (!maintenanceSelected?.id) return;
    const updated = maintenanceItems.find((i) => i.id === maintenanceSelected.id);
    if (updated) setMaintenanceSelected(updated);
  }, [maintenanceItems, maintenanceSelected?.id]);

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

  const formatMaintenanceRoom = (room?: StudentMaintenanceRequest['room']) => {
    if (!room) return '-';
    const dorm = room.block?.dorm?.dorm_name;
    const block = room.block?.block_name;
    const roomNumber = room.room_number;
    const parts = [dorm, block, roomNumber ? `Room ${roomNumber}` : null].filter(Boolean) as string[];
    return parts.length ? parts.join(' · ') : '-';
  };

  const getMaintenanceNextStatusDefault = (currentStatus?: string) => {
    const optionsByStatus: Record<string, string[]> = {
      pending: ['approved', 'rejected'],
      approved: ['assigned'],
      assigned: ['in_progress'],
      in_progress: ['completed'],
    };
    const options = optionsByStatus[String(currentStatus || 'pending')] || [];
    return options[0];
  };

  const getMaintenanceTransitionOptions = (currentStatus?: string) => {
    const optionsByStatus: Record<string, Array<{ label: string; value: string }>> = {
      pending: [
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      approved: [{ label: 'Assigned', value: 'assigned' }],
      assigned: [{ label: 'In progress', value: 'in_progress' }],
      in_progress: [{ label: 'Completed', value: 'completed' }],
    };
    return optionsByStatus[String(currentStatus || 'pending')] || [];
  };

  const openMaintenanceDetail = (item: StudentMaintenanceRequest) => {
    setMaintenanceSelected(item);
    maintenanceForm.setFieldsValue({
      status: getMaintenanceNextStatusDefault(String(item.status)),
      technician_name: item.technician_name || '',
      technician_phone: item.technician_phone || '',
      scheduled_time: item.scheduled_time ? dayjs(item.scheduled_time) : null,
      completion_notes: item.completion_notes || '',
      rejection_reason: item.rejection_reason || '',
    });
    setMaintenanceActiveTab('detail');
  };

  const backToMaintenanceList = () => {
    setMaintenanceActiveTab('list');
    setMaintenanceSelected(null);
    maintenanceForm.resetFields();
  };

  const submitMaintenanceUpdate = async () => {
    if (!maintenanceSelected) return;
    if (isMaintenanceTerminal) {
      message.error('This maintenance request is closed and cannot be edited');
      return;
    }

    try {
      const values = await maintenanceForm.validateFields();
      const status = String(values.status || '').trim();
      setMaintenanceReviewLoading(true);
      const payload: any = { status: status as any };
      if (status === 'assigned') {
        if (values.scheduled_time && dayjs(values.scheduled_time).isBefore(dayjs())) {
          message.error('Scheduled time must be in the future');
          return;
        }
        payload.technician_name = values.technician_name?.trim() || undefined;
        payload.technician_phone = values.technician_phone || undefined;
        payload.scheduled_time = values.scheduled_time
          ? values.scheduled_time.toISOString()
          : undefined;
      }
      if (status === 'completed') {
        payload.completion_notes = values.completion_notes || undefined;
      }
      if (status === 'rejected') {
        payload.rejection_reason = values.rejection_reason;
      }

      await reviewMaintenanceRequest(maintenanceSelected.id, payload);
      message.success('Maintenance request updated');
      backToMaintenanceList();
      loadMaintenanceData();
    } catch (e: any) {
      if (!e?.errorFields) {
        message.error(e?.message || 'Failed to update maintenance request');
      }
    } finally {
      setMaintenanceReviewLoading(false);
    }
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

  const maintenanceDetailTabLabel = maintenanceSelected ? `Detail · ${maintenanceSelected.request_code}` : 'Maintenance detail';

  const maintenanceTabItems = [
    {
      key: 'list',
      label: 'Maintenance list',
      children: (
        <Table
          rowKey="id"
          loading={maintenanceLoading}
          dataSource={maintenanceItems}
          pagination={{ pageSize: 10 }}
          columns={[
            {
              title: 'Request Code',
              dataIndex: 'request_code',
              width: 170,
            },
            {
              title: 'Student',
              render: (_, r) => r.student?.full_name || r.student?.user?.email || '-',
              width: 240,
            },
            {
              title: 'Room',
              render: (_, r) => formatMaintenanceRoom(r.room),
              width: 260,
            },
            {
              title: 'Bed',
              render: (_, r) => r.bed?.bed_number || '-',
              width: 120,
            },
            {
              title: 'Status',
              dataIndex: 'status',
              width: 130,
              render: (v: string) => (
                <Tag color={maintenanceStatusColor[v] || 'default'}>{v}</Tag>
              ),
            },
            {
              title: 'Created',
              dataIndex: 'requested_at',
              width: 150,
              render: (v: string) => (v ? dayjs(v).format('DD/MM/YYYY') : '-'),
            },
            {
              title: 'Action',
              width: 120,
              render: (_, r) => (
                <Space>
                  <Button
                    size="small"
                    type="link"
                    onClick={() => openMaintenanceDetail(r)}
                    style={{ padding: 0 }}
                  >
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
      label: maintenanceDetailTabLabel,
      disabled: !maintenanceSelected,
      children: maintenanceSelected ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button onClick={backToMaintenanceList}>← Back to list</Button>
            {!isMaintenanceTerminal ? (
              <Space>
                <Button type="primary" loading={maintenanceReviewLoading} onClick={submitMaintenanceUpdate}>
                  Save
                </Button>
              </Space>
            ) : (
              <Button type="primary" onClick={backToMaintenanceList}>
                Back to list
              </Button>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2.5">
            <div>
              <Text type="secondary">Request Code:</Text> <Text strong>{maintenanceSelected.request_code}</Text>
            </div>
            <div>
              <Text type="secondary">Student:</Text>{' '}
              <Text>{maintenanceSelected.student?.full_name || maintenanceSelected.student?.user?.email || '-'}</Text>
            </div>
            <div>
              <Text type="secondary">Student Code:</Text>{' '}
              <Text>{maintenanceSelected.student?.student_code || '-'}</Text>
            </div>
            <div>
              <Text type="secondary">Room:</Text> <Text>{formatMaintenanceRoom(maintenanceSelected.room)}</Text>
            </div>
            <div>
              <Text type="secondary">Bed:</Text> <Text>{maintenanceSelected.bed?.bed_number || '-'}</Text>
            </div>
            {maintenanceSelected.equipment &&
              typeof maintenanceSelected.equipment.template === 'object' &&
              maintenanceSelected.equipment.template !== null && (
              <div>
                <Text type="secondary">Affected equipment:</Text>{' '}
                <Text>
                  {maintenanceSelected.equipment.template.equipment_name || 'Equipment'}
                  {maintenanceSelected.equipment.template.brand
                    ? ` (${maintenanceSelected.equipment.template.brand})`
                    : ''}
                </Text>
              </div>
            )}
            <div>
              <Text type="secondary">Description:</Text>
              <div className="mt-1 whitespace-pre-wrap rounded border border-gray-200 bg-white p-3 text-sm min-h-[140px]">
                {maintenanceSelected.description || '-'}
              </div>
            </div>
            <div>
              <Text type="secondary">Current Status:</Text>{' '}
              <Tag color={maintenanceStatusColor[String(maintenanceSelected.status)] || 'default'}>
                {maintenanceSelected.status}
              </Tag>
            </div>
            {maintenanceSelected.scheduled_time && (
              <div>
                <Text type="secondary">Technician scheduled time:</Text>{' '}
                <Text>{dayjs(maintenanceSelected.scheduled_time).format('DD/MM/YYYY HH:mm')}</Text>
              </div>
            )}
            {maintenanceSelected.status === 'rejected' && maintenanceSelected.rejection_reason && (
              <div>
                <Text type="secondary">Rejection reason:</Text>
                <div className="mt-1 rounded border border-red-100 bg-red-50 p-2 text-sm text-red-800">
                  {maintenanceSelected.rejection_reason}
                </div>
              </div>
            )}
            {maintenanceSelected.completion_notes && (
              <div>
                <Text type="secondary">Completion notes / repair report:</Text>
                <div className="mt-1 whitespace-pre-wrap rounded border border-gray-200 bg-white p-2 text-sm">
                  {maintenanceSelected.completion_notes}
                </div>
              </div>
            )}
            {maintenanceSelected.evidence_urls && maintenanceSelected.evidence_urls.length > 0 && (
              <div>
                <Text type="secondary" className="block mb-2">
                  Evidence links
                </Text>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {maintenanceSelected.evidence_urls.map((url, idx) => (
                    <li key={idx}>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <Text type="secondary">Created:</Text>{' '}
              <Text>
                {maintenanceSelected.requested_at ? dayjs(maintenanceSelected.requested_at).format('DD/MM/YYYY HH:mm') : '-'}
              </Text>
            </div>
          </div>

          <Form form={maintenanceForm} layout="vertical" className="max-w-3xl">
            <Form.Item
              name="status"
              label="Update status"
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select
                disabled={isMaintenanceTerminal}
                options={getMaintenanceTransitionOptions(maintenanceSelected.status)}
              />
            </Form.Item>

            {selectedMaintenanceStatus === 'assigned' && (
              <>
                <Form.Item
                  name="technician_name"
                  label="Technician name"
                  rules={[
                    { required: true, message: 'Technician name is required' },
                    {
                      pattern: /^[\p{L}\s]+$/u,
                      message: 'Technician name must contain letters and spaces only',
                    },
                  ]}
                >
                  <Input
                    disabled={isMaintenanceTerminal}
                    placeholder="Enter technician name"
                    maxLength={100}
                  />
                </Form.Item>

                <Form.Item
                  name="technician_phone"
                  label="Technician phone"
                  normalize={(v) => String(v || '').replace(/\D/g, '')}
                  rules={[
                    { required: true, message: 'Technician phone is required' },
                    { pattern: /^\d{10}$/, message: 'Phone must be exactly 10 digits' },
                  ]}
                >
                  <Input
                    disabled={isMaintenanceTerminal}
                    placeholder="Enter 10-digit phone number"
                    maxLength={10}
                  />
                </Form.Item>

                <Form.Item
                  name="scheduled_time"
                  label="Scheduled time"
                  rules={[{ required: true, message: 'Scheduled time is required' }]}
                >
                  <DatePicker
                    disabled={isMaintenanceTerminal}
                    showTime={{ format: 'HH:mm' }}
                    format="DD/MM/YYYY HH:mm"
                    style={{ width: '100%' }}
                    disabledDate={(current) =>
                      !!current && current.endOf('day').isBefore(dayjs().startOf('day'))
                    }
                    disabledTime={(current) => {
                      if (!current || !current.isSame(dayjs(), 'day')) {
                        return {};
                      }
                      const now = dayjs();
                      const disabledHours = Array.from({ length: now.hour() }, (_, i) => i);
                      const disabledMinutes =
                        current.hour() === now.hour()
                          ? Array.from({ length: now.minute() + 1 }, (_, i) => i)
                          : [];
                      return {
                        disabledHours: () => disabledHours,
                        disabledMinutes: () => disabledMinutes,
                        disabledSeconds: () => Array.from({ length: 60 }, (_, i) => i),
                      };
                    }}
                  />
                </Form.Item>
              </>
            )}

            {selectedMaintenanceStatus === 'completed' && (
              <Form.Item name="completion_notes" label="Repair report / completion notes">
                <Input.TextArea
                  disabled={isMaintenanceTerminal}
                  rows={4}
                  placeholder="Repair report / completion notes..."
                />
              </Form.Item>
            )}

            {selectedMaintenanceStatus === 'rejected' && (
              <Form.Item
                name="rejection_reason"
                label="Rejection reason"
                rules={[{ required: true, message: 'Rejection reason is required' }]}
              >
                <Input.TextArea disabled={isMaintenanceTerminal} rows={4} placeholder="Please provide reason..." />
              </Form.Item>
            )}
          </Form>
        </div>
      ) : (
        <Alert type="info" message="Select a maintenance request to review and update status." />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Tabs
        activeKey={mode}
        onChange={(k) => {
          const next = k as RequestModeKey;
          setMode(next);
          setRejectOpen(false);
          if (next === 'maintenance') {
            backToMaintenanceList();
          } else {
            resetAfterAction();
          }
        }}
        items={[
          { key: 'other', label: 'Other Requests' },
          { key: 'maintenance', label: 'Maintenance Requests' },
        ]}
      />

      {mode === 'other' && (
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
      )}

      {mode === 'other' && (
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
      )}

      {mode === 'maintenance' && (
        <Card className="rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <div>
              <Title level={3} style={{ marginBottom: 4 }}>
                Maintenance Request Management
              </Title>
              <Text type="secondary">Review student maintenance requests and update status.</Text>
            </div>
            <Space>
              <Select
                value={maintenanceStatusFilter}
                onChange={setMaintenanceStatusFilter}
                style={{ width: 220 }}
                options={[
                  { label: 'All statuses', value: 'all' },
                  { label: 'Pending', value: 'pending' },
                  { label: 'Approved', value: 'approved' },
                  { label: 'Assigned', value: 'assigned' },
                  { label: 'In progress', value: 'in_progress' },
                  { label: 'Completed', value: 'completed' },
                  { label: 'Rejected', value: 'rejected' },
                ]}
              />
              <Button onClick={loadMaintenanceData}>Refresh</Button>
            </Space>
          </div>
          <Tabs
            activeKey={maintenanceActiveTab}
            onChange={(k) => {
              const key = k as MaintenanceTabKey;
              if (key === 'detail' && !maintenanceSelected) return;
              setMaintenanceActiveTab(key);
            }}
            items={maintenanceTabItems}
            destroyInactiveTabPane={false}
          />
        </Card>
      )}

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
