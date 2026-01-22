import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Base URLs - use nginx proxy in production, Tailscale URLs in development
const API_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_API_URL || 'http://personal-info.tail2984bd.ts.net')
  : '';  // Empty string means relative URLs, proxied through nginx
const LLM_GATEWAY_URL = import.meta.env.VITE_LLM_GATEWAY_URL || 'http://llm-gateway.tail2984bd.ts.net';
const FILE_GATEWAY_URL = import.meta.env.VITE_FILE_GATEWAY_URL || 'http://file-gateway.tail2984bd.ts.net';

// Service authentication
const SERVICE_ID = import.meta.env.VITE_SERVICE_ID || 'personal-info-frontend';
const SERVICE_TOKEN = import.meta.env.VITE_SERVICE_TOKEN || '';

// Error response type
interface ApiErrorResponse {
  message?: string;
  detail?: string;
  error?: string;
}

// Create axios instance with default config
function createApiClient(baseURL: string, useToken: boolean = false): AxiosInstance {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Service-ID': SERVICE_ID,
  };

  // Add token for personal-info API
  if (useToken && SERVICE_TOKEN) {
    headers['X-Service-Token'] = SERVICE_TOKEN;
  }

  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers,
  });

  // Request interceptor
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Ensure headers are always present
      if (config.headers) {
        config.headers['X-Service-ID'] = SERVICE_ID;
        if (useToken && SERVICE_TOKEN) {
          config.headers['X-Service-Token'] = SERVICE_TOKEN;
        }
      }
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorResponse>) => {
      // Extract error message
      let message = 'An unexpected error occurred';

      if (error.response) {
        const data = error.response.data;
        message = data?.message || data?.detail || data?.error || `Error: ${error.response.status}`;

        // Handle specific status codes
        switch (error.response.status) {
          case 401:
            message = 'Unauthorized - Please check your credentials';
            break;
          case 403:
            message = 'Forbidden - You do not have permission';
            break;
          case 404:
            message = 'Resource not found';
            break;
          case 500:
            message = 'Server error - Please try again later';
            break;
        }
      } else if (error.request) {
        message = 'Network error - Unable to reach server';
      }

      // Log error for debugging
      console.error('[API Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message,
      });

      return Promise.reject(new Error(message));
    }
  );

  return client;
}

// Main API client for personal-info backend (with token)
export const apiClient = createApiClient(API_URL, true);

// LLM Gateway client
export const llmClient = createApiClient(LLM_GATEWAY_URL);

// File Gateway client
export const fileClient = createApiClient(FILE_GATEWAY_URL);

// Homework API client - call directly (Vite proxy not working for this endpoint)
const HOMEWORK_API_URL = import.meta.env.DEV
  ? 'http://homework-api.tail2984bd.ts.net'
  : '/homework-api';  // In production, use nginx proxy
export const homeworkClient = createApiClient(HOMEWORK_API_URL);

// Wordbook API client - call directly
const WORDBOOK_API_URL = import.meta.env.DEV
  ? 'http://wordbook-core-api.tail2984bd.ts.net'
  : '/wordbook-api';  // In production, use nginx proxy
export const wordbookClient = createApiClient(WORDBOOK_API_URL);

// Helper function to handle API responses
export async function handleApiResponse<T>(promise: Promise<{ data: T }>): Promise<T> {
  const response = await promise;
  return response.data;
}

// Export base URLs for direct use if needed
export const API_ENDPOINTS = {
  API_URL,
  LLM_GATEWAY_URL,
  FILE_GATEWAY_URL,
};

export default apiClient;
