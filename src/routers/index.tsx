import { ROUTES } from '@/constants';
import { createBrowserRouter } from 'react-router-dom';

import SignInPage from '@/pages/signin';
import SignUpPage from '@/pages/signup';
import { AppProvider } from '@/contexts';
import { ManagerLayout } from '@/layouts/manager';
import { DashboardPage } from '@/pages/manager/dashboard';
import { BedStatisticsPage } from '@/pages/manager/bed-statistics';
import { ViolationListPage } from '@/pages/manager/violations';
import { CreateViolationPage } from '@/pages/manager/violations/create';

const router = createBrowserRouter([
  {
    path: ROUTES.SIGN_IN,
    element: <SignInPage />,
  },
  {
    path: ROUTES.SIGN_UP,
    element: <SignUpPage />,
  },
  {
    element: <AppProvider />,
    children: [
      {
        index: true,
        path: ROUTES.DASHBOARD,
        element: <SignInPage />,
      },
    ],
  },
  // Manager Routes
  {
    path: ROUTES.MANAGER,
    element: <ManagerLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'dorms',
        element: <div className="p-8 text-center text-gray-500">Dorm List Page - Coming Soon</div>,
      },
      {
        path: 'blocks',
        element: <div className="p-8 text-center text-gray-500">Block List Page - Coming Soon</div>,
      },
      {
        path: 'rooms',
        element: <div className="p-8 text-center text-gray-500">Room List Page - Coming Soon</div>,
      },
      {
        path: 'beds',
        element: <div className="p-8 text-center text-gray-500">Bed Management Page - Coming Soon</div>,
      },
      {
        path: 'beds/status',
        element: <div className="p-8 text-center text-gray-500">Update Bed Status - Coming Soon</div>,
      },
      {
        path: 'beds/assignment',
        element: <div className="p-8 text-center text-gray-500">Change Assignment - Coming Soon</div>,
      },
      {
        path: 'bookings',
        element: <div className="p-8 text-center text-gray-500">Booking History Page - Coming Soon</div>,
      },
      {
        path: 'checkout',
        element: <div className="p-8 text-center text-gray-500">Checkout Management - Coming Soon</div>,
      },
      {
        path: 'login-student',
        element: <div className="p-8 text-center text-gray-500">Login as Student - Coming Soon</div>,
      },
      {
        path: 'violations',
        element: <ViolationListPage />,
      },
      {
        path: 'violations/create',
        element: <CreateViolationPage />,
      },
      {
        path: 'facilities',
        element: <div className="p-8 text-center text-gray-500">Facilities Management - Coming Soon</div>,
      },
      {
        path: 'requests',
        element: <div className="p-8 text-center text-gray-500">Request List - Coming Soon</div>,
      },
      {
        path: 'electricity',
        element: <div className="p-8 text-center text-gray-500">Electricity Management - Coming Soon</div>,
      },
      {
        path: 'electricity/import',
        element: <div className="p-8 text-center text-gray-500">Import Electricity Data - Coming Soon</div>,
      },
      {
        path: 'electricity/create',
        element: <div className="p-8 text-center text-gray-500">Create Electricity Record - Coming Soon</div>,
      },
      {
        path: 'invoices',
        element: <div className="p-8 text-center text-gray-500">Invoice List - Coming Soon</div>,
      },
      {
        path: 'news',
        element: <div className="p-8 text-center text-gray-500">News Management - Coming Soon</div>,
      },
      {
        path: 'chat',
        element: <div className="p-8 text-center text-gray-500">Chat with Students - Coming Soon</div>,
      },
      {
        path: 'email',
        element: <div className="p-8 text-center text-gray-500">Send Email - Coming Soon</div>,
      },
      {
        path: 'notifications',
        element: <div className="p-8 text-center text-gray-500">Notifications - Coming Soon</div>,
      },
      {
        path: 'config',
        element: <div className="p-8 text-center text-gray-500">Data Configuration - Coming Soon</div>,
      },
      {
        path: 'import',
        element: <div className="p-8 text-center text-gray-500">Import Data - Coming Soon</div>,
      },
      {
        path: 'export',
        element: <div className="p-8 text-center text-gray-500">Export Data - Coming Soon</div>,
      },
      {
        path: 'settings',
        element: <div className="p-8 text-center text-gray-500">Settings - Coming Soon</div>,
      },
      {
        path: 'bed-statistics',
        element: <BedStatisticsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <div className="p-8 text-center text-gray-500">404 - Page Not Found</div>,
  },
]);

export default router;
