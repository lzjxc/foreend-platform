import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type {
  Skill,
  SkillCreate,
  SkillUpdate,
  SkillVersion,
  SkillListResponse,
  SkillFilters,
  SkillUsageStatsResponse,
} from '@/types/skill';

const CONFIG_SERVICE_URL = '/config-api';

// Query keys
export const skillKeys = {
  all: ['skills'] as const,
  lists: () => [...skillKeys.all, 'list'] as const,
  list: (filters: SkillFilters) => [...skillKeys.lists(), filters] as const,
  details: () => [...skillKeys.all, 'detail'] as const,
  detail: (id: string) => [...skillKeys.details(), id] as const,
  versions: (id: string) => [...skillKeys.all, 'versions', id] as const,
  usage: () => [...skillKeys.all, 'usage'] as const,
  usageStats: (params: Record<string, unknown>) => [...skillKeys.usage(), 'stats', params] as const,
};

// List skills with optional filters
export function useSkills(filters: SkillFilters = {}) {
  return useQuery({
    queryKey: skillKeys.list(filters),
    queryFn: async (): Promise<SkillListResponse> => {
      const params = new URLSearchParams();
      if (filters.source) params.set('source', filters.source);
      if (filters.category) params.set('category', filters.category);
      if (filters.status) params.set('status', filters.status);
      if (filters.tag) params.set('tag', filters.tag);
      if (filters.plugin_name) params.set('plugin_name', filters.plugin_name);
      if (filters.q) params.set('q', filters.q);

      const { data } = await axios.get<SkillListResponse>(
        `${CONFIG_SERVICE_URL}/api/v1/skills`,
        { params }
      );
      return data;
    },
    staleTime: 60_000,
  });
}

// Get single skill
export function useSkill(id: string) {
  return useQuery({
    queryKey: skillKeys.detail(id),
    queryFn: async (): Promise<Skill> => {
      const { data } = await axios.get<Skill>(
        `${CONFIG_SERVICE_URL}/api/v1/skills/${encodeURIComponent(id)}`
      );
      return data;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

// Get skill version history
export function useSkillVersions(id: string) {
  return useQuery({
    queryKey: skillKeys.versions(id),
    queryFn: async (): Promise<SkillVersion[]> => {
      const { data } = await axios.get<SkillVersion[]>(
        `${CONFIG_SERVICE_URL}/api/v1/skills/${encodeURIComponent(id)}/versions`
      );
      return data;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

// Create skill
export function useCreateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SkillCreate): Promise<Skill> => {
      const { data } = await axios.post<Skill>(
        `${CONFIG_SERVICE_URL}/api/v1/skills`,
        input
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillKeys.lists() });
    },
  });
}

// Update skill
export function useUpdateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & SkillUpdate): Promise<Skill> => {
      const { data } = await axios.patch<Skill>(
        `${CONFIG_SERVICE_URL}/api/v1/skills/${encodeURIComponent(id)}`,
        input
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: skillKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: skillKeys.lists() });
      queryClient.invalidateQueries({ queryKey: skillKeys.versions(variables.id) });
    },
  });
}

// Delete skill
export function useDeleteSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await axios.delete(
        `${CONFIG_SERVICE_URL}/api/v1/skills/${encodeURIComponent(id)}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillKeys.lists() });
    },
  });
}

// Get usage stats
export function useSkillUsageStats(params: {
  group_by?: string;
  days?: number;
  skill_id?: string;
  app_id?: string;
  date?: string; // Filter by specific date (YYYY-MM-DD format)
} = {}) {
  return useQuery({
    queryKey: skillKeys.usageStats(params),
    queryFn: async (): Promise<SkillUsageStatsResponse> => {
      const queryParams = new URLSearchParams();
      if (params.group_by) queryParams.set('group_by', params.group_by);
      if (params.days) queryParams.set('days', String(params.days));
      if (params.skill_id) queryParams.set('skill_id', params.skill_id);
      if (params.app_id) queryParams.set('app_id', params.app_id);
      if (params.date) queryParams.set('date', params.date);

      const { data } = await axios.get<SkillUsageStatsResponse>(
        `${CONFIG_SERVICE_URL}/api/v1/skills/usage/stats`,
        { params: queryParams }
      );
      return data;
    },
    staleTime: 60_000,
  });
}
