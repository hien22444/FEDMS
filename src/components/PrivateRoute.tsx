import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { ROUTES } from '@/constants';
import { Spin } from 'antd';

interface PrivateRouteProps {
  allowedRoles?: string[];
}

/**
 * PrivateRoute component - Protects routes that require authentication
 * Redirects to signin page if user is not authenticated
 * Can also check for specific roles if allowedRoles is provided
 */
const PrivateRoute = ({ allowedRoles }: PrivateRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
        }}
      >
        <Spin size="large" tip="Đang kiểm tra xác thực..." />
      </div>
    );
  }

  // Not authenticated - redirect to signin
  if (!isAuthenticated) {
    // Save the attempted URL for redirecting after login
    return <Navigate to={ROUTES.SIGN_IN} state={{ from: location }} replace />;
  }

  // Check role-based access if allowedRoles is specified
  if (allowedRoles && allowedRoles.length > 0 && user) {
    const hasRequiredRole = allowedRoles.includes(user.role);

    if (!hasRequiredRole) {
      // User doesn't have required role - redirect to appropriate page
      // You can customize this based on user role
      return <Navigate to={ROUTES.SIGN_IN} replace />;
    }
  }

  // User is authenticated (and has required role if specified) - render children
  return <Outlet />;
};

export default PrivateRoute;
