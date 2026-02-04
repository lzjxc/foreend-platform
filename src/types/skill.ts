// Skill source types
export type SkillSource = 'user-command' | 'user-skill' | 'plugin-skill' | 'custom';

// Skill status types
export type SkillStatus = 'active' | 'deprecated' | 'draft';

// Skill entity
export interface Skill {
  id: string;
  name: string;
  description: string | null;
  source: SkillSource;
  category: string | null;
  tags: string[];
  plugin_name: string | null;
  plugin_version: string | null;
  content: string;
  frontmatter: Record<string, unknown> | null;
  file_path: string | null;
  file_hash: string | null;
  version: number;
  status: SkillStatus;
  created_at: string;
  updated_at: string | null;
}

// Skill creation input
export interface SkillCreate {
  id: string;
  name: string;
  description?: string;
  source: SkillSource;
  category?: string;
  tags?: string[];
  plugin_name?: string;
  plugin_version?: string;
  content: string;
  frontmatter?: Record<string, unknown>;
  file_path?: string;
  file_hash?: string;
  status?: SkillStatus;
}

// Skill update input
export interface SkillUpdate {
  name?: string;
  description?: string;
  category?: string;
  tags?: string[];
  plugin_version?: string;
  content?: string;
  frontmatter?: Record<string, unknown>;
  file_path?: string;
  file_hash?: string;
  status?: SkillStatus;
  change_summary?: string;
}

// Skill version history entry
export interface SkillVersion {
  id: number;
  skill_id: string;
  version: number;
  content: string;
  frontmatter: Record<string, unknown> | null;
  change_summary: string | null;
  created_at: string;
}

// Skill list response
export interface SkillListResponse {
  skills: Skill[];
  total: number;
}

// Skill list filters
export interface SkillFilters {
  source?: SkillSource;
  category?: string;
  status?: SkillStatus;
  tag?: string;
  plugin_name?: string;
  q?: string;
}

// Usage record
export interface SkillUsageRecord {
  id: number;
  skill_id: string;
  app_id: string;
  project_path: string | null;
  triggered_at: string;
  duration_ms: number | null;
  success: boolean;
  error_message: string | null;
  context: Record<string, unknown> | null;
  parent_usage_id: number | null;  // ID of parent if invoked by another skill
}

// Usage stats entry
export interface SkillUsageStat {
  skill_id: string | null;
  app_id: string | null;
  date: string | null;
  count: number;
  success_count: number;
  avg_duration_ms: number | null;
  direct_count: number | null;   // Count of direct invocations (no parent)
  nested_count: number | null;   // Count of nested invocations (has parent)
}

// Usage stats response
export interface SkillUsageStatsResponse {
  stats: SkillUsageStat[];
  period: {
    start: string;
    end: string;
  };
  total_usage: number;
}

// Usage list response
export interface SkillUsageListResponse {
  records: SkillUsageRecord[];
  total: number;
}

// Source display config
export const SKILL_SOURCE_CONFIG: Record<SkillSource, { label: string; color: string }> = {
  'user-command': { label: '用户命令', color: 'bg-blue-100 text-blue-800' },
  'user-skill': { label: '用户技能', color: 'bg-green-100 text-green-800' },
  'plugin-skill': { label: '插件技能', color: 'bg-purple-100 text-purple-800' },
  'custom': { label: '自定义', color: 'bg-gray-100 text-gray-800' },
};

export const SKILL_STATUS_CONFIG: Record<SkillStatus, { label: string; color: string }> = {
  active: { label: '活跃', color: 'bg-green-100 text-green-800' },
  deprecated: { label: '已弃用', color: 'bg-orange-100 text-orange-800' },
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
};
