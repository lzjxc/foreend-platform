import { create } from 'zustand';
import type { SkillInstance, AtomInInstance, ModifierInInstance } from '@/types/game-design';

interface GameDesignState {
  // Currently editing instance (null = creating new)
  editingInstanceId: number | null;
  setEditingInstanceId: (id: number | null) => void;

  // Draft state for workbench (local before saving)
  draftName: string;
  draftDescription: string;
  draftSkillType: string;
  draftAtoms: AtomInInstance[];
  draftModifiers: ModifierInInstance[];
  draftNumericParams: Record<string, unknown>;

  setDraftName: (name: string) => void;
  setDraftDescription: (desc: string) => void;
  setDraftSkillType: (type: string) => void;
  setDraftAtoms: (atoms: AtomInInstance[]) => void;
  setDraftModifiers: (mods: ModifierInInstance[]) => void;
  setDraftNumericParams: (params: Record<string, unknown>) => void;

  // Load from existing instance
  loadFromInstance: (instance: SkillInstance) => void;

  // Reset draft
  resetDraft: () => void;
}

export const useGameDesignStore = create<GameDesignState>((set) => ({
  editingInstanceId: null,
  setEditingInstanceId: (id) => set({ editingInstanceId: id }),

  draftName: '',
  draftDescription: '',
  draftSkillType: 'normal',
  draftAtoms: [],
  draftModifiers: [],
  draftNumericParams: {},

  setDraftName: (name) => set({ draftName: name }),
  setDraftDescription: (desc) => set({ draftDescription: desc }),
  setDraftSkillType: (type) => set({ draftSkillType: type }),
  setDraftAtoms: (atoms) => set({ draftAtoms: atoms }),
  setDraftModifiers: (mods) => set({ draftModifiers: mods }),
  setDraftNumericParams: (params) => set({ draftNumericParams: params }),

  loadFromInstance: (instance) =>
    set({
      editingInstanceId: instance.id,
      draftName: instance.name,
      draftDescription: instance.description || '',
      draftSkillType: instance.skill_type,
      draftAtoms: instance.atoms,
      draftModifiers: instance.modifiers,
      draftNumericParams: instance.numeric_params,
    }),

  resetDraft: () =>
    set({
      editingInstanceId: null,
      draftName: '',
      draftDescription: '',
      draftSkillType: 'normal',
      draftAtoms: [],
      draftModifiers: [],
      draftNumericParams: {},
    }),
}));
