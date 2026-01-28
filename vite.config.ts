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
        target: 'http://192.168.1.191:30485',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/homework-api/, ''),
      },
      // Proxy file-gateway API to avoid CORS issues
      '/file-api': {
        target: 'http://192.168.1.191:31253',
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
        target: 'http://192.168.1.191:32615',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ai-weekly-api/, ''),
      },
      // Proxy Config Service for service catalog
      '/config-api': {
        target: 'http://192.168.1.191:32683',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/config-api/, ''),
      },
      // Proxy Data Fetcher for news data
      '/data-fetcher-api': {
        target: 'http://192.168.1.191:30254',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/data-fetcher-api/, ''),
      },
      // Proxy Personal Info API for form filling
      '/personal-api': {
        target: 'http://192.168.1.191:32284',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/personal-api/, ''),
      },
      // Proxy Notification Service for health checks
      '/notification-api': {
        target: 'http://192.168.1.191:31417',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/notification-api/, ''),
      },
      // Proxy PDF Service for health checks
      '/pdf-api': {
        target: 'http://192.168.1.191:30661',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/pdf-api/, ''),
      },
      // Proxy LLM Gateway (LiteLLM) for health checks
      '/llm-gateway': {
        target: 'http://192.168.1.191:30773',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/llm-gateway/, ''),
      },
      // Proxy LLM Gateway API (wrapper service with usage breakdown)
      '/llm-gateway-api': {
        target: 'http://192.168.1.191:31993',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/llm-gateway-api/, ''),
      },
      // Proxy Wordbook API
      '/wordbook-api': {
        target: 'http://192.168.1.191:30791',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/wordbook-api/, ''),
      },
      // Proxy MinIO S3 for PDF downloads
      '/minio-s3': {
        target: 'https://192.168.1.191:32311',
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/minio-s3/, ''),
      },
      // Proxy Finance Service for financial tracking
      '/finance-api': {
        target: 'http://192.168.1.191:31426',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/finance-api/, ''),
      },
      // Proxy Efficiency Evaluator API
      '/efficiency-api': {
        target: 'http://192.168.1.191:30719',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/efficiency-api/, ''),
      },
      // Proxy Doc Service API
      '/doc-api': {
        target: 'http://192.168.1.191:30087',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/doc-api/, ''),
      },
    },
  },
});
