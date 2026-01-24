// import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/global.css';

import App from '@/App';
import { ConfigProvider } from 'antd';
import theme from '@/themes/themeConfig';
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')).render(
  // <StrictMode>
  <ConfigProvider theme={theme}>
    <Toaster position='top-right' />
    <App />
  </ConfigProvider>,
  // </StrictMode>,
);
