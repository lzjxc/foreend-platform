import { useCallback, useEffect, useState } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useGradingQueueStore, type NeedsTypeItem } from '@/stores/grading-queue-store';
import { homeworkClient } from '@/api/client';
import {
  usePendingSubmissions,
  useDeleteSubmission,
  useUpdateSubmissionType,
  useOverrideNeatness,
} from '@/hooks/use-homework';
import type {
  GradeResult,
  NeatnessResult,
  ApiResponse,
} from '@/types/homework';

// 批量智能批改 API 响应类型
interface SmartGradeBatchResponse {
  success: boolean;
  data?: {
    submission_ids: number[];
    total_success: number;
    total_failed: number;
    failed_files: string[] | null;
    status: string;
    message: string;
  };
  message?: string;
}

// 轮询批改状态
function useSubmissionStatusPolling(submissionIds: number[]) {
  return useQueries({
    queries: submissionIds.map((id) => ({
      queryKey: ['submission-status', id],
      queryFn: async () => {
        const { data } = await homeworkClient.get<ApiResponse<GradeResult>>(
          `/api/v1/grade/submissions/${id}`
        );
        return data.data;
      },
      refetchInterval: (query: { state: { data?: GradeResult } }) => {
        const status = query.state.data?.status;
        return status === 'pending' || status === 'processing' ? 2000 : false;
      },
      enabled: id > 0,
    })),
  });
}

// 轮询语文规范状态
function useNeatnessStatusPolling(submissionIds: number[]) {
  return useQueries({
    queries: submissionIds.map((id) => ({
      queryKey: ['neatness-status', id],
      queryFn: async () => {
        const { data } = await homeworkClient.get<ApiResponse<NeatnessResult>>(
          `/api/v1/grade/submissions/${id}/neatness`
        );
        return data.data;
      },
      refetchInterval: (query: { state: { data?: NeatnessResult } }) => {
        // 使用 status 字段判断是否继续轮询
        const status = query.state.data?.status;
        const isProcessing = status === 'pending' || status === 'processing';
        return isProcessing ? 2000 : false;
      },
      enabled: id > 0,
    })),
  });
}

