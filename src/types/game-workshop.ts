// Phase definitions
export type PhaseId = 'concept' | 'iterate' | 'blueprint' | 'balance' | 'content' | 'export';

export interface Phase {
  id: PhaseId;
  label: string;
  description: string;
  icon: string; // Lucide icon name
}

export const PHASES: Phase[] = [
  { id: 'concept', label: '概念探索', description: '输入游戏创意，AI 分析同类游戏并推荐系统框架', icon: 'Search' },
  { id: 'iterate', label: '迭代精炼', description: '补充修改意见，AI 整合反馈并更新设计', icon: 'RefreshCw' },
  { id: 'blueprint', label: '系统蓝图', description: '生成完整的游戏系统设计蓝图', icon: 'Map' },
  { id: 'balance', label: '数值框架', description: '设计经济系统、战斗数值、概率系统', icon: 'Scale' },
  { id: 'content', label: '内容规划', description: 'MVP 内容清单、开发里程碑、技术风险', icon: 'Package' },
  { id: 'export', label: '导出文档', description: '整合为完整的 GDD 概要文档', icon: 'FileText' },
];

export const PHASE_MAP: Record<PhaseId, Phase> = Object.fromEntries(
  PHASES.map((p) => [p.id, p])
) as Record<PhaseId, Phase>;

// AI Section types
export type SectionType = 'info' | 'system' | 'reference' | 'warning' | 'formula';

export interface AISection {
  title: string;
  content: string;
  type: SectionType;
}

export interface AIResult {
  summary: string;
  sections: AISection[];
  suggestions: string[];
  tags: string[];
}

// Entities
export interface Project {
  id: string;
  name: string;
  description: string;
  current_phase: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ProjectDetail extends Project {
  entries: DesignEntry[];
  notes: DesignNote[];
}

export interface DesignEntry {
  id: string;
  project_id: string;
  phase_id: string;
  phase_label: string;
  user_input: string;
  ai_summary: string;
  ai_result: AIResult;
  ai_config_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface DesignNote {
  id: string;
  project_id: string;
  content: string;
  phase_label: string;
  created_at: string;
}

export interface AIConfig {
  id: string;
  name: string;
  model_name: string;
  temperature: number;
  max_tokens: number;
  is_default: boolean;
  extra_params: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// DTOs
export interface ProjectCreate {
  name: string;
  description?: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  current_phase?: string;
  tags?: string[];
}

export interface AnalyzeRequest {
  phase_id: PhaseId;
  user_input: string;
  ai_config_id?: string;
}

export interface NoteCreate {
  content: string;
  phase_label: string;
}
