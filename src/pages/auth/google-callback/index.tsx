import { useEffect, useRef, useState } from 'react';
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
  // Guard against React 18 StrictMode double-invocation (code is single-use)
  const hasExchanged = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (hasExchanged.current) return;
      hasExchanged.current = true;
      try {
        const errorParam = searchParams.get('error');
        if (errorParam) {
          setError('Google sign-in failed. Please try again.');
          return;
        }

        // New flow: BE returns a one-time code, not tokens in URL
        const code = searchParams.get('code');
        if (!code) {
          setError('No authentication data received from Google.');
          return;
        }

        // Exchange code for tokens (tokens never touched the URL)
        // VITE_BASE_URL already includes /v1 (e.g. http://localhost:3001/v1)
        const baseUrl = import.meta.env.VITE_BASE_URL?.replace(/\/$/, '') ?? '';
        const resp = await fetch(`${baseUrl}/auth/google/exchange?code=${encodeURIComponent(code)}`);
        if (!resp.ok) {
          setError('Failed to complete Google sign-in. Please try again.');
          return;
        }
        const json = await resp.json();
        const { token, refreshToken, user, profile } = json.data ?? json;

        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        login(token, user, profile);
        toast.success('Google sign-in successful!');

        let redirectPath = ROUTES.STUDENT_DASHBOARD;
        if (user.role === 'manager') {
          redirectPath = ROUTES.MANAGER;
        } else if (user.role === 'security') {
          redirectPath = ROUTES.SECURITY_DASHBOARD;
        }
        navigate(redirectPath, { replace: true });
      } catch (err) {
        console.error('Google callback error:', err);
        setError('An error occurred while processing Google sign-in.');
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
          title="Sign-in Failed"
          subTitle={error}
          extra={
            <a href={ROUTES.SIGN_IN} style={{ color: '#FF6C00' }}>
              Back to sign-in page
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
      <p style={{ color: '#666', fontSize: '16px' }}>Processing Google sign-in...</p>
    </div>
  );
};

export default GoogleCallbackPage;
