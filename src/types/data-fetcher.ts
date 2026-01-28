// Data Fetcher Service Types
// API Base: /data-fetcher-api

// ==================== Common Types ====================

export type DataSource = 'github' | 'rss' | 'hackernews';

export type TopicType = 'ai' | 'game' | 'tech' | 'finance' | 'healthcare' | 'education' | 'entertainment';

// ==================== GitHub Types ====================

export interface TrendingRepo {
  full_name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  stars_today: number;
  forks: number;
  topics: string[];
}

export interface RepoDetail {
  full_name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  open_issues: number;
  topics: string[];
  created_at: string;
  updated_at: string;
  license: string | null;
}

export interface Release {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
}

// ==================== RSS Types ====================

export interface RSSItem {
  title: string;
  link: string;
  description: string | null;
  author: string | null;
  published_at: string | null;
  categories: string[];
}

export interface RSSFeed {
  source_url: string;
  source_title: string;
  items: RSSItem[];
  error: string | null;
}

export interface RSSSource {
  name: string;
  url: string;
  category: string;
}

export type RSSPresetCategory = 'ai' | 'tech' | 'game' | 'general';

// ==================== Hacker News Types ====================

export interface HNItem {
  id: number;
  title: string;
  url: string | null;
  score: number;
  author: string;
  time: string;
  comments_count: number;
  type: 'story' | 'ask' | 'show' | 'job';
  text: string | null;
}

export interface HNSearchResult {
  id: number;
  title: string;
  url: string | null;
  score: number;
  author: string;
  time: string;
  comments_count: number;
}

export interface HNComment {
  id: number;
  author: string;
  text: string;
  time: string;
}

export interface HNItemWithComments extends HNItem {
  comments: HNComment[];
}

// ==================== News Types ====================

export interface NewsItem {
  id: string;
  source: DataSource;
  source_id: string;
  source_name: string | null;
  title: string;
  summary: string | null;
  url: string | null;
  author: string | null;
  published_at: string | null;
  topics: string[];
  tags: string[];
  importance_score: number;
  is_ad: boolean;
  collected_at: string;
  tagged_at: string | null;
}

export interface NewsListResponse {
  items: NewsItem[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface NewsFilters {
  topics?: string;          // Comma-separated, ANY match
  topics_all?: string;      // Comma-separated, ALL must match
  tags?: string;            // Comma-separated, AND logic
  keyword?: string;         // Full-text search
  source?: DataSource;
  min_importance?: number;  // 0.0-1.0
  days?: number;            // 1-90 days lookback
  page?: number;
  page_size?: number;
}

// ==================== Collection Types ====================

export interface CollectRequest {
  sources: DataSource[];
  submit_tagging: boolean;
}

export interface CollectResponse {
  status: string;
  collected: {
    github?: number;
    rss?: number;
    hackernews?: number;
  };
  tagging_workflow?: {
    workflow_id: string;
    status: string;
  };
}

export interface CollectionStats {
  period_days: number;
  news_items: {
    total: number;
    tagged: number;
    untagged: number;
    avg_importance: number;
  };
  github_projects: {
    total: number;
    tagged: number;
    untagged: number;
    avg_importance: number;
  };
}

export interface BackfillRequest {
  source_type: 'mixed' | 'news' | 'github';
  batch_size?: number;
  max_batches?: number;
  dry_run?: boolean;
}

export interface BackfillResponse {
  status: 'submitted' | 'dry_run' | 'no_items' | 'partial_failure';
  total_untagged: number;
  batches_submitted: number;
  items_submitted: number;
  workflows: Array<{
    batch: number;
    items: number;
    workflow: Record<string, unknown>;
  }>;
}

// ==================== Tag Types ====================

export interface Tag {
  id: string;
  slug: string;
  name: string;
  group: string;
  description: string | null;
  keywords: string[] | null;
  color: string | null;
  is_active: boolean;
}

export interface TagCreate {
  slug: string;
  name: string;
  group: string;
  description?: string;
  keywords?: string[];
  color?: string;
}

export interface TagUpdate {
  name?: string;
  group?: string;
  description?: string;
  keywords?: string[];
  color?: string;
  is_active?: boolean;
}

export interface TagStats {
  by_group: Record<string, Record<string, number>>;
  total_news: number;
  total_tags_used: number;
}

export interface TopicStats {
  by_topic: Record<string, { total: number; recent_7d: number }>;
  cross_domain_ai_game?: number;
}

// ==================== Batch Tagging Types ====================

export type BatchTagSourceType = 'news' | 'github' | 'mixed';

export type BatchTagStatus = 'pending' | 'running' | 'completed' | 'failed' | 'partial';

export interface BatchTagRequest {
  source_type: BatchTagSourceType;
  limit?: number;
  force_retag?: boolean;
}

export interface BatchTagResponse {
  status: 'submitted' | 'no_items';
  items_count: number;
  task_id?: string;
  message: string;
}

export interface BatchTagTask {
  id: string;
  llm_gateway_task_id: string;
  status: BatchTagStatus;
  total_items: number;
  completed_items: number;
  failed_items: number;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  error_message?: string | null;
}

export interface BatchTagTasksResponse {
  tasks: BatchTagTask[];
  total: number;
}

// ==================== Health Types ====================

export interface DataFetcherHealth {
  status: string;
  service: string;
  cache: {
    size: number;
    max_size: number;
    hit_count: number;
    miss_count: number;
    hit_rate: number;
  };
}