export function useGradingQueue() {
  const queryClient = useQueryClient();
  const store = useGradingQueueStore();
  // 单独获取 loadFromServer 避免依赖整个 store 导致无限循环
  const loadFromServer = useGradingQueueStore((state) => state.loadFromServer);
  const [confirmingIds, setConfirmingIds] = useState<Set<string>>(new Set());
  const [isConfirmingAll, setIsConfirmingAll] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [changingTypeIds, setChangingTypeIds] = useState<Set<string>>(new Set());
  const [overridingNeatnessIds, setOverridingNeatnessIds] = useState<Set<string>>(new Set());

  // API mutations
  const deleteSubmissionMutation = useDeleteSubmission();
  const updateTypeMutation = useUpdateSubmissionType();
  const overrideNeatnessMutation = useOverrideNeatness();

  // 从服务器获取未确认的提交列表（带自动轮询）
  const { data: serverSubmissions, isLoading: isLoadingServer } = usePendingSubmissions();

  // 服务器数据变化时同步到 store
  useEffect(() => {
    if (serverSubmissions) {
      loadFromServer(serverSubmissions);
    }
  }, [serverSubmissions, loadFromServer]);

  // 获取处理中的数学/英语 submission IDs
  const mathEnglishProcessingIds = store.processingQueue
    .filter((p) => p.homeworkType !== 'chinese' && ['pending', 'processing'].includes(p.status))
    .map((p) => p.submissionId);

  // 获取处理中的语文 submission IDs
  const chineseProcessingIds = store.processingQueue
    .filter((p) => p.homeworkType === 'chinese' && ['pending', 'processing'].includes(p.status))
    .map((p) => p.submissionId);

  // 轮询状态
  const mathEnglishStatusQueries = useSubmissionStatusPolling(mathEnglishProcessingIds);
  const chineseStatusQueries = useNeatnessStatusPolling(chineseProcessingIds);

  // 根据结果推断作业类型
  const inferHomeworkType = (result: GradeResult): 'math' | 'english' | 'chinese' => {
    // 1. 如果是规范评分模式，是语文
    if (result.grading_mode === 'neatness' || result.neatness_score != null) {
      return 'chinese';
    }
    // 2. 如果结果中有 word_index，是英语
    if (result.results?.some((r: any) => r.word_index != null)) {
      return 'english';
    }
    // 3. 否则默认是数学
    return 'math';
  };

  // 处理轮询结果 - 数学/英语
  useEffect(() => {
    mathEnglishStatusQueries.forEach((query, index) => {
      if (!query.data) return;
      const submissionId = mathEnglishProcessingIds[index];
      const processingItem = store.processingQueue.find((p) => p.submissionId === submissionId);
      if (!processingItem) return;

      const result = query.data;

      // 更新处理状态
      if (result.status !== processingItem.status) {
        store.updateProcessingStatus(processingItem.id, result.status);
      }

      // 如果处理完成，移到待核查列表
      if (result.status === 'graded') {
        // 根据结果推断实际的作业类型
        const actualHomeworkType = inferHomeworkType(result);

        // 如果是语文规范评分，特殊处理
        if (actualHomeworkType === 'chinese') {
          store.addToPendingReviews({
            id: processingItem.id,
            submissionId: result.id,
            homeworkType: 'chinese',
            homeworkRecordId: result.homework_record_id ?? 0,
            homeworkDate: new Date().toISOString().split('T')[0],
            originalPreviewUrl: processingItem.originalPreviewUrl,
            imagePath: result.image_path,
            neatnessResult: {
              submission_id: result.id,
              homework_id: result.homework_record_id ?? 0,
              status: result.status,
              average_score: result.neatness_score ?? null,
              chars: result.neatness_details?.chars || [],
              overall_feedback: result.neatness_details?.overall_feedback || '',
              confidence: (result.neatness_details?.confidence as 'high' | 'medium' | 'low') || null,
              error_message: result.error_message,
              passed: (result.neatness_score ?? 0) >= 60,
            },
            batchId: store.getCurrentBatchId(),
          });
        } else {
          // 数学或英语
          store.addToPendingReviews({
            id: processingItem.id,
            submissionId: result.id,
            homeworkType: actualHomeworkType,
            homeworkRecordId: result.homework_record_id ?? 0,
            homeworkDate: new Date().toISOString().split('T')[0],
            originalPreviewUrl: processingItem.originalPreviewUrl,
            annotatedImageUrl: result.annotated_image_path
              ? `/homework-api${result.annotated_image_path}`
              : undefined,
            imagePath: result.image_path,
            results: result.results,
            confidence: result.confidence,
            totalCorrect: result.total_correct,
            totalWrong: result.total_wrong,
            batchId: store.getCurrentBatchId(),
          });
        }
        store.removeFromProcessingQueue(processingItem.id);
        toast.success(`${processingItem.originalFileName} 识别完成`);
      } else if (result.status === 'failed') {
        store.removeFromProcessingQueue(processingItem.id);
        toast.error(`${processingItem.originalFileName} 识别失败: ${result.error_message || '未知错误'}`);
      }
    });
  }, [mathEnglishStatusQueries, mathEnglishProcessingIds, store]);

  // 处理轮询结果 - 语文
  useEffect(() => {
    chineseStatusQueries.forEach((query, index) => {
      if (!query.data) return;
      const submissionId = chineseProcessingIds[index];
      const processingItem = store.processingQueue.find((p) => p.submissionId === submissionId);
      if (!processingItem) return;

      const result = query.data;

      // 使用 status 字段判断是否完成
      if (result.status === 'graded') {
        store.addToPendingReviews({
          id: processingItem.id,
          submissionId: result.submission_id,
          homeworkType: 'chinese',
          homeworkRecordId: result.homework_id ?? 0, // 独立批改时为 null
          homeworkDate: new Date().toISOString().split('T')[0],
          originalPreviewUrl: processingItem.originalPreviewUrl,
          imagePath: '',
          neatnessResult: {
            ...result,
            passed: (result.average_score ?? 0) >= 60,
          },
          batchId: store.getCurrentBatchId(),
        });
        store.removeFromProcessingQueue(processingItem.id);
        toast.success(`${processingItem.originalFileName} 规范评估完成`);
      } else if (result.status === 'failed') {
        store.removeFromProcessingQueue(processingItem.id);
        toast.error(`${processingItem.originalFileName} 规范评估失败: ${result.error_message || '未知错误'}`);
      }
    });
  }, [chineseStatusQueries, chineseProcessingIds, store]);

  // 批量上传文件（使用智能批改批量接口）
  const uploadFilesBatch = useCallback(
    async (
      items: Array<{ file: File; previewUrl: string; id: string }>,
      homeworkType?: 'math' | 'english' | 'chinese'
    ) => {
      if (items.length === 0) return { success: 0, needsType: 0, failed: 0 };

      const formData = new FormData();
      // 添加所有文件
      for (const item of items) {
        formData.append('files', item.file);
        store.updateUploadStatus(item.id, 'uploading');
      }
      // 如果指定了类型则添加（API 参数名是 fallback_type）
      if (homeworkType) {
        formData.append('fallback_type', homeworkType);
      }

      try {
        const { data } = await homeworkClient.post<SmartGradeBatchResponse>(
          '/api/v1/grade/smart-grade-batch',
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        if (!data.success || !data.data) {
          throw new Error(data.message || '批量上传失败');
        }

        const { submission_ids, total_success, total_failed, failed_files } = data.data;

        // 按顺序匹配 submission_ids 到上传的文件
        // 假设后端返回的 ID 顺序和上传文件顺序一致
        let successIndex = 0;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const isFailed = failed_files?.includes(item.file.name);

          if (isFailed) {
            // 文件上传失败
            store.updateUploadStatus(item.id, 'failed', '上传失败');
            toast.error(`${item.file.name}: 上传失败`);
          } else if (successIndex < submission_ids.length) {
            // 成功，添加到处理队列
            const submissionId = submission_ids[successIndex];
            store.updateUploadStatus(item.id, 'uploaded');
            store.addToProcessingQueue({
              id: item.id,
              submissionId,
              homeworkType: homeworkType || 'math', // 使用指定类型或默认
              originalFileName: item.file.name,
              originalPreviewUrl: item.previewUrl,
              status: 'pending',
            });
            store.removeFromUploadQueue(item.id);
            successIndex++;
          }
        }

        return { success: total_success, needsType: 0, failed: total_failed };
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || '批量上传失败';
        // 标记所有项为失败
        for (const item of items) {
          store.updateUploadStatus(item.id, 'failed', errorMessage);
        }
        toast.error(errorMessage);
        return { success: 0, needsType: 0, failed: items.length };
      }
    },
    [store]
  );

  // 处理上传队列（批量上传）
  const processUploadQueue = useCallback(async () => {
    const currentQueue = useGradingQueueStore.getState().uploadQueue;
    const queuedItems = currentQueue.filter((item) => item.status === 'queued');
    if (queuedItems.length === 0) return;

    useGradingQueueStore.getState().setIsUploading(true);

    // 批量上传所有文件，默认使用 math（实际类型会从结果推断）
    const result = await uploadFilesBatch(
      queuedItems.map((item) => ({
        file: item.file,
        previewUrl: item.previewUrl,
        id: item.id,
      })),
      'math' // 默认类型，后端会根据图片内容自动识别实际类型
    );

    useGradingQueueStore.getState().setIsUploading(false);

    // 显示上传结果
    if (result.success > 0) {
      toast.success(`${result.success} 个文件上传成功`);
    }
    if (result.needsType > 0) {
      toast.info(`${result.needsType} 个文件需要选择作业类型`);
    }
  }, [uploadFilesBatch]);

  // 重试上传（带用户选择的类型，使用批量接口）
  const retryWithType = useCallback(
    async (items: NeedsTypeItem[], homeworkType: 'math' | 'english' | 'chinese') => {
      useGradingQueueStore.getState().setIsUploading(true);

      // 准备批量上传的数据
      const uploadItems = items.map((item) => ({
        file: item.file,
        previewUrl: item.previewUrl,
        id: item.id,
      }));

      // 从需要类型队列移除
      for (const item of items) {
        store.removeFromNeedsTypeQueue(item.id);
      }

      // 批量上传（带指定类型）
      const result = await uploadFilesBatch(uploadItems, homeworkType);

      useGradingQueueStore.getState().setIsUploading(false);

      // 显示结果
      if (result.success > 0) {
        toast.success(`${result.success} 个文件上传成功`);
      }
    },
    [store, uploadFilesBatch]
  );

  // 添加文件并开始上传（智能模式，不需要指定类型）
  const addFiles = useCallback(
    async (files: File[]) => {
      // 为每个文件创建上传项（使用占位类型，实际由后端智能识别）
      // 这里使用 'math' 作为占位符，实际类型由 smart-grade 识别
      store.addToUploadQueue(files, 'math');
      // 自动开始上传
      setTimeout(() => processUploadQueue(), 100);
    },
    [store, processUploadQueue]
  );

  // 添加文件并指定类型（用于重试场景）
  const addFilesWithType = useCallback(
    async (files: File[], homeworkType: 'math' | 'english' | 'chinese') => {
      store.addToUploadQueue(files, homeworkType);
      // 自动开始上传
      setTimeout(() => processUploadQueue(), 100);
    },
    [store, processUploadQueue]
  );

  // 确认单个
  const confirmReview = useCallback(
    async (reviewId: string) => {
      const review = store.getPendingReview(reviewId);
      if (!review) return;

      setConfirmingIds((prev) => new Set(prev).add(reviewId));

      try {
        // 构建最终结果（合并用户编辑）
        const finalResults = (review.results || []).map((result, index) => ({
          index,
          correct: review.userEdits[index] ?? result.correct,
        }));

        // 使用 confirm-standalone 端点（适用于独立批改模式）
        await homeworkClient.post('/api/v1/grade/confirm-standalone', {
          submission_id: review.submissionId,
          results: finalResults,
        });

        store.removeFromPendingReviews(reviewId);
        queryClient.invalidateQueries({ queryKey: ['recent-submissions'] });
        queryClient.invalidateQueries({ queryKey: ['homework', 'unconfirmed-submissions'] });
        toast.success('提交成功');
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || '提交失败';
        toast.error(errorMessage);
      } finally {
        setConfirmingIds((prev) => {
          const next = new Set(prev);
          next.delete(reviewId);
          return next;
        });
      }
    },
    [store, queryClient]
  );

  // 全部确认
  const confirmAllReviews = useCallback(async () => {
    const reviews = store.pendingReviews;
    if (reviews.length === 0) {
      toast.info('没有待核查项');
      return;
    }

    setIsConfirmingAll(true);

    try {
      for (const review of reviews) {
        // 构建最终结果（合并用户编辑）
        const finalResults = (review.results || []).map((result, index) => ({
          index,
          correct: review.userEdits[index] ?? result.correct,
        }));

        // 使用 confirm-standalone 端点（适用于独立批改模式）
        await homeworkClient.post('/api/v1/grade/confirm-standalone', {
          submission_id: review.submissionId,
          results: finalResults,
        });
      }

      store.clearPendingReviews();
      queryClient.invalidateQueries({ queryKey: ['recent-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['homework', 'unconfirmed-submissions'] });
      toast.success(`已提交 ${reviews.length} 项`);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || '部分提交失败';
      toast.error(errorMessage);
    } finally {
      setIsConfirmingAll(false);
    }
  }, [store, queryClient]);

  // 软删除提交记录（从数据库删除）
  const deleteReview = useCallback(
    async (reviewId: string) => {
      const review = store.getPendingReview(reviewId);
      if (!review || !review.submissionId) {
        // 如果没有 submissionId（本地未上传成功的），直接从 store 删除
        store.removeFromPendingReviews(reviewId);
        return;
      }

      try {
        await deleteSubmissionMutation.mutateAsync(review.submissionId);
        store.removeFromPendingReviews(reviewId);
        toast.success('已删除');
      } catch (error: any) {
        const errorMessage = error?.response?.data?.detail || error?.message || '删除失败';
        toast.error(errorMessage);
      }
    },
    [store, deleteSubmissionMutation]
  );

  // 全部删除（软删除所有）
  const clearAllReviews = useCallback(async () => {
    const reviews = store.pendingReviews;
    if (reviews.length === 0) {
      return;
    }

    setIsClearingAll(true);

    try {
      // 收集所有 submissionId
      const submissionIds = reviews
        .map((r) => r.submissionId)
        .filter((id): id is number => id !== undefined && id !== null);

      // 逐个删除
      for (const submissionId of submissionIds) {
        try {
          await deleteSubmissionMutation.mutateAsync(submissionId);
        } catch {
          // 忽略单个错误
        }
      }

      // 先清空本地状态
      store.clearPendingReviews();
      // 刷新服务器数据
      await queryClient.invalidateQueries({
        queryKey: ['homework', 'unconfirmed-submissions'],
      });
      toast.success('已删除全部');
    } finally {
      setIsClearingAll(false);
    }
  }, [store, deleteSubmissionMutation, queryClient]);

  // 修改作业类型
  const changeReviewType = useCallback(
    async (reviewId: string, newType: 'math' | 'english' | 'chinese') => {
      const review = store.getPendingReview(reviewId);
      if (!review || !review.submissionId) {
        toast.error('无法修改类型');
        return;
      }

      setChangingTypeIds((prev) => new Set(prev).add(reviewId));

      try {
        await updateTypeMutation.mutateAsync({
          submissionId: review.submissionId,
          homeworkType: newType,
        });
        toast.success(`类型已修改为${newType === 'math' ? '数学' : newType === 'english' ? '英语' : '语文'}，正在重新批改...`);
        // 刷新待核查列表
        queryClient.invalidateQueries({ queryKey: ['homework', 'unconfirmed-submissions'] });
      } catch (error: any) {
        const errorMessage = error?.response?.data?.detail || error?.message || '修改失败';
        toast.error(errorMessage);
      } finally {
        setChangingTypeIds((prev) => {
          const next = new Set(prev);
          next.delete(reviewId);
          return next;
        });
      }
    },
    [store, updateTypeMutation, queryClient]
  );

  // 手动覆盖语文工整度通过/不通过
  const overrideNeatness = useCallback(
    async (reviewId: string, passed: boolean) => {
      const review = store.getPendingReview(reviewId);
      if (!review || !review.submissionId) {
        toast.error('无法修改评分');
        return;
      }

      setOverridingNeatnessIds((prev) => new Set(prev).add(reviewId));

      try {
        await overrideNeatnessMutation.mutateAsync({
          submissionId: review.submissionId,
          passed,
        });
        toast.success(passed ? '已改为通过' : '已改为不通过');
        // 刷新待核查列表
        queryClient.invalidateQueries({ queryKey: ['homework', 'unconfirmed-submissions'] });
      } catch (error: any) {
        const errorMessage = error?.response?.data?.detail || error?.message || '修改失败';
        toast.error(errorMessage);
      } finally {
        setOverridingNeatnessIds((prev) => {
          const next = new Set(prev);
          next.delete(reviewId);
          return next;
        });
      }
    },
    [store, overrideNeatnessMutation, queryClient]
  );

  return {
    // 状态
    uploadQueue: store.uploadQueue,
    processingQueue: store.processingQueue,
    pendingReviews: store.pendingReviews,
    needsTypeQueue: store.needsTypeQueue,
    isUploading: store.isUploading,
    isLoadingServer,
    confirmingIds,
    isConfirmingAll,
    isClearingAll,
    changingTypeIds,
    overridingNeatnessIds,

    // 操作
    addFiles,
    addFilesWithType,
    retryWithType,
    removeFromUploadQueue: store.removeFromUploadQueue,
    clearUploadQueue: store.clearUploadQueue,
    removeFromNeedsTypeQueue: store.removeFromNeedsTypeQueue,
    clearNeedsTypeQueue: store.clearNeedsTypeQueue,
    updateUserEdit: store.updateUserEdit,
    confirmReview,
    deleteReview,
    confirmAllReviews,
    clearAllReviews,
    changeReviewType,
    overrideNeatness,

    // 计算属性
    hasQueuedItems: store.uploadQueue.length > 0 || store.processingQueue.length > 0,
    hasPendingReviews: store.pendingReviews.length > 0,
    hasNeedsTypeItems: store.needsTypeQueue.length > 0,
  };
}
