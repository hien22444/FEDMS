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
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) {
                        return undefined;
                    }
                    if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                        return 'react-vendor';
                    }
                    if (id.includes('antd')) {
                        return 'antd-vendor';
                    }
                    if (id.includes('recharts')) {
                        return 'charts-vendor';
                    }
                    if (id.includes('framer-motion')) {
                        return 'motion-vendor';
                    }
                    if (id.includes('socket.io-client')) {
                        return 'socket-vendor';
                    }
                    return 'vendor';
                },
            },
        },
    },
});
