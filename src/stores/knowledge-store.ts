import { create } from 'zustand';
import type {
  CaptureMode,
  ProcessingStep,
  ProcessingStepStatus,
} from '@/types/knowledge';

// Active tab in the Knowledge Hub UI
export type KnowledgeTab = 'capture' | 'search' | 'ontology' | 'gaps' | 'graph';

// Source selection state
export interface SourceSelection {
  lv1: string | null;
  lv2: string | null;
  lv3: string | null;
  lv4: string | null;
}

interface KnowledgeState {
  // Capture mode
  captureMode: CaptureMode;
  setCaptureMode: (mode: CaptureMode) => void;

  // Source selection for capture form
  selectedSource: SourceSelection;
  setSourceLevel: (level: keyof SourceSelection, value: string | null) => void;
  resetSource: () => void;

  // Active tab navigation
  activeTab: KnowledgeTab;
  setActiveTab: (tab: KnowledgeTab) => void;

  // Processing steps for real-time UI feedback during capture
  processingSteps: ProcessingStep[];
  setStepStatus: (key: string, status: ProcessingStepStatus) => void;
  resetProcessing: () => void;
}

const DEFAULT_PROCESSING_STEPS: ProcessingStep[] = [
  { key: 'parse', label: 'Parsing text', status: 'pending' },
  { key: 'classify', label: 'Classifying domain', status: 'pending' },
  { key: 'extract', label: 'Extracting concepts', status: 'pending' },
  { key: 'connect', label: 'Finding connections', status: 'pending' },
  { key: 'store', label: 'Storing atoms', status: 'pending' },
];

const INITIAL_SOURCE: SourceSelection = {
  lv1: null,
  lv2: null,
  lv3: null,
  lv4: null,
};

export const useKnowledgeStore = create<KnowledgeState>()((set) => ({
  // Capture mode
  captureMode: 'excerpt',
  setCaptureMode: (mode) => set({ captureMode: mode }),

  // Source selection
  selectedSource: { ...INITIAL_SOURCE },
  setSourceLevel: (level, value) =>
    set((state) => {
      const updated = { ...state.selectedSource, [level]: value };
      // Clear child levels when parent changes
      if (level === 'lv1') {
        updated.lv2 = null;
        updated.lv3 = null;
        updated.lv4 = null;
      } else if (level === 'lv2') {
        updated.lv3 = null;
        updated.lv4 = null;
      } else if (level === 'lv3') {
        updated.lv4 = null;
      }
      return { selectedSource: updated };
    }),
  resetSource: () => set({ selectedSource: { ...INITIAL_SOURCE } }),

  // Active tab
  activeTab: 'capture',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Processing steps
  processingSteps: DEFAULT_PROCESSING_STEPS.map((s) => ({ ...s })),
  setStepStatus: (key, status) =>
    set((state) => ({
      processingSteps: state.processingSteps.map((step) =>
        step.key === key ? { ...step, status } : step
      ),
    })),
  resetProcessing: () =>
    set({
      processingSteps: DEFAULT_PROCESSING_STEPS.map((s) => ({ ...s })),
    }),
}));
