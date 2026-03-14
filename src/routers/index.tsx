import { ROUTES } from '@/constants';

import { createBrowserRouter } from 'react-router-dom';

// Auth pages
import SignInPage from '@/pages/signin';
import SignUpPage from '@/pages/signup';
import GoogleCallbackPage from '@/pages/auth/google-callback';
import LandingPage from '@/pages/landing/landingpage';
import NotFoundPage from '@/pages/not-found';
import AdminLoginPage from '@/pages/admin/login';

// Layouts
import StudentLayout from '@/layouts/StudentLayout';
import AuthLayout from '@/layouts/AuthLayout';
import SecurityLayout from '@/layouts/SecurityLayout';
import { ManagerLayout } from '@/layouts/manager';
import PrivateRoute from '@/components/PrivateRoute';

// Security pages
import DashboardPage from '@/pages/security/dashboard';
import CameraCheckinPage from '@/pages/security/camera-checkin';
import CheckoutRequestsPage from '@/pages/security/checkout-requests';
import VisitorsPage from '@/pages/security/visitors';
import SecurityReportViolationPage from '@/pages/security/report-violation';

// Manager pages
import { DashboardPage as ManagerDashboardPage } from '@/pages/manager/dashboard';
import ManagerDormsPage from '@/pages/manager/dorm';
import ManagerBlocksPage from '@/pages/manager/blocks';
import ManagerNewsPage from '@/pages/manager/news';
import ManagerNewsDetailPage from '@/pages/manager/news/detail';
import { BedStatisticsPage } from '@/pages/manager/bed-statistics';
import { ViolationListPage } from '@/pages/manager/violations';
import { CreateViolationPage } from '@/pages/manager/violations/create';
import ManagerChatPage from '@/pages/manager/chat';
import ManagerNotificationsPage from '@/pages/manager/notifications';
import ManagerRoomsPage from '@/pages/manager/rooms';
import ManagerBedsPage from '@/pages/manager/beds';
import UpdateBedStatusPage from '@/pages/manager/beds/status';
import ChangeBedAssignmentPage from '@/pages/manager/beds/assignment';
import ManagerBookingsPage from '@/pages/manager/bookings';
import ManagerDateConfigPage from '@/pages/manager/config';

// Student pages
import StudentDashboard from '@/pages/student/dashboard';
import StudentChatPage from '@/pages/student/chat';
import NewsPage from '@/pages/student/news';
import StudentNewsDetailPage from '@/pages/student/news/detail';
import SchedulePage from '@/pages/student/schedule';
import BookingPage from '@/pages/student/booking';
import UtilitiesPage from '@/pages/student/utilities';
import PaymentPage from '@/pages/student/payment';
import RequestsPage from '@/pages/student/requests';
import CFDPage from '@/pages/student/cfd-points';
import GuidelinesPage from '@/pages/student/guidelines';
import MaintenancePage from '@/pages/student/maintenance';
import FAQPage from '@/pages/student/faq';
import NotificationsPage from '@/pages/student/notifications';
import DormRulesPage from '@/pages/student/dorm-rules';

// Admin
import { AdminLayout } from '@/layouts/admin';
import AdminDashboardPage from '@/pages/admin/dashboard';
import AdminDormsPage from '@/pages/admin/dorm';
import AdminBlocksPage from '@/pages/admin/blocks';
import AdminRoomsPage from '@/pages/admin/rooms';
import AdminRoomTypesPage from '@/pages/admin/room-types';
import AdminUsersPage from '@/pages/admin/users';
import AdminFacilitiesPage from '@/pages/admin/facilities';

const ComingSoon = ({ label }: { label: string }) => (
  <div className="p-8 text-center text-gray-500">{label} - Coming Soon</div>
);

