// Doc Service Types - 文档服务类型定义

// ==================== Documents ====================

export type DocType = 'claude_md' | 'api_doc' | 'system_doc' | 'tutorial' | 'other';
export type DocCategory = 'development' | 'deployment' | 'operations' | 'architecture' | 'general';

export interface Document {
  id: number;
  title: string;
  content: string;
  doc_type: DocType;
  category: DocCategory;
  service_id?: string;
  tags: string[];
  version: string;
  created_at: string;
  updated_at?: string;
}

export interface DocumentCreate {
  title: string;
  content: string;
  doc_type: DocType;
  category: DocCategory;
  service_id?: string;
  tags?: string[];
  version?: string;
}

export interface DocumentUpdate {
  title?: string;
  content?: string;
  doc_type?: DocType;
  category?: DocCategory;
  service_id?: string;
  tags?: string[];
  version?: string;
}

export interface DocumentListParams {
  doc_type?: DocType;
  category?: DocCategory;
  service_id?: string;
  search?: string;
  skip?: number;
  limit?: number;
}

export interface DocumentVersion {
  id: number;
  document_id: number;
  version: string;
  content: string;
  changed_by?: string;
  change_summary?: string;
  created_at: string;
}

// ==================== Timeline ====================

export type EventType = 'commit' | 'release' | 'document' | 'deployment' | 'incident';

export interface TimelineEvent {
  id: string;
  type: EventType;
  title: string;
  description?: string;
  service_id?: string;
  repo?: string;
  url?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface TimelineParams {
  event_type?: EventType;
  service_id?: string;
  repo?: string;
  days?: number;
  skip?: number;
  limit?: number;
}

export interface TimelineSummary {
  period_days: number;
  total_commits: number;
  total_releases: number;
  total_document_updates: number;
  commit_types: Record<string, number>;
  active_repos: Record<string, number>;
  generated_at: string;
}

// ==================== ArgoCD Configuration ====================

export type ArgoLayer = 'apps' | 'infra' | 'shared-services' | 'personal';

export interface ArgoApp {
  name: string;
  layer: ArgoLayer;
  namespace?: string;
  image?: string;
  image_tag?: string;
  replicas?: number;
  resources?: {
    requests?: { cpu?: string; memory?: string };
    limits?: { cpu?: string; memory?: string };
  };
  env_vars?: Record<string, string>;
  config_path?: string;
}

export interface ArgoEnvVar {
  name: string;
  value: string | null;
  is_secret: boolean;
}

export interface ArgoAppConfig {
  app_name: string;
  layer: ArgoLayer;
  namespace: string;
  image?: string;
  image_tag?: string;
  deployment_path?: string;
  replicas?: number;
  resources?: {
    requests?: { cpu?: string; memory?: string };
    limits?: { cpu?: string; memory?: string };
  };
  env_vars: ArgoEnvVar[];
  external_secrets?: string[];
  ports?: { name: string; port: number; targetPort: number }[];
  health_check?: {
    path: string;
    port: number;
  };
  config_path?: string;
  raw_content?: string;
}

export interface ArgoEnvVarUpdate {
  key: string;
  value: string;
  commit_message?: string;
}

export interface ArgoGitStatus {
  clean: boolean;
  modified_files: string[];
  untracked_files: string[];
  staged_files: string[];
  current_branch: string;
  last_commit?: {
    sha: string;
    message: string;
    author: string;
    date: string;
  };
}

export interface ArgoAppsByLayer {
  [layer: string]: ArgoApp[];
}

// ==================== Search ====================

export interface SearchResult {
  id: string;
  type: 'document' | 'timeline' | 'argo_app';
  title: string;
  snippet: string;
  url?: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface SearchParams {
  query: string;
  types?: ('document' | 'timeline' | 'argo_app')[];
  limit?: number;
}

// ==================== API Response Types ====================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ==================== Catalog Types ====================

export interface CatalogService {
  id: string;
  name: string;
  description?: string;
  namespace: string;
  layer: string;
  status: 'active' | 'inactive' | 'deprecated';
  health_url?: string;
  docs_url?: string;
  repo_url?: string;
}

export interface SystemDoc {
  id: string;
  title: string;
  content: string;
  doc_type: string;
  updated_at?: string;
}
