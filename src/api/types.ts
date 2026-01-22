// Common API response types

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiError {
  message: string;
  detail?: string;
  code?: string;
}

// Health check response
export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  version?: string;
  timestamp?: string;
}

// LLM Gateway types
export interface LLMUsageSummary {
  total_tokens: number;
  total_cost: number;
  total_requests: number;
  period_start: string;
  period_end: string;
}

export interface LLMDailyUsage {
  date: string;
  tokens: number;
  cost: number;
  requests: number;
}

export interface LLMWeeklyUsage {
  summary: LLMUsageSummary;
  daily: LLMDailyUsage[];
}

// File Gateway types
export interface Bucket {
  name: string;
  creation_date?: string;
  file_count?: number;
}

export interface FileItem {
  key: string;
  size: number;
  last_modified: string;
  url: string;
  content_type?: string;
  etag?: string;
}

export interface FileUploadResponse {
  key: string;
  url: string;
  size: number;
  content_type: string;
  sha256?: string;
}

export interface DuplicateCheckResponse {
  exists: boolean;
  existing_key?: string;
  existing_url?: string;
}
