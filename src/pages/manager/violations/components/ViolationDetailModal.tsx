import { useState } from 'react';
import {
  Modal,
  Descriptions,
  Tag,
  Button,
  Form,
  Select,
  Input,
  InputNumber,
  message,
  Divider,
  Image,
  Space,
} from 'antd';
import dayjs from 'dayjs';
import { reviewViolationReport } from '@/lib/actions/violation';
import type { IViolation } from '@/interfaces';
import { ViolationStatus, ViolationType, PenaltyType, ReporterType } from '@/interfaces';

interface Props {
  open: boolean;
  report: IViolation.ViolationReport | null;
  onClose: (refreshData?: boolean) => void;
}

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

const reporterTypeConfig: Record<ReporterType, { label: string }> = {
  [ReporterType.STUDENT]: { label: 'Sinh viên' },
  [ReporterType.SECURITY]: { label: 'Bảo vệ' },
  [ReporterType.MANAGER]: { label: 'Quản lý' },
};

const penaltyTypeConfig: Record<PenaltyType, { label: string; maxPoints: number }> = {
  [PenaltyType.MINOR]: { label: 'Nhẹ', maxPoints: 2 },
  [PenaltyType.SEVERE]: { label: 'Nặng', maxPoints: 5 },
};

export default function ViolationDetailModal({ open, report, onClose }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ViolationStatus | null>(null);

  const canReview =
    report?.status === ViolationStatus.NEW || report?.status === ViolationStatus.UNDER_REVIEW;

  const handleStartReview = () => {
    setIsReviewing(true);
    form.setFieldsValue({
      status: ViolationStatus.UNDER_REVIEW,
      review_notes: '',
      penalty_type: PenaltyType.MINOR,
      points_deducted: 1,
      penalty_reason: '',
    });
    setSelectedStatus(ViolationStatus.UNDER_REVIEW);
  };

  const handleCancelReview = () => {
    setIsReviewing(false);
    form.resetFields();
    setSelectedStatus(null);
  };

  const handleSubmitReview = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const reviewData: IViolation.ReviewViolationDto = {
        status: values.status,
        review_notes: values.review_notes,
      };

      if (values.status === ViolationStatus.RESOLVED_PENALIZED) {
        reviewData.penalty = {
          penalty_type: values.penalty_type,
          points_deducted: values.points_deducted,
          reason: values.penalty_reason || undefined,
        };
      }

      await reviewViolationReport(report!.id, reviewData);
      message.success('Cập nhật trạng thái thành công');
      handleCancelReview();
      onClose(true);
    } catch (error) {
      console.error('Error reviewing violation:', error);
      message.error('Không thể cập nhật trạng thái');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    handleCancelReview();
    onClose();
  };

  if (!report) return null;

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <span>Chi tiết vi phạm</span>
          <Tag color={statusConfig[report.status]?.color}>
            {statusConfig[report.status]?.label}
          </Tag>
        </div>
      }
      open={open}
      onCancel={handleClose}
      width={800}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={handleClose}>Đóng</Button>
          {canReview && !isReviewing && (
            <Button type="primary" onClick={handleStartReview}>
              Xử lý vi phạm
            </Button>
          )}
          {isReviewing && (
            <>
              <Button onClick={handleCancelReview}>Hủy</Button>
              <Button type="primary" loading={loading} onClick={handleSubmitReview}>
                Lưu
              </Button>
            </>
          )}
        </div>
      }
    >
      <Descriptions bordered column={2} size="small" className="mb-4">
        <Descriptions.Item label="Mã báo cáo" span={1}>
          <span className="font-mono font-medium text-blue-600">{report.report_code}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Ngày tạo" span={1}>
          {dayjs(report.createdAt).format('DD/MM/YYYY HH:mm')}
        </Descriptions.Item>

        <Descriptions.Item label="Sinh viên vi phạm" span={1}>
          <div>
            <div className="font-medium">{report.reported_student.full_name}</div>
            <div className="text-xs text-gray-500">{report.reported_student.student_code}</div>
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="Điểm hành vi hiện tại" span={1}>
          <span
            className={`font-medium ${
              (report.reported_student.behavioral_score ?? 10) < 5 ? 'text-red-500' : 'text-green-500'
            }`}
          >
            {report.reported_student.behavioral_score ?? 10}/10
          </span>
        </Descriptions.Item>

        <Descriptions.Item label="Loại vi phạm" span={1}>
          {violationTypeConfig[report.violation_type]?.label}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày vi phạm" span={1}>
          {dayjs(report.violation_date).format('DD/MM/YYYY')}
        </Descriptions.Item>

        <Descriptions.Item label="Địa điểm" span={2}>
          {report.location || 'Không xác định'}
        </Descriptions.Item>

        <Descriptions.Item label="Người báo cáo" span={1}>
          <div>
            <div className="font-medium">{report.reporter.fullname}</div>
            <div className="text-xs text-gray-500">
              {reporterTypeConfig[report.reporter_type]?.label}
            </div>
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="Email người báo cáo" span={1}>
          {report.reporter.email}
        </Descriptions.Item>

        <Descriptions.Item label="Mô tả vi phạm" span={2}>
          {report.description}
        </Descriptions.Item>

        {report.evidence_urls && report.evidence_urls.length > 0 && (
          <Descriptions.Item label="Bằng chứng" span={2}>
            <Image.PreviewGroup>
              <Space wrap>
                {report.evidence_urls.map((url, index) => (
                  <Image
                    key={index}
                    width={100}
                    height={100}
                    src={url}
                    style={{ objectFit: 'cover' }}
                  />
                ))}
              </Space>
            </Image.PreviewGroup>
          </Descriptions.Item>
        )}

        {report.reviewed_by && (
          <>
            <Descriptions.Item label="Người xử lý" span={1}>
              {report.reviewed_by.full_name}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày xử lý" span={1}>
              {report.reviewed_at ? dayjs(report.reviewed_at).format('DD/MM/YYYY HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú xử lý" span={2}>
              {report.review_notes || '-'}
            </Descriptions.Item>
          </>
        )}
      </Descriptions>

      {isReviewing && (
        <>
          <Divider>Xử lý vi phạm</Divider>
          <Form form={form} layout="vertical">
            <Form.Item
              name="status"
              label="Trạng thái xử lý"
              rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
            >
              <Select
                placeholder="Chọn trạng thái"
                onChange={(value) => setSelectedStatus(value)}
                options={[
                  { value: ViolationStatus.UNDER_REVIEW, label: 'Đang xử lý' },
                  { value: ViolationStatus.RESOLVED_PENALIZED, label: 'Xử phạt' },
                  { value: ViolationStatus.RESOLVED_NO_ACTION, label: 'Không xử phạt' },
                  { value: ViolationStatus.REJECTED, label: 'Từ chối báo cáo' },
                ]}
              />
            </Form.Item>

            {selectedStatus === ViolationStatus.RESOLVED_PENALIZED && (
              <>
                <Form.Item
                  name="penalty_type"
                  label="Mức độ vi phạm"
                  rules={[{ required: true, message: 'Vui lòng chọn mức độ' }]}
                >
                  <Select
                    placeholder="Chọn mức độ"
                    options={Object.entries(penaltyTypeConfig).map(([value, config]) => ({
                      value,
                      label: `${config.label} (tối đa -${config.maxPoints} điểm)`,
                    }))}
                  />
                </Form.Item>

                <Form.Item
                  name="points_deducted"
                  label="Số điểm trừ"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số điểm trừ' },
                    { type: 'number', min: 0.5, max: 5, message: 'Điểm trừ từ 0.5 đến 5' },
                  ]}
                >
                  <InputNumber
                    min={0.5}
                    max={5}
                    step={0.5}
                    style={{ width: '100%' }}
                    placeholder="Nhập số điểm trừ"
                  />
                </Form.Item>

                <Form.Item name="penalty_reason" label="Lý do xử phạt">
                  <Input.TextArea rows={2} placeholder="Nhập lý do xử phạt (tùy chọn)" />
                </Form.Item>
              </>
            )}

            <Form.Item name="review_notes" label="Ghi chú xử lý">
              <Input.TextArea rows={3} placeholder="Nhập ghi chú xử lý" />
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
}
