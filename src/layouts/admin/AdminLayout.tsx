import { Outlet, Navigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { ROUTES } from '@/constants';

export default function AdminLayout() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('admin-role');

    if (!token || role !== 'admin') {
      return <Navigate to={ROUTES.ADMIN_LOGIN} replace />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-6">
        <Outlet />
      </main>
    </div>
  );
}

