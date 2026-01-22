import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PersonState {
  // Currently selected person ID
  selectedPersonId: string | null;
  setSelectedPersonId: (id: string | null) => void;

  // Sensitive field visibility (by field type)
  sensitiveFieldsVisible: Record<string, boolean>;
  toggleSensitiveField: (fieldType: string) => void;
  setSensitiveFieldVisible: (fieldType: string, visible: boolean) => void;
  hideAllSensitiveFields: () => void;

  // Recently viewed persons (for quick access)
  recentlyViewed: string[];
  addToRecentlyViewed: (personId: string) => void;
  clearRecentlyViewed: () => void;
}

const MAX_RECENTLY_VIEWED = 5;

export const usePersonStore = create<PersonState>()(
  persist(
    (set) => ({
      // Selected person
      selectedPersonId: null,
      setSelectedPersonId: (id) => set({ selectedPersonId: id }),

      // Sensitive fields visibility
      sensitiveFieldsVisible: {},
      toggleSensitiveField: (fieldType) =>
        set((state) => ({
          sensitiveFieldsVisible: {
            ...state.sensitiveFieldsVisible,
            [fieldType]: !state.sensitiveFieldsVisible[fieldType],
          },
        })),
      setSensitiveFieldVisible: (fieldType, visible) =>
        set((state) => ({
          sensitiveFieldsVisible: {
            ...state.sensitiveFieldsVisible,
            [fieldType]: visible,
          },
        })),
      hideAllSensitiveFields: () => set({ sensitiveFieldsVisible: {} }),

      // Recently viewed
      recentlyViewed: [],
      addToRecentlyViewed: (personId) =>
        set((state) => {
          const filtered = state.recentlyViewed.filter((id) => id !== personId);
          return {
            recentlyViewed: [personId, ...filtered].slice(0, MAX_RECENTLY_VIEWED),
          };
        }),
      clearRecentlyViewed: () => set({ recentlyViewed: [] }),
    }),
    {
      name: 'person-storage',
      // Only persist selectedPersonId and recentlyViewed
      // sensitiveFieldsVisible should reset on page reload for security
      partialize: (state) => ({
        selectedPersonId: state.selectedPersonId,
        recentlyViewed: state.recentlyViewed,
      }),
    }
  )
);

// Sensitive field types for masking
export const SENSITIVE_FIELD_TYPES = {
  DOCUMENT_NUMBER: 'document_number',
  BANK_ACCOUNT: 'bank_account',
  CARD_NUMBER: 'card_number',
  PHONE_NUMBER: 'phone_number',
  EMAIL: 'email',
  MEDICAL_INSURANCE: 'medical_insurance',
} as const;

export type SensitiveFieldType = (typeof SENSITIVE_FIELD_TYPES)[keyof typeof SENSITIVE_FIELD_TYPES];
