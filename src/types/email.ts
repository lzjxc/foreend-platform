export interface EmailListItem {
  id: string;
  seq: number;
  direction: 'inbound' | 'outbound' | 'draft';
  from_address: string;
  from_name: string | null;
  subject: string | null;
  body_preview: string;
  email_date: string;
  is_important: boolean;
  importance_rule: 'whitelist' | 'llm' | null;
  is_read: boolean;
  reply_status: 'none' | 'draft_pending' | 'confirmed' | 'sent';
  attachments_count: number;
}

export interface EmailDetail extends EmailListItem {
  message_id: string | null;
  to_addresses: string[];
  cc_addresses: string[];
  body_text: string | null;
  body_html: string | null;
  stored_at: string;
  importance_reason: string | null;
  reply_to_id: string | null;
  reply_draft: string | null;
  attachments: EmailAttachment[];
  raw_headers: Record<string, unknown>;
}

export interface EmailAttachment {
  filename: string;
  size: number;
  content_type: string;
}

export interface EmailListResponse {
  items: EmailListItem[];
  total: number;
  page: number;
  size: number;
}

export interface DailyTrend {
  date: string;
  received: number;
  sent: number;
  important: number;
}

export interface TopSender {
  address: string;
  name: string | null;
  count: number;
}

export interface EmailStatsResponse {
  period: string;
  total_received: number;
  total_sent: number;
  important_count: number;
  important_rate: number;
  daily_trend: DailyTrend[];
  top_senders: TopSender[];
}

export interface EmailSettingsResponse {
  whitelist_senders: string[];
  whitelist_domains: string[];
  llm_analysis_enabled: boolean;
  quiet_hours: { start: string; end: string } | null;
}

export interface EmailSettingsUpdate {
  whitelist_senders?: string[];
  whitelist_domains?: string[];
  llm_analysis_enabled?: boolean;
  quiet_hours?: { start: string; end: string } | null;
}

export interface EmailListFilters {
  page?: number;
  size?: number;
  direction?: 'inbound' | 'outbound' | 'draft';
  important?: boolean;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface DraftResponse {
  draft: string;
  to: string;
  subject: string;
}

export interface SendResponse {
  status: string;
  to: string;
  subject: string;
}

export interface ComposeEmailInput {
  to: string;
  subject: string;
  body: string;
  send?: boolean;
}

export interface DraftUpdateInput {
  to?: string;
  subject?: string;
  body?: string;
}
