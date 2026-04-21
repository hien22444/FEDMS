import { Outlet } from 'react-router-dom';
import { Suspense, useEffect, useState } from 'react';
import { Spin } from 'antd';
import ManagerSidebar from './ManagerSidebar';
import ManagerHeader from './ManagerHeader';
import { useWindowSize } from '@/hooks/useWindowSize';

export default function ManagerLayout() {
  const { width } = useWindowSize();
  const isDesktop = width >= 1024;
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (isDesktop) setMobileSidebarOpen(false);
  }, [isDesktop]);

  const mainMargin = isDesktop ? (collapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]') : '';

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
        collapsed={isDesktop ? collapsed : false}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
      />
      <ManagerHeader
        isDesktop={isDesktop}
        onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)}
      />
      <main className={`px-4 pb-6 pt-20 sm:px-6 lg:px-6 transition-all duration-300 ${mainMargin}`}>
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
              <Spin size="large" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
