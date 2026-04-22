/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { ROUTES } from '@/constants';
import PrivateRoute from '@/components/PrivateRoute';
import { SecurityAdminAccessProvider } from '@/contexts';

// Layouts
import StudentLayout from '@/layouts/StudentLayout';
import AuthLayout from '@/layouts/AuthLayout';
import SecurityLayout from '@/layouts/SecurityLayout';
import { ManagerLayout } from '@/layouts/manager';
import { AdminLayout } from '@/layouts/admin';

// Auth pages
const SignInPage = lazy(() => import('@/pages/signin'));
const SignUpPage = lazy(() => import('@/pages/signup'));
const GoogleCallbackPage = lazy(() => import('@/pages/auth/google-callback'));
const LandingPage = lazy(() => import('@/pages/landing/landingpage'));
const AboutUsPage = lazy(() => import('@/pages/about-us'));
const NotFoundPage = lazy(() => import('@/pages/not-found'));
const AdminLoginPage = lazy(() => import('@/pages/admin/login'));

// Security pages
const DashboardPage = lazy(() => import('@/pages/security/dashboard'));
const CameraManagementPage = lazy(() => import('@/pages/security/camera-management'));
const CheckoutRequestsPage = lazy(() => import('@/pages/security/checkout-requests'));
const VisitorsPage = lazy(() => import('@/pages/security/visitors'));
const SecurityReportViolationPage = lazy(() => import('@/pages/security/report-violation'));
const SecurityReportsPage = lazy(() => import('@/pages/security/reports'));

// Manager pages
const ManagerDashboardPage = lazy(() =>
  import('@/pages/manager/dashboard').then((module) => ({ default: module.DashboardPage })),
);
const ManagerDormsPage = lazy(() => import('@/pages/manager/dorm'));
const ManagerBlocksPage = lazy(() => import('@/pages/manager/blocks'));
const ManagerNewsPage = lazy(() => import('@/pages/manager/news'));
const ManagerNewsDetailPage = lazy(() => import('@/pages/manager/news/detail'));
const BedStatisticsPage = lazy(() =>
  import('@/pages/manager/bed-statistics').then((module) => ({ default: module.BedStatisticsPage })),
);
const ViolationListPage = lazy(() =>
  import('@/pages/manager/violations').then((module) => ({ default: module.ViolationListPage })),
);
const CreateViolationPage = lazy(() =>
  import('@/pages/manager/violations/create').then((module) => ({
    default: module.CreateViolationPage,
  })),
);
const ManagerChatPage = lazy(() => import('@/pages/manager/chat'));
const ManagerEmailCenterPage = lazy(() => import('@/pages/manager/email'));
const ManagerNotificationsPage = lazy(() => import('@/pages/manager/notifications'));
const ManagerRoomsPage = lazy(() => import('@/pages/manager/rooms'));
const ManagerBedsPage = lazy(() => import('@/pages/manager/beds'));
const UpdateBedStatusPage = lazy(() => import('@/pages/manager/beds/status'));
const ChangeBedAssignmentPage = lazy(() => import('@/pages/manager/beds/assignment'));
const ManagerBookingsPage = lazy(() => import('@/pages/manager/bookings'));
const ManagerRequestsPage = lazy(() => import('@/pages/manager/requests'));
const FaceRegistrationPage = lazy(() => import('@/pages/manager/face-registration'));
const LoginAsStudentPage = lazy(() => import('@/pages/manager/login-student'));
const ElectricityPage = lazy(() => import('@/pages/manager/electricity'));
const ManagerCheckoutPage = lazy(() => import('@/pages/manager/checkout'));
const ManagerStudentsCfdRiskPage = lazy(() => import('@/pages/manager/students-cfd-risk'));
const ManagerDateConfigPage = lazy(() => import('@/pages/manager/config'));
const ManagerInvoicesPage = lazy(() => import('@/pages/manager/invoices'));

