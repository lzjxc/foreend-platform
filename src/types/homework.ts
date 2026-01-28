// 作业类型
export type HomeworkType = 'chinese' | 'math' | 'english' | 'combined';

// 运算类型
export type MathOperation = 'add' | 'subtract' | 'mixed';

// 生成作业请求
export interface GenerateHomeworkRequest {
  homework_type: HomeworkType;
  homework_date?: string;      // YYYY-MM-DD, 默认今天
  chinese_count?: number;      // 1-10, 默认 4
  math_count?: number;         // 10-100, 默认 40
  english_count?: number;      // 4-20, 默认 8
}

// 作业记录
export interface HomeworkRecord {
  id: number;
  homework_date: string;
  homework_type: HomeworkType;
  pdf_path: string;
  generated_at: string;
  source?: string;
  requester_id?: string;
}

// 语文字
export interface ChineseChar {
  id: number;
  char: string;
  pinyin: string;
  stroke_count: number;
  difficulty: number;
  source: string;
  notes?: string;
  usage_count: number;
  correct_count: number;
  wrong_count: number;
  neatness_total: number;
  neatness_count: number;
}

// 语文作业数据
export interface ChineseHomework {
  chars: ChineseChar[];
  date: string;
}

// 数学题
export interface MathProblem {
  expression: string;
  answer: number;
  operation: MathOperation;
  has_carry: boolean;
}

// 数学作业数据
export interface MathHomework {
  problems: MathProblem[];
  date: string;
  total_count: number;
}

// 英语单词
export interface EnglishWord {
  id: number;
  word: string;
  meaning: string;
  image_path?: string;
  image_url?: string;
  usage_count: number;
  difficulty: number;
  category: string;
  phonetic?: string;
  scrambled_letters?: string;  // 作业中使用
}

// 英语作业数据
export interface EnglishHomework {
  words: EnglishWord[];
  date: string;
}

// 生成作业响应
export interface GenerateHomeworkResponse {
  homework_id: number;
  homework_date: string;
  homework_type: HomeworkType;
  pdf_url: string;
  chinese?: ChineseHomework;
  math?: MathHomework;
  english?: EnglishHomework;
  generated_at: string;
}

// 字库统计
export interface ChineseStats {
  total: number;
  [source: string]: number;  // 按来源统计
}

// 词库统计
export interface EnglishStats {
  total_words: number;
  words_with_images: number;
  words_without_images: number;
  image_sources: Record<string, number>;
  // Optional fields used by the UI
  with_image?: number;              // Alias for words_with_images
  by_category?: Record<string, number>;  // Category breakdown
}

// 数学预览请求参数
export interface MathPreviewParams {
  count?: number;        // 10-100, 默认 10
  operation?: MathOperation;
  max_number?: number;   // 20-1000, 默认 100
  allow_carry?: boolean;
}

// 数学题库统计
export interface MathStats {
  total_problems: number;      // 题库总题数
  wrong_problems: number;      // 有错误记录的题数
  unused_problems: number;     // 从未使用的题数
  total_correct_answers: number; // 总答对次数
  total_wrong_answers: number;   // 总答错次数
  accuracy: number;            // 正确率 (0-100)
}

// 数学题（带统计信息）
export interface MathProblemWithStats {
  id: number;
  expression: string;
  answer: number;
  operation_type: 'add' | 'subtract';
  has_carry: boolean;
  occurrence_count: number;
  correct_count: number;
  wrong_count: number;
  last_used_date: string | null;
}

// 分页响应
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// API 通用响应格式
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

// ==================== 作业批改相关 ====================

// 批改提交状态
export type SubmissionStatus = 'pending' | 'processing' | 'graded' | 'failed';

// 作业提交记录
export interface HomeworkSubmission {
  id: number;
  homework_record_id: number | null;
  homework_type?: HomeworkType | null;  // 作业类型（auto-grade 返回）
  image_path: string;
  annotated_image_path: string | null;  // 标注后的图片路径
  status: SubmissionStatus;
  submitted_at: string;
  graded_at: string | null;
  total_correct: number;
  total_wrong: number;
  error_message: string | null;
  // 批改模式
  grading_mode?: 'marks' | 'neatness' | null;
  // 语文规范评分（grading_mode=neatness 时）
  neatness_score?: number | null;
  neatness_details?: {
    chars: Array<{
      char: string;
      score: number;
      feedback?: string;
    }>;
    confidence?: string;
    overall_feedback?: string;
  } | null;
}

