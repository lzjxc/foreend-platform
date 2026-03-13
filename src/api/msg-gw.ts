import { msgGwClient } from './client';
import type {
  MsgGwProvider, CreateProviderInput, UpdateProviderInput,
  MsgGwChannel, CreateChannelInput, UpdateChannelInput,
  ChannelTestInput, ProviderTypeInfo, MsgGwHealth, NotificationStats,
  NotificationLogEntry, SourceStats,
} from '@/types/msg-gw';

export const providerApi = {
  list: () => msgGwClient.get<{ success: boolean; data: MsgGwProvider[] }>('/api/v1/providers'),
  get: (id: string) => msgGwClient.get<{ success: boolean; data: MsgGwProvider }>(`/api/v1/providers/${id}`),
  create: (data: CreateProviderInput) => msgGwClient.post<{ success: boolean; data: MsgGwProvider }>('/api/v1/providers', data),
  update: (id: string, data: UpdateProviderInput) => msgGwClient.put<{ success: boolean; data: MsgGwProvider }>(`/api/v1/providers/${id}`, data),
  delete: (id: string) => msgGwClient.delete(`/api/v1/providers/${id}`),
  health: (id: string) => msgGwClient.get<{ success: boolean; healthy: boolean }>(`/api/v1/providers/${id}/health`),
  types: () => msgGwClient.get<{ success: boolean; data: ProviderTypeInfo[] }>('/api/v1/providers/types'),
};

export const channelApi = {
  list: () => msgGwClient.get<{ success: boolean; data: MsgGwChannel[] }>('/api/v1/channels'),
  get: (name: string) => msgGwClient.get<{ success: boolean; data: MsgGwChannel }>(`/api/v1/channels/${name}`),
  create: (data: CreateChannelInput) => msgGwClient.post<{ success: boolean; data: MsgGwChannel }>('/api/v1/channels', data),
  update: (name: string, data: UpdateChannelInput) => msgGwClient.put<{ success: boolean; data: MsgGwChannel }>(`/api/v1/channels/${name}`, data),
  delete: (name: string) => msgGwClient.delete(`/api/v1/channels/${name}`),
  test: (name: string, data?: ChannelTestInput) => msgGwClient.post(`/api/v1/channels/${name}/test`, data || {}),
};

export const msgGwAdminApi = {
  reload: () => msgGwClient.post('/api/v1/admin/reload'),
  health: () => msgGwClient.get<MsgGwHealth>('/health'),
};

export const statsApi = {
  list: () => msgGwClient.get<{ success: boolean; data: NotificationStats[] }>('/api/v1/stats'),
  bySource: () => msgGwClient.get<{ success: boolean; data: SourceStats[] }>('/api/v1/stats/by-source'),
  logs: (channelName: string, source?: string, limit = 50) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (source) params.set('source', source);
    return msgGwClient.get<{ success: boolean; data: NotificationLogEntry[] }>(`/api/v1/stats/logs/${channelName}?${params}`);
  },
};
