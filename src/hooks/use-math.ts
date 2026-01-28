import { useQuery } from '@tanstack/react-query';
import { homeworkClient } from '@/api/client';
import type { MathHomework, MathPreviewParams, MathStats, MathProblemWithStats, PaginatedResponse, ApiResponse } from '@/types/homework';

const API_BASE = '';  // Base URL is set in homeworkClient

// Query keys
export const mathKeys = {
  all: ['math'] as const,
  preview: (params?: MathPreviewParams) => [...mathKeys.all, 'preview', params] as const,
  stats: () => [...mathKeys.all, 'stats'] as const,
  problems: (params?: MathProblemsParams) => [...mathKeys.all, 'problems', params] as const,
};

// 数学题库列表参数
export interface MathProblemsParams {
  operation?: 'add' | 'subtract' | 'mixed';
  has_wrong?: boolean;
  sort_by?: 'wrong_count' | 'occurrence_count' | 'last_used_date';
  sort_desc?: boolean;
  page?: number;
  page_size?: number;
}

// 获取数学题预览
export function useMathPreview(params?: MathPreviewParams) {
  return useQuery({
    queryKey: mathKeys.preview(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.count) searchParams.append('count', String(params.count));
      if (params?.operation) searchParams.append('operation', params.operation);
      if (params?.max_number) searchParams.append('max_number', String(params.max_number));
      if (params?.allow_carry !== undefined) searchParams.append('allow_carry', String(params.allow_carry));

      const url = `${API_BASE}/api/v1/math/preview${searchParams.toString() ? `?${searchParams}` : ''}`;
      const { data } = await homeworkClient.get<ApiResponse<MathHomework>>(url);
      return data.data;
    },
    staleTime: 0, // 每次都重新获取，因为是随机生成的
  });
}

// 获取数学题库统计
export function useMathStats() {
  return useQuery({
    queryKey: mathKeys.stats(),
    queryFn: async () => {
      const { data } = await homeworkClient.get<ApiResponse<MathStats>>(
        `${API_BASE}/api/v1/math/stats`
      );
      return data.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

// 获取数学题库列表
export function useMathProblems(params?: MathProblemsParams) {
  return useQuery({
    queryKey: mathKeys.problems(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.operation) searchParams.append('operation', params.operation);
      if (params?.has_wrong !== undefined) searchParams.append('has_wrong', String(params.has_wrong));
      if (params?.sort_by) searchParams.append('sort_by', params.sort_by);
      if (params?.sort_desc !== undefined) searchParams.append('sort_desc', String(params.sort_desc));
      if (params?.page) searchParams.append('page', String(params.page));
      if (params?.page_size) searchParams.append('page_size', String(params.page_size));

      const url = `${API_BASE}/api/v1/math/problems${searchParams.toString() ? `?${searchParams}` : ''}`;
      const { data } = await homeworkClient.get<PaginatedResponse<MathProblemWithStats>>(url);
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}
