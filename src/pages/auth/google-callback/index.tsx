import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, Result } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';
import { ROUTES } from '@/constants';
import { useAuth } from '@/contexts';

const GoogleCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = () => {
      try {
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');
        const profileParam = searchParams.get('profile');
        const errorParam = searchParams.get('error');

        if (errorParam) {
          setError('Đăng nhập Google thất bại. Vui lòng thử lại.');
          return;
        }

        if (!token || !userParam) {
          setError('Không nhận được thông tin xác thực từ Google.');
          return;
        }

        // Parse user and profile data
        const user = JSON.parse(decodeURIComponent(userParam));
        const profile = profileParam ? JSON.parse(decodeURIComponent(profileParam)) : null;

        // Use AuthContext login function
        login(token, user, profile);
        toast.success('Đăng nhập Google thành công!');

        // Redirect based on user role
        let redirectPath = ROUTES.STUDENT_DASHBOARD;
        if (user.role === 'manager') {
          redirectPath = ROUTES.MANAGER;
        } else if (user.role === 'security') {
          redirectPath = ROUTES.SECURITY_DASHBOARD;
        }
        navigate(redirectPath, { replace: true });
      } catch (err) {
        console.error('Google callback error:', err);
        setError('Có lỗi xảy ra khi xử lý đăng nhập Google.');
      }
    };

    handleCallback();
  }, [searchParams, login, navigate]);

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Result
          status="error"
          title="Đăng nhập thất bại"
          subTitle={error}
          extra={
            <a href={ROUTES.SIGN_IN} style={{ color: '#FF6C00' }}>
              Quay lại trang đăng nhập
            </a>
          }
        />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
      }}
    >
      <Spin indicator={<LoadingOutlined style={{ fontSize: 48, color: '#FF6C00' }} spin />} />
      <p style={{ color: '#666', fontSize: '16px' }}>Đang xử lý đăng nhập Google...</p>
    </div>
  );
};

export default GoogleCallbackPage;
