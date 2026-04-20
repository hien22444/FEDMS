import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svgr({
      include: '**/*.svg',
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@public': path.resolve(__dirname, 'public'),
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined;
          }

          // Normalize path separators for cross-platform matching
          const p = id.replace(/\\/g, '/');

          // React core ONLY — strict path matching to avoid catching
          // @tanstack/react-query, mobx-react-lite, react-hot-toast, etc.
          if (
            p.includes('/node_modules/react/') ||
            p.includes('/node_modules/react-dom/') ||
            p.includes('/node_modules/react-router/') ||
            p.includes('/node_modules/react-router-dom/') ||
            p.includes('/node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }

          if (p.includes('/node_modules/antd/') || p.includes('/node_modules/@ant-design/')) {
            return 'antd-vendor';
          }

          if (p.includes('/node_modules/recharts/') || p.includes('/node_modules/d3-')) {
            return 'charts-vendor';
          }

          if (p.includes('/node_modules/framer-motion/')) {
            return 'motion-vendor';
          }

          if (
            p.includes('/node_modules/socket.io-client/') ||
            p.includes('/node_modules/engine.io-client/') ||
            p.includes('/node_modules/socket.io-parser/')
          ) {
            return 'socket-vendor';
          }

          if (p.includes('/node_modules/@tiptap/') || p.includes('/node_modules/prosemirror-')) {
            return 'tiptap-vendor';
          }

          if (p.includes('/node_modules/mobx/') || p.includes('/node_modules/mobx-react')) {
            return 'mobx-vendor';
          }

          if (p.includes('/node_modules/@tanstack/')) {
            return 'query-vendor';
          }

          if (p.includes('/node_modules/dayjs/') || p.includes('/node_modules/date-fns/')) {
            return 'date-vendor';
          }

          if (p.includes('/node_modules/exceljs/')) {
            return 'excel-vendor';
          }

          if (
            p.includes('/node_modules/react-markdown/') ||
            p.includes('/node_modules/rehype-') ||
            p.includes('/node_modules/remark-') ||
            p.includes('/node_modules/micromark') ||
            p.includes('/node_modules/mdast-') ||
            p.includes('/node_modules/hast-')
          ) {
            return 'markdown-vendor';
          }

          return 'vendor';
        },
      },
    },
  },
});
