import { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '@/lib/actions';
import { ROUTES } from '@/constants';
import { useAuth } from '@/contexts';

const { Title, Text } = Typography;

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      setLoading(true);
      const res = await adminLogin({
        email: values.username,
        password: values.password,
      });

      if (res.user.role !== 'admin') {
        message.error('This account is not an admin');
        return;
      }

      // Update AuthContext so PrivateRoute recognizes the session
      login(res.token, res.user as any, null);

      message.success('Admin login successful');
      navigate(ROUTES.ADMIN, { replace: true });
    } catch (err: any) {
      const msg =
        err?.message ||
        (Array.isArray(err?.message) ? err.message[0] : '') ||
        'Login failed';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-md">
        <div className="mb-6 text-center">
          <Title level={3} className="!mb-1">
            Admin Login
          </Title>
          <Text type="secondary">
            FPT University Dormitory Management System - Administrator
          </Text>
        </div>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Account"
            name="username"
            rules={[{ required: true, message: 'Please enter your account' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Enter admin username"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className="mt-2"
            >
              Login
            </Button>
          </Form.Item>
        </Form>

        <div className="mt-4 text-xs text-gray-500">
        </div>
      </Card>
    </div>
  );
}
