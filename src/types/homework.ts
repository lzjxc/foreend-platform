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
  usage_count?: number;  // 后端待添加
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

// API 通用响应格式
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
