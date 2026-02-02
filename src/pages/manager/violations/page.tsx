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
  [ViolationStatus.NEW]: { color: 'blue', label: 'Mới' },
  [ViolationStatus.UNDER_REVIEW]: { color: 'orange', label: 'Đang xử lý' },
  [ViolationStatus.RESOLVED_PENALIZED]: { color: 'red', label: 'Đã xử phạt' },
  [ViolationStatus.RESOLVED_NO_ACTION]: { color: 'green', label: 'Không xử phạt' },
  [ViolationStatus.REJECTED]: { color: 'gray', label: 'Từ chối' },
};

const violationTypeConfig: Record<ViolationType, { label: string }> = {
  [ViolationType.POLICY_VIOLATION]: { label: 'Vi phạm nội quy' },
  [ViolationType.OTHER]: { label: 'Khác' },
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

<<<<<<< HEAD
  // Filters
=======
>>>>>>> b08cf52a5d072614a43cfae62aa76e7efed1071d
  const [searchCode, setSearchCode] = useState('');
  const [statusFilter, setStatusFilter] = useState<ViolationStatus | undefined>();
  const [typeFilter, setTypeFilter] = useState<ViolationType | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

<<<<<<< HEAD
  // Modal states
=======
>>>>>>> b08cf52a5d072614a43cfae62aa76e7efed1071d
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
      message.error('Không thể tải danh sách vi phạm');
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
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa báo cáo vi phạm này?',
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteViolationReport(id);
          message.success('Xóa báo cáo vi phạm thành công');
          fetchData(pagination.page);
        } catch (error) {
          message.error('Không thể xóa báo cáo vi phạm');
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
      title: 'Mã báo cáo',
      dataIndex: 'report_code',
      key: 'report_code',
      width: 140,
      render: (code: string) => (
        <span className="font-mono text-sm font-medium text-blue-600">{code}</span>
      ),
    },
    {
      title: 'Sinh viên',
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
      title: 'Loại vi phạm',
      dataIndex: 'violation_type',
      key: 'violation_type',
      width: 140,
      render: (type: ViolationType) => violationTypeConfig[type]?.label || type,
    },
    {
      title: 'Mô tả',
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
      title: 'Ngày vi phạm',
      dataIndex: 'violation_date',
      key: 'violation_date',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: ViolationStatus) => (
        <Tag color={statusConfig[status]?.color}>{statusConfig[status]?.label || status}</Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<Eye size={16} />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {record.status === ViolationStatus.NEW && (
            <Tooltip title="Xóa">
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
          <h1 className="text-2xl font-bold text-gray-900">Quản lý vi phạm</h1>
          <p className="text-sm text-gray-500">
            Quản lý và xử lý các báo cáo vi phạm nội quy ký túc xá
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => navigate('/manager/violations/create')}
        >
          Tạo vi phạm mới
        </Button>
      </div>

      {statistics && (
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Tổng báo cáo"
                value={statistics.totalReports}
                prefix={<AlertTriangle className="text-blue-500" size={20} />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Chờ xử lý"
                value={statistics.byStatus.new + statistics.byStatus.under_review}
                prefix={<Clock className="text-orange-500" size={20} />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Đã xử phạt"
                value={statistics.byStatus.resolved_penalized}
                prefix={<Check className="text-red-500" size={20} />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title={`Xử phạt ${statistics.currentSemester}`}
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
            placeholder="Tìm theo mã sinh viên"
            prefix={<Search className="w-4 h-4 text-gray-400" />}
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            style={{ width: 200 }}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="Trạng thái"
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
            placeholder="Loại vi phạm"
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
            placeholder={['Từ ngày', 'Đến ngày']}
          />
          <Space>
            <Button type="primary" onClick={handleSearch}>
              Tìm kiếm
            </Button>
            <Button onClick={handleReset}>Đặt lại</Button>
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
            showTotal: (total) => `Tổng ${total} báo cáo`,
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
