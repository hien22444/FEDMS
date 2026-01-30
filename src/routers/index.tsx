import { ROUTES } from '@/constants';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Auth pages
import SignInPage from '@/pages/signin';
import SignUpPage from '@/pages/signup';
import GoogleCallbackPage from '@/pages/auth/google-callback';

// Layouts
import { StudentLayout, AuthLayout } from '@/layouts';
import PrivateRoute from '@/components/PrivateRoute';

// Student pages
import StudentDashboard from '@/pages/student/dashboard';
import NewsPage from '@/pages/student/news';
import SchedulePage from '@/pages/student/schedule';
import BookingPage from '@/pages/student/booking';
import UtilitiesPage from '@/pages/student/utilities';
import PaymentPage from '@/pages/student/payment';
import RequestsPage from '@/pages/student/requests';
import MaintenancePage from '@/pages/student/maintenance';
import CFDPage from '@/pages/student/cfd-points';
import GuidelinesPage from '@/pages/student/guidelines';
import FAQPage from '@/pages/student/faq';
import NotificationsPage from '@/pages/student/notifications';
import DormRulesPage from '@/pages/student/dorm-rules';

const router = createBrowserRouter([
  // Root route - AuthLayout provides AuthContext to all children
  {
    element: <AuthLayout />,
    children: [
      // Public routes - accessible without authentication
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
        path: '/',
        element: <Navigate to={ROUTES.SIGN_IN} replace />,
      },

      // Protected routes - require authentication
      {
        element: <PrivateRoute allowedRoles={['student']} />,
        children: [
          // Student routes with StudentLayout
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
                path: ROUTES.STUDENT_MAINTENANCE,
                element: <MaintenancePage />,
              },
              {
                path: '/student/cfd-points',
                element: <CFDPage />,
              },
              {
                path: '/student/guidelines',
                element: <GuidelinesPage />,
              },
              {
                path: '/student/faq',
                element: <FAQPage />,
              },
              {
                path: '/student/dorm-rules',
                element: <DormRulesPage />,
              },
              {
                path: '/student/notifications',
                element: <NotificationsPage />,
              },
            ],
          },
        ],
      },
    ],
  },

  // Catch all - redirect to signin
  {
    path: '*',
    element: <Navigate to={ROUTES.SIGN_IN} replace />,
  },
]);

export default router;
