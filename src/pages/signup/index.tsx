import { PASSWORD_REGEX, ROUTES } from '@/constants';
import type { IError, IUser } from '@/interfaces';
import { signUp } from '@/lib/actions';
import { useAuth } from '@/contexts';
import { useMutation } from '@tanstack/react-query';
import { Form, Input, Button, theme } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  HomeOutlined,
  TeamOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import toast from 'react-hot-toast';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useState } from 'react';

interface IForm extends IUser.SignupDto {
  confirmPassword: string;
}

const SignUpPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<IForm>();
  const { token } = theme.useToken();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login, isAuthenticated } = useAuth();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: signUp,
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to={ROUTES.STUDENT_DASHBOARD} replace />;
  }

  const onFinish = async (values: IUser.SignupDto) => {
    // Set role as student for registration
    values.role = 'student';
    await mutateAsync(values, {
      onSuccess: data => {
        // Use AuthContext login function
        login(data.token, data.user, null);
        toast.success('Registration successful');
        form.resetFields();
        navigate(ROUTES.STUDENT_DASHBOARD);
      },
      onError: error => {
        const err = error as IError;
        const message = Array.isArray(err.message) ? err.message[0] : err.message;
        toast.error(message || 'Registration failed');
      },
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* Left side - Form */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backgroundColor: token.colorBgLayout,
        }}
      >
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {/* Logo and Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div
              style={{
                height: '48px',
                width: '48px',
                borderRadius: '12px',
                backgroundColor: token.colorPrimary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 8px 16px ${token.colorPrimary}40`,
              }}
            >
              <HomeOutlined style={{ fontSize: '24px', color: '#fff' }} />
            </div>
            <div>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: token.colorPrimary }}>
                FPT
              </span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: token.colorText }}>
                {' '}Dormitory
              </span>
            </div>
          </div>

          {/* Welcome Text */}
          <div style={{ marginBottom: '24px' }}>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: token.colorText,
                marginBottom: '8px',
              }}
            >
              Register FPT Dormitory Account
            </h1>
            <p style={{ color: token.colorTextSecondary }}>
              Create an account to manage your room and dormitory services
            </p>
          </div>

          {/* Google Signup Button (FPT Account) */}
          <button
            type="button"
            onClick={() => {
              // Redirect to backend Google OAuth endpoint
              window.location.href = `${import.meta.env.VITE_BASE_URL}/auth/google`;
            }}
            style={{
              width: '100%',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              border: `2px solid ${token.colorPrimary}30`,
              borderRadius: '12px',
              backgroundColor: `${token.colorPrimary}08`,
              cursor: 'pointer',
              marginBottom: '20px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${token.colorPrimary}15`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `${token.colorPrimary}08`;
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span style={{ fontWeight: 500, color: token.colorText }}>
              Sign up with Google (@fpt.edu.vn)
            </span>
          </button>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <div style={{ flex: 1, height: '1px', backgroundColor: token.colorBorder }} />
            <span
              style={{
                padding: '0 16px',
                color: token.colorTextSecondary,
                fontSize: '14px',
              }}
            >
              or sign up with email
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: token.colorBorder }} />
          </div>

          {/* Signup Form */}
          <Form
            form={form}
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="fullname"
              label={
                <span style={{ color: token.colorTextSecondary, fontWeight: 500 }}>
                  Full Name
                </span>
              }
              rules={[{ required: true, message: 'Please enter your full name!' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: token.colorTextSecondary }} />}
                placeholder="e.g. John Doe"
                style={{ height: '48px', borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item
              name="email"
              label={
                <span style={{ color: token.colorTextSecondary, fontWeight: 500 }}>
                  Email
                </span>
              }
              rules={[
                { required: true, message: 'Please enter your email!' },
                { type: 'email', message: 'Invalid email address!' },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: token.colorTextSecondary }} />}
                placeholder="e.g. email@fpt.edu.vn"
                style={{ height: '48px', borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={
                <span style={{ color: token.colorTextSecondary, fontWeight: 500 }}>
                  Password
                </span>
              }
              rules={[
                { required: true, message: 'Please enter your password!' },
                {
                  pattern: PASSWORD_REGEX,
                  message: 'Min 8 characters, 1 uppercase and 1 number.',
                },
              ]}
            >
              <Input
                prefix={<LockOutlined style={{ color: token.colorTextSecondary }} />}
                suffix={
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ cursor: 'pointer', color: token.colorTextSecondary }}
                  >
                    {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                  </span>
                }
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                style={{ height: '48px', borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={
                <span style={{ color: token.colorTextSecondary, fontWeight: 500 }}>
                  Confirm Password
                </span>
              }
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password!' },
                {
                  validator: (_, value) => {
                    if (!value || form.getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match!'));
                  },
                },
              ]}
            >
              <Input
                prefix={<LockOutlined style={{ color: token.colorTextSecondary }} />}
                suffix={
                  <span
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ cursor: 'pointer', color: token.colorTextSecondary }}
                  >
                    {showConfirmPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                  </span>
                }
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                style={{ height: '48px', borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isPending}
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '16px',
                  boxShadow: `0 8px 16px ${token.colorPrimary}40`,
                }}
              >
                {isPending ? 'Signing up...' : 'Sign Up'}
              </Button>
            </Form.Item>
          </Form>

          {/* Terms */}
          <p
            style={{
              textAlign: 'center',
              color: token.colorTextSecondary,
              fontSize: '12px',
              marginBottom: '16px',
            }}
          >
            By signing up, you agree to our{' '}
            <Link to="#" style={{ color: token.colorPrimary }}>
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link to="#" style={{ color: token.colorPrimary }}>
              Terms of Service
            </Link>
          </p>

          {/* Login Link */}
          <p style={{ textAlign: 'center', color: token.colorTextSecondary, fontSize: '14px' }}>
            Already have an account?{' '}
            <Link
              to={ROUTES.SIGN_IN}
              style={{ color: token.colorPrimary, fontWeight: 600 }}
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div
        style={{
          flex: 1,
          backgroundColor: token.colorPrimary,
          position: 'relative',
          overflow: 'hidden',
          display: 'none',
        }}
        className="signup-right-panel"
      >
        {/* Gradient Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimary}ee 50%, #FF8C40 100%)`,
          }}
        />

        {/* Decorative Circles */}
        <div
          style={{
            position: 'absolute',
            top: '80px',
            right: '80px',
            height: '256px',
            width: '256px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            filter: 'blur(64px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '128px',
            left: '64px',
            height: '192px',
            width: '192px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            filter: 'blur(48px)',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%',
            padding: '64px',
          }}
        >
          <div style={{ maxWidth: '480px' }}>
            <h2
              style={{
                fontSize: '40px',
                fontWeight: 'bold',
                color: '#fff',
                lineHeight: 1.2,
                marginBottom: '24px',
              }}
            >
              FPT Dormitory - Your Second Home
            </h2>
            <p
              style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '18px',
                lineHeight: 1.6,
                marginBottom: '40px',
              }}
            >
              Smart dormitory management system, helping FPT students easily book rooms,
              make payments and track utility services.
            </p>

            {/* Feature Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
              }}
            >
              <FeatureCard
                icon={<TeamOutlined style={{ fontSize: '28px', color: '#fff' }} />}
                title="Room Booking"
                subtitle="Quick & Easy"
              />
              <FeatureCard
                icon={<SafetyOutlined style={{ fontSize: '28px', color: '#fff' }} />}
                title="Security"
                subtitle="24/7"
              />
              <FeatureCard
                icon={<ClockCircleOutlined style={{ fontSize: '28px', color: '#fff' }} />}
                title="Support"
                subtitle="Anytime"
              />
              <FeatureCard
                icon={<HomeOutlined style={{ fontSize: '28px', color: '#fff' }} />}
                title="Amenities"
                subtitle="Modern"
              />
            </div>
          </div>
        </div>

        {/* Decorative Pattern */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            opacity: 0.1,
          }}
        >
          <svg width="400" height="400" viewBox="0 0 400 400" fill="none">
            <circle cx="200" cy="200" r="180" stroke="white" strokeWidth="2" />
            <circle cx="200" cy="200" r="140" stroke="white" strokeWidth="2" />
            <circle cx="200" cy="200" r="100" stroke="white" strokeWidth="2" />
            <circle cx="200" cy="200" r="60" stroke="white" strokeWidth="2" />
          </svg>
        </div>
      </div>

      {/* CSS for responsive */}
      <style>{`
        @media (min-width: 992px) {
          .signup-right-panel {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '16px',
    }}
  >
    {icon}
    <div>
      <div style={{ color: '#fff', fontWeight: 600 }}>{title}</div>
      <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>{subtitle}</div>
    </div>
  </div>
);

export default SignUpPage;
