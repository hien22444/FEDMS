import { Suspense, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './routers';
import { configure } from 'mobx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider, Spin } from 'antd';
import theme from '@/themes/themeConfig';

configure({
  enforceActions: 'always',
});

function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  return (
    <ConfigProvider theme={theme}>
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <Suspense
            fallback={
              <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <Spin size="large" tip="Loading..." />
              </div>
            }
          >
            <RouterProvider
              router={router}
              // fallbackElement={<SplashScreen />}
            />
          </Suspense>
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