// Student pages
const StudentDashboard = lazy(() => import('@/pages/student/dashboard'));
const StudentChatPage = lazy(() => import('@/pages/student/chat'));
const NewsPage = lazy(() => import('@/pages/student/news'));
const StudentNewsDetailPage = lazy(() => import('@/pages/student/news/detail'));
const SchedulePage = lazy(() => import('@/pages/student/schedule'));
const BookingPage = lazy(() => import('@/pages/student/booking'));
const UtilitiesPage = lazy(() => import('@/pages/student/utilities'));
const PaymentPage = lazy(() => import('@/pages/student/payment'));
const RequestsPage = lazy(() => import('@/pages/student/requests'));
const CFDPage = lazy(() => import('@/pages/student/cfd-points'));
const DormRulesPage = lazy(() => import('@/pages/student/dorm-rules'));
const GuidelinesPage = lazy(() => import('@/pages/student/guidelines'));
const MaintenancePage = lazy(() => import('@/pages/student/maintenance'));
const FAQPage = lazy(() => import('@/pages/student/faq'));
const NotificationsPage = lazy(() => import('@/pages/student/notifications'));

// Admin pages
const AdminDashboardPage = lazy(() => import('@/pages/admin/dashboard'));
const AdminDormsPage = lazy(() => import('@/pages/admin/dorm'));
const AdminBlocksPage = lazy(() => import('@/pages/admin/blocks'));
const AdminRoomsPage = lazy(() => import('@/pages/admin/rooms'));
const AdminRoomTypesPage = lazy(() => import('@/pages/admin/room-types'));
const AdminUsersPage = lazy(() => import('@/pages/admin/users'));
const AdminFacilitiesPage = lazy(() => import('@/pages/admin/facilities'));
const AdminDormRulesPage = lazy(() => import('@/pages/admin/dorm-rules'));

const ComingSoon = ({ label }: { label: string }) => (
  <div className="p-8 text-center text-gray-500">{label} - Coming Soon</div>
);

const router = createBrowserRouter([
  {
    path: ROUTES.LANDING,
    element: <LandingPage />,
  },
  {
    path: ROUTES.ABOUT_US,
    element: <AboutUsPage />,
  },
  {
    element: <AuthLayout />,
    children: [
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
                path: ROUTES.STUDENT_BED_TRANSFER,
                element: <Navigate to={`${ROUTES.STUDENT_REQUESTS}?tab=bed-transfer`} replace />,
              },
              {
                path: ROUTES.STUDENT_CFD_POINTS,
                element: <CFDPage />,
              },
              {
                path: ROUTES.STUDENT_DORM_RULES,
                element: <DormRulesPage />,
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
      {
        element: <PrivateRoute allowedRoles={['security', 'admin']} />,
        children: [
          {
            path: 'security',
            element: (
              <SecurityAdminAccessProvider>
                <SecurityLayout />
              </SecurityAdminAccessProvider>
            ),
            children: [
              {
                index: true,
                element: <DashboardPage />,
              },
              {
                path: 'camera-management',
                element: <CameraManagementPage />,
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
              {
                path: 'reports',
                element: <SecurityReportsPage />,
              },
            ],
          },
        ],
      },
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
                path: 'dorm-rules',
                element: <AdminDormRulesPage />,
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
  {
    element: <AuthLayout />,
    children: [
      {
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
                path: 'face-registration',
                element: <FaceRegistrationPage />,
              },
              {
                path: 'checkout',
                element: <ManagerCheckoutPage />,
              },
              {
                path: 'students-cfd-risk',
                element: <ManagerStudentsCfdRiskPage />,
              },
              {
                path: 'login-student',
                element: <LoginAsStudentPage />,
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
                element: <ManagerRequestsPage />,
              },
              {
                path: 'electricity',
                element: <ElectricityPage />,
              },
              {
                path: 'invoices',
                element: <ManagerInvoicesPage />,
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
                element: <ManagerEmailCenterPage />,
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
