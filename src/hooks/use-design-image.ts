import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/design-image';
import { generateImage } from '@/api/design-image';
import type { GenerateRequest } from '@/types/design-image';

export const designImageKeys = {
  all: ['design-image'] as const,
  history: () => [...designImageKeys.all, 'history'] as const,
  historyList: (params?: Record<string, unknown>) => [...designImageKeys.history(), params] as const,
  presets: () => [...designImageKeys.all, 'presets'] as const,
};

export function usePresets() {
  return useQuery({
    queryKey: designImageKeys.presets(),
    queryFn: api.getPresets,
  });
}

export function useHistory(params?: {
  page?: number;
  limit?: number;
  content_type?: string;
  art_style?: string;
  target_tool?: string;
}) {
  return useQuery({
    queryKey: designImageKeys.historyList(params),
    queryFn: () => api.getHistory(params),
  });
}

export function useGeneratePrompt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (req: GenerateRequest) => api.generatePrompt(req),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: designImageKeys.history() });
    },
  });
}

export function useDeleteHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteHistory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: designImageKeys.history() });
    },
  });
}

export function useGenerateImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generateImage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: designImageKeys.history() });
    },
  });
}
