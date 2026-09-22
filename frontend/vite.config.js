import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // Required for Docker port forwarding
    port: 5173,
    watch: {
      usePolling: true,
    },
    proxy: {
      // Forward /api/* to the backend container
      '/api': {
        target: process.env.VITE_BACKEND_TARGET || 'http://backend:5001',
        changeOrigin: true,
      },
      // Forward /uploads/* to the backend container
      '/uploads': {
        target: process.env.VITE_BACKEND_TARGET || 'http://backend:5001',
        changeOrigin: true,
      },
    },
  },
});
