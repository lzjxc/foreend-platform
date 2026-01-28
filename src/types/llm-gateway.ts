// LLM Gateway Batch Processing Types
// API Base: /llm-gateway-api

// ==================== Batch Task Types ====================

export type BatchTaskStatus =
  | 'pending'     // 等待处理
  | 'processing'  // 处理中
  | 'completed'   // 完成
  | 'failed'      // 失败
  | 'partial';    // 部分完成

export interface BatchTaskItem {
  id: string;
  status: BatchTaskStatus;
  result?: unknown;
  error?: string;
}

export interface BatchTask {
  task_id: string;
  app_id: string;
  task_type: string;
  model: string;
  status: BatchTaskStatus;
  total_items: number;
  completed_items: number;
  failed_items: number;
  progress: number;
  callback_url?: string | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  error_message?: string | null;
  results?: unknown | null;
  total_cost: number;
  items?: BatchTaskItem[];
}

export interface BatchTasksResponse {
  tasks: BatchTask[];
  total: number;
}

export interface BatchTaskCreateRequest {
  app_id: string;
  items: Array<{
    id: string;
    content: string;
    metadata?: Record<string, unknown>;
  }>;
  model?: string;
  callback_url?: string;
}

export interface BatchTaskCreateResponse {
  task_id: string;
  status: BatchTaskStatus;
  total_items: number;
  message: string;
}

// ==================== Usage Types ====================

export interface UsageBreakdown {
  app_id: string;
  model: string;
  total_requests: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost: number;
}

export interface UsageBreakdownResponse {
  period: string;
  start_date: string;
  end_date: string;
  breakdown: UsageBreakdown[];
  total: {
    requests: number;
    input_tokens: number;
    output_tokens: number;
    cost: number;
  };
}

export interface DailyUsage {
  date: string;
  requests: number;
  input_tokens: number;
  output_tokens: number;
  cost: number;
}

export interface DailyUsageResponse {
  days: number;
  daily: DailyUsage[];
  total: {
    requests: number;
    input_tokens: number;
    output_tokens: number;
    cost: number;
  };
}
