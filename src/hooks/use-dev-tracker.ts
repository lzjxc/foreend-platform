import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { devTrackerClient } from '@/api/client';
import type {
  PaginatedResponse,
  Category,
  CategoryCreate,
  CategoryUpdate,
  App,
  AppCreate,
  AppUpdate,
  Milestone,
  MilestoneListItem,
  MilestoneCreate,
  MilestoneUpdate,
  Spec,
  SpecListItem,
  SpecCreate,
  SpecUpdate,
  Task,
  TaskListItem,
  TaskCreate,
  TaskUpdate,
  Activity,
  ActivityCreate,
  ActivityUpdate,
  BulkLinkRequest,
  Session,
  SessionListItem,
  ConfigBackupListItem,
  ConfigBackup,
  DevTrackerOverview,
  ActivityTrend,
  ServiceBreakdown,
  TimelineDay,
} from '@/types/dev-tracker';

// --- Query Keys ---

export const devTrackerKeys = {
  all: ['dev-tracker'] as const,
  categories: () => [...devTrackerKeys.all, 'categories'] as const,
  categoryDetail: (id: number) => [...devTrackerKeys.all, 'categories', id] as const,
  apps: (filters?: Record<string, unknown>) => [...devTrackerKeys.all, 'apps', filters] as const,
  appDetail: (id: number) => [...devTrackerKeys.all, 'apps', 'detail', id] as const,
  milestones: (filters?: Record<string, unknown>) => [...devTrackerKeys.all, 'milestones', filters] as const,
  milestoneDetail: (id: number) => [...devTrackerKeys.all, 'milestones', 'detail', id] as const,
  milestoneSummary: (id: number) => [...devTrackerKeys.all, 'milestones', 'summary', id] as const,
  specs: (filters?: Record<string, unknown>) => [...devTrackerKeys.all, 'specs', filters] as const,
  specDetail: (id: number) => [...devTrackerKeys.all, 'specs', 'detail', id] as const,
  specTasks: (id: number, filters?: Record<string, unknown>) => [...devTrackerKeys.all, 'specs', id, 'tasks', filters] as const,
  tasks: (filters?: Record<string, unknown>) => [...devTrackerKeys.all, 'tasks', filters] as const,
  taskDetail: (id: number) => [...devTrackerKeys.all, 'tasks', 'detail', id] as const,
  activities: (filters?: Record<string, unknown>) => [...devTrackerKeys.all, 'activities', filters] as const,
  activitiesUnlinked: (filters?: Record<string, unknown>) => [...devTrackerKeys.all, 'activities', 'unlinked', filters] as const,
  sessions: (filters?: Record<string, unknown>) => [...devTrackerKeys.all, 'sessions', filters] as const,
  sessionDetail: (id: number) => [...devTrackerKeys.all, 'sessions', 'detail', id] as const,
  configBackups: (filters?: Record<string, unknown>) => [...devTrackerKeys.all, 'config-backups', filters] as const,
  configBackupLatest: () => [...devTrackerKeys.all, 'config-backups', 'latest'] as const,
  configBackupDetail: (id: number) => [...devTrackerKeys.all, 'config-backups', 'detail', id] as const,
  statsOverview: () => [...devTrackerKeys.all, 'stats', 'overview'] as const,
  statsActivityTrend: (days?: number) => [...devTrackerKeys.all, 'stats', 'activity-trend', days] as const,
  statsServiceBreakdown: () => [...devTrackerKeys.all, 'stats', 'service-breakdown'] as const,
  statsSpecPhases: () => [...devTrackerKeys.all, 'stats', 'spec-phases'] as const,
  timeline: (filters?: Record<string, unknown>) => [...devTrackerKeys.all, 'timeline', filters] as const,
};

// --- Categories ---

