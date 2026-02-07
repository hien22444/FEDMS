import { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '@/lib/actions';
import { ROUTES } from '@/constants';

const { Title, Text } = Typography;

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      setLoading(true);
      const res = await adminLogin({
        email: values.username,
        password: values.password,
      });

      if (res.user.role !== 'admin') {
        message.error('Tài khoản không phải admin');
        return;
      }

      message.success('Đăng nhập admin thành công');
      navigate(ROUTES.ADMIN, { replace: true });
    } catch (err: any) {
      const msg =
        err?.message ||
        (Array.isArray(err?.message) ? err.message[0] : '') ||
        'Đăng nhập thất bại';
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

        <Form layout="vertical" initialValues={{ username: 'admin', password: 'admin' }} onFinish={onFinish}>
          <Form.Item
            label="Tài khoản"
            name="username"
            rules={[{ required: true, message: 'Vui lòng nhập tài khoản' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="admin"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="admin"
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
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <div className="mt-4 text-xs text-gray-500">
        </div>
      </Card>
    </div>
  );
}

