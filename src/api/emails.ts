import { msgGwClient } from './client';
import type {
  EmailListResponse,
  EmailDetail,
  EmailStatsResponse,
  EmailSettingsResponse,
  EmailSettingsUpdate,
  EmailListFilters,
  DraftResponse,
  SendResponse,
  ComposeEmailInput,
  DraftUpdateInput,
} from '@/types/email';

export const emailApi = {
  list: (filters: EmailListFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.page != null) params.set('page', String(filters.page));
    if (filters.size != null) params.set('size', String(filters.size));
    if (filters.direction) params.set('direction', filters.direction);
    if (filters.important !== undefined) params.set('important', String(filters.important));
    if (filters.search) params.set('search', filters.search);
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to) params.set('date_to', filters.date_to);
    const qs = params.toString();
    return msgGwClient.get<EmailListResponse>(`/api/v1/emails${qs ? `?${qs}` : ''}`);
  },

  detail: (id: string) =>
    msgGwClient.get<EmailDetail>(`/api/v1/emails/${id}`),

  markRead: (id: string) =>
    msgGwClient.put<{ status: string }>(`/api/v1/emails/${id}/read`),

  stats: (days = 30) =>
    msgGwClient.get<EmailStatsResponse>(`/api/v1/emails/stats?days=${days}`),

  getSettings: () =>
    msgGwClient.get<EmailSettingsResponse>('/api/v1/emails/settings'),

  updateSettings: (data: EmailSettingsUpdate) =>
    msgGwClient.put<EmailSettingsResponse>('/api/v1/emails/settings', data),

  generateDraft: (id: string, intent: string) =>
    msgGwClient.post<DraftResponse>(`/api/v1/emails/${id}/draft`, { intent }, { timeout: 60000 }),

  sendReply: (id: string, body: string) =>
    msgGwClient.post<SendResponse>(`/api/v1/emails/${id}/send`, { body }),

  compose: (data: ComposeEmailInput) =>
    msgGwClient.post<EmailDetail>('/api/v1/emails/compose', data),

  listDrafts: (page = 1, size = 20) =>
    msgGwClient.get<EmailListResponse>(`/api/v1/emails/drafts?page=${page}&size=${size}`),

  getDraft: (id: string) =>
    msgGwClient.get<EmailDetail>(`/api/v1/emails/drafts/${id}`),

  updateDraft: (id: string, data: DraftUpdateInput) =>
    msgGwClient.put<EmailDetail>(`/api/v1/emails/drafts/${id}`, data),

  deleteDraft: (id: string) =>
    msgGwClient.delete<{ status: string }>(`/api/v1/emails/drafts/${id}`),

  sendDraft: (id: string) =>
    msgGwClient.post<EmailDetail>(`/api/v1/emails/drafts/${id}/send`),
};