export function useCategories() {
  return useQuery({
    queryKey: devTrackerKeys.categories(),
    queryFn: async () => {
      const { data } = await devTrackerClient.get<Category[]>('/api/v1/categories/');
      return data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useCategory(id: number) {
  return useQuery({
    queryKey: devTrackerKeys.categoryDetail(id),
    queryFn: async () => {
      const { data } = await devTrackerClient.get<Category>(`/api/v1/categories/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CategoryCreate) => {
      const { data } = await devTrackerClient.post<Category>('/api/v1/categories/', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.categories() });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: number } & CategoryUpdate) => {
      const { data } = await devTrackerClient.patch<Category>(`/api/v1/categories/${id}`, input);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.categories() });
      qc.invalidateQueries({ queryKey: devTrackerKeys.categoryDetail(vars.id) });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await devTrackerClient.delete(`/api/v1/categories/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.categories() });
    },
  });
}

// --- Apps ---

export function useApps(categoryId?: number) {
  const filters = { categoryId };
  return useQuery({
    queryKey: devTrackerKeys.apps(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryId) params.set('category_id', String(categoryId));
      const { data } = await devTrackerClient.get<App[]>(`/api/v1/apps/?${params}`);
      return data;
    },
  });
}

export function useApp(id: number) {
  return useQuery({
    queryKey: devTrackerKeys.appDetail(id),
    queryFn: async () => {
      const { data } = await devTrackerClient.get<App>(`/api/v1/apps/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AppCreate) => {
      const { data } = await devTrackerClient.post<App>('/api/v1/apps/', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.apps() });
    },
  });
}

export function useUpdateApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: number } & AppUpdate) => {
      const { data } = await devTrackerClient.patch<App>(`/api/v1/apps/${id}`, input);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.apps() });
      qc.invalidateQueries({ queryKey: devTrackerKeys.appDetail(vars.id) });
    },
  });
}

export function useDeleteApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await devTrackerClient.delete(`/api/v1/apps/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.apps() });
    },
  });
}

export function useAddAppCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ appId, categoryId }: { appId: number; categoryId: number }) => {
      const { data } = await devTrackerClient.post(`/api/v1/apps/${appId}/categories?category_id=${categoryId}`);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.appDetail(vars.appId) });
      qc.invalidateQueries({ queryKey: devTrackerKeys.apps() });
    },
  });
}

export function useRemoveAppCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ appId, categoryId }: { appId: number; categoryId: number }) => {
      await devTrackerClient.delete(`/api/v1/apps/${appId}/categories/${categoryId}`);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.appDetail(vars.appId) });
      qc.invalidateQueries({ queryKey: devTrackerKeys.apps() });
    },
  });
}

// --- Milestones ---

export function useMilestones(
  page = 1,
  pageSize = 20,
  filters?: { status?: string; appId?: number }
) {
  const queryFilters = { page, pageSize, ...filters };
  return useQuery({
    queryKey: devTrackerKeys.milestones(queryFilters),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      if (filters?.status) params.set('status', filters.status);
      if (filters?.appId) params.set('app_id', String(filters.appId));
      const { data } = await devTrackerClient.get<PaginatedResponse<MilestoneListItem>>(
        `/api/v1/milestones/?${params}`
      );
      return data;
    },
  });
}

export function useMilestone(id: number) {
  return useQuery({
    queryKey: devTrackerKeys.milestoneDetail(id),
    queryFn: async () => {
      const { data } = await devTrackerClient.get<Milestone>(`/api/v1/milestones/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useMilestoneSummary(id: number) {
  return useQuery({
    queryKey: devTrackerKeys.milestoneSummary(id),
    queryFn: async () => {
      const { data } = await devTrackerClient.get<string>(`/api/v1/milestones/${id}/summary`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: MilestoneCreate) => {
      const { data } = await devTrackerClient.post<Milestone>('/api/v1/milestones/', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.milestones() });
      qc.invalidateQueries({ queryKey: devTrackerKeys.statsOverview() });
    },
  });
}

export function useUpdateMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: number } & MilestoneUpdate) => {
      const { data } = await devTrackerClient.patch<Milestone>(`/api/v1/milestones/${id}`, input);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.milestones() });
      qc.invalidateQueries({ queryKey: devTrackerKeys.milestoneDetail(vars.id) });
      qc.invalidateQueries({ queryKey: devTrackerKeys.statsOverview() });
    },
  });
}

export function useDeleteMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await devTrackerClient.delete(`/api/v1/milestones/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.milestones() });
      qc.invalidateQueries({ queryKey: devTrackerKeys.statsOverview() });
    },
  });
}

export function useCompleteMilestone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await devTrackerClient.post<Milestone>(`/api/v1/milestones/${id}/complete`);
      return data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.milestones() });
      qc.invalidateQueries({ queryKey: devTrackerKeys.milestoneDetail(id) });
      qc.invalidateQueries({ queryKey: devTrackerKeys.statsOverview() });
    },
  });
}

