import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { ROUTES } from '@/constants';
import { Spin } from 'antd';

interface PrivateRouteProps {
  allowedRoles?: string[];
}

/**
 * Get the default dashboard route for a given user role
 */
const getRoleDashboard = (role: string): string => {
  switch (role) {
    case 'student':
      return ROUTES.STUDENT_DASHBOARD;
    case 'admin':
      return ROUTES.ADMIN;
    case 'manager':
      return ROUTES.MANAGER;
    case 'security':
      return ROUTES.SECURITY_DASHBOARD;
    default:
      return ROUTES.SIGN_IN;
  }
};

/**
 * PrivateRoute component - Protects routes that require authentication
 * Redirects to signin page if user is not authenticated
 * Redirects to user's own dashboard if role doesn't match
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
        <Spin size="large" tip="Checking authentication..." />
      </div>
    );
  }

  // Not authenticated - redirect to signin
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.SIGN_IN} state={{ from: location }} replace />;
  }

  // Check role-based access if allowedRoles is specified
  if (allowedRoles && allowedRoles.length > 0 && user) {
    const hasRequiredRole = allowedRoles.includes(user.role);

    if (!hasRequiredRole) {
      // Redirect to the user's own dashboard instead of sign-in
      return <Navigate to={getRoleDashboard(user.role)} replace />;
    }
  }

  // User is authenticated (and has required role if specified) - render children
  return <Outlet />;
};

export default PrivateRoute;
