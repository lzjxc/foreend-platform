import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  UploadQueueItem,
  ProcessingItem,
  PendingReviewItem,
  UploadQueueStatus,
  SubmissionStatus,
} from '@/types/homework';
import type { UnconfirmedSubmission } from '@/hooks/use-homework';

// 将 MinIO Tailscale URL 转换为代理路径
const convertMinioUrl = (url: string | undefined | null): string | undefined => {
  if (!url) return undefined;
  // 如果是 Tailscale URL，转换为代理路径
  // https://minio-s3.tail2984bd.ts.net/images/... -> /minio-s3/images/...
  const tailscalePattern = /^https?:\/\/minio-s3\.tail2984bd\.ts\.net\/images\/(.+)$/;
  const match = url.match(tailscalePattern);
  if (match) {
    return `/minio-s3/images/${match[1]}`;
  }
  return url;
};

// 生成唯一 ID（兼容非 HTTPS 环境）
const generateId = () => {
  // crypto.randomUUID() requires secure context (HTTPS)
  // Fallback to a simple UUID generator for HTTP environments
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: generate a UUID-like string
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// 生成批次 ID
const generateBatchId = () => `batch-${Date.now()}`;

// 需要选择类型的项（QR识别失败时）
export interface NeedsTypeItem {
  id: string;
  file: File;
  previewUrl: string;
  addedAt: number;
}

interface GradingQueueState {
  // 上传队列（不持久化，File 对象无法序列化）
  uploadQueue: UploadQueueItem[];
  isUploading: boolean;
  currentBatchId: string | null;

  // 处理中队列（不持久化，需要重新轮询）
  processingQueue: ProcessingItem[];

  // 待核查列表（从服务器加载，不再通过 localStorage 持久化）
  pendingReviews: PendingReviewItem[];

  // 需要选择类型的队列（QR识别失败时）
  needsTypeQueue: NeedsTypeItem[];

  // 用户本地编辑（submissionId -> {index -> correct}），持久化到 localStorage
  localEdits: Record<number, Record<number, boolean>>;

  // 上传队列操作
  addToUploadQueue: (
    files: File[],
    homeworkType: 'math' | 'english' | 'chinese'
  ) => string[];
  removeFromUploadQueue: (id: string) => void;
  clearUploadQueue: () => void;
  updateUploadStatus: (id: string, status: UploadQueueStatus, error?: string) => void;
  setIsUploading: (uploading: boolean) => void;

  // 处理队列操作
  addToProcessingQueue: (item: Omit<ProcessingItem, 'startedAt'>) => void;
  updateProcessingStatus: (id: string, status: SubmissionStatus) => void;
  removeFromProcessingQueue: (id: string) => void;

  // 待核查列表操作
  addToPendingReviews: (item: Omit<PendingReviewItem, 'userEdits' | 'processedAt'>) => void;
  updateUserEdit: (reviewId: string, index: number, correct: boolean) => void;
  removeFromPendingReviews: (id: string) => void;
  clearPendingReviews: () => void;

  // 从服务器加载待核查列表
  loadFromServer: (submissions: UnconfirmedSubmission[]) => void;
  // 按 submissionId 获取/设置用户编辑
  getLocalEdits: (submissionId: number) => Record<number, boolean>;
  setLocalEdit: (submissionId: number, index: number, correct: boolean) => void;
  clearLocalEdits: (submissionId: number) => void;

  // 需要选择类型队列操作
  addToNeedsTypeQueue: (item: NeedsTypeItem) => void;
  removeFromNeedsTypeQueue: (id: string) => void;
  clearNeedsTypeQueue: () => void;

  // 批次操作
  startNewBatch: () => string;
  getCurrentBatchId: () => string;

  // 获取状态
  getUploadQueueItem: (id: string) => UploadQueueItem | undefined;
  getProcessingItem: (id: string) => ProcessingItem | undefined;
  getPendingReview: (id: string) => PendingReviewItem | undefined;
  getPendingReviewBySubmissionId: (submissionId: number) => PendingReviewItem | undefined;
}

export const useGradingQueueStore = create<GradingQueueState>()(
  persist(
    (set, get) => ({
      // 初始状态
      uploadQueue: [],
      isUploading: false,
      currentBatchId: null,
      processingQueue: [],
      pendingReviews: [],
      needsTypeQueue: [],
      localEdits: {},

      // 上传队列操作
      addToUploadQueue: (files, homeworkType) => {
        // Ensure batch is initialized (side effect: creates batch if needed)
        get().getCurrentBatchId();
        const newItems: UploadQueueItem[] = files.map((file) => ({
          id: generateId(),
          file,
          previewUrl: URL.createObjectURL(file),
          homeworkType,
          status: 'queued' as const,
          addedAt: Date.now(),
        }));

        set((state) => ({
          uploadQueue: [...state.uploadQueue, ...newItems],
        }));

        return newItems.map((item) => item.id);
      },

      removeFromUploadQueue: (id) => {
        const item = get().uploadQueue.find((i) => i.id === id);
        if (item?.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
        set((state) => ({
          uploadQueue: state.uploadQueue.filter((i) => i.id !== id),
        }));
      },

      clearUploadQueue: () => {
        const { uploadQueue } = get();
        uploadQueue.forEach((item) => {
          if (item.previewUrl) {
            URL.revokeObjectURL(item.previewUrl);
          }
        });
        set({ uploadQueue: [], isUploading: false });
      },

      updateUploadStatus: (id, status, error) => {
        set((state) => ({
          uploadQueue: state.uploadQueue.map((item) =>
            item.id === id ? { ...item, status, error } : item
          ),
        }));
      },

      setIsUploading: (uploading) => {
        set({ isUploading: uploading });
      },

      // 处理队列操作
      addToProcessingQueue: (item) => {
        set((state) => ({
          processingQueue: [
            ...state.processingQueue,
            { ...item, startedAt: Date.now() },
          ],
        }));
      },

      updateProcessingStatus: (id, status) => {
        set((state) => ({
          processingQueue: state.processingQueue.map((item) =>
            item.id === id ? { ...item, status } : item
          ),
        }));
      },

      removeFromProcessingQueue: (id) => {
        set((state) => ({
          processingQueue: state.processingQueue.filter((item) => item.id !== id),
        }));
      },

      // 待核查列表操作
      addToPendingReviews: (item) => {
        set((state) => ({
          pendingReviews: [
            {
              ...item,
              userEdits: {},
              processedAt: Date.now(),
            },
            ...state.pendingReviews,
          ],
        }));
      },

      updateUserEdit: (reviewId, index, correct) => {
        const review = get().pendingReviews.find((r) => r.id === reviewId);
        const submissionId = review?.submissionId;

        set((state) => ({
          pendingReviews: state.pendingReviews.map((r) =>
            r.id === reviewId
              ? {
                  ...r,
                  userEdits: { ...r.userEdits, [index]: correct },
                }
              : r
          ),
          // 同时更新 localEdits（持久化）
          localEdits: submissionId
            ? {
                ...state.localEdits,
                [submissionId]: {
                  ...(state.localEdits[submissionId] || {}),
                  [index]: correct,
                },
              }
            : state.localEdits,
        }));
      },

      removeFromPendingReviews: (id) => {
        const review = get().pendingReviews.find((r) => r.id === id);
        if (review?.originalPreviewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(review.originalPreviewUrl);
        }
        // 清除对应的 localEdits
        const submissionId = review?.submissionId;
        set((state) => {
          const newLocalEdits = submissionId
            ? (() => {
                const { [submissionId]: _, ...rest } = state.localEdits;
                return rest;
              })()
            : state.localEdits;
          return {
            pendingReviews: state.pendingReviews.filter((r) => r.id !== id),
            localEdits: newLocalEdits,
          };
        });
      },

      clearPendingReviews: () => {
        const { pendingReviews } = get();
        pendingReviews.forEach((review) => {
          if (review.originalPreviewUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(review.originalPreviewUrl);
          }
        });
        set({ pendingReviews: [] });
      },

      // 需要选择类型队列操作
      addToNeedsTypeQueue: (item) => {
        set((state) => ({
          needsTypeQueue: [...state.needsTypeQueue, item],
        }));
      },

      removeFromNeedsTypeQueue: (id) => {
        const item = get().needsTypeQueue.find((i) => i.id === id);
        if (item?.previewUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
        }
        set((state) => ({
          needsTypeQueue: state.needsTypeQueue.filter((i) => i.id !== id),
        }));
      },

      clearNeedsTypeQueue: () => {
        const { needsTypeQueue } = get();
        needsTypeQueue.forEach((item) => {
          if (item.previewUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(item.previewUrl);
          }
        });
        set({ needsTypeQueue: [] });
      },

      // 从服务器加载待核查列表
      loadFromServer: (submissions) => {
        const { localEdits } = get();
        const newPendingReviews: PendingReviewItem[] = submissions.map((sub) => {
          // 合并服务器结果和本地编辑
          const serverEdits: Record<number, boolean> = {};
          // 转换 results 类型（undefined -> null）
          const mappedResults = (sub.results ?? []).map((r) => {
            const idx = r.problem_index ?? r.word_index ?? 0;
            serverEdits[idx] = r.correct;
            return {
              problem_index: r.problem_index ?? null,
              word_index: r.word_index ?? null,
              word: r.word ?? null,
              correct: r.correct,
              student_answer: r.student_answer ?? null,
              student_spelling: r.student_spelling ?? null,
              correct_answer: r.correct_answer ?? null,
            };
          });
          // 本地编辑优先
          const userEdits = { ...serverEdits, ...(localEdits[sub.id] || {}) };

          // 为语文作业构造 neatnessResult 对象
          const neatnessResult =
            sub.homework_type === 'chinese' && sub.neatness_score != null
              ? {
                  submission_id: sub.id,
                  homework_id: sub.homework_record_id ?? undefined,
                  status: sub.status as 'pending' | 'processing' | 'graded' | 'failed',
                  average_score: sub.neatness_score ?? null,
                  chars: sub.neatness_details?.chars || [],
                  overall_feedback: sub.neatness_details?.overall_feedback || '',
                  confidence: (sub.neatness_details?.confidence as
                    | 'high'
                    | 'medium'
                    | 'low') || null,
                  error_message: sub.error_message ?? undefined,
                  passed: (sub.neatness_score ?? 0) >= 60,
                }
              : undefined;

          return {
            id: `server-${sub.id}`,
            submissionId: sub.id,
            homeworkRecordId: sub.homework_record_id ?? undefined,
            homeworkType: sub.homework_type ?? 'math',
            homeworkDate: sub.homework_date ?? undefined,
            originalPreviewUrl: convertMinioUrl(sub.image_url) || '',
            annotatedPreviewUrl: convertMinioUrl(sub.annotated_image_url),
            status: sub.status,
            totalCorrect: sub.total_correct,
            totalWrong: sub.total_wrong,
            results: mappedResults,
            userEdits,
            processedAt: new Date(sub.submitted_at).getTime(),
            gradingMode: sub.grading_mode ?? undefined,
            neatnessScore: sub.neatness_score ?? undefined,
            neatnessDetails: sub.neatness_details ?? undefined,
            neatnessResult,
            confidence: sub.confidence ?? undefined,
            errorMessage: sub.error_message ?? undefined,
          };
        });
        set({ pendingReviews: newPendingReviews });
      },

      // 按 submissionId 获取用户编辑
      getLocalEdits: (submissionId) => {
        return get().localEdits[submissionId] || {};
      },

      // 设置单个编辑
      setLocalEdit: (submissionId, index, correct) => {
        set((state) => ({
          localEdits: {
            ...state.localEdits,
            [submissionId]: {
              ...(state.localEdits[submissionId] || {}),
              [index]: correct,
            },
          },
        }));
      },

      // 清除某个 submission 的本地编辑（确认后调用）
      clearLocalEdits: (submissionId) => {
        set((state) => {
          const { [submissionId]: _, ...rest } = state.localEdits;
          return { localEdits: rest };
        });
      },

      // 批次操作
      startNewBatch: () => {
        const batchId = generateBatchId();
        set({ currentBatchId: batchId });
        return batchId;
      },

      getCurrentBatchId: () => {
        let { currentBatchId } = get();
        if (!currentBatchId) {
          currentBatchId = generateBatchId();
          set({ currentBatchId });
        }
        return currentBatchId;
      },

      // 获取状态
      getUploadQueueItem: (id) => get().uploadQueue.find((i) => i.id === id),
      getProcessingItem: (id) => get().processingQueue.find((i) => i.id === id),
      getPendingReview: (id) => get().pendingReviews.find((r) => r.id === id),
      getPendingReviewBySubmissionId: (submissionId) =>
        get().pendingReviews.find((r) => r.submissionId === submissionId),
    }),
    {
      name: 'grading-queue-storage',
      // 只持久化用户本地编辑（pendingReviews 从服务器加载）
      partialize: (state) => ({
        localEdits: state.localEdits,
      }),
    }
  )
);

// 选择器 hooks
export const useUploadQueue = () => useGradingQueueStore((state) => state.uploadQueue);
export const useProcessingQueue = () => useGradingQueueStore((state) => state.processingQueue);
export const usePendingReviews = () => useGradingQueueStore((state) => state.pendingReviews);
export const useIsUploading = () => useGradingQueueStore((state) => state.isUploading);
export const useNeedsTypeQueue = () => useGradingQueueStore((state) => state.needsTypeQueue);
