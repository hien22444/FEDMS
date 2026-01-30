import { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  message,
  Spin,
  Alert,
  Descriptions,
  Tag,
  Space,
} from 'antd';
import { RiSearchLine, RiArrowLeftLine, RiUserLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { createViolationReport, searchStudentByCode } from '@/lib/actions/violation';
import type { IViolation } from '@/interfaces';
import { ViolationType, ReporterType } from '@/interfaces';

const violationTypeOptions = [
  { value: ViolationType.POLICY_VIOLATION, label: 'Vi phạm nội quy' },
  { value: ViolationType.OTHER, label: 'Khác' },
];

const reporterTypeOptions = [
  { value: ReporterType.MANAGER, label: 'Quản lý' },
  { value: ReporterType.SECURITY, label: 'Bảo vệ' },
  { value: ReporterType.STUDENT, label: 'Sinh viên' },
];

export default function CreateViolationPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [studentCode, setStudentCode] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<IViolation.SearchStudentResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearchStudent = async () => {
    if (!studentCode.trim()) {
      message.warning('Vui lòng nhập mã sinh viên');
      return;
    }

    setSearchLoading(true);
    setSearchError(null);
    setSelectedStudent(null);

    try {
      const student = await searchStudentByCode(studentCode.trim().toUpperCase());
      if (student) {
        setSelectedStudent(student);
        form.setFieldsValue({ student_code: student.student_code });
      } else {
        setSearchError(`Không tìm thấy sinh viên với mã "${studentCode}"`);
      }
    } catch (error) {
      console.error('Error searching student:', error);
      setSearchError('Có lỗi xảy ra khi tìm kiếm sinh viên');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmit = async (values: IViolation.CreateViolationDto) => {
    if (!selectedStudent) {
      message.error('Vui lòng tìm và chọn sinh viên');
      return;
    }

    setLoading(true);
    try {
      const data: IViolation.CreateViolationDto = {
        student_code: selectedStudent.student_code,
        reporter_type: values.reporter_type,
        violation_type: values.violation_type,
        description: values.description,
        violation_date: dayjs(values.violation_date).format('YYYY-MM-DD'),
        location: values.location,
        evidence_urls: values.evidence_urls || [],
      };

      await createViolationReport(data);
      message.success('Tạo báo cáo vi phạm thành công');
      navigate('/manager/violations');
    } catch (error) {
      console.error('Error creating violation:', error);
      message.error('Không thể tạo báo cáo vi phạm');
    } finally {
      setLoading(false);
    }
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setStudentCode('');
    setSearchError(null);
    form.setFieldsValue({ student_code: '' });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button
          type="text"
          icon={<RiArrowLeftLine />}
          onClick={() => navigate('/manager/violations')}
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tạo vi phạm mới</h1>
          <p className="text-sm text-gray-500">
            Tạo báo cáo vi phạm nội quy cho sinh viên
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Search */}
        <Card title="Tìm sinh viên" className="lg:col-span-1">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã sinh viên
              </label>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="VD: DE180775"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                  onPressEnter={handleSearchStudent}
                  prefix={<RiUserLine className="text-gray-400" />}
                />
                <Button
                  type="primary"
                  icon={<RiSearchLine />}
                  loading={searchLoading}
                  onClick={handleSearchStudent}
                >
                  Tìm
                </Button>
              </Space.Compact>
            </div>

            {searchLoading && (
              <div className="flex justify-center py-4">
                <Spin tip="Đang tìm kiếm..." />
              </div>
            )}

            {searchError && (
              <Alert type="error" message={searchError} showIcon />
            )}

            {selectedStudent && (
              <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-medium text-green-700">
                    Sinh viên được chọn
                  </span>
                  <Button type="link" danger size="small" onClick={handleClearStudent}>
                    Xóa
                  </Button>
                </div>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Họ tên">
                    <span className="font-medium">{selectedStudent.full_name}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Mã SV">
                    <span className="font-mono">{selectedStudent.student_code}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="SĐT">
                    {selectedStudent.phone || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Điểm hành vi">
                    <Tag color={selectedStudent.behavioral_score < 5 ? 'red' : 'green'}>
                      {selectedStudent.behavioral_score}/10
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Vi phạm kỳ này">
                    <Tag color={selectedStudent.violations_current_semester > 0 ? 'orange' : 'blue'}>
                      {selectedStudent.violations_current_semester} lần
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </div>
        </Card>

        {/* Violation Form */}
        <Card title="Thông tin vi phạm" className="lg:col-span-2">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              reporter_type: ReporterType.MANAGER,
              violation_type: ViolationType.POLICY_VIOLATION,
              violation_date: dayjs(),
            }}
          >
            <Form.Item name="student_code" hidden>
              <Input />
            </Form.Item>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                name="reporter_type"
                label="Người báo cáo"
                rules={[{ required: true, message: 'Vui lòng chọn loại người báo cáo' }]}
              >
                <Select options={reporterTypeOptions} placeholder="Chọn loại người báo cáo" />
              </Form.Item>

              <Form.Item
                name="violation_type"
                label="Loại vi phạm"
                rules={[{ required: true, message: 'Vui lòng chọn loại vi phạm' }]}
              >
                <Select options={violationTypeOptions} placeholder="Chọn loại vi phạm" />
              </Form.Item>

              <Form.Item
                name="violation_date"
                label="Ngày vi phạm"
                rules={[{ required: true, message: 'Vui lòng chọn ngày vi phạm' }]}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  style={{ width: '100%' }}
                  placeholder="Chọn ngày vi phạm"
                  disabledDate={(current) => current && current > dayjs().endOf('day')}
                />
              </Form.Item>

              <Form.Item name="location" label="Địa điểm vi phạm">
                <Input placeholder="VD: Tòa A, Phòng 101" />
              </Form.Item>
            </div>

            <Form.Item
              name="description"
              label="Mô tả vi phạm"
              rules={[
                { required: true, message: 'Vui lòng nhập mô tả vi phạm' },
                { min: 10, message: 'Mô tả phải có ít nhất 10 ký tự' },
              ]}
            >
              <Input.TextArea
                rows={4}
                placeholder="Mô tả chi tiết hành vi vi phạm của sinh viên..."
                showCount
                maxLength={1000}
              />
            </Form.Item>

            <Form.Item name="evidence_urls" label="Link bằng chứng (hình ảnh)">
              <Select
                mode="tags"
                placeholder="Nhập URL hình ảnh và nhấn Enter"
                tokenSeparators={[',']}
              />
            </Form.Item>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button onClick={() => navigate('/manager/violations')}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={!selectedStudent}
              >
                Tạo vi phạm
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}
