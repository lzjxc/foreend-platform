/**
 * Efficiency Evaluator API Types
 */

// Dimension evaluation score
export interface DimensionScore {
  score: number;  // 0-100
  level: 'A' | 'B' | 'C' | 'D' | 'F';
  strengths: string[];
  issues: string[];
  suggestions: string[];
}

// All evaluation dimensions
export interface EvaluationDimensions {
  efficiency: DimensionScore;
  reliability: DimensionScore;
  observability: DimensionScore;
  security: DimensionScore;
  scalability: DimensionScore;
}

// Service evaluation result
export interface ServiceEvaluation {
  service_id: string;
  service_name: string;
  overall_score: number;
  overall_level: string;
  dimensions: EvaluationDimensions;
  evaluated_at: string;
}

// System summary
export interface SystemSummary {
  total_services: number;
  average_score: number;
  average_level: string;
  dimension_averages: Record<string, number>;
  grade_distribution: Record<string, number>;  // e.g., { "A": 3, "B": 5, "C": 2 }
  last_evaluated_at: string;
}

// Recommendation item
export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';

export interface RecommendationItem {
  id: string;
  priority: RecommendationPriority;
  category: string;
  title: string;
  description: string;
  affected_services: string[];
  estimated_effort: string;
  expected_impact: string;
}

// Roadmap item
export type RoadmapStatus = 'planned' | 'in_progress' | 'completed';

export interface RoadmapItem {
  id: string;
  phase: string;
  title: string;
  description: string;
  dependencies: string[];
  estimated_duration: string;
  status: RoadmapStatus;
}

// Full system evaluation report
export interface SystemEvaluationReport {
  summary: SystemSummary;
  evaluations: ServiceEvaluation[];
  recommendations: RecommendationItem[];
  roadmap: RoadmapItem[];
  generated_at: string;
}

// API response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Evaluation history item
export interface EvaluationHistoryItem {
  evaluated_at: string;
  overall_score: number;
  overall_level: string;
  dimension_scores: Record<string, number>;
}

// Priority config for UI
export const PRIORITY_CONFIG: Record<RecommendationPriority, { label: string; color: string; icon: string }> = {
  critical: { label: '紧急', color: 'bg-red-100 text-red-800 border-red-200', icon: '🔴' },
  high: { label: '高', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '🟠' },
  medium: { label: '中', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '🟡' },
  low: { label: '低', color: 'bg-green-100 text-green-800 border-green-200', icon: '🟢' },
};

// Status config for UI
export const STATUS_CONFIG: Record<RoadmapStatus, { label: string; color: string; icon: string }> = {
  completed: { label: '已完成', color: 'bg-green-100 text-green-800', icon: '✅' },
  in_progress: { label: '进行中', color: 'bg-blue-100 text-blue-800', icon: '🔄' },
  planned: { label: '计划中', color: 'bg-gray-100 text-gray-800', icon: '📋' },
};

// Level config for UI
export const LEVEL_CONFIG: Record<string, { color: string; bgColor: string }> = {
  'A': { color: 'text-green-600', bgColor: 'bg-green-100' },
  'B': { color: 'text-blue-600', bgColor: 'bg-blue-100' },
  'C': { color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  'D': { color: 'text-orange-600', bgColor: 'bg-orange-100' },
  'F': { color: 'text-red-600', bgColor: 'bg-red-100' },
};

// Dimension labels
export const DIMENSION_LABELS: Record<keyof EvaluationDimensions, string> = {
  efficiency: '效率',
  reliability: '可靠性',
  observability: '可观测性',
  security: '安全性',
  scalability: '可伸缩性',
};
