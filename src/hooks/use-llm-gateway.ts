import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { llmClient } from '@/api/client';
import type {
  BatchTask,
  BatchTasksResponse,
  BatchTaskCreateRequest,
  BatchTaskCreateResponse,
  UsageBreakdownResponse,
  DailyUsageResponse,
} from '@/types/llm-gateway';

// ==================== Query Keys ====================

export const llmGatewayKeys = {
  all: ['llm-gateway'] as const,
  batchTasks: (appId?: string) =>
    [...llmGatewayKeys.all, 'batch-tasks', { appId }] as const,
  batchTask: (taskId: string) =>
    [...llmGatewayKeys.all, 'batch-task', taskId] as const,
  usageBreakdown: (days: number) =>
    [...llmGatewayKeys.all, 'usage', 'breakdown', days] as const,
  usageDaily: (days: number) =>
    [...llmGatewayKeys.all, 'usage', 'daily', days] as const,
};

// ==================== Batch Task Hooks ====================

/**
 * Fetch all batch tasks, optionally filtered by app_id
 * @param appId - Filter by application ID (e.g., 'data-fetcher')
 * @param enabled - Whether the query is enabled
 * @param refetchInterval - Polling interval in ms (0 to disable)
 */
export function useBatchTasks(
  appId?: string,
  enabled: boolean = true,
  refetchInterval: number = 0
) {
  return useQuery({
    queryKey: llmGatewayKeys.batchTasks(appId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (appId) params.set('app_id', appId);
      params.set('limit', '20');
      const { data } = await llmClient.get<BatchTasksResponse>(
        `/api/v1/tasks?${params}`
      );
      return data;
    },
    enabled,
    refetchInterval: refetchInterval > 0 ? refetchInterval : false,
  });
}

/**
 * Fetch a specific batch task by ID
 * @param taskId - The task ID to fetch
 * @param enabled - Whether the query is enabled
 * @param refetchInterval - Polling interval in ms (0 to disable)
 */
export function useBatchTask(
  taskId: string,
  enabled: boolean = true,
  refetchInterval: number = 0
) {
  return useQuery({
    queryKey: llmGatewayKeys.batchTask(taskId),
    queryFn: async () => {
      const { data } = await llmClient.get<BatchTask>(
        `/api/v1/tasks/${taskId}`
      );
      return data;
    },
    enabled: !!taskId && enabled,
    refetchInterval: refetchInterval > 0 ? refetchInterval : false,
  });
}

/**
 * Create a new batch task
 */
export function useCreateBatchTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: BatchTaskCreateRequest) => {
      const { data } = await llmClient.post<BatchTaskCreateResponse>(
        '/api/v1/tasks/batch',
        request
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: llmGatewayKeys.batchTasks() });
    },
  });
}

// ==================== Usage Hooks ====================

/**
 * Fetch usage breakdown statistics
 * @param days - Number of days to look back (default: 7)
 */
export function useUsageBreakdown(days: number = 7) {
  return useQuery({
    queryKey: llmGatewayKeys.usageBreakdown(days),
    queryFn: async () => {
      const { data } = await llmClient.get<UsageBreakdownResponse>(
        `/usage/breakdown?days=${days}`
      );
      return data;
    },
  });
}

/**
 * Fetch daily usage statistics
 * @param days - Number of days to look back (default: 7)
 */
export function useUsageDaily(days: number = 7) {
  return useQuery({
    queryKey: llmGatewayKeys.usageDaily(days),
    queryFn: async () => {
      const { data } = await llmClient.get<DailyUsageResponse>(
        `/usage/daily?days=${days}`
      );
      return data;
    },
  });
}

// ==================== Helper Functions ====================

/**
 * Calculate progress percentage for a batch task
 * Uses the progress field from API if available, otherwise calculates manually
 */
export function calculateTaskProgress(task: BatchTask): number {
  // Use the API-provided progress if available
  if (task.progress !== undefined) {
    return Math.round(task.progress);
  }
  // Fallback to manual calculation
  if (task.total_items === 0) return 0;
  return Math.round((task.completed_items / task.total_items) * 100);
}

/**
 * Check if a task is still running (needs polling)
 */
export function isTaskRunning(task: BatchTask): boolean {
  return task.status === 'pending' || task.status === 'processing';
}

/**
 * Get the most recent active task for an app
 */
export function getMostRecentActiveTask(tasks: BatchTask[], appId?: string): BatchTask | null {
  const filtered = appId ? tasks.filter(t => t.app_id === appId) : tasks;
  const active = filtered.filter(t => isTaskRunning(t));
  if (active.length === 0) return null;
  return active.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
}
