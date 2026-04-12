import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Input,
  Button,
  Card,
  Descriptions,
  Tag,
  Popconfirm,
  Alert,
  Space,
} from 'antd';
import { Search, LogOut, CheckCircle } from 'lucide-react';
import { searchStudentForCheckout, checkoutStudent } from '@/lib/actions';
import type { CheckoutStudentInfo } from '@/lib/actions';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN').format(amount) + ' VND';

const ManagerCheckout = () => {
  const [studentCode, setStudentCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [studentInfo, setStudentInfo] = useState<CheckoutStudentInfo | null>(null);
  const [checkedOut, setCheckedOut] = useState(false);
  const [checkoutDate, setCheckoutDate] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    const code = studentCode.trim();
    if (!code) {
      toast.error('Please enter a student code');
      return;
    }
    setSearching(true);
    setStudentInfo(null);
    setCheckedOut(false);
    setCheckoutDate(null);
    setNotFound(false);
    try {
      const data = await searchStudentForCheckout(code);
      setStudentInfo(data);
    } catch (err: any) {
      const msg = err?.message || 'Student not found';
      if (msg.toLowerCase().includes('not found')) {
        setNotFound(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setSearching(false);
    }
  };

  const handleCheckout = async () => {
    if (!studentInfo) return;
    setCheckingOut(true);
    try {
      const data = await checkoutStudent(studentInfo.student.student_code);
      setCheckoutDate(data.checkout_date);
      setCheckedOut(true);
      // Re-fetch student info to sync UI — contract will now be null
      const updated = await searchStudentForCheckout(studentInfo.student.student_code);
      setStudentInfo(updated);
      toast.success(`${data.full_name} has been checked out successfully!`);
    } catch (err: any) {
      toast.error(err?.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const contract = studentInfo?.active_contract;
  const room = contract?.room;
  const block = room?.block;
  const upcomingContract = studentInfo?.upcoming_contract;
  const upcomingRoom = upcomingContract?.room;
  const upcomingBlock = upcomingRoom?.block;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="text-sm text-gray-500">Search a student by student code to perform checkout</p>
      </div>

      <Card>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            placeholder="Enter student code (e.g. SE123456)"
            value={studentCode}
            onChange={(e) => setStudentCode(e.target.value)}
            onPressEnter={handleSearch}
            prefix={<Search className="w-4 h-4 text-gray-400" />}
            size="large"
          />
          <Button
            type="primary"
            size="large"
            loading={searching}
            onClick={handleSearch}
          >
            Search
          </Button>
        </Space.Compact>
      </Card>

      {notFound && (
        <Alert type="warning" message="Student not found. Please check the student code." showIcon />
      )}

      {checkedOut && checkoutDate && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircle className="w-4 h-4" />}
          message="Checkout Completed"
          description={
            <span>
              Student has been checked out on{' '}
              <strong>{new Date(checkoutDate).toLocaleString('vi-VN')}</strong>.
              They can now book a new room.
            </span>
          }
        />
      )}

      {studentInfo && (
        <Card title="Student Information">
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Full Name">
              {studentInfo.student.full_name}
            </Descriptions.Item>
            <Descriptions.Item label="Student Code">
              <span className="font-mono font-semibold">{studentInfo.student.student_code}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {studentInfo.student.email || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Gender">
              {studentInfo.student.gender || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Student Type">
              {studentInfo.student.student_type || '—'}
            </Descriptions.Item>
          </Descriptions>

          <div className="mt-4">
            <div className="font-semibold mb-2">Current Room Assignment</div>
            {contract ? (
              <>
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="Semester">{contract.semester}</Descriptions.Item>
                  <Descriptions.Item label="Dorm">
                    {block?.dorm?.dorm_name || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Block">
                    {block?.block_name || '—'} ({block?.block_code || '—'})
                  </Descriptions.Item>
                  <Descriptions.Item label="Room">
                    {room?.room_number || '—'} — {room?.room_type || '—'}, Floor {room?.floor ?? '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Bed">
                    {contract.bed?.bed_number || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Room Price">
                    {formatCurrency(contract.room_price)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Contract Start">
                    {new Date(contract.start_date).toLocaleDateString('vi-VN')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Contract End">
                    {new Date(contract.end_date).toLocaleDateString('vi-VN')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color="green">{contract.status}</Tag>
                  </Descriptions.Item>
                </Descriptions>

                <div className="mt-6 flex justify-end">
                  <Popconfirm
                    title="Confirm Checkout"
                    description={
                      <div>
                        Are you sure you want to check out{' '}
                        <strong>{studentInfo.student.full_name}</strong>?<br />
                        Their bed will be freed and they will be able to book a new room.
                      </div>
                    }
                    onConfirm={handleCheckout}
                    okText="Yes, Checkout"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      type="primary"
                      danger
                      size="large"
                      loading={checkingOut}
                      icon={<LogOut className="w-4 h-4" />}
                    >
                      Checkout Student
                    </Button>
                  </Popconfirm>
                </div>
              </>
            ) : (
              <Alert
                type="info"
                message="This student has no active contract. They can already book a new room."
                showIcon
              />
            )}
          </div>

          {upcomingContract && (
            <div className="mt-4">
              <div className="font-semibold mb-2">
                Upcoming Reservation
                <Tag color="blue" className="ml-2">Next Semester</Tag>
              </div>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Semester">{upcomingContract.semester}</Descriptions.Item>
                <Descriptions.Item label="Dorm">
                  {upcomingBlock?.dorm?.dorm_name || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Block">
                  {upcomingBlock?.block_name || '—'} ({upcomingBlock?.block_code || '—'})
                </Descriptions.Item>
                <Descriptions.Item label="Room">
                  {upcomingRoom?.room_number || '—'} — {upcomingRoom?.room_type || '—'}, Floor {upcomingRoom?.floor ?? '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Bed">
                  {upcomingContract.bed?.bed_number || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Room Price">
                  {formatCurrency(upcomingContract.room_price)}
                </Descriptions.Item>
                <Descriptions.Item label="Starts">
                  {new Date(upcomingContract.start_date).toLocaleDateString('vi-VN')}
                </Descriptions.Item>
                <Descriptions.Item label="Ends">
                  {new Date(upcomingContract.end_date).toLocaleDateString('vi-VN')}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color="blue">{upcomingContract.status}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default ManagerCheckout;
