// Wordbook types

// User ID for wordbook (defaults to 'default' for single-user mode)
export type UserId = string;

// Word search mode
export type SearchMode = 'lite' | 'full';

// Word list type
export type ListType = 'new' | 'due' | 'recent';

// Review rating
export type ReviewRating = 1 | 2 | 3 | 4;

// Rating labels
export const RATING_LABELS: Record<ReviewRating, string> = {
  1: '完全忘记',
  2: '困难',
  3: '一般',
  4: '简单',
};

// Word item in list
export interface WordItem {
  word_id: string;
  term: string;
}

// Word card details
export interface WordCard {
  card: string;  // Markdown formatted card
  word_id: string;
  review_count?: number;
  last_review?: string | null;
  next_review?: string | null;
}

// Search result
export interface SearchResult {
  card: string;
  found: boolean;
}

// Add word result
export interface AddWordResult {
  card: string;
  word_id: string;
  added: boolean;
}

// Find words result
export interface FindWordsResult {
  words: WordItem[];
}

// List words result
export interface ListWordsResult {
  words: WordItem[];
}

// Today review result
export interface TodayReviewResult {
  due_count: number;
  words: WordItem[];
}

// Start review result
export interface StartReviewResult {
  word_id: string;
  card: string;
}

// Grade result
export interface GradeResult {
  success: boolean;
  next_review?: string;
}

// Stats
export interface WordbookStats {
  total_words: number;
  new_words: number;
  due_words: number;
  reviewed_today: number;
  streak_days: number;
  // Extended stats from text format parsing
  learning_words?: number;
  review_words?: number;
  relearning_words?: number;
}

// Request types
export interface SearchWordRequest {
  user_id: UserId;
  term: string;
  mode?: SearchMode;
}

export interface AddWordRequest {
  user_id: UserId;
  term: string;
}

export interface FindWordsRequest {
  user_id: UserId;
  keyword: string;
  limit?: number;
}

export interface ListWordsRequest {
  user_id: UserId;
  list_type: ListType;
  limit?: number;
}

export interface GradeWordRequest {
  user_id: UserId;
  word_id: string;
  rating: ReviewRating;
}

export interface TodayReviewRequest {
  user_id: UserId;
}

export interface StartReviewRequest {
  user_id: UserId;
}
