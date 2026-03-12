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
