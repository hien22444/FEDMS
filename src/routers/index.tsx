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
        element: <SecurityLayout />,
        children: [
          {
            path: ROUTES.DASHBOARD,
            element: <DashboardPage />,
          },
          {
            path: ROUTES.CAMERA_CHECKIN,
            element: <CameraCheckinPage />,
          },
          {
            path: ROUTES.CHECKOUT_REQUESTS,
            element: <CheckoutRequestsPage />,
          },
          {
            path: ROUTES.VISITORS,
            element: <VisitorsPage />,
          },
        ],
      },
    ],
  },
  {
    path: '/*',
    element: <div></div>,
  },
]);
export default router;
