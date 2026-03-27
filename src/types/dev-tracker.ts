// --- Paginated Response ---
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

// --- Categories ---
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
  app_count: number;
}

export interface CategoryCreate {
  name: string;
  slug: string;
  description?: string | null;
  sort_order?: number;
}

export interface CategoryUpdate {
  name?: string | null;
  description?: string | null;
  sort_order?: number | null;
}

// --- Apps ---
export interface App {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  repo_url: string | null;
  created_at: string;
  updated_at: string | null;
  category_slugs: string[];
  milestone_count: number;
}

export interface AppCreate {
  name: string;
  slug: string;
  description?: string | null;
  repo_url?: string | null;
  category_ids?: number[];
}

export interface AppUpdate {
  name?: string | null;
  description?: string | null;
  repo_url?: string | null;
}

// --- Milestones ---
export interface Milestone {
  id: number;
  title: string;
  description: string;
  status: string;
  scope: string[] | null;
  target_date: string | null;
  completed_at: string | null;
  summary_doc: string | null;
  deviation_report: string | null;
  app_id: number | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string | null;
}

export interface MilestoneListItem {
  id: number;
  title: string;
  description: string;
  status: string;
  scope: string[] | null;
  target_date: string | null;
  completed_at: string | null;
  app_id: number | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string | null;
  task_count: number;
  tasks_done: number;
}

export interface MilestoneCreate {
  title: string;
  description?: string;
  scope?: string[] | null;
  target_date?: string | null;
  tags?: string[] | null;
  app_id?: number | null;
}

export interface MilestoneUpdate {
  title?: string | null;
  description?: string | null;
  status?: string | null;
  scope?: string[] | null;
  target_date?: string | null;
  tags?: string[] | null;
  app_id?: number | null;
}

// --- Specs ---
export interface Spec {
  id: number;
  title: string;
  description: string;
  phase: string;
  milestone_id: number | null;
  content: string | null;
  content_hash: string | null;
  source_repo: string | null;
  spec_file_path: string | null;
  plan_content: string | null;
  plan_content_hash: string | null;
  plan_file_path: string | null;
  expected_files: string[] | null;
  phase_history: Array<Record<string, unknown>>;
  scope_services: string[] | null;
  version: string;
  tags: string[] | null;
  created_at: string;
  updated_at: string | null;
}

export interface SpecListItem {
  id: number;
  title: string;
  description: string;
  phase: string;
  milestone_id: number | null;
  source_repo: string | null;
  scope_services: string[] | null;
  tags: string[] | null;
  version: string;
  created_at: string;
  updated_at: string | null;
  task_count: number;
  tasks_done: number;
}

export interface SpecCreate {
  title: string;
  description?: string;
  milestone_id?: number | null;
  phase?: string;
  source_repo?: string | null;
  spec_file_path?: string | null;
  plan_file_path?: string | null;
  expected_files?: string[] | null;
  scope_services?: string[] | null;
  tags?: string[] | null;
}

export interface SpecUpdate {
  title?: string | null;
  description?: string | null;
  milestone_id?: number | null;
  source_repo?: string | null;
  spec_file_path?: string | null;
  plan_file_path?: string | null;
  expected_files?: string[] | null;
  scope_services?: string[] | null;
  tags?: string[] | null;
}

// --- Tasks ---
export interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  service_id: string;
  origin_service_id: string | null;
  task_type: string;
  source: string;
  priority: string;
  milestone_id: number | null;
  spec_id: number | null;
  check_result: Record<string, unknown> | null;
  plan_doc_path: string | null;
  landing_doc_path: string | null;
  tags: string[] | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface TaskListItem {
  id: number;
  title: string;
  status: string;
  service_id: string;
  origin_service_id: string | null;
  task_type: string;
  source: string;
  priority: string;
  milestone_id: number | null;
  spec_id: number | null;
  tags: string[] | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string | null;
  activity_count: number;
}

export interface TaskCreate {
  title: string;
  description?: string;
  milestone_id?: number | null;
  service_id: string;
  origin_service_id?: string | null;
  task_type?: string;
  source?: string;
  plan_doc_path?: string | null;
  landing_doc_path?: string | null;
  priority?: string;
  spec_id?: number | null;
  tags?: string[] | null;
}

