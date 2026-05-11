import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type VerificationCategory =
  | 'Dimensional'
  | 'Location'
  | 'Material'
  | 'Connection'
  | 'Deficiency'
  | 'As-Built';

export interface AIDetection {
  verificationId: string;
  status: 'PASS' | 'FAIL' | 'FLAG';
  confidence: number;
  boundingBox?: { x: number; y: number; w: number; h: number };
  description: string;
  overridden: boolean;
  overrideReason?: string;
}

export interface Evidence {
  id: string;
  fileUrl: string;
  type: 'photo' | 'video';
  drawingSheet: string;
  detailReference: string;
  category: VerificationCategory;
  linkedChecklistItem?: string;
  timestamp: string;
  aiResults?: AIDetection[];
  gpsLat?: number | null;
  gpsLon?: number | null;
}

export interface EvidenceState {
  evidence: Evidence[];
  filters: {
    category?: VerificationCategory;
    aiStatus?: 'pass' | 'fail' | 'flag' | 'unanalyzed';
    checklistItem?: string;
  };
  addEvidence: (item: Evidence) => void;
  removeEvidence: (id: string) => void;
  updateEvidence: (id: string, item: Partial<Evidence>) => void;
  setFilters: (filters: EvidenceState['filters']) => void;
  setEvidence: (items: Evidence[]) => void;
  getFilteredEvidence: () => Evidence[];
  reset: () => void;
}

export const useEvidenceStore = create<EvidenceState>()(
  persist(
    (set, get) => ({
      evidence: [
        {
          id: 'demo_1',
          fileUrl: 'data:image/svg+xml,%3Csvg width="200" height="200" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="200" height="200" fill="%23e5e7eb"/%3E%3C/svg%3E',
          type: 'photo',
          drawingSheet: 'A4.1 Framing Details',
          detailReference: 'Grid B-3',
          category: 'Dimensional',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'demo_2',
          fileUrl: 'data:image/svg+xml,%3Csvg width="200" height="200" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="200" height="200" fill="%23d1d5db"/%3E%3C/svg%3E',
          type: 'photo',
          drawingSheet: 'A4.2 Fire Rating Details',
          detailReference: 'Detail 4A',
          category: 'Material',
          timestamp: new Date().toISOString(),
          aiResults: [
            {
              verificationId: 'v1',
              status: 'PASS',
              confidence: 0.95,
              description: 'Header properly installed',
              overridden: false,
            },
          ],
        },
      ],
      filters: {},

      addEvidence: (item) =>
        set((state) => ({
          evidence: [...state.evidence, item],
        })),

      removeEvidence: (id) =>
        set((state) => ({
          evidence: state.evidence.filter((item) => item.id !== id),
        })),

      updateEvidence: (id, updates) =>
        set((state) => ({
          evidence: state.evidence.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),

      setFilters: (filters) =>
        set({
          filters,
        }),

      setEvidence: (items: Evidence[]) =>
        set({ evidence: items }),

      getFilteredEvidence: () => {
        const state = get();
        return state.evidence.filter((item) => {
          if (state.filters.category && item.category !== state.filters.category) {
            return false;
          }
          if (state.filters.checklistItem && item.linkedChecklistItem !== state.filters.checklistItem) {
            return false;
          }
          if (state.filters.aiStatus) {
            if (state.filters.aiStatus === 'unanalyzed' && item.aiResults && item.aiResults.length > 0) {
              return false;
            }
            if (state.filters.aiStatus !== 'unanalyzed' && item.aiResults) {
              const hasStatus = item.aiResults.some((r) =>
                r.status === state.filters.aiStatus!.toUpperCase()
              );
              if (!hasStatus) return false;
            }
          }
          return true;
        });
      },

      reset: () =>
        set({
          evidence: [],
          filters: {},
        }),
    }),
    {
      name: 'evidence-storage',
      version: 1,
    }
  )
);
