import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { homeworkClient } from '@/api/client';
import type {
  GenerateHomeworkRequest,
  GenerateHomeworkResponse,
  HomeworkRecord,
  ApiResponse,
} from '@/types/homework';

const API_BASE = '';  // Base URL is set in homeworkClient

// Query keys
export const homeworkKeys = {
  all: ['homework'] as const,
  lists: () => [...homeworkKeys.all, 'list'] as const,
  byDate: (date: string, type?: string) => [...homeworkKeys.all, 'date', date, type] as const,
  detail: (id: number) => [...homeworkKeys.all, 'detail', id] as const,
};

// 生成作业
export function useGenerateHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: GenerateHomeworkRequest) => {
      const { data } = await homeworkClient.post<ApiResponse<GenerateHomeworkResponse>>(
        `${API_BASE}/api/v1/homework/generate`,
        request
      );
      return data.data;
    },
    onSuccess: (data) => {
      // Invalidate date-based queries
      queryClient.invalidateQueries({
        queryKey: homeworkKeys.byDate(data.homework_date),
      });
    },
  });
}

// 按日期查询作业
export function useHomeworkByDate(date: string, type?: string) {
  return useQuery({
    queryKey: homeworkKeys.byDate(date, type),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.append('homework_type', type);

      const url = `${API_BASE}/api/v1/homework/date/${date}${params.toString() ? `?${params}` : ''}`;
      const { data } = await homeworkClient.get<ApiResponse<HomeworkRecord[]>>(url);
      return data.data;
    },
    enabled: !!date,
  });
}

// 获取作业详情
export function useHomeworkDetail(id: number) {
  return useQuery({
    queryKey: homeworkKeys.detail(id),
    queryFn: async () => {
      const { data } = await homeworkClient.get<ApiResponse<HomeworkRecord>>(
        `${API_BASE}/api/v1/homework/${id}`
      );
      return data.data;
    },
    enabled: !!id,
  });
}

// 获取最近的作业记录 (通过查询最近7天)
export function useRecentHomework() {
  return useQuery({
    queryKey: [...homeworkKeys.lists(), 'recent'],
    queryFn: async () => {
      const records: HomeworkRecord[] = [];
      const today = new Date();

      // Query last 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        try {
          const { data } = await homeworkClient.get<ApiResponse<HomeworkRecord[]>>(
            `${API_BASE}/api/v1/homework/date/${dateStr}`
          );
          records.push(...data.data);
        } catch {
          // Ignore errors for individual dates
        }
      }

      // Sort by date descending
      return records.sort((a, b) =>
        new Date(b.homework_date).getTime() - new Date(a.homework_date).getTime()
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
