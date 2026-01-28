import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { efficiencyClient } from '@/api/client';
import type {
  ServiceEvaluation,
  SystemSummary,
  RecommendationItem,
  RoadmapItem,
  EvaluationHistoryItem,
  SystemEvaluationReport,
} from '@/types/efficiency-evaluator';

// Query keys
export const efficiencyKeys = {
  all: ['efficiency'] as const,
  evaluations: () => [...efficiencyKeys.all, 'evaluations'] as const,
  evaluation: (serviceId: string) => [...efficiencyKeys.all, 'evaluation', serviceId] as const,
  history: (serviceId: string) => [...efficiencyKeys.all, 'history', serviceId] as const,
  recommendations: () => [...efficiencyKeys.all, 'recommendations'] as const,
  roadmap: () => [...efficiencyKeys.all, 'roadmap'] as const,
  summary: () => [...efficiencyKeys.all, 'summary'] as const,
  report: () => [...efficiencyKeys.all, 'report'] as const,
};

// API response wrapper
interface ApiResponse<T> {
  data?: T;
  success?: boolean;
  message?: string;
}

// Evaluations API response
interface EvaluationsResponse {
  evaluations: ServiceEvaluation[];
  summary: SystemSummary;
}

// Recommendations API response
interface RecommendationsResponse {
  recommendations: RecommendationItem[];
}

// Roadmap API response
interface RoadmapResponse {
  roadmap: RoadmapItem[];
}

// History API response
interface HistoryResponse {
  history: EvaluationHistoryItem[];
}

// Get all service evaluations
export function useEvaluations() {
  return useQuery({
    queryKey: efficiencyKeys.evaluations(),
    queryFn: async () => {
      const { data } = await efficiencyClient.get<EvaluationsResponse | ApiResponse<ServiceEvaluation[]>>(
        '/api/v1/evaluations'
      );
      // Handle both response formats: {evaluations: [...]} or {data: [...]}
      if ('evaluations' in data) {
        return data.evaluations;
      }
      return data.data || data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get single service evaluation
export function useServiceEvaluation(serviceId: string) {
  return useQuery({
    queryKey: efficiencyKeys.evaluation(serviceId),
    queryFn: async () => {
      const { data } = await efficiencyClient.get<{ evaluation: ServiceEvaluation } | ApiResponse<ServiceEvaluation>>(
        `/api/v1/evaluations/${serviceId}`
      );
      // Handle both response formats: {evaluation: ...} or {data: ...}
      if ('evaluation' in data) {
        return data.evaluation;
      }
      return data.data || data;
    },
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000,
  });
}

// Get service evaluation history
export function useServiceHistory(serviceId: string) {
  return useQuery({
    queryKey: efficiencyKeys.history(serviceId),
    queryFn: async () => {
      const { data } = await efficiencyClient.get<HistoryResponse | ApiResponse<EvaluationHistoryItem[]>>(
        `/api/v1/evaluations/${serviceId}/history`
      );
      // Handle both response formats: {history: [...]} or {data: [...]}
      if ('history' in data) {
        return data.history;
      }
      return data.data || data;
    },
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000,
  });
}

// Get optimization recommendations
export function useRecommendations() {
  return useQuery({
    queryKey: efficiencyKeys.recommendations(),
    queryFn: async () => {
      const { data } = await efficiencyClient.get<RecommendationsResponse | ApiResponse<RecommendationItem[]>>(
        '/api/v1/recommendations'
      );
      // Handle both response formats: {recommendations: [...]} or {data: [...]}
      if ('recommendations' in data) {
        return data.recommendations;
      }
      return data.data || data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Get system roadmap
export function useRoadmap() {
  return useQuery({
    queryKey: efficiencyKeys.roadmap(),
    queryFn: async () => {
      const { data } = await efficiencyClient.get<RoadmapResponse | ApiResponse<RoadmapItem[]>>(
        '/api/v1/roadmap'
      );
      // Handle both response formats: {roadmap: [...]} or {data: [...]}
      if ('roadmap' in data) {
        return data.roadmap;
      }
      return data.data || data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Get system summary (from evaluations endpoint which includes summary)
export function useSystemSummary() {
  return useQuery({
    queryKey: efficiencyKeys.summary(),
    queryFn: async () => {
      // The evaluations endpoint returns both evaluations and summary
      const { data } = await efficiencyClient.get<EvaluationsResponse | ApiResponse<SystemSummary>>(
        '/api/v1/evaluations'
      );

      // If response has summary, return it directly
      if ('summary' in data && data.summary) {
        return data.summary;
      }

      // Fallback: compute from evaluations
      const rawEvaluations = 'evaluations' in data ? data.evaluations : data.data;

      // Ensure we have an array of ServiceEvaluation
      if (!rawEvaluations || !Array.isArray(rawEvaluations) || rawEvaluations.length === 0) {
        return null;
      }

      const evaluations = rawEvaluations as ServiceEvaluation[];

      // Compute summary
      const totalServices = evaluations.length;
      const averageScore = evaluations.reduce((sum: number, e: ServiceEvaluation) => sum + e.overall_score, 0) / totalServices;

      // Grade distribution
      const gradeDistribution: Record<string, number> = {};
      evaluations.forEach((e: ServiceEvaluation) => {
        const level = e.overall_level.charAt(0);
        gradeDistribution[level] = (gradeDistribution[level] || 0) + 1;
      });

      // Dimension averages
      const dimensionAverages: Record<string, number> = {
        efficiency: 0,
        reliability: 0,
        observability: 0,
        security: 0,
        scalability: 0,
      };

      evaluations.forEach((e: ServiceEvaluation) => {
        if (e.dimensions) {
          Object.keys(dimensionAverages).forEach(dim => {
            const score = e.dimensions[dim as keyof typeof e.dimensions]?.score || 0;
            dimensionAverages[dim] += score;
          });
        }
      });

      Object.keys(dimensionAverages).forEach(dim => {
        dimensionAverages[dim] = dimensionAverages[dim] / totalServices;
      });

      // Determine average level
      let averageLevel = 'C';
      if (averageScore >= 90) averageLevel = 'A';
      else if (averageScore >= 80) averageLevel = 'B';
      else if (averageScore >= 70) averageLevel = 'C';
      else if (averageScore >= 60) averageLevel = 'D';
      else averageLevel = 'F';

      return {
        total_services: totalServices,
        average_score: averageScore,
        average_level: averageLevel,
        dimension_averages: dimensionAverages,
        grade_distribution: gradeDistribution,
        last_evaluated_at: evaluations[0]?.evaluated_at || new Date().toISOString(),
      } as SystemSummary;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Get full system evaluation report
export function useSystemReport() {
  return useQuery({
    queryKey: efficiencyKeys.report(),
    queryFn: async () => {
      const { data } = await efficiencyClient.get<{ report: SystemEvaluationReport } | ApiResponse<SystemEvaluationReport>>(
        '/api/v1/report'
      );
      // Handle both response formats: {report: ...} or {data: ...}
      if ('report' in data) {
        return data.report;
      }
      return data.data || data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Trigger a new system evaluation
export function useTriggerEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await efficiencyClient.post<ApiResponse<{ message: string }>>(
        '/api/v1/evaluate'
      );
      return data;
    },
    onSuccess: () => {
      // Invalidate all efficiency queries to refresh data
      queryClient.invalidateQueries({ queryKey: efficiencyKeys.all });
    },
  });
}
