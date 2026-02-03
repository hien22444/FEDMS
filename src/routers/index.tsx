import { ROUTES } from '@/constants';

import { createBrowserRouter } from 'react-router-dom';

import SignInPage from '@/pages/signin';
import { AppProvider } from '@/contexts';
import SignUpPage from '@/pages/signup';
import LandingPage from '@/pages/landing/landingpage';
import SecurityLayout from '@/layouts/SecurityLayout';
import DashboardPage from '@/pages/security/dashboard';
import CameraCheckinPage from '@/pages/security/camera-checkin';
import CheckoutRequestsPage from '@/pages/security/checkout-requests';
import VisitorsPage from '@/pages/security/visitors';
import { ManagerLayout } from '@/layouts/manager';
import { DashboardPage as ManagerDashboardPage } from '@/pages/manager/dashboard';
import { BedStatisticsPage } from '@/pages/manager/bed-statistics';
import { ViolationListPage } from '@/pages/manager/violations';
import { CreateViolationPage } from '@/pages/manager/violations/create';
import { AdminLayout } from '@/layouts/admin';
import AdminDashboardPage from '@/pages/admin/dashboard';
import NotFoundPage from '@/pages/not-found';

const ComingSoon = ({ label }: { label: string }) => (
  <div className="p-8 text-center text-gray-500">{label} - Coming Soon</div>
);

const router = createBrowserRouter([
  {
    path: ROUTES.LANDING,
    element: <LandingPage />,
  },
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
        path: 'security',
        element: <SecurityLayout />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: 'camera-checkin',
            element: <CameraCheckinPage />,
          },
          {
            path: 'checkout-requests',
            element: <CheckoutRequestsPage />,
          },
          {
            path: 'visitors',
            element: <VisitorsPage />,
          },
        ],
      },
    ],
  },
  // Admin Routes
  {
    path: ROUTES.ADMIN,
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <AdminDashboardPage />,
      },
      {
        path: 'facilities',
        element: <ComingSoon label="Facility Management" />,
      },
      {
        path: 'users',
        element: <ComingSoon label="User Management" />,
      },
      {
        path: 'reports',
        element: <ComingSoon label="Reports & Monitoring" />,
      },
      {
        path: 'data',
        element: <ComingSoon label="Data Management" />,
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
        element: <ManagerDashboardPage />,
      },
      {
        path: 'dorms',
        element: <ComingSoon label="Dorm List Page" />,
      },
      {
        path: 'blocks',
        element: <ComingSoon label="Block List Page" />,
      },
      {
        path: 'rooms',
        element: <ComingSoon label="Room List Page" />,
      },
      {
        path: 'beds',
        element: <ComingSoon label="Bed Management Page" />,
      },
      {
        path: 'beds/status',
        element: <ComingSoon label="Update Bed Status" />,
      },
      {
        path: 'beds/assignment',
        element: <ComingSoon label="Change Assignment" />,
      },
      {
        path: 'bookings',
        element: <ComingSoon label="Booking History Page" />,
      },
      {
        path: 'checkout',
        element: <ComingSoon label="Checkout Management" />,
      },
      {
        path: 'login-student',
        element: <ComingSoon label="Login as Student" />,
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
        element: <ComingSoon label="Facilities Management" />,
      },
      {
        path: 'requests',
        element: <ComingSoon label="Request List" />,
      },
      {
        path: 'electricity',
        element: <ComingSoon label="Electricity Management" />,
      },
      {
        path: 'electricity/import',
        element: <ComingSoon label="Import Electricity Data" />,
      },
      {
        path: 'electricity/create',
        element: <ComingSoon label="Create Electricity Record" />,
      },
      {
        path: 'invoices',
        element: <ComingSoon label="Invoice List" />,
      },
      {
        path: 'news',
        element: <ComingSoon label="News Management" />,
      },
      {
        path: 'chat',
        element: <ComingSoon label="Chat with Students" />,
      },
      {
        path: 'email',
        element: <ComingSoon label="Send Email" />,
      },
      {
        path: 'notifications',
        element: <ComingSoon label="Notifications" />,
      },
      {
        path: 'config',
        element: <ComingSoon label="Data Configuration" />,
      },
      {
        path: 'settings',
        element: <ComingSoon label="Settings" />,
      },
      {
        path: 'bed-statistics',
        element: <BedStatisticsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
export default router;
