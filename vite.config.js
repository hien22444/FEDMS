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
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) {
                        return undefined;
                    }
                    // Normalize path separators for cross-platform matching
                    const p = id.replace(/\\/g, '/');
                    // React core + anything deeply coupled to React's module identity.
                    // Keep mobx-react-lite, react-hot-toast, @tanstack/react-query here
                    // so they share the SAME React module instance (avoids hook errors
                    // from duplicate React copies across chunks).
                    if (p.includes('/node_modules/react/') ||
                        p.includes('/node_modules/react-dom/') ||
                        p.includes('/node_modules/react-router/') ||
                        p.includes('/node_modules/react-router-dom/') ||
                        p.includes('/node_modules/scheduler/') ||
                        p.includes('/node_modules/react-is/') ||
                        p.includes('/node_modules/mobx-react') ||
                        p.includes('/node_modules/react-hot-toast/') ||
                        p.includes('/node_modules/@tanstack/') ||
                        p.includes('/node_modules/react-hook-form/') ||
                        p.includes('/node_modules/react-markdown/') ||
                        p.includes('/node_modules/react-infinite-scroll-component/') ||
                        p.includes('/node_modules/react-icons/')) {
                        return 'react-vendor';
                    }
                    // Keep antd together with ALL its internal rc-* deps to avoid
                    // cross-chunk circular init issues.
                    if (p.includes('/node_modules/antd/') ||
                        p.includes('/node_modules/antd-img-crop/') ||
                        p.includes('/node_modules/@ant-design/') ||
                        p.includes('/node_modules/rc-') ||
                        p.includes('/node_modules/@rc-component/')) {
                        return 'antd-vendor';
                    }
                    if (p.includes('/node_modules/recharts/') || p.includes('/node_modules/d3-')) {
                        return 'charts-vendor';
                    }
                    if (p.includes('/node_modules/framer-motion/')) {
                        return 'motion-vendor';
                    }
                    if (p.includes('/node_modules/socket.io-client/') ||
                        p.includes('/node_modules/engine.io-client/') ||
                        p.includes('/node_modules/socket.io-parser/')) {
                        return 'socket-vendor';
                    }
                    if (p.includes('/node_modules/@tiptap/') || p.includes('/node_modules/prosemirror-')) {
                        return 'tiptap-vendor';
                    }
                    if (p.includes('/node_modules/exceljs/')) {
                        return 'excel-vendor';
                    }
                    return 'vendor';
                },
            },
        },
    },
});
