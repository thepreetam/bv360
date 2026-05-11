import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RequiredShot {
  type: 'photo' | 'video_360';
  duration?: number;
  description: string;
  prefillDrawingSheet: string;
  prefillCategory: string;
  checklistItem: string;
  captured: boolean;
}

export interface WalkthroughPoint {
  id: string;
  title: string;
  instructions: string;
  requiredShots: RequiredShot[];
  completed: boolean;
  capturedShots: string[]; // evidence IDs
}

export interface WalkthroughState {
  currentPointIndex: number;
  points: WalkthroughPoint[];
  setPoints: (points: WalkthroughPoint[]) => void;
  setCurrentPointIndex: (index: number) => void;
  markShotCaptured: (pointIndex: number, shotIndex: number) => void;
  markPointComplete: (pointIndex: number) => void;
  getProgress: () => { completed: number; total: number };
  getCompletion: () => number;
  reset: () => void;
}

export const useWalkthroughStore = create<WalkthroughState>()(
  persist(
    (set, get) => ({
      currentPointIndex: 0,
      points: [],

      setPoints: (points) => set({ points }),

      setCurrentPointIndex: (index) => set({ currentPointIndex: index }),

      markShotCaptured: (pointIndex, shotIndex) =>
        set((state) => ({
          points: state.points.map((point, pIdx) =>
            pIdx === pointIndex
              ? {
                  ...point,
                  requiredShots: point.requiredShots.map((shot, sIdx) =>
                    sIdx === shotIndex ? { ...shot, captured: true } : shot
                  ),
                }
              : point
          ),
        })),

      markPointComplete: (pointIndex) =>
        set((state) => ({
          points: state.points.map((point, idx) =>
            idx === pointIndex ? { ...point, completed: true } : point
          ),
        })),

      getProgress: () => {
        const state = get();
        const completed = state.points.filter((p) => p.completed).length;
        return {
          completed,
          total: state.points.length,
        };
      },

      getCompletion: () => {
        const state = get();
        if (state.points.length === 0) return 0;
        const completed = state.points.filter((p) => p.completed).length;
        return Math.round((completed / state.points.length) * 100);
      },

      reset: () =>
        set({
          currentPointIndex: 0,
          points: [],
        }),
    }),
    {
      name: 'walkthrough-storage',
      version: 1,
    }
  )
);
