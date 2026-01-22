import { useQuery } from '@tanstack/react-query';
import { homeworkClient } from '@/api/client';
import type { ChineseChar, ChineseStats, ApiResponse } from '@/types/homework';

const API_BASE = '';  // Base URL is set in homeworkClient

// Query keys
export const chineseKeys = {
  all: ['chinese'] as const,
  chars: (params?: { source?: string; difficulty?: number }) =>
    [...chineseKeys.all, 'chars', params] as const,
  charDetail: (id: number) => [...chineseKeys.all, 'char', id] as const,
  stats: () => [...chineseKeys.all, 'stats'] as const,
};

// 字库筛选参数
export interface ChineseCharsParams {
  source?: string;
  difficulty?: number;
}

// 获取字库列表
export function useChineseChars(params?: ChineseCharsParams) {
  return useQuery({
    queryKey: chineseKeys.chars(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.source) searchParams.append('source', params.source);
      if (params?.difficulty) searchParams.append('difficulty', String(params.difficulty));

      const url = `${API_BASE}/api/v1/chinese/chars${searchParams.toString() ? `?${searchParams}` : ''}`;
      const { data } = await homeworkClient.get<ApiResponse<ChineseChar[]>>(url);
      return data.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - 字库不常变化
  });
}

// 获取单个汉字详情
export function useChineseChar(id: number) {
  return useQuery({
    queryKey: chineseKeys.charDetail(id),
    queryFn: async () => {
      const { data } = await homeworkClient.get<ApiResponse<ChineseChar>>(
        `${API_BASE}/api/v1/chinese/chars/${id}`
      );
      return data.data;
    },
    enabled: !!id,
  });
}

// 获取字库统计
export function useChineseStats() {
  return useQuery({
    queryKey: chineseKeys.stats(),
    queryFn: async () => {
      const { data } = await homeworkClient.get<ApiResponse<ChineseStats>>(
        `${API_BASE}/api/v1/chinese/stats`
      );
      return data.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
