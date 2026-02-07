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

const reporterTypeConfig: Record<ReporterType, { label: string }> = {
  [ReporterType.STUDENT]: { label: 'Student' },
  [ReporterType.SECURITY]: { label: 'Security' },
  [ReporterType.MANAGER]: { label: 'Manager' },
};

const penaltyTypeConfig: Record<PenaltyType, { label: string; maxPoints: number }> = {
  [PenaltyType.MINOR]: { label: 'Minor', maxPoints: 2 },
  [PenaltyType.SEVERE]: { label: 'Severe', maxPoints: 5 },
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
      message.success('Status updated successfully');
      handleCancelReview();
      onClose(true);
    } catch (error) {
      console.error('Error reviewing violation:', error);
      message.error('Failed to update status');
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
          <span>Violation Details</span>
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
          <Button onClick={handleClose}>Close</Button>
          {canReview && !isReviewing && (
            <Button type="primary" onClick={handleStartReview}>
              Process Violation
            </Button>
          )}
          {isReviewing && (
            <>
              <Button onClick={handleCancelReview}>Cancel</Button>
              <Button type="primary" loading={loading} onClick={handleSubmitReview}>
                Save
              </Button>
            </>
          )}
        </div>
      }
    >
      <Descriptions bordered column={2} size="small" className="mb-4">
        <Descriptions.Item label="Report Code" span={1}>
          <span className="font-mono font-medium text-blue-600">{report.report_code}</span>
        </Descriptions.Item>
        <Descriptions.Item label="Created Date" span={1}>
          {dayjs(report.createdAt).format('DD/MM/YYYY HH:mm')}
        </Descriptions.Item>

        <Descriptions.Item label="Violating Student" span={1}>
          <div>
            <div className="font-medium">{report.reported_student.full_name}</div>
            <div className="text-xs text-gray-500">{report.reported_student.student_code}</div>
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="Current Behavioral Score" span={1}>
          <span
            className={`font-medium ${(report.reported_student.behavioral_score ?? 10) < 5 ? 'text-red-500' : 'text-green-500'
              }`}
          >
            {report.reported_student.behavioral_score ?? 10}/10
          </span>
        </Descriptions.Item>

        <Descriptions.Item label="Violation Type" span={1}>
          {violationTypeConfig[report.violation_type]?.label}
        </Descriptions.Item>
        <Descriptions.Item label="Violation Date" span={1}>
          {dayjs(report.violation_date).format('DD/MM/YYYY')}
        </Descriptions.Item>

        <Descriptions.Item label="Location" span={2}>
          {report.location || 'Not specified'}
        </Descriptions.Item>

        <Descriptions.Item label="Reporter" span={1}>
          <div>
            <div className="font-medium">{report.reporter.fullname}</div>
            <div className="text-xs text-gray-500">
              {reporterTypeConfig[report.reporter_type]?.label}
            </div>
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="Reporter Email" span={1}>
          {report.reporter.email}
        </Descriptions.Item>

        <Descriptions.Item label="Description" span={2}>
          {report.description}
        </Descriptions.Item>

        {report.evidence_urls && report.evidence_urls.length > 0 && (
          <Descriptions.Item label="Evidence" span={2}>
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
            <Descriptions.Item label="Reviewed By" span={1}>
              {report.reviewed_by.full_name}
            </Descriptions.Item>
            <Descriptions.Item label="Review Date" span={1}>
              {report.reviewed_at ? dayjs(report.reviewed_at).format('DD/MM/YYYY HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Review Notes" span={2}>
              {report.review_notes || '-'}
            </Descriptions.Item>
          </>
        )}
      </Descriptions>

      {isReviewing && (
        <>
          <Divider>Process Violation</Divider>
          <Form form={form} layout="vertical">
            <Form.Item
              name="status"
              label="Processing Status"
              rules={[{ required: true, message: 'Please select a status' }]}
            >
              <Select
                placeholder="Select status"
                onChange={(value) => setSelectedStatus(value)}
                options={[
                  { value: ViolationStatus.UNDER_REVIEW, label: 'Under Review' },
                  { value: ViolationStatus.RESOLVED_PENALIZED, label: 'Penalize' },
                  { value: ViolationStatus.RESOLVED_NO_ACTION, label: 'No Action' },
                  { value: ViolationStatus.REJECTED, label: 'Reject Report' },
                ]}
              />
            </Form.Item>

            {selectedStatus === ViolationStatus.RESOLVED_PENALIZED && (
              <>
                <Form.Item
                  name="penalty_type"
                  label="Severity Level"
                  rules={[{ required: true, message: 'Please select severity level' }]}
                >
                  <Select
                    placeholder="Select severity"
                    options={Object.entries(penaltyTypeConfig).map(([value, config]) => ({
                      value,
                      label: `${config.label} (max -${config.maxPoints} points)`,
                    }))}
                  />
                </Form.Item>

                <Form.Item
                  name="points_deducted"
                  label="Points to Deduct"
                  rules={[
                    { required: true, message: 'Please enter points to deduct' },
                    { type: 'number', min: 0.5, max: 5, message: 'Points must be between 0.5 and 5' },
                  ]}
                >
                  <InputNumber
                    min={0.5}
                    max={5}
                    step={0.5}
                    style={{ width: '100%' }}
                    placeholder="Enter points to deduct"
                  />
                </Form.Item>

                <Form.Item name="penalty_reason" label="Penalty Reason">
                  <Input.TextArea rows={2} placeholder="Enter penalty reason (optional)" />
                </Form.Item>
              </>
            )}

            <Form.Item name="review_notes" label="Review Notes">
              <Input.TextArea rows={3} placeholder="Enter review notes" />
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
}
