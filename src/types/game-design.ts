// ==================== Enums ====================

export type AtomCategory =
  | 'damage_mode'
  | 'target_mode'
  | 'element_attribute'
  | 'control_effect'
  | 'buff_debuff'
  | 'cast_mode'
  | 'trigger_condition'
  | 'resource_cost'
  | 'field_effect'
  | 'mark_system'
  | 'value_template';

export type AtomRole = 'tag' | 'effect' | 'hybrid';

export type SkillType = 'normal' | 'ultimate' | 'talent';

export type SkillTypeTag = 'active' | 'passive' | 'ultimate';

export type ModifierType = 'gem' | 'passive' | 'equipment';

export type RuleType = 'mutually_exclusive' | 'compatible' | 'requires' | 'enhances';

export type SkillPhase =
  | 'cast'
  | 'projectile'
  | 'impact'
  | 'aftermath'
  | 'field_active'
  | 'field_tick'
  | 'buff_active'
  | 'general';

export type GenerationSource = 'manual' | 'rule_generated' | 'ai_generated';

// ==================== Display labels ====================

export const ATOM_CATEGORY_LABELS: Record<AtomCategory, string> = {
  damage_mode: '伤害模式',
  target_mode: '目标模式',
  element_attribute: '元素属性',
  control_effect: '控制效果',
  buff_debuff: '增益减益',
  cast_mode: '施法模式',
  trigger_condition: '触发条件',
  resource_cost: '资源消耗',
  field_effect: '场地效果',
  mark_system: '标记系统',
  value_template: '数值模板',
};

export const ATOM_ROLE_LABELS: Record<AtomRole, string> = {
  tag: '标签',
  effect: '效果',
  hybrid: '混合',
};

export const SKILL_TYPE_LABELS: Record<SkillType, string> = {
  normal: '普通技能',
  ultimate: '终极技能',
  talent: '天赋',
};

export const SKILL_TYPE_TAG_LABELS: Record<SkillTypeTag, string> = {
  active: '主动',
  passive: '被动',
  ultimate: '终极',
};

export const MODIFIER_TYPE_LABELS: Record<ModifierType, string> = {
  gem: '宝石',
  passive: '被动',
  equipment: '装备',
};

export const RULE_TYPE_LABELS: Record<RuleType, string> = {
  mutually_exclusive: '互斥',
  compatible: '兼容',
  requires: '依赖',
  enhances: '增强',
};

export const SKILL_PHASE_LABELS: Record<SkillPhase, string> = {
  cast: '施法',
  projectile: '弹道',
  impact: '命中',
  aftermath: '后续',
  field_active: '场地激活',
  field_tick: '场地跳动',
  buff_active: 'Buff激活',
  general: '通用',
};

export const GENERATION_SOURCE_LABELS: Record<GenerationSource, string> = {
  manual: '手动创建',
  rule_generated: '规则生成',
  ai_generated: 'AI生成',
};

// ==================== Entities ====================

