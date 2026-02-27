import { gameDesignClient } from './client';
import type {
  SkillAtom,
  SkillAtomCreate,
  SkillAtomUpdate,
  OriginalSkill,
  OriginalSkillCreate,
  OriginalSkillUpdate,
  SkillInstance,
  SkillInstanceCreate,
  SkillInstanceUpdate,
  SkillModifier,
  SkillModifierCreate,
  SkillModifierUpdate,
  Rule,
  RuleCreate,
  RuleUpdate,
  DesignStats,
  PaginatedResponse,
  CategoriesResponse,
  SkillPhase,
} from '@/types/game-design';

// ==================== Atoms ====================

export async function getAtoms(params?: { category?: string; page?: number; page_size?: number }) {
  const { data } = await gameDesignClient.get<PaginatedResponse<SkillAtom>>('/api/v1/atoms', { params });
  return data;
}

export async function getAtom(id: number) {
  const { data } = await gameDesignClient.get<SkillAtom>(`/api/v1/atoms/${id}`);
  return data;
}

export async function createAtom(input: SkillAtomCreate) {
  const { data } = await gameDesignClient.post<SkillAtom>('/api/v1/atoms', input);
  return data;
}

export async function updateAtom(id: number, input: SkillAtomUpdate) {
  const { data } = await gameDesignClient.patch<SkillAtom>(`/api/v1/atoms/${id}`, input);
  return data;
}

export async function deleteAtom(id: number) {
  await gameDesignClient.delete(`/api/v1/atoms/${id}`);
}

export async function getAtomCategories() {
  const { data } = await gameDesignClient.get<CategoriesResponse>('/api/v1/atoms/categories');
  return data;
}

// ==================== Rules ====================

export async function getRules(params?: { page?: number; page_size?: number }) {
  const { data } = await gameDesignClient.get<PaginatedResponse<Rule>>('/api/v1/rules', { params });
  return data;
}

export async function getRule(id: number) {
  const { data } = await gameDesignClient.get<Rule>(`/api/v1/rules/${id}`);
  return data;
}

export async function createRule(input: RuleCreate) {
  const { data } = await gameDesignClient.post<Rule>('/api/v1/rules', input);
  return data;
}

export async function updateRule(id: number, input: RuleUpdate) {
  const { data } = await gameDesignClient.patch<Rule>(`/api/v1/rules/${id}`, input);
  return data;
}

export async function deleteRule(id: number) {
  await gameDesignClient.delete(`/api/v1/rules/${id}`);
}

// ==================== Original Skills ====================

export async function getOriginalSkills(params?: { page?: number; page_size?: number }) {
  const { data } = await gameDesignClient.get<PaginatedResponse<OriginalSkill>>('/api/v1/original-skills', { params });
  return data;
}

export async function getOriginalSkill(id: number) {
  const { data } = await gameDesignClient.get<OriginalSkill>(`/api/v1/original-skills/${id}`);
  return data;
}

export async function createOriginalSkill(input: OriginalSkillCreate) {
  const { data } = await gameDesignClient.post<OriginalSkill>('/api/v1/original-skills', input);
  return data;
}

export async function updateOriginalSkill(id: number, input: OriginalSkillUpdate) {
  const { data } = await gameDesignClient.patch<OriginalSkill>(`/api/v1/original-skills/${id}`, input);
  return data;
}

export async function deleteOriginalSkill(id: number) {
  await gameDesignClient.delete(`/api/v1/original-skills/${id}`);
}

export async function addAtomToOriginalSkill(skillId: number, atomId: number, phase?: SkillPhase) {
  const { data } = await gameDesignClient.post(`/api/v1/original-skills/${skillId}/atoms`, {
    atom_id: atomId,
    phase: phase || 'general',
  });
  return data;
}

export async function removeAtomFromOriginalSkill(skillId: number, atomId: number) {
  await gameDesignClient.delete(`/api/v1/original-skills/${skillId}/atoms/${atomId}`);
}

// ==================== Skill Instances ====================

export async function getSkillInstances(params?: { page?: number; page_size?: number }) {
  const { data } = await gameDesignClient.get<PaginatedResponse<SkillInstance>>('/api/v1/skill-instances', { params });
  return data;
}

export async function getSkillInstance(id: number) {
  const { data } = await gameDesignClient.get<SkillInstance>(`/api/v1/skill-instances/${id}`);
  return data;
}

export async function createSkillInstance(input: SkillInstanceCreate) {
  const { data } = await gameDesignClient.post<SkillInstance>('/api/v1/skill-instances', input);
  return data;
}

export async function updateSkillInstance(id: number, input: SkillInstanceUpdate) {
  const { data } = await gameDesignClient.patch<SkillInstance>(`/api/v1/skill-instances/${id}`, input);
  return data;
}

export async function deleteSkillInstance(id: number) {
  await gameDesignClient.delete(`/api/v1/skill-instances/${id}`);
}

export async function createInstanceFromOriginal(originalSkillId: number, name: string, skillType: string) {
  const { data } = await gameDesignClient.post<SkillInstance>(
    `/api/v1/skill-instances/from-original/${originalSkillId}`,
    null,
    { params: { name, skill_type: skillType } }
  );
  return data;
}

export async function addAtomToInstance(instanceId: number, atomId: number, phase?: SkillPhase, slotOrder?: number) {
  const { data } = await gameDesignClient.post(`/api/v1/skill-instances/${instanceId}/atoms`, {
    atom_id: atomId,
    phase: phase || 'general',
    slot_order: slotOrder || 0,
  });
  return data;
}

export async function removeAtomFromInstance(instanceId: number, atomId: number) {
  await gameDesignClient.delete(`/api/v1/skill-instances/${instanceId}/atoms/${atomId}`);
}

export async function mountModifier(instanceId: number, modifierId: number, slotOrder?: number, overrideParams?: Record<string, unknown>) {
  const { data } = await gameDesignClient.post(`/api/v1/skill-instances/${instanceId}/modifiers`, {
    modifier_id: modifierId,
    slot_order: slotOrder || 0,
    override_params: overrideParams || {},
  });
  return data;
}

export async function unmountModifier(instanceId: number, modifierId: number) {
  await gameDesignClient.delete(`/api/v1/skill-instances/${instanceId}/modifiers/${modifierId}`);
}

export async function addReference(instanceId: number, originalSkillId: number, notes?: string) {
  const { data } = await gameDesignClient.post(`/api/v1/skill-instances/${instanceId}/references`, {
    original_skill_id: originalSkillId,
    reference_notes: notes,
  });
  return data;
}

// ==================== Modifiers ====================

export async function getModifiers(params?: { page?: number; page_size?: number }) {
  const { data } = await gameDesignClient.get<PaginatedResponse<SkillModifier>>('/api/v1/modifiers', { params });
  return data;
}

export async function getModifier(id: number) {
  const { data } = await gameDesignClient.get<SkillModifier>(`/api/v1/modifiers/${id}`);
  return data;
}

export async function createModifier(input: SkillModifierCreate) {
  const { data } = await gameDesignClient.post<SkillModifier>('/api/v1/modifiers', input);
  return data;
}

export async function updateModifier(id: number, input: SkillModifierUpdate) {
  const { data } = await gameDesignClient.patch<SkillModifier>(`/api/v1/modifiers/${id}`, input);
  return data;
}

export async function deleteModifier(id: number) {
  await gameDesignClient.delete(`/api/v1/modifiers/${id}`);
}

// ==================== Stats ====================

export async function getDesignStats() {
  const { data } = await gameDesignClient.get<DesignStats>('/api/v1/stats');
  return data;
}
