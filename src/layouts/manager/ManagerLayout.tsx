import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ManagerSidebar from './ManagerSidebar';
import ManagerHeader from './ManagerHeader';
import { useWindowSize } from '@/hooks/useWindowSize';

export default function ManagerLayout() {
  const { width } = useWindowSize();
  const isDesktop = width >= 1024;
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (isDesktop) setMobileSidebarOpen(false);
  }, [isDesktop]);

  return (
    <div className="min-h-screen bg-gray-50">
      {!isDesktop && mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <ManagerSidebar
        isDesktop={isDesktop}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <ManagerHeader
        isDesktop={isDesktop}
        onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)}
      />
      <main className="px-4 pb-6 pt-20 sm:px-6 lg:ml-[280px] lg:px-6">
        <Outlet />
      </main>
    </div>
  );
}