export interface SkillAtom {
  id: number;
  code: string;
  name: string;
  category: AtomCategory;
  atom_role: AtomRole;
  description: string;
  narrative_keywords: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AtomInSkill {
  atom_id: number;
  code: string;
  name: string;
  category: AtomCategory;
  atom_role: AtomRole;
  phase: SkillPhase;
  relevance_order: number;
}

export interface AtomInInstance {
  atom_id: number;
  code: string;
  name: string;
  category: AtomCategory;
  atom_role: AtomRole;
  phase: SkillPhase;
  slot_order: number;
}

export interface AtomBrief {
  id: number;
  code: string;
  name: string;
  category: AtomCategory;
  atom_role: AtomRole;
}

export interface Rule {
  id: number;
  atom_a_id: number;
  atom_b_id: number;
  atom_a: AtomBrief;
  atom_b: AtomBrief;
  rule_type: RuleType;
  description: string | null;
  priority: number;
  condition: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface OriginalSkill {
  id: number;
  name: string;
  source_game: string;
  character_name: string | null;
  character_class: string | null;
  description: string;
  skill_type_tag: SkillTypeTag;
  tags: string[];
  designer_notes: string | null;
  atoms: AtomInSkill[];
  created_at: string;
  updated_at: string;
}

export interface ModifierInInstance {
  modifier_id: number;
  name: string;
  code: string;
  slot_order: number;
  override_params: Record<string, unknown>;
}

export interface ReferenceInInstance {
  original_skill_id: number;
  name: string;
  source_game: string;
  reference_notes: string | null;
}

export interface SkillInstance {
  id: number;
  name: string;
  description: string | null;
  skill_type: SkillType;
  generation_source: GenerationSource;
  archetype: string | null;
  numeric_params: Record<string, unknown>;
  combo_tags: Record<string, unknown>;
  version: number;
  parent_id: number | null;
  design_score: number | null;
  design_notes: string | null;
  atoms: AtomInInstance[];
  modifiers: ModifierInInstance[];
  references: ReferenceInInstance[];
  created_at: string;
  updated_at: string;
}

export interface SkillModifier {
  id: number;
  name: string;
  code: string;
  description: string;
  modifier_type: ModifierType;
  compatibility_tags: string[];
  incompatibility_tags: string[];
  exclusion_group: string | null;
  effects: Record<string, unknown>;
  max_stacks: number;
  created_at: string;
  updated_at: string;
}

export interface DesignStats {
  atoms: number;
  rules: number;
  original_skills: number;
  skill_instances: number;
  modifiers: number;
  category_breakdown: Record<string, number>;
  generation_breakdown: Record<string, number>;
}

// ==================== Paginated Response ====================

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  page_size: number;
  items: T[];
}

// ==================== Category Info ====================

export interface CategoryInfo {
  category: AtomCategory;
  display_name: string;
  constraints: Record<SkillType, number>;
}

export interface CategoriesResponse {
  categories: CategoryInfo[];
}

// ==================== Create/Update DTOs ====================

export interface SkillAtomCreate {
  code: string;
  name: string;
  category: AtomCategory;
  atom_role?: AtomRole;
  description: string;
  narrative_keywords?: string[];
  metadata?: Record<string, unknown>;
}

export interface SkillAtomUpdate {
  code?: string;
  name?: string;
  category?: AtomCategory;
  atom_role?: AtomRole;
  description?: string;
  narrative_keywords?: string[];
  metadata?: Record<string, unknown>;
}

export interface OriginalSkillCreate {
  name: string;
  source_game: string;
  character_name?: string;
  character_class?: string;
  description: string;
  skill_type_tag: SkillTypeTag;
  tags?: string[];
  designer_notes?: string;
  atoms?: { atom_id: number; phase?: SkillPhase; relevance_order?: number }[];
}

export interface OriginalSkillUpdate {
  name?: string;
  source_game?: string;
  character_name?: string;
  character_class?: string;
  description?: string;
  skill_type_tag?: SkillTypeTag;
  tags?: string[];
  designer_notes?: string;
}

export interface SkillInstanceCreate {
  name: string;
  description?: string;
  skill_type: SkillType;
  generation_source?: GenerationSource;
  archetype?: string;
  numeric_params?: Record<string, unknown>;
  combo_tags?: Record<string, unknown>;
  atoms?: { atom_id: number; phase?: SkillPhase; slot_order?: number }[];
  reference_ids?: number[];
  modifier_ids?: number[];
  parent_id?: number;
}

export interface SkillInstanceUpdate {
  name?: string;
  description?: string;
  skill_type?: SkillType;
  archetype?: string;
  numeric_params?: Record<string, unknown>;
  combo_tags?: Record<string, unknown>;
  design_score?: number;
  design_notes?: string;
}

export interface SkillModifierCreate {
  name: string;
  code: string;
  description: string;
  modifier_type: ModifierType;
  compatibility_tags?: string[];
  incompatibility_tags?: string[];
  exclusion_group?: string;
  effects?: Record<string, unknown>;
  max_stacks?: number;
}

export interface SkillModifierUpdate {
  name?: string;
  description?: string;
  modifier_type?: ModifierType;
  compatibility_tags?: string[];
  incompatibility_tags?: string[];
  exclusion_group?: string;
  effects?: Record<string, unknown>;
  max_stacks?: number;
}

export interface RuleCreate {
  atom_a_id: number;
  atom_b_id: number;
  rule_type: RuleType;
  description?: string;
  priority?: number;
  condition?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface RuleUpdate {
  rule_type?: RuleType;
  description?: string;
  priority?: number;
  condition?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