// 批改结果项
export interface GradeResultItem {
  problem_index: number | null;
  word_index: number | null;
  word: string | null;
  correct: boolean;
  // AI识别的学生答案（数学）
  student_answer?: string | null;
  // AI识别的学生拼写（英语）
  student_spelling?: string | null;
  // 正确答案
  correct_answer?: string | null;
}

// 完整批改结果（包含详细结果列表）
export interface GradeResult extends HomeworkSubmission {
  results: GradeResultItem[];
  confidence: string;
}

// 批改汇总（用于展示）
export interface GradeSummary {
  homework_id: number;
  homework_type: HomeworkType;
  homework_date: string;
  total_correct: number;
  total_wrong: number;
  accuracy: number;
  wrong_items: string[];
  message: string;
}

// ==================== 批改队列相关 ====================

// 上传队列项状态
export type UploadQueueStatus = 'queued' | 'uploading' | 'uploaded' | 'failed';

// 上传队列项（用于前端状态管理，不持久化）
export interface UploadQueueItem {
  id: string;                           // UUID
  file: File;                           // 文件对象
  previewUrl: string;                   // blob URL 用于预览
  homeworkType: 'math' | 'english' | 'chinese';
  status: UploadQueueStatus;
  error?: string;                       // 失败原因
  addedAt: number;                      // 添加时间戳
}

// 处理中队列项（正在被后端处理）
export interface ProcessingItem {
  id: string;                           // 与上传队列项的 id 对应
  submissionId: number;                 // 后端返回的 submission ID
  homeworkType: 'math' | 'english' | 'chinese';
  originalFileName: string;
  originalPreviewUrl: string;           // 保留预览 URL
  status: SubmissionStatus;             // pending | processing | graded | failed
  startedAt: number;                    // 开始处理时间戳
}

// 待核查项（处理完成，等待用户确认）
export interface PendingReviewItem {
  id: string;                           // UUID
  submissionId: number;                 // 后端 submission ID
  homeworkType: 'math' | 'english' | 'chinese';
  homeworkRecordId?: number;            // 关联的作业记录 ID（独立批改时可能为空）
  homeworkDate?: string;                // 作业日期
  originalPreviewUrl: string;           // 原始图片预览 URL
  annotatedPreviewUrl?: string;         // 标注后的图片 URL (如果有)
  annotatedImageUrl?: string;           // 兼容旧字段
  imagePath?: string;                   // 后端存储路径

  // 数学/英语批改结果
  results?: GradeResultItem[];
  confidence?: string;
  totalCorrect?: number;
  totalWrong?: number;

  // 语文书写规范结果
  neatnessResult?: NeatnessResult;
  // 工整度相关（从服务器加载）
  gradingMode?: string;
  neatnessScore?: number;
  neatnessDetails?: {
    chars?: Array<{
      char: string;
      score: number;
      feedback?: string;
    }>;
    overall_feedback?: string;
    confidence?: string;
  };
  errorMessage?: string;

  // 用户编辑状态 (index -> corrected value)
  userEdits: Record<number, boolean>;

  // 元数据
  processedAt: number;                  // 处理完成时间戳
  batchId?: string;                     // 批次 ID（从服务器加载时为空）
  status?: SubmissionStatus;            // 状态（从服务器加载）
}

// 语文书写规范评估结果（用于核查）
export interface NeatnessResult {
  submission_id: number;
  homework_id?: number | null;          // 独立批改时为 null
  status?: 'pending' | 'processing' | 'graded' | 'failed';
  average_score: number | null;
  chars: Array<{
    char: string;
    char_index?: number;
    score: number;
    dimensions?: {
      stroke_clarity: number;
      uprightness: number;
      centering: number;
      size_consistency: number;
      structure: number;
    };
    feedback?: string;
  }>;
  overall_feedback: string;
  confidence?: 'high' | 'medium' | 'low' | null;
  error_message?: string | null;
  passed?: boolean;                     // 前端添加: score >= 60
}

// 确认批改请求
export interface ConfirmGradeRequest {
  homework_id: number;
  image_path: string;
  results: Array<{
    index: number;
    correct: boolean;
  }>;
}

// 批量确认请求项
export interface BatchConfirmItem {
  homeworkId: number;
  imagePath: string;
  results: Array<{
    index: number;
    correct: boolean;
  }>;
}
