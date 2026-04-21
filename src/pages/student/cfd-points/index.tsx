import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ExclamationCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '@/contexts/AuthContext';
import { connectSocket } from '@/lib/socket';
import { getMyPenalties } from '@/lib/actions/violation';
import type { IViolation } from '@/interfaces';
import { ViolationType } from '@/interfaces';

const { Title, Text, Paragraph } = Typography;

const VIOLATION_LABEL: Record<string, string> = {
  [ViolationType.NOISE]: 'Noise disturbance',
  [ViolationType.CLEANLINESS]: 'Cleanliness',
  [ViolationType.UNAUTHORIZED_GUEST]: 'Unauthorized guest',
  [ViolationType.ALCOHOL]: 'Alcohol / smoking',
  [ViolationType.OTHER]: 'Other',
};

function scoreLabel(score: number): { text: string; color: string } {
  if (score >= 9) return { text: 'Excellent', color: 'success' };
  if (score >= 7) return { text: 'Good', color: 'success' };
  if (score >= 5) return { text: 'Fair', color: 'warning' };
  if (score >= 4) return { text: 'At risk', color: 'warning' };
  return { text: 'Critical', color: 'error' };
}

const CFDPoints: React.FC = () => {
  const { token } = theme.useToken();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cfdData, setCfdData] = useState<IViolation.MyPenaltiesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyPenalties();
      setCfdData(data);
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message || 'Failed to load CFD data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const socket = connectSocket();

    const handleCfdUpdated = () => {
      load();
    };

    socket.on('cfd_updated', handleCfdUpdated);

    return () => {
      socket.off('cfd_updated', handleCfdUpdated);
    };
  }, [load]);

  const behavioralScore = useMemo(() => {
    if (cfdData?.student?.behavioral_score != null) return cfdData.student.behavioral_score;
    return profile?.behavioral_score ?? null;
  }, [cfdData?.student?.behavioral_score, profile?.behavioral_score]);

  const violationsCount = useMemo(() => {
    if (cfdData?.student?.violations_current_semester != null) {
      return cfdData.student.violations_current_semester;
    }
    return profile?.violations_current_semester ?? 0;
  }, [cfdData?.student?.violations_current_semester, profile?.violations_current_semester]);

  const penalties = useMemo(() => cfdData?.penalties ?? [], [cfdData]);
  const totalDeducted = useMemo(
    () => penalties.reduce((sum, p) => sum + (Number(p.points_deducted) || 0), 0),
    [penalties],
  );

  const band = behavioralScore != null ? scoreLabel(behavioralScore) : { text: '—', color: 'default' };
  const progressPercent = behavioralScore != null ? Math.min(100, Math.max(0, behavioralScore * 10)) : 0;

  const columns: ColumnsType<IViolation.Penalty> = [
    {
      title: 'Date',
      dataIndex: 'issued_at',
      width: 120,
      render: (v: string) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—'),
    },
    {
      title: 'Report',
      width: 140,
      render: (_, row) => row.report?.report_code ?? '—',
    },
    {
      title: 'Related violation',
      ellipsis: true,
      render: (_, row) => {
        if (!row.report) return '—';
        const t = row.report.violation_type
          ? VIOLATION_LABEL[row.report.violation_type] || row.report.violation_type
          : '';
        return (
          <span>
            {t}
            {row.report.description ? (
              <Text type="secondary" className="block text-xs mt-0.5">
                {row.report.description}
              </Text>
            ) : null}
          </span>
        );
      },
    },
    {
      title: 'Reason (deduction)',
      dataIndex: 'reason',
      ellipsis: true,
      render: (r: string) => <span className="whitespace-pre-wrap">{r || '—'}</span>,
    },
    {
      title: 'Type',
      dataIndex: 'penalty_type',
      width: 100,
      render: (t: string) => (
        <Tag color={t === 'severe' ? 'red' : 'orange'}>{t === 'severe' ? 'Severe' : 'Minor'}</Tag>
      ),
    },
    {
      title: 'Points',
      dataIndex: 'points_deducted',
      width: 90,
      align: 'right',
      render: (pts: number) => (
        <Text strong style={{ color: token.colorError }}>
          −{pts}
        </Text>
      ),
    },
    {
      title: 'Semester',
      dataIndex: 'semester',
      width: 110,
    },
    {
      title: 'Issued by',
      width: 140,
      render: (_, row) => row.issued_by?.full_name ?? '—',
    },
  ];

  if (loading && !cfdData) {
    return (
      <div className="flex justify-center items-center min-h-[320px]" style={{ background: token.colorBgLayout }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8" style={{ background: token.colorBgLayout, minHeight: '100%' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <Title level={2} className="!mb-1">
              CFD score
            </Title>
            <Text type="secondary">
              Conduct &amp; discipline points (CFD) from your student record — deductions are recorded when a
              violation is penalized.
            </Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
            Refresh
          </Button>
        </div>

        {error && (
          <Alert type="error" message={error} showIcon closable onClose={() => setError(null)} />
        )}

        {!cfdData?.student && !profile?.student_code && (
          <Alert
            type="warning"
            showIcon
            message="No student profile linked"
            description="Your account does not have a student record. CFD data is only available for student accounts."
          />
        )}

        {(cfdData?.student?.is_banned_permanently || cfdData?.student?.ban_until_semester) && (
          <Alert
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            message="Restriction notice"
            description={
              cfdData?.student?.is_banned_permanently
                ? 'Your record shows a permanent ban flag. Please contact dormitory management.'
                : `Registration may be restricted until semester: ${cfdData?.student?.ban_until_semester}. Contact management for details.`
            }
          />
        )}

        {cfdData?.student?.dorm_booking_suspended && (
          <Alert
            type="error"
            showIcon
            message="Dormitory booking is locked"
            description="Management has suspended booking for your account due to a rules violation. You can still sign in. Contact dormitory management if you have questions."
          />
        )}

        {behavioralScore != null && behavioralScore <= 2 && (
          <Alert
            type="error"
            showIcon
            icon={<WarningOutlined />}
            message="Warning: risk of removal from the dormitory"
            description="Your CFD score is 2 or below. Management may require you to vacate your bed and suspend booking if rules violations continue. Follow dormitory rules and contact management if you need support."
          />
        )}

        {/* Main score */}
        <Card
          className="rounded-2xl border-0 shadow-md overflow-hidden"
          styles={{ body: { padding: 0 } }}
        >
          <div
            className="px-6 py-8 md:px-10 md:py-10 text-center"
            style={{
              background: `linear-gradient(135deg, ${token.colorPrimary}18 0%, ${token.colorBgContainer} 55%, ${token.colorSuccess}12 100%)`,
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <SafetyCertificateOutlined style={{ fontSize: 22, color: token.colorPrimary }} />
              <Text type="secondary" strong className="uppercase tracking-widest text-xs">
                Current CFD score
              </Text>
            </div>
            {behavioralScore != null ? (
              <>
                <div className="flex items-baseline justify-center gap-1 my-2">
                  <span
                    className="text-6xl md:text-7xl font-bold tabular-nums"
                    style={{ color: token.colorPrimary, lineHeight: 1 }}
                  >
                    {behavioralScore.toFixed(1)}
                  </span>
                  <span className="text-2xl md:text-3xl font-medium" style={{ color: token.colorTextSecondary }}>
                    /10
                  </span>
                </div>
                <Progress
                  percent={progressPercent}
                  showInfo={false}
                  strokeColor={token.colorPrimary}
                  trailColor={`${token.colorBorder}99`}
                  className="max-w-md mx-auto mb-4"
                />
                <Space size="middle" wrap className="justify-center">
                  <Tag color={band.color as 'success'}>{band.text}</Tag>
                  <Text type="secondary">
                    Violations this semester: <Text strong>{violationsCount}</Text>
                  </Text>
                </Space>
              </>
            ) : (
              <Empty description="Score not available" className="my-6" />
            )}
          </div>

          <Row gutter={[0, 0]} className="bg-[var(--ant-color-bg-container)]">
            <Col xs={24} md={12}>
              <div className="p-6 border-b md:border-b-0 md:border-r border-[var(--ant-color-border-secondary)]">
                <Text type="secondary" className="text-xs uppercase block mb-1">
                  Total deducted (listed below)
                </Text>
                <Title level={3} className="!m-0" style={{ color: token.colorError }}>
                  −{totalDeducted.toFixed(2)} pts
                </Title>
                <Text type="secondary" className="text-sm">
                  Sum of all penalty deductions on your record
                </Text>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="p-6">
                <Text type="secondary" className="text-xs uppercase block mb-1">
                  Penalty events
                </Text>
                <Title level={3} className="!m-0 flex items-center gap-2">
                  <ExclamationCircleOutlined style={{ color: token.colorWarning }} />
                  {penalties.length}
                </Title>
                <Text type="secondary" className="text-sm">
                  Each row is a recorded CFD deduction with reason
                </Text>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Deductions table */}
        <div>
          <Title level={4} className="!mb-3">
            Deduction history
          </Title>
          <Card className="rounded-xl shadow-sm">
            {penalties.length === 0 ? (
              <Empty
                description="No deductions yet. Your CFD has not been reduced by any penalized violation."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Table<IViolation.Penalty>
                rowKey="id"
                columns={columns}
                dataSource={penalties}
                pagination={{ pageSize: 8, showSizeChanger: true }}
                scroll={{ x: 960 }}
                size="middle"
              />
            )}
          </Card>
        </div>

        <Card className="rounded-xl border-l-4 shadow-sm" style={{ borderLeftColor: token.colorSuccess }}>
          <Title level={5} className="!mt-0">
            How to protect your CFD score
          </Title>
          <Paragraph type="secondary" className="!mb-2">
            CFD reflects dormitory conduct. Points are deducted only through official violation processing
            (with a documented reason). To stay in good standing:
          </Paragraph>
          <ul className="list-disc pl-5 m-0 space-y-1 text-[var(--ant-color-text-secondary)]">
            <li>Follow dormitory rules and quiet hours.</li>
            <li>Keep your room and shared areas clean.</li>
            <li>Resolve issues through requests or staff before they escalate.</li>
            <li>If you believe a deduction is wrong, contact dormitory management with your report code.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default CFDPoints;
