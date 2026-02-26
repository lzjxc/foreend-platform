import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type QueueItemStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface BatchQueueItem {
  id: string;
  batchNum: number;
  status: QueueItemStatus;
  backendTaskId?: string;
  itemsProcessed?: number;
  error?: string;
}

interface BatchQueueState {
  queue: BatchQueueItem[];
  lastCompletedId: string | null;

  setQueue: (queue: BatchQueueItem[]) => void;
  updateItem: (id: string, updates: Partial<BatchQueueItem>) => void;
  markRunning: (id: string) => void;
  markCompleted: (id: string, itemsProcessed?: number) => void;
  markFailed: (id: string, error?: string) => void;
  markFailedAndCancelRemaining: (id: string, error?: string) => void;
  completeAndCancelRemaining: (id: string, itemsProcessed?: number) => void;
  cancelItem: (id: string) => void;
  cancelAll: () => void;
  clearFinished: () => void;
  clearAll: () => void;
  setLastCompletedId: (id: string | null) => void;
}

export const useBatchQueueStore = create<BatchQueueState>()(
  persist(
    (set) => ({
      queue: [],
      lastCompletedId: null,

      setQueue: (queue) => set({ queue, lastCompletedId: null }),

      updateItem: (id, updates) =>
        set((state) => ({
          queue: state.queue.map((q) => (q.id === id ? { ...q, ...updates } : q)),
        })),

      markRunning: (id) =>
        set((state) => ({
          queue: state.queue.map((q) =>
            q.id === id ? { ...q, status: 'running' as const } : q
          ),
        })),

      markCompleted: (id, itemsProcessed) =>
        set((state) => ({
          queue: state.queue.map((q) =>
            q.id === id ? { ...q, status: 'completed' as const, itemsProcessed } : q
          ),
        })),

      markFailed: (id, error) =>
        set((state) => ({
          queue: state.queue.map((q) =>
            q.id === id ? { ...q, status: 'failed' as const, error } : q
          ),
        })),

      markFailedAndCancelRemaining: (id, error) =>
        set((state) => ({
          queue: state.queue.map((q) =>
            q.id === id
              ? { ...q, status: 'failed' as const, error }
              : q.status === 'pending'
                ? { ...q, status: 'cancelled' as const }
                : q
          ),
        })),

      completeAndCancelRemaining: (id, itemsProcessed) =>
        set((state) => ({
          queue: state.queue.map((q) =>
            q.id === id
              ? { ...q, status: 'completed' as const, itemsProcessed }
              : q.status === 'pending'
                ? { ...q, status: 'cancelled' as const }
                : q
          ),
        })),

      cancelItem: (id) =>
        set((state) => ({
          queue: state.queue.map((q) =>
            q.id === id ? { ...q, status: 'cancelled' as const } : q
          ),
        })),

      cancelAll: () =>
        set((state) => ({
          queue: state.queue.map((q) =>
            q.status === 'pending' ? { ...q, status: 'cancelled' as const } : q
          ),
        })),

      clearFinished: () =>
        set((state) => ({
          queue: state.queue.filter(
            (q) => q.status !== 'completed' && q.status !== 'cancelled' && q.status !== 'failed'
          ),
        })),

      clearAll: () => set({ queue: [], lastCompletedId: null }),

      setLastCompletedId: (id) => set({ lastCompletedId: id }),
    }),
    {
      name: 'batch-queue-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