export interface TaskUpdate {
  title?: string | null;
  description?: string | null;
  status?: string | null;
  milestone_id?: number | null;
  service_id?: string | null;
  task_type?: string | null;
  plan_doc_path?: string | null;
  landing_doc_path?: string | null;
  priority?: string | null;
  spec_id?: number | null;
  tags?: string[] | null;
}

// --- Activities ---
export interface Activity {
  id: number;
  task_id: number | null;
  service_id: string;
  activity_type: string;
  source: string;
  title: string;
  title_original: string | null;
  detail: string | null;
  commit_sha: string | null;
  branch: string | null;
  category_slug: string | null;
  session_db_id: number | null;
  files_changed: string[] | null;
  created_at: string;
}

export interface ActivityCreate {
  service_id: string;
  activity_type: string;
  source?: string;
  title: string;
  detail?: string | null;
  task_id?: number | null;
  commit_sha?: string | null;
  branch?: string | null;
  files_changed?: string[] | null;
}

export interface ActivityUpdate {
  task_id?: number | null;
}

export interface BulkLinkRequest {
  activity_ids: number[];
  task_id: number;
}

// --- Sessions ---
export interface Session {
  id: number;
  session_id: string;
  service_id: string;
  project_path: string | null;
  title: string | null;
  minio_bucket: string;
  minio_key: string | null;
  file_size: number | null;
  status: string;
  conversation: Array<Record<string, unknown>> | null;
  summary: string | null;
  category: string | null;
  tags: unknown[] | null;
  decisions: unknown[] | null;
  files_changed: unknown[] | null;
  is_dev_related: boolean | null;
  linked_activity_id: number | null;
  dev_purpose: string | null;
  topics: unknown[] | null;
  linked_activity_ids: unknown[] | null;
  environment: string | null;
  trigger_source: string | null;
  message_count: number | null;
  user_message_count: number | null;
  assistant_message_count: number | null;
  duration_seconds: number | null;
  created_at: string;
  processed_at: string | null;
}

export interface SessionListItem {
  id: number;
  session_id: string;
  service_id: string;
  project_path: string | null;
  title: string | null;
  status: string;
  file_size: number | null;
  message_count: number | null;
  user_message_count: number | null;
  duration_seconds: number | null;
  summary: string | null;
  category: string | null;
  tags: unknown[] | null;
  is_dev_related: boolean | null;
  linked_activity_id: number | null;
  dev_purpose: string | null;
  topics: unknown[] | null;
  linked_activity_ids: unknown[] | null;
  environment: string | null;
  trigger_source: string | null;
  created_at: string;
  processed_at: string | null;
}

// --- Config Backups ---
export interface ConfigBackupListItem {
  id: number;
  content_hash: string;
  file_count: number;
  total_size: number;
  status: string;
  files_added: unknown[] | null;
  files_removed: unknown[] | null;
  files_modified: unknown[] | null;
  hostname: string | null;
  trigger: string;
  created_at: string;
}

export interface ConfigBackup {
  id: number;
  content_hash: string;
  file_count: number;
  total_size: number;
  manifest: unknown[];
  minio_bucket: string;
  minio_key: string | null;
  status: string;
  files_added: unknown[] | null;
  files_removed: unknown[] | null;
  files_modified: unknown[] | null;
  hostname: string | null;
  trigger: string;
  created_at: string;
}

// --- Stats ---
export interface DevTrackerOverview {
  active_milestones: number;
  tasks_by_status: Record<string, number>;
  weekly_activities: number;
  unlinked_activities: number;
}

export interface ActivityTrend {
  date: string;
  count: number;
}

export interface ServiceBreakdown {
  service_id: string;
  count: number;
}

// --- Timeline ---
export interface TimelineDay {
  date: string;
  weekday: string;
  sessions: TimelineSession[];
  unlinked: Activity[];
}

export interface TimelineSession {
  id: number;
  session_id: string;
  title: string | null;
  service_id: string;
  dev_purpose: string | null;
  category: string | null;
  topics: Array<{
    title: string;
    summary: string;
    category: string;
    plan_category: string;
    confidence: number;
    tags: string[];
    files_changed?: string[];
  }> | null;
  duration_seconds: number | null;
  message_count: number | null;
  environment: string | null;
  trigger_source: string | null;
  created_at: string;
  activities: Activity[];
}
