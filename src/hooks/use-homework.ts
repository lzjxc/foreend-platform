import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { homeworkClient } from '@/api/client';
import type {
  GenerateHomeworkRequest,
  GenerateHomeworkResponse,
  HomeworkRecord,
  HomeworkSubmission,
  GradeResult,
  GradeSummary,
  ApiResponse,
  SubmissionStatus,
} from '@/types/homework';

const API_BASE = '';  // Base URL is set in homeworkClient

// Query keys
export const homeworkKeys = {
  all: ['homework'] as const,
  lists: () => [...homeworkKeys.all, 'list'] as const,
  byDate: (date: string, type?: string) => [...homeworkKeys.all, 'date', date, type] as const,
  detail: (id: number) => [...homeworkKeys.all, 'detail', id] as const,
  // 批改相关
  submissions: (homeworkId: number) => [...homeworkKeys.all, 'submissions', homeworkId] as const,
  submission: (submissionId: number) => [...homeworkKeys.all, 'submission', submissionId] as const,
};

// 生成作业
export function useGenerateHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: GenerateHomeworkRequest) => {
      const { data } = await homeworkClient.post<ApiResponse<GenerateHomeworkResponse>>(
        `${API_BASE}/api/v1/homework/generate`,
        request
      );
      return data.data;
    },
    onSuccess: (data) => {
      // Invalidate date-based queries
      queryClient.invalidateQueries({
        queryKey: homeworkKeys.byDate(data.homework_date),
      });
    },
  });
}

// 按日期查询作业
export function useHomeworkByDate(date: string, type?: string) {
  return useQuery({
    queryKey: homeworkKeys.byDate(date, type),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.append('homework_type', type);

      const url = `${API_BASE}/api/v1/homework/date/${date}${params.toString() ? `?${params}` : ''}`;
      const { data } = await homeworkClient.get<ApiResponse<HomeworkRecord[]>>(url);
      return data.data;
    },
    enabled: !!date,
  });
}

// 获取作业详情
export function useHomeworkDetail(id: number) {
  return useQuery({
    queryKey: homeworkKeys.detail(id),
    queryFn: async () => {
      const { data } = await homeworkClient.get<ApiResponse<HomeworkRecord>>(
        `${API_BASE}/api/v1/homework/${id}`
      );
      return data.data;
    },
    enabled: !!id,
  });
}

// 获取最近的作业记录 (通过查询最近7天)
export function useRecentHomework() {
  return useQuery({
    queryKey: [...homeworkKeys.lists(), 'recent'],
    queryFn: async () => {
      const records: HomeworkRecord[] = [];
      const today = new Date();

      // Query last 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        try {
          const { data } = await homeworkClient.get<ApiResponse<HomeworkRecord[]>>(
            `${API_BASE}/api/v1/homework/date/${dateStr}`
          );
          records.push(...data.data);
        } catch {
          // Ignore errors for individual dates
        }
      }

      // Sort by date descending
      return records.sort((a, b) =>
        new Date(b.homework_date).getTime() - new Date(a.homework_date).getTime()
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ==================== 作业批改相关 ====================

// 提交作业照片进行批改
export function useSubmitHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ homeworkId, file }: { homeworkId: number; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await homeworkClient.post<ApiResponse<HomeworkSubmission>>(
        `${API_BASE}/api/v1/grade/homework/${homeworkId}/submit`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      // 刷新该作业的提交列表
      queryClient.invalidateQueries({
        queryKey: homeworkKeys.submissions(variables.homeworkId),
      });
    },
  });
}

// 查询批改状态（自动轮询直到完成）
export function useSubmissionStatus(submissionId: number | null) {
  return useQuery({
    queryKey: homeworkKeys.submission(submissionId!),
    queryFn: async () => {
      const { data } = await homeworkClient.get<ApiResponse<GradeResult>>(
        `${API_BASE}/api/v1/grade/submissions/${submissionId}`
      );
      return data.data;
    },
    enabled: !!submissionId,
    // 如果状态是 pending 或 processing，每 2 秒轮询一次
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'pending' || status === 'processing' ? 2000 : false;
    },
  });
}

// 获取作业的所有提交记录
export function useHomeworkSubmissions(homeworkId: number | null) {
  return useQuery({
    queryKey: homeworkKeys.submissions(homeworkId!),
    queryFn: async () => {
      const { data } = await homeworkClient.get<ApiResponse<HomeworkSubmission[]>>(
        `${API_BASE}/api/v1/grade/homework/${homeworkId}/submissions`
      );
      return data.data;
    },
    enabled: !!homeworkId,
  });
}

// 获取批改汇总
export function useGradeSummary(submissionId: number | null) {
  return useQuery({
    queryKey: [...homeworkKeys.submission(submissionId!), 'summary'],
    queryFn: async () => {
      const { data } = await homeworkClient.get<ApiResponse<GradeSummary>>(
        `${API_BASE}/api/v1/grade/submissions/${submissionId}/summary`
      );
      return data.data;
    },
    enabled: !!submissionId,
  });
}

