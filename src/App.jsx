import { RouterProvider } from 'react-router-dom';
import router from './routers';
import { configure } from 'mobx';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
// import { SplashScreen } from '@/components';

configure({
  enforceActions: 'always',
});

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  });
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <RouterProvider
          router={router}
          // fallbackElement={<SplashScreen />}
        />
      </QueryClientProvider>
    </>
  );
}

export default App;
