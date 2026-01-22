// AI Weekly Report types

export interface AIReport {
  id: string;
  type: 'daily' | 'weekly';
  title: string;
  content?: string;      // Markdown format (not present in list response)
  summary?: string;
  period_start: string;  // YYYY-MM-DD
  period_end: string;
  pdf_url: string | null;
  pdf_size_bytes?: number | null;
  dingtalk_sent_at?: string | null;
  created_at: string;
}

export interface NewsItem {
  id: string;
  source: 'github' | 'rss' | 'hackernews';
  source_id: string;
  title: string;
  summary: string | null;
  url: string | null;
  author: string | null;
  published_at: string | null;
  category: string | null;
  tags: string[];
  ai_score: number;
  game_score: number;
  relevance_score: number;
  importance_score: number;
  extra_data: Record<string, unknown> | null;
  collected_at: string;
  analyzed_at: string | null;
}

// API response types
export interface ReportsListResponse {
  reports: AIReport[];
  total: number;
}

export interface NewsListResponse {
  items: NewsItem[];
  total: number;
}

// Query params
export interface ReportsQueryParams {
  limit?: number;
  type?: 'daily' | 'weekly';
}

export interface NewsQueryParams {
  limit?: number;
  offset?: number;
  source?: 'github' | 'rss' | 'hackernews';
  category?: string;
}
