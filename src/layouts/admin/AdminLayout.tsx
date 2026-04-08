import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { useWindowSize } from '@/hooks/useWindowSize';

export default function AdminLayout() {
  // Role-based access is now handled by PrivateRoute in the router config
  const location = useLocation();
  const { width } = useWindowSize();
  const isDesktop = width >= 1024;
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (isDesktop) setMobileSidebarOpen(false);
  }, [isDesktop]);

  const pageTitle =
    location.pathname === '/admin'
      ? 'Dashboard'
      : location.pathname.split('/').filter(Boolean).slice(-1)[0]?.replace(/-/g, ' ') || 'Admin';

  return (
    <div className="min-h-screen bg-gray-100">
      {!isDesktop && mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <AdminSidebar
        isDesktop={isDesktop}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <header className="fixed left-0 right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:left-[280px]">
        <div className="flex items-center gap-3">
          {!isDesktop && (
            <button
              type="button"
              onClick={() => setMobileSidebarOpen((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 lg:hidden"
            >
              <Menu size={18} />
            </button>
          )}
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Admin</div>
            <div className="text-sm font-semibold text-gray-900 capitalize">{pageTitle}</div>
          </div>
        </div>
      </header>

      <main className="min-w-0 overflow-y-auto px-4 pb-6 pt-20 sm:px-6 lg:ml-[280px]">
        <Outlet />
      </main>
    </div>
  );
}
