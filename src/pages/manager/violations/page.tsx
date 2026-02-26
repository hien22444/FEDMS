import { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Button,
  Input,
  Select,
  DatePicker,
  Space,
  Modal,
  message,
  Tooltip,
  Card,
  Row,
  Col,
  Statistic,
} from 'antd';
import { Search, Plus, Eye, Trash2, AlertTriangle, Clock, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  getViolationReports,
  getViolationStatistics,
  deleteViolationReport,
} from '@/lib/actions/violation';
import type { IViolation } from '@/interfaces';
import { ViolationStatus, ViolationType } from '@/interfaces';
import ViolationDetailModal from './components/ViolationDetailModal';

const { RangePicker } = DatePicker;

const statusConfig: Record<ViolationStatus, { color: string; label: string }> = {
  [ViolationStatus.NEW]: { color: 'blue', label: 'New' },
  [ViolationStatus.UNDER_REVIEW]: { color: 'orange', label: 'Under Review' },
  [ViolationStatus.RESOLVED_PENALIZED]: { color: 'red', label: 'Penalized' },
  [ViolationStatus.RESOLVED_NO_ACTION]: { color: 'green', label: 'No Action' },
  [ViolationStatus.REJECTED]: { color: 'gray', label: 'Rejected' },
};

const violationTypeConfig: Record<ViolationType, { label: string }> = {
  [ViolationType.POLICY_VIOLATION]: { label: 'Policy Violation' },
  [ViolationType.OTHER]: { label: 'Other' },
};

export default function ViolationListPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IViolation.ViolationReport[]>([]);
  const [pagination, setPagination] = useState<IViolation.Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [statistics, setStatistics] = useState<IViolation.ViolationStatistics | null>(null);

  const [searchCode, setSearchCode] = useState('');
  const [statusFilter, setStatusFilter] = useState<ViolationStatus | undefined>();
  const [typeFilter, setTypeFilter] = useState<ViolationType | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<IViolation.ViolationReport | null>(null);

  const fetchData = async (page = 1) => {
    setLoading(true);
    try {
      const query: IViolation.ViolationQuery = {
        page,
        limit: pagination.limit,
        status: statusFilter,
        violation_type: typeFilter,
        student_code: searchCode || undefined,
        start_date: dateRange?.[0]?.format('YYYY-MM-DD'),
        end_date: dateRange?.[1]?.format('YYYY-MM-DD'),
      };

      const response = await getViolationReports(query);
      setData(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching violations:', error);
      message.error('Failed to load violations list');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await getViolationStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchStatistics();
  }, []);

  const handleSearch = () => {
    fetchData(1);
  };

  const handleReset = () => {
    setSearchCode('');
    setStatusFilter(undefined);
    setTypeFilter(undefined);
    setDateRange(null);
    fetchData(1);
  };

  const handleViewDetail = (record: IViolation.ViolationReport) => {
    setSelectedReport(record);
    setDetailModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Confirm Delete',
      content: 'Are you sure you want to delete this violation report?',
      okText: 'Delete',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteViolationReport(id);
          message.success('Violation report deleted successfully');
          fetchData(pagination.page);
        } catch (error) {
          message.error('Failed to delete violation report');
        }
      },
    });
  };

  const handleModalClose = (refreshData?: boolean) => {
    setDetailModalOpen(false);
    setSelectedReport(null);
    if (refreshData) {
      fetchData(pagination.page);
      fetchStatistics();
    }
  };

  const columns: ColumnsType<IViolation.ViolationReport> = [
    {
      title: 'Report Code',
      dataIndex: 'report_code',
      key: 'report_code',
      width: 140,
      render: (code: string) => (
        <span className="font-mono text-sm font-medium text-blue-600">{code}</span>
      ),
    },
    {
      title: 'Student',
      key: 'student',
      width: 200,
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.reported_student.full_name}</div>
          <div className="text-xs text-gray-500">{record.reported_student.student_code}</div>
        </div>
      ),
    },
    {
      title: 'Violation Type',
      dataIndex: 'violation_type',
      key: 'violation_type',
      width: 140,
      render: (type: ViolationType) => violationTypeConfig[type]?.label || type,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Violation Date',
      dataIndex: 'violation_date',
      key: 'violation_date',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: ViolationStatus) => (
        <Tag color={statusConfig[status]?.color}>{statusConfig[status]?.label || status}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<Eye size={16} />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {record.status === ViolationStatus.NEW && (
            <Tooltip title="Delete">
              <Button
                type="text"
                danger
                icon={<Trash2 size={16} />}
                onClick={() => handleDelete(record.id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Violation Management</h1>
          <p className="text-sm text-gray-500">
            Manage and process dormitory policy violation reports
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => navigate('/manager/violations/create')}
        >
          Create New Violation
        </Button>
      </div>

      {statistics && (
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Reports"
                value={statistics.totalReports}
                prefix={<AlertTriangle className="text-blue-500" size={20} />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Pending"
                value={statistics.byStatus.new + statistics.byStatus.under_review}
                prefix={<Clock className="text-orange-500" size={20} />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Penalized"
                value={statistics.byStatus.resolved_penalized}
                prefix={<Check className="text-red-500" size={20} />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={`Penalties ${statistics.currentSemester}`}
                value={statistics.totalPenaltiesThisSemester}
                prefix={<X className="text-gray-500" size={20} />}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Search by student code"
            prefix={<Search className="w-4 h-4 text-gray-400" />}
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            style={{ width: 200 }}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="Status"
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 160 }}
            options={Object.entries(statusConfig).map(([value, config]) => ({
              value,
              label: config.label,
            }))}
          />
          <Select
            placeholder="Violation Type"
            allowClear
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 160 }}
            options={Object.entries(violationTypeConfig).map(([value, config]) => ({
              value,
              label: config.label,
            }))}
          />
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            format="DD/MM/YYYY"
            placeholder={['From Date', 'To Date']}
          />
          <Space>
            <Button type="primary" onClick={handleSearch}>
              Search
            </Button>
            <Button onClick={handleReset}>Reset</Button>
          </Space>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} reports`,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, limit: pageSize ?? prev.limit }));
              fetchData(page);
            },
          }}
        />
      </Card>

      <ViolationDetailModal
        open={detailModalOpen}
        report={selectedReport}
        onClose={handleModalClose}
      />
    </div>
  );
}
