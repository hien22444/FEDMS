import { Outlet } from 'react-router-dom';
import ManagerSidebar from './ManagerSidebar';
import ManagerHeader from './ManagerHeader';

export default function ManagerLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ManagerSidebar />
      <ManagerHeader />
      <main className="ml-64 pt-16 p-6">
        <Outlet />
      </main>
    </div>
  );
}
