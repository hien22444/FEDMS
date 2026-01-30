import { Outlet } from 'react-router-dom';
import ManagerSidebar from './ManagerSidebar';
import ManagerHeader from './ManagerHeader';

export default function ManagerLayout() {
  console.log('ManagerLayout rendered');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <ManagerSidebar />

      {/* Header */}
      <ManagerHeader />

      {/* Main Content */}
      <main className="ml-64 pt-16 p-6">
        <Outlet />
      </main>
    </div>
  );
}
