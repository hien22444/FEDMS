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
    // Large vendor chunks are acceptable; route-level code splitting via
    // React.lazy() handles the real optimization. Custom manualChunks was
    // causing cross-chunk TDZ / circular-init errors in production.
    chunkSizeWarningLimit: 2000,
  },
});
