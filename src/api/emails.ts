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

  compose: (data: ComposeEmailInput) => {
    if (data.attachments && data.attachments.length > 0) {
      const form = new FormData();
      data.to.forEach((t) => form.append('to', t));
      form.append('subject', data.subject);
      form.append('body', data.body);
      if (data.send !== undefined) form.append('send', String(data.send));
      data.attachments.forEach((f) => form.append('attachments', f));
      return msgGwClient.post<EmailDetail>('/api/v1/emails/compose', form);
    }
    const { attachments: _a, ...rest } = data;
    return msgGwClient.post<EmailDetail>('/api/v1/emails/compose', rest);
  },

  listDrafts: (page = 1, size = 20) =>
    msgGwClient.get<EmailListResponse>(`/api/v1/emails/drafts?page=${page}&size=${size}`),

  getDraft: (id: string) =>
    msgGwClient.get<EmailDetail>(`/api/v1/emails/drafts/${id}`),

  updateDraft: (id: string, data: DraftUpdateInput) => {
    if (data.attachments && data.attachments.length > 0) {
      const form = new FormData();
      if (data.to) data.to.forEach((t) => form.append('to', t));
      if (data.subject !== undefined) form.append('subject', data.subject);
      if (data.body !== undefined) form.append('body', data.body);
      data.attachments.forEach((f) => form.append('attachments', f));
      return msgGwClient.put<EmailDetail>(`/api/v1/emails/drafts/${id}`, form);
    }
    const { attachments: _a, ...rest } = data;
    return msgGwClient.put<EmailDetail>(`/api/v1/emails/drafts/${id}`, rest);
  },

  deleteDraft: (id: string) =>
    msgGwClient.delete<{ status: string }>(`/api/v1/emails/drafts/${id}`),

  sendDraft: (id: string) =>
    msgGwClient.post<EmailDetail>(`/api/v1/emails/drafts/${id}/send`),
};
