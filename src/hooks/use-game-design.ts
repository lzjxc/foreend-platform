import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/game-design';
import type {
  SkillAtomCreate,
  SkillAtomUpdate,
  OriginalSkillCreate,
  OriginalSkillUpdate,
  SkillInstanceCreate,
  SkillInstanceUpdate,
  SkillModifierCreate,
  SkillModifierUpdate,
  RuleCreate,
  RuleUpdate,
  SkillPhase,
} from '@/types/game-design';

// ==================== Query Keys ====================

export const gameDesignKeys = {
  all: ['game-design'] as const,
  atoms: () => [...gameDesignKeys.all, 'atoms'] as const,
  atomList: (params?: { category?: string }) => [...gameDesignKeys.atoms(), 'list', params] as const,
  atomDetail: (id: number) => [...gameDesignKeys.atoms(), 'detail', id] as const,
  atomCategories: () => [...gameDesignKeys.atoms(), 'categories'] as const,
  rules: () => [...gameDesignKeys.all, 'rules'] as const,
  ruleList: () => [...gameDesignKeys.rules(), 'list'] as const,
  originals: () => [...gameDesignKeys.all, 'originals'] as const,
  originalList: () => [...gameDesignKeys.originals(), 'list'] as const,
  originalDetail: (id: number) => [...gameDesignKeys.originals(), 'detail', id] as const,
  instances: () => [...gameDesignKeys.all, 'instances'] as const,
  instanceList: () => [...gameDesignKeys.instances(), 'list'] as const,
  instanceDetail: (id: number) => [...gameDesignKeys.instances(), 'detail', id] as const,
  modifiers: () => [...gameDesignKeys.all, 'modifiers'] as const,
  modifierList: () => [...gameDesignKeys.modifiers(), 'list'] as const,
  stats: () => [...gameDesignKeys.all, 'stats'] as const,
};

// ==================== Atoms ====================

export function useAtoms(category?: string) {
  return useQuery({
    queryKey: gameDesignKeys.atomList({ category }),
    queryFn: () => api.getAtoms({ category, page_size: 100 }),
  });
}

export function useAtom(id: number) {
  return useQuery({
    queryKey: gameDesignKeys.atomDetail(id),
    queryFn: () => api.getAtom(id),
    enabled: id > 0,
  });
}

export function useAtomCategories() {
  return useQuery({
    queryKey: gameDesignKeys.atomCategories(),
    queryFn: api.getAtomCategories,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateAtom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SkillAtomCreate) => api.createAtom(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameDesignKeys.atoms() }); },
  });
}

export function useUpdateAtom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: SkillAtomUpdate & { id: number }) => api.updateAtom(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameDesignKeys.atoms() }); },
  });
}

export function useDeleteAtom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteAtom(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameDesignKeys.atoms() }); },
  });
}

// ==================== Rules ====================

export function useRules() {
  return useQuery({
    queryKey: gameDesignKeys.ruleList(),
    queryFn: () => api.getRules({ page_size: 100 }),
  });
}

export function useCreateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RuleCreate) => api.createRule(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameDesignKeys.rules() }); },
  });
}

export function useUpdateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: RuleUpdate & { id: number }) => api.updateRule(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameDesignKeys.rules() }); },
  });
}

export function useDeleteRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteRule(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameDesignKeys.rules() }); },
  });
}

// ==================== Original Skills ====================

export function useOriginalSkills() {
  return useQuery({
    queryKey: gameDesignKeys.originalList(),
    queryFn: () => api.getOriginalSkills({ page_size: 100 }),
  });
}

export function useOriginalSkill(id: number) {
  return useQuery({
    queryKey: gameDesignKeys.originalDetail(id),
    queryFn: () => api.getOriginalSkill(id),
    enabled: id > 0,
  });
}

export function useCreateOriginalSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OriginalSkillCreate) => api.createOriginalSkill(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameDesignKeys.originals() }); },
  });
}

