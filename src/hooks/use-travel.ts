import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lifeAppClient } from '@/api/client';
import type {
  TravelPlanSummary,
  TravelPlan,
  TravelPlanInput,
  PaginatedResponse,
} from '@/types/life-app';

export const travelKeys = {
  all: ['travel'] as const,
  plans: () => [...travelKeys.all, 'plans'] as const,
  plan: (id: string) => [...travelKeys.all, 'plan', id] as const,
};

export function useTravelPlans(page = 1, pageSize = 10) {
  return useQuery({
    queryKey: [...travelKeys.plans(), page, pageSize],
    queryFn: async () => {
      const { data } = await lifeAppClient.get<PaginatedResponse<TravelPlanSummary>>(
        `/api/v1/travel/plans?page=${page}&page_size=${pageSize}`
      );
      return data;
    },
    staleTime: 60_000,
  });
}

export function useTravelPlan(planId: string) {
  return useQuery({
    queryKey: travelKeys.plan(planId),
    queryFn: async () => {
      const { data } = await lifeAppClient.get<TravelPlan>(
        `/api/v1/travel/plans/${planId}`
      );
      return data;
    },
    enabled: !!planId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'completed' || status === 'failed' ? false : 3000;
    },
  });
}

export function useCreateTravelPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TravelPlanInput) => {
      const { data } = await lifeAppClient.post<{ id: string; status: string }>(
        '/api/v1/travel/plans',
        input
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: travelKeys.plans() });
    },
  });
}

export function useExportTravelPlan() {
  return useMutation({
    mutationFn: async (planId: string) => {
      const response = await lifeAppClient.get(
        `/api/v1/travel/plans/${planId}/export`,
        { responseType: 'text' }
      );
      const blob = new Blob([response.data], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `travel-plan-${planId}.md`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}

export function useExportItinerary() {
  return useMutation({
    mutationFn: async (planId: string) => {
      const response = await lifeAppClient.get(
        `/api/v1/travel/plans/${planId}/itinerary`,
        { responseType: 'text' }
      );
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `itinerary-${planId}.html`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}

export function usePatchPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, data }: { planId: string; data: Record<string, unknown> }) => {
      const res = await lifeAppClient.patch(`/api/v1/travel/plans/${planId}`, data);
      return res.data;
    },
    onSuccess: (_d, { planId }) => {
      qc.invalidateQueries({ queryKey: travelKeys.plan(planId) });
      qc.invalidateQueries({ queryKey: travelKeys.plans() });
    },
  });
}

export function usePatchActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await lifeAppClient.patch(`/api/v1/travel/activities/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: travelKeys.all });
    },
  });
}

export function usePatchAccommodation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await lifeAppClient.patch(`/api/v1/travel/accommodations/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: travelKeys.all });
    },
  });
}

export function usePatchTransport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await lifeAppClient.patch(`/api/v1/travel/transports/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: travelKeys.all });
    },
  });
}
