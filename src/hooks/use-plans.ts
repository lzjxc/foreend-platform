import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { knowledgeApi } from '@/api/knowledge';
import type {
  LearningPlan,
  PlanDraft,
  PlanCreateRequest,
  ReviewAtom,
} from '@/types/knowledge';

export const planKeys = {
  all: ['plans'] as const,
  list: (status?: string) => [...planKeys.all, 'list', status] as const,
  detail: (id: string) => [...planKeys.all, 'detail', id] as const,
  active: () => [...planKeys.all, 'active'] as const,
  reviewQueue: (id: string) => [...planKeys.all, 'review-queue', id] as const,
};

export function usePlans(status?: string) {
  return useQuery({
    queryKey: planKeys.list(status),
    queryFn: (): Promise<LearningPlan[]> => knowledgeApi.getPlans(status),
  });
}

export function usePlan(id: string) {
  return useQuery({
    queryKey: planKeys.detail(id),
    queryFn: (): Promise<LearningPlan> => knowledgeApi.getPlan(id),
    enabled: !!id,
  });
}

export function useActivePlan() {
  return useQuery({
    queryKey: planKeys.active(),
    queryFn: async (): Promise<LearningPlan | null> => {
      const plans = await knowledgeApi.getPlans('active');
      return plans.length > 0 ? plans[0] : null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useGenerateDraft() {
  return useMutation({
    mutationFn: ({
      goal,
      domain,
      maxItems,
    }: {
      goal: string;
      domain?: string;
      maxItems?: number;
    }): Promise<PlanDraft> => knowledgeApi.generatePlanDraft(goal, domain, maxItems),
  });
}

export function useSavePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PlanCreateRequest): Promise<LearningPlan> =>
      knowledgeApi.createPlan(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}

export function useArchivePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string): Promise<LearningPlan> => knowledgeApi.archivePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string): Promise<void> => knowledgeApi.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKeys.all });
    },
  });
}

export function usePlanReviewQueue(planId: string) {
  return useQuery({
    queryKey: planKeys.reviewQueue(planId),
    queryFn: (): Promise<ReviewAtom[]> => knowledgeApi.getPlanReviewQueue(planId),
    enabled: !!planId,
  });
}