export function useUpdateOriginalSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: OriginalSkillUpdate & { id: number }) => api.updateOriginalSkill(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameDesignKeys.originals() }); },
  });
}

export function useDeleteOriginalSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteOriginalSkill(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameDesignKeys.originals() }); },
  });
}

export function useAddAtomToOriginal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ skillId, atomId, phase }: { skillId: number; atomId: number; phase?: SkillPhase }) =>
      api.addAtomToOriginalSkill(skillId, atomId, phase),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameDesignKeys.originals() }); },
  });
}

export function useRemoveAtomFromOriginal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ skillId, atomId }: { skillId: number; atomId: number }) =>
      api.removeAtomFromOriginalSkill(skillId, atomId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameDesignKeys.originals() }); },
  });
}

// ==================== Skill Instances ====================

export function useSkillInstances() {
  return useQuery({
    queryKey: gameDesignKeys.instanceList(),
    queryFn: () => api.getSkillInstances({ page_size: 100 }),
  });
}

export function useSkillInstance(id: number) {
  return useQuery({
    queryKey: gameDesignKeys.instanceDetail(id),
    queryFn: () => api.getSkillInstance(id),
    enabled: id > 0,
  });
}

export function useCreateSkillInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SkillInstanceCreate) => api.createSkillInstance(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameDesignKeys.instances() }); },
  });
}

export function useUpdateSkillInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: SkillInstanceUpdate & { id: number }) => api.updateSkillInstance(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameDesignKeys.instances() }); },
  });
}

export function useDeleteSkillInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteSkillInstance(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameDesignKeys.instances() }); },
  });
}

export function useCreateFromOriginal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ originalId, name, skillType }: { originalId: number; name: string; skillType: string }) =>
      api.createInstanceFromOriginal(originalId, name, skillType),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameDesignKeys.instances() }); },
  });
}

export function useAddAtomToInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ instanceId, atomId, phase, slotOrder }: { instanceId: number; atomId: number; phase?: SkillPhase; slotOrder?: number }) =>
      api.addAtomToInstance(instanceId, atomId, phase, slotOrder),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameDesignKeys.instances() }); },
  });
}

export function useRemoveAtomFromInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ instanceId, atomId }: { instanceId: number; atomId: number }) =>
      api.removeAtomFromInstance(instanceId, atomId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameDesignKeys.instances() }); },
  });
}

export function useMountModifier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ instanceId, modifierId, slotOrder, overrideParams }: {
      instanceId: number; modifierId: number; slotOrder?: number; overrideParams?: Record<string, unknown>;
    }) => api.mountModifier(instanceId, modifierId, slotOrder, overrideParams),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameDesignKeys.instances() }); },
  });
}

export function useUnmountModifier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ instanceId, modifierId }: { instanceId: number; modifierId: number }) =>
      api.unmountModifier(instanceId, modifierId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameDesignKeys.instances() }); },
  });
}

export function useAddReference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ instanceId, originalSkillId, notes }: { instanceId: number; originalSkillId: number; notes?: string }) =>
      api.addReference(instanceId, originalSkillId, notes),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameDesignKeys.instances() }); },
  });
}

// ==================== Modifiers ====================

export function useModifiers() {
  return useQuery({
    queryKey: gameDesignKeys.modifierList(),
    queryFn: () => api.getModifiers({ page_size: 100 }),
  });
}

export function useCreateModifier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SkillModifierCreate) => api.createModifier(input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameDesignKeys.modifiers() }); },
  });
}

export function useUpdateModifier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: SkillModifierUpdate & { id: number }) => api.updateModifier(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameDesignKeys.modifiers() }); },
  });
}

export function useDeleteModifier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteModifier(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameDesignKeys.modifiers() }); },
  });
}

// ==================== Stats ====================

export function useDesignStats() {
  return useQuery({
    queryKey: gameDesignKeys.stats(),
    queryFn: api.getDesignStats,
  });
}