// --- Specs ---

export function useSpecs(
  page = 1,
  pageSize = 20,
  filters?: { milestoneId?: number; phase?: string; scopeService?: string }
) {
  const queryFilters = { page, pageSize, ...filters };
  return useQuery({
    queryKey: devTrackerKeys.specs(queryFilters),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      if (filters?.milestoneId) params.set('milestone_id', String(filters.milestoneId));
      if (filters?.phase) params.set('phase', filters.phase);
      if (filters?.scopeService) params.set('scope_service', filters.scopeService);
      const { data } = await devTrackerClient.get<PaginatedResponse<SpecListItem>>(
        `/api/v1/specs/?${params}`
      );
      return data;
    },
  });
}

export function useSpec(id: number) {
  return useQuery({
    queryKey: devTrackerKeys.specDetail(id),
    queryFn: async () => {
      const { data } = await devTrackerClient.get<{ success: boolean; data: Spec }>(
        `/api/v1/specs/${id}`
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function useSpecTasks(specId: number, page = 1, pageSize = 20) {
  const filters = { page, pageSize };
  return useQuery({
    queryKey: devTrackerKeys.specTasks(specId, filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      const { data } = await devTrackerClient.get<PaginatedResponse<TaskListItem>>(
        `/api/v1/specs/${specId}/tasks?${params}`
      );
      return data;
    },
    enabled: !!specId,
  });
}

export function useCreateSpec() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SpecCreate) => {
      const { data } = await devTrackerClient.post<{ success: boolean; data: Spec }>(
        '/api/v1/specs/',
        input
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.specs() });
      qc.invalidateQueries({ queryKey: devTrackerKeys.statsSpecPhases() });
    },
  });
}

export function useUpdateSpec() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: number } & SpecUpdate) => {
      const { data } = await devTrackerClient.patch<{ success: boolean; data: Spec }>(
        `/api/v1/specs/${id}`,
        input
      );
      return data.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.specs() });
      qc.invalidateQueries({ queryKey: devTrackerKeys.specDetail(vars.id) });
    },
  });
}

