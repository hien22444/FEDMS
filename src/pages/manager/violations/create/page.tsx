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
import { Search, ArrowLeft, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { createViolationReport, searchStudentByCode } from '@/lib/actions/violation';
import type { IViolation } from '@/interfaces';
import { ViolationType, ReporterType } from '@/interfaces';

const violationTypeOptions = [
  { value: ViolationType.POLICY_VIOLATION, label: 'Policy Violation' },
  { value: ViolationType.OTHER, label: 'Other' },
];

const reporterTypeOptions = [
  { value: ReporterType.MANAGER, label: 'Manager' },
  { value: ReporterType.SECURITY, label: 'Security' },
  { value: ReporterType.STUDENT, label: 'Student' },
];

export default function CreateViolationPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [studentCode, setStudentCode] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<IViolation.SearchStudentResult | null>(
    null
  );
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearchStudent = async () => {
    if (!studentCode.trim()) {
      message.warning('Please enter student code');
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
        setSearchError(`Student not found with code "${studentCode}"`);
      }
    } catch (error) {
      console.error('Error searching student:', error);
      setSearchError('An error occurred while searching for student');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmit = async (values: IViolation.CreateViolationDto) => {
    if (!selectedStudent) {
      message.error('Please search and select a student');
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
      message.success('Violation report created successfully');
      navigate('/manager/violations');
    } catch (error) {
      console.error('Error creating violation:', error);
      message.error('Failed to create violation report');
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
      <div className="flex items-center gap-4">
        <Button
          type="text"
          icon={<ArrowLeft size={20} />}
          onClick={() => navigate('/manager/violations')}
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Violation</h1>
          <p className="text-sm text-gray-500">Create a policy violation report for a student</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Search Student" className="lg:col-span-1">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student Code
              </label>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  placeholder="E.g: DE180775"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                  onPressEnter={handleSearchStudent}
                  prefix={<User className="w-4 h-4 text-gray-400" />}
                />
                <Button
                  type="primary"
                  icon={<Search size={16} />}
                  loading={searchLoading}
                  onClick={handleSearchStudent}
                >
                  Search
                </Button>
              </Space.Compact>
            </div>

            {searchLoading && (
              <div className="flex justify-center py-4">
                <Spin tip="Searching..." />
              </div>
            )}

            {searchError && <Alert type="error" message={searchError} showIcon />}

            {selectedStudent && (
              <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-medium text-green-700">Selected Student</span>
                  <Button type="link" danger size="small" onClick={handleClearStudent}>
                    Clear
                  </Button>
                </div>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Full Name">
                    <span className="font-medium">{selectedStudent.full_name}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Student Code">
                    <span className="font-mono">{selectedStudent.student_code}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Phone">
                    {selectedStudent.phone || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Behavioral Score">
                    <Tag color={selectedStudent.behavioral_score < 5 ? 'red' : 'green'}>
                      {selectedStudent.behavioral_score}/10
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Violations This Semester">
                    <Tag
                      color={
                        selectedStudent.violations_current_semester > 0 ? 'orange' : 'blue'
                      }
                    >
                      {selectedStudent.violations_current_semester} times
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            )}
          </div>
        </Card>

        <Card title="Violation Information" className="lg:col-span-2">
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
                label="Reporter"
                rules={[{ required: true, message: 'Please select reporter type' }]}
              >
                <Select options={reporterTypeOptions} placeholder="Select reporter type" />
              </Form.Item>

              <Form.Item
                name="violation_type"
                label="Violation Type"
                rules={[{ required: true, message: 'Please select violation type' }]}
              >
                <Select options={violationTypeOptions} placeholder="Select violation type" />
              </Form.Item>

              <Form.Item
                name="violation_date"
                label="Violation Date"
                rules={[{ required: true, message: 'Please select violation date' }]}
              >
                <DatePicker
                  format="DD/MM/YYYY"
                  style={{ width: '100%' }}
                  placeholder="Select violation date"
                  disabledDate={(current) => current && current > dayjs().endOf('day')}
                />
              </Form.Item>

              <Form.Item name="location" label="Location">
                <Input placeholder="E.g: Building A, Room 101" />
              </Form.Item>
            </div>

            <Form.Item
              name="description"
              label="Description"
              rules={[
                { required: true, message: 'Please enter violation description' },
                { min: 10, message: 'Description must be at least 10 characters' },
              ]}
            >
              <Input.TextArea
                rows={4}
                placeholder="Describe the student's violation in detail..."
                showCount
                maxLength={1000}
              />
            </Form.Item>

            <Form.Item name="evidence_urls" label="Evidence Links (images)">
              <Select
                mode="tags"
                placeholder="Enter image URL and press Enter"
                tokenSeparators={[',']}
              />
            </Form.Item>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button onClick={() => navigate('/manager/violations')}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                disabled={!selectedStudent}
              >
                Create Violation
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
}
