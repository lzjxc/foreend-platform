export interface MsgGwProvider {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  credential_keys: Record<string, string>;
  description: string;
  enabled: boolean;
  channel_count: number;
  healthy?: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProviderInput {
  name: string;
  type: string;
  config?: Record<string, unknown>;
  credential_keys?: Record<string, string>;
  credentials?: Record<string, string>;
  description?: string;
  enabled?: boolean;
}

export interface UpdateProviderInput {
  config?: Record<string, unknown>;
  credential_keys?: Record<string, string>;
  credentials?: Record<string, string>;
  description?: string;
  enabled?: boolean;
}

export interface MsgGwChannel {
  id: string;
  name: string;
  provider_id: string;
  provider_name: string;
  provider_type: string;
  description: string;
  default_title_prefix: string;
  default_recipients: string[];
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateChannelInput {
  name: string;
  provider_id: string;
  description?: string;
  default_title_prefix?: string;
  default_recipients?: string[];
  enabled?: boolean;
}

export interface UpdateChannelInput {
  provider_id?: string;
  description?: string;
  default_title_prefix?: string;
  default_recipients?: string[];
  enabled?: boolean;
}

export interface ChannelTestInput {
  title?: string;
  content?: string;
  content_type?: string;
}

export interface ProviderTypeInfo {
  type: string;
  credential_fields: string[];
  config_fields: string[];
}

export interface MsgGwHealth {
  status: string;
  channels_loaded: number;
  providers: Record<string, boolean>;
  telegram_polling: boolean;
}

export interface NotificationStats {
  channel_name: string;
  total_count: number;
  success_count: number;
  fail_count: number;
  last_sent_at: string | null;
  last_error: string | null;
  created_at: string | null;
}

export interface SourceStats {
  channel_name: string;
  source: string;
  total_count: number;
  success_count: number;
  fail_count: number;
  last_sent_at: string | null;
  first_sent_at: string | null;
}

export interface NotificationLogEntry {
  id: string;
  channel_name: string;
  source: string | null;
  title: string;
  content_preview: string | null;
  success: boolean;
  error: string | null;
  sent_at: string | null;
}