const router = createBrowserRouter([
  // Landing page (public)
  {
    path: ROUTES.LANDING,
    element: <LandingPage />,
  },

  // All auth-aware routes (provides AuthContext via AuthLayout)
  {
    element: <AuthLayout />,
    children: [
      // Public auth routes (no PrivateRoute guard)
      {
        path: ROUTES.SIGN_IN,
        element: <SignInPage />,
      },
      {
        path: ROUTES.SIGN_UP,
        element: <SignUpPage />,
      },
      {
        path: ROUTES.GOOGLE_CALLBACK,
        element: <GoogleCallbackPage />,
      },
      {
        path: ROUTES.ADMIN_LOGIN,
        element: <AdminLoginPage />,
      },

      // Protected Student routes — only 'student' role
      {
        element: <PrivateRoute allowedRoles={['student']} />,
        children: [
          {
            element: <StudentLayout />,
            children: [
              {
                path: ROUTES.STUDENT_DASHBOARD,
                element: <StudentDashboard />,
              },
              {
                path: ROUTES.STUDENT_NEWS,
                element: <NewsPage />,
              },
              {
                path: `${ROUTES.STUDENT_NEWS}/:id`,
                element: <StudentNewsDetailPage />,
              },
              {
                path: ROUTES.STUDENT_SCHEDULE,
                element: <SchedulePage />,
              },
              {
                path: ROUTES.STUDENT_BOOKING,
                element: <BookingPage />,
              },
              {
                path: ROUTES.STUDENT_UTILITIES,
                element: <UtilitiesPage />,
              },
              {
                path: ROUTES.STUDENT_PAYMENT,
                element: <PaymentPage />,
              },
              {
                path: ROUTES.STUDENT_REQUESTS,
                element: <RequestsPage />,
              },
              {
                path: ROUTES.STUDENT_CFD_POINTS,
                element: <CFDPage />,
              },
              {
                path: ROUTES.STUDENT_GUIDELINES,
                element: <GuidelinesPage />,
              },
              {
                path: ROUTES.STUDENT_MAINTENANCE,
                element: <MaintenancePage />,
              },
              {
                path: ROUTES.STUDENT_FAQ,
                element: <FAQPage />,
              },
              {
                path: ROUTES.STUDENT_DORM_RULES,
                element: <DormRulesPage />,
              },
              {
                path: ROUTES.STUDENT_NOTIFICATIONS,
                element: <NotificationsPage />,
              },
              {
                path: ROUTES.STUDENT_CHAT,
                element: <StudentChatPage />,
              },
            ],
          },
        ],
      },

      // Protected Security routes — only 'security' role
      {
        element: <PrivateRoute allowedRoles={['security']} />,
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
              {
                path: 'report-violation',
                element: <SecurityReportViolationPage />,
              },
            ],
          },
        ],
      },

      // Protected Admin routes — only 'admin' role
      {
        element: <PrivateRoute allowedRoles={['admin']} />,
        children: [
          {
            path: ROUTES.ADMIN,
            element: <AdminLayout />,
            children: [
              {
                index: true,
                element: <AdminDashboardPage />,
              },
              {
                path: 'dorms',
                element: <AdminDormsPage />,
              },
              {
                path: 'blocks',
                element: <AdminBlocksPage />,
              },
              {
                path: 'rooms',
                element: <AdminRoomsPage />,
              },
              {
                path: 'room-types',
                element: <AdminRoomTypesPage />,
              },
              {
                path: 'users',
                element: <AdminUsersPage />,
              },
              {
                path: 'facilities',
                element: <AdminFacilitiesPage />,
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
        ],
      },

    ],
  },

  // Manager routes
  {
    element: <AuthLayout />,
    children: [
      {
        // element: <PrivateRoute allowedRoles={['manager']} />,
        element: <PrivateRoute allowedRoles={['manager']} />,
        children: [
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
                element: <ManagerDormsPage />,
              },
              {
                path: 'blocks',
                element: <ManagerBlocksPage />,
              },
              {
                path: 'rooms',
                element: <ManagerRoomsPage />,
              },
              {
                path: 'beds',
                element: <ManagerBedsPage />,
              },
              {
                path: 'beds/status',
                element: <UpdateBedStatusPage />,
              },
              {
                path: 'beds/assignment',
                element: <ChangeBedAssignmentPage />,
              },
              {
                path: 'bookings',
                element: <ManagerBookingsPage />,
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
                element: <AdminFacilitiesPage />,
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
                element: <ManagerNewsPage />,
              },
              {
                path: 'news/:id',
                element: <ManagerNewsDetailPage />,
              },
              {
                path: 'chat',
                element: <ManagerChatPage />,
              },
              {
                path: 'email',
                element: <ComingSoon label="Send Email" />,
              },
              {
                path: 'notifications',
                element: <ManagerNotificationsPage />,
              },
              {
                path: 'config',
                element: <ManagerDateConfigPage />,
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
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
export default router;