// 自动识别并批改作业（通过 QR 码识别）
export function useAutoGradeHomework() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await homeworkClient.post<ApiResponse<HomeworkSubmission>>(
        `${API_BASE}/api/v1/grade/auto-grade`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return data.data;
    },
    onSuccess: () => {
      // 刷新所有提交相关查询
      queryClient.invalidateQueries({
        queryKey: [...homeworkKeys.all, 'submissions'],
      });
      queryClient.invalidateQueries({
        queryKey: [...homeworkKeys.all, 'recent-submissions'],
      });
    },
  });
}

// 获取最近的所有提交记录（仅已确认的）
export function useRecentSubmissions() {
  return useQuery({
    queryKey: [...homeworkKeys.all, 'recent-submissions'],
    queryFn: async () => {
      // 先获取最近的作业记录
      const records: HomeworkRecord[] = [];
      const today = new Date();

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        try {
          const { data } = await homeworkClient.get<ApiResponse<HomeworkRecord[]>>(
            `${API_BASE}/api/v1/homework/date/${dateStr}`
          );
          records.push(...data.data);
        } catch {
          // Ignore errors
        }
      }

      // 获取每个作业的提交记录（仅已确认的）
      const allSubmissions: HomeworkSubmission[] = [];
      for (const record of records) {
        try {
          const { data } = await homeworkClient.get<ApiResponse<HomeworkSubmission[]>>(
            `${API_BASE}/api/v1/grade/homework/${record.id}/submissions?confirmed=true`
          );
          allSubmissions.push(...data.data);
        } catch {
          // Ignore errors
        }
      }

      // 获取已确认的独立提交（无关联作业记录的）
      try {
        const { data } = await homeworkClient.get<ApiResponse<HomeworkSubmission[]>>(
          `${API_BASE}/api/v1/grade/submissions/confirmed-standalone`
        );
        allSubmissions.push(...data.data);
      } catch {
        // Ignore errors
      }

      // 按提交时间排序
      return allSubmissions.sort((a, b) =>
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      );
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ==================== 识别 + 确认流程 ====================

export interface MathProblemItem {
  index: number;
  expression: string;
  answer: number;
}

export interface EnglishWordItem {
  index: number;
  word: string;
  meaning: string;
}

export interface ChineseCharItem {
  index: number;
  char: string;
  pinyin: string;
}

export interface IdentifyResult {
  homework_id: number;
  homework_type: string;
  homework_date: string;
  image_path: string;
  problems: MathProblemItem[];
  words: EnglishWordItem[];
  chars: ChineseCharItem[];
}

export interface GradeResultInput {
  index: number;
  correct: boolean;
}

export interface ConfirmGradeResult {
  submission_id: number;
  total_correct: number;
  total_wrong: number;
  accuracy: number;
}

// 识别作业QR码
export function useIdentifyHomework() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await homeworkClient.post<ApiResponse<IdentifyResult>>(
        `${API_BASE}/api/v1/grade/identify`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return data.data;
    },
  });
}

// 确认批改结果
export function useConfirmGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      homeworkId,
      imagePath,
      results,
    }: {
      homeworkId: number;
      imagePath: string;
      results: GradeResultInput[];
    }) => {
      const { data } = await homeworkClient.post<ApiResponse<ConfirmGradeResult>>(
        `${API_BASE}/api/v1/grade/confirm`,
        {
          homework_id: homeworkId,
          image_path: imagePath,
          results: results,
        }
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...homeworkKeys.all, 'recent-submissions'],
      });
    },
  });
}

// ==================== 手动录入错题 ====================

export interface ManualRecordInput {
  homeworkId: number;
  homeworkType: 'math' | 'english';
  totalCount: number;
  wrongIndices: number[];  // 错题编号数组
  file?: File;
}

export function useManualRecordGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ homeworkId, homeworkType, totalCount, wrongIndices, file }: ManualRecordInput) => {
      const formData = new FormData();
      formData.append('homework_id', homeworkId.toString());
      formData.append('homework_type', homeworkType);
      formData.append('total_count', totalCount.toString());
      formData.append('wrong_indices', wrongIndices.join(','));
      if (file) {
        formData.append('file', file);
      }

      const { data } = await homeworkClient.post<ApiResponse<HomeworkSubmission>>(
        `${API_BASE}/api/v1/grade/manual-record`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...homeworkKeys.all, 'recent-submissions'],
      });
    },
  });
}

// ==================== 语文工整度评分 ====================

export interface NeatnessResult {
  submission_id: number;
  homework_id: number;
  status: SubmissionStatus;
  average_score: number | null;
  chars: Array<{
    char: string;
    char_index: number;
    score: number;
    dimensions: {
      stroke_clarity: number;
      uprightness: number;
      centering: number;
      size_consistency: number;
      structure: number;
    };
    feedback?: string;
  }>;
  overall_feedback: string;
  confidence: 'high' | 'medium' | 'low' | null;
  error_message: string | null;
}

