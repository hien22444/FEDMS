// import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/global.css';

import App from '@/App';
import { App as AntApp, ConfigProvider } from 'antd';
import theme from '@/themes/themeConfig';
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  <ConfigProvider theme={theme}>
    <AntApp>
      <Toaster position='top-right' />
      <App />
    </AntApp>
  </ConfigProvider>,
  // </StrictMode>,
);
