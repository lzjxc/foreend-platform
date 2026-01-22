import { useQuery } from '@tanstack/react-query';
import type { AIReport, ReportsQueryParams } from '@/types/ai-report';

// API base URL - use proxy in development
const AI_WEEKLY_API_URL = import.meta.env.DEV
  ? '/ai-weekly-api'
  : (import.meta.env.VITE_AI_WEEKLY_URL || 'http://ai-weekly-api.tail2984bd.ts.net');

// Query key factory for AI reports
export const aiReportKeys = {
  all: ['ai-reports'] as const,
  lists: () => [...aiReportKeys.all, 'list'] as const,
  list: (params: ReportsQueryParams) => [...aiReportKeys.lists(), params] as const,
  details: () => [...aiReportKeys.all, 'detail'] as const,
  detail: (id: string) => [...aiReportKeys.details(), id] as const,
  latest: (type: 'daily' | 'weekly') => [...aiReportKeys.all, 'latest', type] as const,
};

// API functions
const aiReportsApi = {
  getList: async (params: ReportsQueryParams = {}): Promise<AIReport[]> => {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.type) searchParams.set('type', params.type);

    const response = await fetch(
      `${AI_WEEKLY_API_URL}/api/v1/reports?${searchParams.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch reports: ${response.status}`);
    }

    const data = await response.json();
    // API returns { reports: [...], total: n }
    return data.reports || data;
  },

  getById: async (id: string): Promise<AIReport> => {
    const response = await fetch(`${AI_WEEKLY_API_URL}/api/v1/reports/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch report: ${response.status}`);
    }

    return response.json();
  },

  getLatest: async (type: 'daily' | 'weekly'): Promise<AIReport | null> => {
    const response = await fetch(`${AI_WEEKLY_API_URL}/api/v1/reports/latest/${type}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch latest ${type} report: ${response.status}`);
    }

    return response.json();
  },
};

// Hooks

/**
 * Fetch list of AI reports with optional filtering
 */
export function useAIReports(params: ReportsQueryParams = {}) {
  return useQuery({
    queryKey: aiReportKeys.list(params),
    queryFn: () => aiReportsApi.getList(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch a single AI report by ID
 */
export function useAIReport(id: string) {
  return useQuery({
    queryKey: aiReportKeys.detail(id),
    queryFn: () => aiReportsApi.getById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes - report content doesn't change
  });
}

/**
 * Fetch the latest report of a given type
 */
export function useLatestAIReport(type: 'daily' | 'weekly') {
  return useQuery({
    queryKey: aiReportKeys.latest(type),
    queryFn: () => aiReportsApi.getLatest(type),
    staleTime: 5 * 60 * 1000,
  });
}
