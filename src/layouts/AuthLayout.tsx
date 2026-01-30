import { Outlet } from 'react-router-dom';
import { AuthProvider } from '@/contexts';

/**
 * AuthLayout - Provides authentication context to all child routes
 * Must be at the root level of routes that need authentication
 */
const AuthLayout = () => {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
};

export default AuthLayout;
