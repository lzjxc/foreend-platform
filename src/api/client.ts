import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Base URLs - use nginx proxy in production, Vite proxy in development
const API_URL = import.meta.env.DEV
  ? '/personal-api'  // Vite proxy
  : '/personal-api'; // nginx proxy
// LLM Gateway API (for batch tasks, usage stats) - different from LiteLLM
const LLM_GATEWAY_URL = import.meta.env.DEV
  ? '/llm-gateway-api'  // Vite proxy to llm-gateway service
  : '/llm-gateway-api'; // nginx proxy to llm-gateway service
const FILE_GATEWAY_URL = import.meta.env.DEV
  ? '/file-api'       // Vite proxy
  : '/file-api';      // nginx proxy

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

// Homework API client - use proxy
const HOMEWORK_API_URL = '/homework-api';  // Both dev (Vite) and prod (nginx)
export const homeworkClient = createApiClient(HOMEWORK_API_URL);

// Wordbook API client - use proxy
const WORDBOOK_API_URL = '/wordbook-api';  // Both dev (Vite) and prod (nginx)
export const wordbookClient = createApiClient(WORDBOOK_API_URL);

// Data Fetcher API client - use proxy
const DATA_FETCHER_URL = '/data-fetcher-api';  // Both dev (Vite) and prod (nginx)
export const dataFetcherClient = createApiClient(DATA_FETCHER_URL);

// Finance API client - use proxy
const FINANCE_API_URL = '/finance-api';  // Both dev (Vite) and prod (nginx)
export const financeClient = createApiClient(FINANCE_API_URL);

// Efficiency Evaluator API client - use proxy
const EFFICIENCY_API_URL = '/efficiency-api';  // Both dev (Vite) and prod (nginx)
export const efficiencyClient = createApiClient(EFFICIENCY_API_URL);

// Doc Service API client - use proxy
const DOC_SERVICE_URL = '/doc-api';  // Both dev (Vite) and prod (nginx)
export const docClient = createApiClient(DOC_SERVICE_URL);

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