export function useChineseNeatnessGrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ homeworkId, file, pageType }: { homeworkId: number; file: File; pageType?: string }) => {
      const formData = new FormData();
      formData.append('homework_id', homeworkId.toString());
      formData.append('file', file);
      // 传递 QR 码页面类型（用于 combined 作业单页批改）
      if (pageType) {
        formData.append('page_type', pageType);
      }

      const { data } = await homeworkClient.post<ApiResponse<NeatnessResult>>(
        `${API_BASE}/api/v1/grade/chinese-neatness`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...homeworkKeys.all, 'recent-submissions'],
      });
    },
  });
}

// 查询工整度评分结果（轮询）
export function useNeatnessStatus(submissionId: number | null) {
  return useQuery({
    queryKey: [...homeworkKeys.all, 'neatness', submissionId],
    queryFn: async () => {
      const { data } = await homeworkClient.get<ApiResponse<NeatnessResult>>(
        `${API_BASE}/api/v1/grade/submissions/${submissionId}/neatness`
      );
      return data.data;
    },
    enabled: !!submissionId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'pending' || status === 'processing' ? 2000 : false;
    },
  });
}

// ==================== 未确认提交列表（待核查） ====================

/**
 * 未确认的提交记录（从后端获取）
 * 用于前端待核查列表，刷新页面后可恢复状态
 */
export interface UnconfirmedSubmission {
  id: number;
  homework_record_id: number | null;
  homework_type: 'math' | 'english' | 'chinese' | null;
  homework_date: string | null;
  image_path: string;
  image_url: string;                    // MinIO 外部 URL
  annotated_image_path: string | null;
  annotated_image_url: string | null;
  status: SubmissionStatus;
  submitted_at: string;
  graded_at: string | null;
  total_correct: number;
  total_wrong: number;
  results: Array<{
    problem_index?: number;
    word_index?: number;
    word?: string;
    correct: boolean;
    student_answer?: string;
    student_spelling?: string;
    correct_answer?: string;
  }> | null;
  confidence: string | null;
  grading_mode: string | null;
  neatness_score: number | null;
  neatness_details: {
    chars?: Array<{
      char: string;
      score: number;
      feedback?: string;
    }>;
    overall_feedback?: string;
    confidence?: string;
  } | null;
  error_message: string | null;
}

/**
 * 获取所有未确认的提交（待核查列表）
 *
 * - 页面加载时自动获取
 * - 如果有 pending/processing 状态的项目，每 3 秒自动刷新
 * - 刷新页面后可恢复待核查列表
 */
export function usePendingSubmissions() {
  return useQuery({
    queryKey: [...homeworkKeys.all, 'unconfirmed-submissions'],
    queryFn: async () => {
      const { data } = await homeworkClient.get<ApiResponse<UnconfirmedSubmission[]>>(
        `${API_BASE}/api/v1/grade/submissions/unconfirmed`
      );
      return data.data;
    },
    // 如果有 processing 状态的项目，每 3 秒轮询
    refetchInterval: (query) => {
      const hasProcessing = query.state.data?.some(
        (s) => s.status === 'pending' || s.status === 'processing'
      );
      return hasProcessing ? 3000 : false;
    },
    staleTime: 10 * 1000, // 10 seconds
  });
}

/**
 * 软删除提交记录
 */
export function useDeleteSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submissionId: number) => {
      const { data } = await homeworkClient.delete<ApiResponse<{ id: number; deleted: boolean }>>(
        `${API_BASE}/api/v1/grade/submissions/${submissionId}`
      );
      return data.data;
    },
    onSuccess: () => {
      // 刷新待核查列表
      queryClient.invalidateQueries({
        queryKey: [...homeworkKeys.all, 'unconfirmed-submissions'],
      });
    },
  });
}

/**
 * 修改作业类型（并重新批改）
 */
export function useUpdateSubmissionType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      homeworkType,
    }: {
      submissionId: number;
      homeworkType: 'math' | 'english' | 'chinese';
    }) => {
      const formData = new FormData();
      formData.append('homework_type', homeworkType);

      const { data } = await homeworkClient.patch<
        ApiResponse<{
          id: number;
          old_type: string;
          new_type: string;
          status: string;
          message: string;
        }>
      >(`${API_BASE}/api/v1/grade/submissions/${submissionId}/type`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...homeworkKeys.all, 'unconfirmed-submissions'],
      });
    },
  });
}

/**
 * 手动覆盖语文工整度结果
 */
export function useOverrideNeatness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      passed,
      feedback,
    }: {
      submissionId: number;
      passed: boolean;
      feedback?: string;
    }) => {
      const formData = new FormData();
      formData.append('passed', String(passed));
      if (feedback) {
        formData.append('feedback', feedback);
      }

      const { data } = await homeworkClient.patch<
        ApiResponse<{
          id: number;
          neatness_score: number;
          passed: boolean;
          feedback: string | null;
          message: string;
        }>
      >(`${API_BASE}/api/v1/grade/submissions/${submissionId}/neatness-override`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...homeworkKeys.all, 'unconfirmed-submissions'],
      });
    },
  });
}
