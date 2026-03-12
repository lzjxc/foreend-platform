import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providerApi, channelApi, msgGwAdminApi } from '@/api/msg-gw';
import type {
  CreateProviderInput, UpdateProviderInput,
  CreateChannelInput, UpdateChannelInput, ChannelTestInput,
} from '@/types/msg-gw';

export const msgGwKeys = {
  all: ['msg-gw'] as const,
  providers: () => [...msgGwKeys.all, 'providers'] as const,
  providerTypes: () => [...msgGwKeys.all, 'provider-types'] as const,
  channels: () => [...msgGwKeys.all, 'channels'] as const,
  health: () => [...msgGwKeys.all, 'health'] as const,
};

// ==================== Provider hooks ====================

export function useProviders() {
  return useQuery({
    queryKey: msgGwKeys.providers(),
    queryFn: async () => {
      const { data } = await providerApi.list();
      return data.data;
    },
  });
}

export function useProviderTypes() {
  return useQuery({
    queryKey: msgGwKeys.providerTypes(),
    queryFn: async () => {
      const { data } = await providerApi.types();
      return data.data;
    },
  });
}

export function useCreateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProviderInput) => {
      const { data } = await providerApi.create(input);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: msgGwKeys.providers() });
    },
  });
}

export function useUpdateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & UpdateProviderInput) => {
      const { data } = await providerApi.update(id, input);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: msgGwKeys.providers() });
    },
  });
}

export function useDeleteProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => providerApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: msgGwKeys.providers() });
    },
  });
}

// ==================== Channel hooks ====================

export function useChannels() {
  return useQuery({
    queryKey: msgGwKeys.channels(),
    queryFn: async () => {
      const { data } = await channelApi.list();
      return data.data;
    },
  });
}

export function useCreateChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateChannelInput) => {
      const { data } = await channelApi.create(input);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: msgGwKeys.channels() });
    },
  });
}

export function useUpdateChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, ...input }: { name: string } & UpdateChannelInput) => {
      const { data } = await channelApi.update(name, input);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: msgGwKeys.channels() });
    },
  });
}

export function useDeleteChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => channelApi.delete(name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: msgGwKeys.channels() });
    },
  });
}

export function useTestChannel() {
  return useMutation({
    mutationFn: ({ name, ...input }: { name: string } & Partial<ChannelTestInput>) =>
      channelApi.test(name, input),
  });
}

// ==================== Health + Admin ====================

export function useMsgGwHealth() {
  return useQuery({
    queryKey: msgGwKeys.health(),
    queryFn: async () => {
      const { data } = await msgGwAdminApi.health();
      return data;
    },
    refetchInterval: 30000,
  });
}

export function useReloadMsgGw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => msgGwAdminApi.reload(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: msgGwKeys.all });
    },
  });
}
