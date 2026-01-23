import { ROUTES } from '@/constants';

import { createBrowserRouter } from 'react-router-dom';

import SignInPage from '@/pages/signin';
import { AppProvider } from '@/contexts';
// import { PrivateLayout } from '@/layouts';
import SignUpPage from '@/pages/signup';

const router = createBrowserRouter([
  {
    path: '/*',
    element: <div></div>,
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
    // loader: getUserProfile, // tạm thời tắt để không bị lỗi khi chưa có backend
    children: [
      {
        // element: <PrivateLayout />,
        children: [
          {
            index: true,
            path: ROUTES.DASHBOARD,
            element: <SignInPage />,
            // element: <DashboardPage />,
          },
        ],
      },
    ],
  },
]);
export default router;
