import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { msgGwKeys } from './use-msg-gw';
import { emailApi } from '@/api/emails';
import type { EmailListFilters, EmailSettingsUpdate } from '@/types/email';

export const emailKeys = {
  all: [...msgGwKeys.all, 'emails'] as const,
  list: (filters: EmailListFilters) => [...emailKeys.all, 'list', filters] as const,
  detail: (id: string) => [...emailKeys.all, 'detail', id] as const,
  stats: (days: number) => [...emailKeys.all, 'stats', days] as const,
  settings: () => [...emailKeys.all, 'settings'] as const,
};

export function useEmailList(filters: EmailListFilters = {}) {
  return useQuery({
    queryKey: emailKeys.list(filters),
    queryFn: async () => {
      const { data } = await emailApi.list(filters);
      return data;
    },
  });
}

export function useEmailDetail(id: string) {
  return useQuery({
    queryKey: emailKeys.detail(id),
    queryFn: async () => {
      const { data } = await emailApi.detail(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useEmailStats(days = 30) {
  return useQuery({
    queryKey: emailKeys.stats(days),
    queryFn: async () => {
      const { data } = await emailApi.stats(days);
      return data;
    },
  });
}

export function useEmailSettings() {
  return useQuery({
    queryKey: emailKeys.settings(),
    queryFn: async () => {
      const { data } = await emailApi.getSettings();
      return data;
    },
  });
}

export function useUpdateEmailSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EmailSettingsUpdate) => {
      const { data } = await emailApi.updateSettings(input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: emailKeys.settings() });
    },
  });
}

export function useMarkEmailRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await emailApi.markRead(id);
      return data;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: [...emailKeys.all, 'list'] });
      qc.setQueriesData(
        { queryKey: [...emailKeys.all, 'list'] },
        (old: any) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.map((item: any) =>
              item.id === id ? { ...item, is_read: true } : item
            ),
          };
        }
      );
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: emailKeys.detail(id) });
    },
  });
}

export function useGenerateDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, intent }: { id: string; intent: string }) => {
      const { data } = await emailApi.generateDraft(id, intent);
      return data;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: emailKeys.detail(id) });
      qc.invalidateQueries({ queryKey: [...emailKeys.all, 'list'] });
    },
  });
}

export function useSendReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: string }) => {
      const { data } = await emailApi.sendReply(id, body);
      return data;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: emailKeys.detail(id) });
      qc.invalidateQueries({ queryKey: [...emailKeys.all, 'list'] });
      qc.invalidateQueries({ queryKey: emailKeys.stats(30) });
    },
  });
}
