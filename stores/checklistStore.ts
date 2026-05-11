import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SubItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  isBlocking: boolean;
  subItems: SubItem[];
  completed: boolean;
  evidenceCount: number;
  notes: string;
  decision?: 'pass' | 'fail' | 'hold';
}

export interface ChecklistState {
  items: ChecklistItem[];
  aiRunComplete: boolean;
  stepStatus: string;
  setItems: (items: ChecklistItem[]) => void;
  toggleItemComplete: (itemId: string) => void;
  toggleSubItemComplete: (itemId: string, subItemId: string) => void;
  incrementEvidence: (itemId: string) => void;
  setDecision: (itemId: string, decision: 'pass' | 'fail' | 'hold') => void;
  setAiRunComplete: (complete: boolean) => void;
  setStepStatus: (status: string) => void;
  getBlockingItemsComplete: () => boolean;
  getOverallCompletion: () => number;
  reset: () => void;
}

const initialState: ChecklistItem[] = [];

export const useChecklistStore = create<ChecklistState>()(
  persist(
    (set, get) => ({
      items: initialState,
      aiRunComplete: false,
      stepStatus: 'in_progress',

      setItems: (items) => set({ items }),

      toggleItemComplete: (itemId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          ),
        })),

      toggleSubItemComplete: (itemId, subItemId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  subItems: item.subItems.map((sub) =>
                    sub.id === subItemId ? { ...sub, completed: !sub.completed } : sub
                  ),
                }
              : item
          ),
        })),

      incrementEvidence: (itemId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? { ...item, evidenceCount: item.evidenceCount + 1 }
              : item
          ),
        })),

      setDecision: (itemId, decision) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, decision } : item
          ),
        })),

setAiRunComplete: (complete) => set({ aiRunComplete: complete }),
  setStepStatus: (status) => set({ stepStatus: status }),

  getBlockingItemsComplete: () => {
        const state = get();
        return state.items
          .filter((item) => item.isBlocking)
          .every((item) => item.completed);
      },

      getOverallCompletion: () => {
        const state = get();
        if (state.items.length === 0) return 0;
        const completed = state.items.filter((item) => item.completed).length;
        return Math.round((completed / state.items.length) * 100);
      },

      reset: () => set({ items: initialState, aiRunComplete: false, stepStatus: 'in_progress' }),
    }),
    {
      name: 'checklist-storage',
      version: 1,
    }
  )
);
