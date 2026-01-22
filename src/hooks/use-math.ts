import { useQuery } from '@tanstack/react-query';
import { homeworkClient } from '@/api/client';
import type { MathHomework, MathPreviewParams, ApiResponse } from '@/types/homework';

const API_BASE = '';  // Base URL is set in homeworkClient

// Query keys
export const mathKeys = {
  all: ['math'] as const,
  preview: (params?: MathPreviewParams) => [...mathKeys.all, 'preview', params] as const,
};

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