export function useDeleteSpec() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await devTrackerClient.delete(`/api/v1/specs/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.specs() });
      qc.invalidateQueries({ queryKey: devTrackerKeys.statsSpecPhases() });
    },
  });
}

export function useAdvanceSpec() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await devTrackerClient.post<{ success: boolean; data: Spec }>(
        `/api/v1/specs/${id}/advance`
      );
      return data.data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.specs() });
      qc.invalidateQueries({ queryKey: devTrackerKeys.specDetail(id) });
      qc.invalidateQueries({ queryKey: devTrackerKeys.statsSpecPhases() });
    },
  });
}

export function useRetreatSpec() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await devTrackerClient.post<{ success: boolean; data: Spec }>(
        `/api/v1/specs/${id}/retreat`
      );
      return data.data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.specs() });
      qc.invalidateQueries({ queryKey: devTrackerKeys.specDetail(id) });
      qc.invalidateQueries({ queryKey: devTrackerKeys.statsSpecPhases() });
    },
  });
}

export function useCancelSpec() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await devTrackerClient.post<{ success: boolean; data: Spec }>(
        `/api/v1/specs/${id}/cancel`
      );
      return data.data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.specs() });
      qc.invalidateQueries({ queryKey: devTrackerKeys.specDetail(id) });
      qc.invalidateQueries({ queryKey: devTrackerKeys.statsSpecPhases() });
    },
  });
}

export function useSyncSpec() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await devTrackerClient.post<{ success: boolean; data: Spec }>(
        `/api/v1/specs/${id}/sync`
      );
      return data.data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.specDetail(id) });
    },
  });
}

// --- Tasks ---

export function useTasks(
  page = 1,
  pageSize = 20,
  filters?: {
    milestoneId?: number;
    serviceId?: string;
    status?: string;
    taskType?: string;
    specId?: number;
  }
) {
  const queryFilters = { page, pageSize, ...filters };
  return useQuery({
    queryKey: devTrackerKeys.tasks(queryFilters),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      if (filters?.milestoneId) params.set('milestone_id', String(filters.milestoneId));
      if (filters?.serviceId) params.set('service_id', filters.serviceId);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.taskType) params.set('task_type', filters.taskType);
      if (filters?.specId) params.set('spec_id', String(filters.specId));
      const { data } = await devTrackerClient.get<PaginatedResponse<TaskListItem>>(
        `/api/v1/tasks/?${params}`
      );
      return data;
    },
  });
}

export function useTask(id: number) {
  return useQuery({
    queryKey: devTrackerKeys.taskDetail(id),
    queryFn: async () => {
      const { data } = await devTrackerClient.get<Task>(`/api/v1/tasks/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TaskCreate) => {
      const { data } = await devTrackerClient.post<Task>('/api/v1/tasks/', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.tasks() });
      qc.invalidateQueries({ queryKey: devTrackerKeys.statsOverview() });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: number } & TaskUpdate) => {
      const { data } = await devTrackerClient.patch<Task>(`/api/v1/tasks/${id}`, input);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.tasks() });
      qc.invalidateQueries({ queryKey: devTrackerKeys.taskDetail(vars.id) });
      qc.invalidateQueries({ queryKey: devTrackerKeys.statsOverview() });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await devTrackerClient.delete(`/api/v1/tasks/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.tasks() });
      qc.invalidateQueries({ queryKey: devTrackerKeys.statsOverview() });
    },
  });
}

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await devTrackerClient.post<Task>(`/api/v1/tasks/${id}/complete`);
      return data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.tasks() });
      qc.invalidateQueries({ queryKey: devTrackerKeys.taskDetail(id) });
      qc.invalidateQueries({ queryKey: devTrackerKeys.statsOverview() });
    },
  });
}

export function useRetreatTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await devTrackerClient.post<Task>(`/api/v1/tasks/${id}/retreat`);
      return data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.tasks() });
      qc.invalidateQueries({ queryKey: devTrackerKeys.taskDetail(id) });
      qc.invalidateQueries({ queryKey: devTrackerKeys.statsOverview() });
    },
  });
}

// --- Activities ---

export function useActivities(
  page = 1,
  pageSize = 20,
  filters?: {
    serviceId?: string;
    taskId?: number;
    activityType?: string;
    source?: string;
  }
) {
  const queryFilters = { page, pageSize, ...filters };
  return useQuery({
    queryKey: devTrackerKeys.activities(queryFilters),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      if (filters?.serviceId) params.set('service_id', filters.serviceId);
      if (filters?.taskId) params.set('task_id', String(filters.taskId));
      if (filters?.activityType) params.set('activity_type', filters.activityType);
      if (filters?.source) params.set('source', filters.source);
      const { data } = await devTrackerClient.get<PaginatedResponse<Activity>>(
        `/api/v1/activities/?${params}`
      );
      return data;
    },
  });
}

export function useUnlinkedActivities(page = 1, pageSize = 20) {
  const filters = { page, pageSize };
  return useQuery({
    queryKey: devTrackerKeys.activitiesUnlinked(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      const { data } = await devTrackerClient.get<PaginatedResponse<Activity>>(
        `/api/v1/activities/unlinked?${params}`
      );
      return data;
    },
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ActivityCreate) => {
      const { data } = await devTrackerClient.post<Activity>('/api/v1/activities/', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.activities() });
      qc.invalidateQueries({ queryKey: devTrackerKeys.activitiesUnlinked() });
      qc.invalidateQueries({ queryKey: devTrackerKeys.statsOverview() });
    },
  });
}

export function useUpdateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: number } & ActivityUpdate) => {
      const { data } = await devTrackerClient.patch<Activity>(`/api/v1/activities/${id}`, input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.activities() });
      qc.invalidateQueries({ queryKey: devTrackerKeys.activitiesUnlinked() });
    },
  });
}

export function useBulkLinkActivities() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: BulkLinkRequest) => {
      const { data } = await devTrackerClient.post('/api/v1/activities/bulk-link', input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.activities() });
      qc.invalidateQueries({ queryKey: devTrackerKeys.activitiesUnlinked() });
      qc.invalidateQueries({ queryKey: devTrackerKeys.statsOverview() });
    },
  });
}

// --- Sessions ---

export function useSessions(
  page = 1,
  pageSize = 20,
  filters?: { serviceId?: string; status?: string }
) {
  const queryFilters = { page, pageSize, ...filters };
  return useQuery({
    queryKey: devTrackerKeys.sessions(queryFilters),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      if (filters?.serviceId) params.set('service_id', filters.serviceId);
      if (filters?.status) params.set('status', filters.status);
      const { data } = await devTrackerClient.get<SessionListItem[]>(
        `/api/v1/sessions/?${params}`
      );
      return { data, total: data.length, page, page_size: pageSize } as PaginatedResponse<SessionListItem>;
    },
  });
}

export function useSession(id: number) {
  return useQuery({
    queryKey: devTrackerKeys.sessionDetail(id),
    queryFn: async () => {
      const { data } = await devTrackerClient.get<Session>(`/api/v1/sessions/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await devTrackerClient.delete(`/api/v1/sessions/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.sessions() });
    },
  });
}

export function useLinkSessionTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sessionId, taskId }: { sessionId: number; taskId: number }) => {
      const { data } = await devTrackerClient.patch(
        `/api/v1/sessions/${sessionId}/link-task`,
        { task_id: taskId }
      );
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.sessions() });
      qc.invalidateQueries({ queryKey: devTrackerKeys.sessionDetail(vars.sessionId) });
    },
  });
}

export function useReanalyzeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await devTrackerClient.post(`/api/v1/sessions/${id}/reanalyze`);
      return data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.sessionDetail(id) });
      qc.invalidateQueries({ queryKey: devTrackerKeys.sessions() });
    },
  });
}

// --- Config Backups ---

export function useConfigBackups(page = 1, pageSize = 20) {
  const filters = { page, pageSize };
  return useQuery({
    queryKey: devTrackerKeys.configBackups(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      const { data } = await devTrackerClient.get<ConfigBackupListItem[]>(
        `/api/v1/config-backups/?${params}`
      );
      return { data, total: data.length, page, page_size: pageSize } as PaginatedResponse<ConfigBackupListItem>;
    },
  });
}

export function useLatestConfigBackup() {
  return useQuery({
    queryKey: devTrackerKeys.configBackupLatest(),
    queryFn: async () => {
      const { data } = await devTrackerClient.get<ConfigBackup>('/api/v1/config-backups/latest');
      return data;
    },
  });
}

export function useConfigBackup(id: number) {
  return useQuery({
    queryKey: devTrackerKeys.configBackupDetail(id),
    queryFn: async () => {
      const { data } = await devTrackerClient.get<ConfigBackup>(`/api/v1/config-backups/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useDeleteConfigBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await devTrackerClient.delete(`/api/v1/config-backups/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: devTrackerKeys.configBackups() });
    },
  });
}

// --- Stats ---

export function useDevTrackerOverview() {
  return useQuery({
    queryKey: devTrackerKeys.statsOverview(),
    queryFn: async () => {
      const { data } = await devTrackerClient.get<DevTrackerOverview>('/api/v1/stats/overview');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useActivityTrend(days?: number) {
  return useQuery({
    queryKey: devTrackerKeys.statsActivityTrend(days),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (days) params.set('days', String(days));
      const { data } = await devTrackerClient.get<ActivityTrend[]>(
        `/api/v1/stats/activity-trend?${params}`
      );
      return data;
    },
    staleTime: 60_000,
  });
}

export function useServiceBreakdown() {
  return useQuery({
    queryKey: devTrackerKeys.statsServiceBreakdown(),
    queryFn: async () => {
      const { data } = await devTrackerClient.get<ServiceBreakdown[]>(
        '/api/v1/stats/service-breakdown'
      );
      return data;
    },
    staleTime: 60_000,
  });
}

export function useSpecPhases() {
  return useQuery({
    queryKey: devTrackerKeys.statsSpecPhases(),
    queryFn: async () => {
      const { data } = await devTrackerClient.get<Record<string, number>>(
        '/api/v1/stats/spec-phases'
      );
      return data;
    },
    staleTime: 60_000,
  });
}

// --- Timeline ---

export function useTimeline(days?: number, category?: string) {
  const filters = { days, category };
  return useQuery({
    queryKey: devTrackerKeys.timeline(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (days) params.set('days', String(days));
      if (category) params.set('category', category);
      const { data } = await devTrackerClient.get<{ dates: TimelineDay[] }>(
        `/api/v1/timeline/?${params}`
      );
      return data.dates;
    },
    staleTime: 30_000,
  });
}
