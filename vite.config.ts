import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react-dom') || id.includes('react-router') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            // Charts - largest dependency
            if (id.includes('recharts') || id.includes('d3-') || id.includes('@xyflow')) {
              return 'vendor-charts';
            }
            // Radix UI components
            if (id.includes('@radix-ui')) {
              return 'vendor-ui';
            }
            // Data management
            if (id.includes('@tanstack') || id.includes('zustand') || id.includes('axios')) {
              return 'vendor-data';
            }
            // Icons
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Proxy Homework API for homework assistant
      '/homework-api': {
        target: 'http://homework-api.tail2984bd.ts.net',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/homework-api/, ''),
      },
      // Proxy file-gateway API to avoid CORS issues
      '/file-api': {
        target: 'http://file-gateway.tail2984bd.ts.net',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/file-api/, ''),
      },
      // Proxy LM Studio API to avoid CORS issues
      '/lm-studio-api': {
        target: 'http://192.168.1.218:1234',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/lm-studio-api/, ''),
      },
      // Proxy AI Weekly API for news feed
      '/ai-weekly-api': {
        target: 'http://ai-weekly-api.tail2984bd.ts.net',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ai-weekly-api/, ''),
      },
      // Proxy Config Service for service catalog
      '/config-api': {
        target: 'http://config-service.tail2984bd.ts.net',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/config-api/, ''),
      },
      // Proxy Data Fetcher for news data
      '/data-fetcher-api': {
        target: 'http://data-fetcher.tail2984bd.ts.net',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/data-fetcher-api/, ''),
      },
      // Proxy Personal Info API for form filling
      '/personal-api': {
        target: 'http://personal-info.tail2984bd.ts.net:8000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/personal-api/, ''),
      },
      // Proxy Notification Service for health checks
      '/notification-api': {
        target: 'http://notification.tail2984bd.ts.net',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/notification-api/, ''),
      },
      // Proxy PDF Service for health checks
      '/pdf-api': {
        target: 'http://pdf-service.tail2984bd.ts.net',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/pdf-api/, ''),
      },
    },
  },
});
