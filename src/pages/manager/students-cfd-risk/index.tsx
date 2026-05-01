import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Popconfirm, Space, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  fetchCfdAtRiskStudents,
  cfdDormExpelStudent,
  type CfdAtRiskStudent,
} from '@/lib/actions/booking';

const { Title, Text } = Typography;

const roomLabel = (row: CfdAtRiskStudent) => {
  const c = row.active_contract;
  if (!c?.room) return '—';
  const d = c.room.block?.dorm?.dorm_code || c.room.block?.dorm?.dorm_name || '';
  const b = c.room.block?.block_code || c.room.block?.block_name || '';
  const n = c.room.room_number || '';
  const bed = c.bed?.bed_number != null ? ` · Bed ${c.bed.bed_number}` : '';
  const prefix = [d, b].filter(Boolean).join(' ');
  return `${prefix ? `${prefix} · ` : ''}Room ${n}${bed}`;
};

export default function ManagerStudentsCfdRiskPage() {
  const [rows, setRows] = useState<CfdAtRiskStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [expelling, setExpelling] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCfdAtRiskStudents();
      setRows(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Failed to load';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleBan = async (code: string) => {
    setExpelling(code);
    try {
      await cfdDormExpelStudent(code);
      message.success('Security inspection request created. Manager can finalize suspension in Requests after inspection.');
      await load();
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as { message: unknown }).message) : 'Action failed';
      message.error(msg);
    } finally {
      setExpelling(null);
    }
  };

  const columns: ColumnsType<CfdAtRiskStudent> = [
    {
      title: 'Student code',
      dataIndex: 'student_code',
      width: 130,
      render: (v: string) => <Text strong>{v}</Text>,
    },
    { title: 'Full name', dataIndex: 'full_name', ellipsis: true },
    {
      title: 'CFD',
      dataIndex: 'behavioral_score',
      width: 88,
      render: (v: number) => <Tag color="red">{v?.toFixed?.(1) ?? v}</Tag>,
    },
    {
      title: 'Current bed',
      key: 'bed',
      ellipsis: true,
      render: (_, r) => (r.active_contract ? roomLabel(r) : <Text type="secondary">None</Text>),
    },
    {
      title: 'Booking status',
      key: 'susp',
      width: 140,
      render: (_, r) =>
        r.dorm_booking_suspended ? <Tag color="magenta">Suspended</Tag> : <Tag>Not suspended</Tag>,
    },
    {
      title: 'Action',
      key: 'act',
      width: 120,
      render: (_, r) => (
        <Popconfirm
          title="Start CFD expulsion workflow?"
          description="Creates a security inspection request first. Final suspension is completed by manager after inspection."
          okText="Ban"
          okButtonProps={{ danger: true }}
          onConfirm={() => handleBan(r.student_code)}
        >
          <Button type="primary" danger size="small" loading={expelling === r.student_code}>
            Ban
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <Title level={2} className="!mb-1">
          CFD at-risk students
        </Title>
        <Text type="secondary">
          Students with CFD score ≤ 0. Use <strong>Ban</strong> to start expulsion workflow:
          security inspection first, then manager finalization.
        </Text>
      </div>

      <Alert
        type="warning"
        showIcon
        message="Discipline threshold"
        description="Only students listed here meet the CFD ≤ 0 rule. After Ban is clicked, security must inspect the room and report back before manager can finalize service suspension."
      />

      <Card>
        <Space className="mb-4">
          <Button onClick={load} loading={loading}>
            Refresh
          </Button>
        </Space>
        <Table<CfdAtRiskStudent>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 15, showSizeChanger: true }}
          locale={{ emptyText: 'No students with CFD ≤ 0' }}
        />
      </Card>
    </div>
  );
}
