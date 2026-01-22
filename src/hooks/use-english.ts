import { useQuery } from '@tanstack/react-query';
import { homeworkClient } from '@/api/client';
import type { EnglishWord, EnglishStats, ApiResponse } from '@/types/homework';

const API_BASE = '';  // Base URL is set in homeworkClient

// Query keys
export const englishKeys = {
  all: ['english'] as const,
  words: (params?: { category?: string; difficulty?: number; has_image?: boolean }) =>
    [...englishKeys.all, 'words', params] as const,
  wordDetail: (id: number) => [...englishKeys.all, 'word', id] as const,
  stats: () => [...englishKeys.all, 'stats'] as const,
};

// 词库筛选参数
export interface EnglishWordsParams {
  category?: string;
  difficulty?: number;
  has_image?: boolean;
}

// 获取词库列表
export function useEnglishWords(params?: EnglishWordsParams) {
  return useQuery({
    queryKey: englishKeys.words(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.append('category', params.category);
      if (params?.difficulty) searchParams.append('difficulty', String(params.difficulty));
      if (params?.has_image !== undefined) searchParams.append('has_image', String(params.has_image));

      const url = `${API_BASE}/api/v1/english/words${searchParams.toString() ? `?${searchParams}` : ''}`;
      const { data } = await homeworkClient.get<ApiResponse<EnglishWord[]>>(url);
      return data.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - 词库不常变化
  });
}

// 获取单个单词详情
export function useEnglishWord(id: number) {
  return useQuery({
    queryKey: englishKeys.wordDetail(id),
    queryFn: async () => {
      const { data } = await homeworkClient.get<ApiResponse<EnglishWord>>(
        `${API_BASE}/api/v1/english/words/${id}`
      );
      return data.data;
    },
    enabled: !!id,
  });
}

// 获取词库统计
export function useEnglishStats() {
  return useQuery({
    queryKey: englishKeys.stats(),
    queryFn: async () => {
      const { data } = await homeworkClient.get<ApiResponse<EnglishStats>>(
        `${API_BASE}/api/v1/english/stats`
      );
      return data.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
