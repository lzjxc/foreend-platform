import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataFetcherClient, argoClient } from '@/api/client';
import type {
  TrendingRepo,
  RepoDetail,
  Release,
  RSSFeed,
  RSSSource,
  RSSPresetCategory,
  HNItem,
  HNSearchResult,
  HNItemWithComments,
  NewsItem,
  NewsListResponse,
  NewsFilters,
  CollectRequest,
  CollectResponse,
  CollectionStats,
  BackfillRequest,
  BackfillResponse,
  Tag,
  TagCreate,
  TagUpdate,
  TagStats,
  TopicStats,
  DataFetcherHealth,
  BatchTagRequest,
  BatchTagResponse,
  BatchTagTask,
  BatchTagTasksResponse,
  BatchTagStatus,
  FinancialSummary,
  FinancialTrendResponse,
} from '@/types/data-fetcher';

// ==================== Query Keys ====================

export const dataFetcherKeys = {
  all: ['data-fetcher'] as const,
  // GitHub
  githubTrending: (language?: string, since?: string) =>
    [...dataFetcherKeys.all, 'github', 'trending', { language, since }] as const,
  githubRepo: (owner: string, repo: string) =>
    [...dataFetcherKeys.all, 'github', 'repo', owner, repo] as const,
  githubReleases: (owner: string, repo: string) =>
    [...dataFetcherKeys.all, 'github', 'releases', owner, repo] as const,
  // RSS
  rssSources: () => [...dataFetcherKeys.all, 'rss', 'sources'] as const,
  rssPreset: (category: RSSPresetCategory) =>
    [...dataFetcherKeys.all, 'rss', 'preset', category] as const,
  rssFetch: (urls: string[]) =>
    [...dataFetcherKeys.all, 'rss', 'fetch', urls] as const,
  // Hacker News
  hnTop: (limit?: number, minScore?: number) =>
    [...dataFetcherKeys.all, 'hn', 'top', { limit, minScore }] as const,
  hnSearch: (query: string) =>
    [...dataFetcherKeys.all, 'hn', 'search', query] as const,
  hnItem: (id: number) =>
    [...dataFetcherKeys.all, 'hn', 'item', id] as const,
  // News
  news: (filters: NewsFilters) =>
    [...dataFetcherKeys.all, 'news', filters] as const,
  newsItem: (id: string) =>
    [...dataFetcherKeys.all, 'news', 'item', id] as const,
  // Collection
  collectStats: (days?: number) =>
    [...dataFetcherKeys.all, 'collect', 'stats', days] as const,
  // Tags
  tags: (group?: string) =>
    [...dataFetcherKeys.all, 'tags', { group }] as const,
  tagGroups: () => [...dataFetcherKeys.all, 'tags', 'groups'] as const,
  tagStats: () => [...dataFetcherKeys.all, 'tags', 'stats'] as const,
  topicStats: () => [...dataFetcherKeys.all, 'tags', 'topics'] as const,
  // Health
  health: () => [...dataFetcherKeys.all, 'health'] as const,
  // Batch Tagging
  batchTasks: (status?: BatchTagStatus) =>
    [...dataFetcherKeys.all, 'batch-tasks', { status }] as const,
  batchTask: (taskId: string) =>
    [...dataFetcherKeys.all, 'batch-task', taskId] as const,
  // Financial
  financialSummary: () => [...dataFetcherKeys.all, 'financial', 'summary'] as const,
  financialTrend: (symbol: string, days?: number) =>
    [...dataFetcherKeys.all, 'financial', 'trend', symbol, { days }] as const,
};

// ==================== GitHub Hooks ====================

export function useGitHubTrending(language?: string, since: string = 'daily') {
  return useQuery({
    queryKey: dataFetcherKeys.githubTrending(language, since),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (language) params.set('language', language);
      params.set('since', since);
      const { data } = await dataFetcherClient.get<TrendingRepo[]>(
        `/api/v1/github/trending?${params}`
      );
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useGitHubRepo(owner: string, repo: string) {
  return useQuery({
    queryKey: dataFetcherKeys.githubRepo(owner, repo),
    queryFn: async () => {
      const { data } = await dataFetcherClient.get<RepoDetail>(
        `/api/v1/github/repo/${owner}/${repo}`
      );
      return data;
    },
    enabled: !!owner && !!repo,
  });
}

export function useGitHubReleases(owner: string, repo: string, limit: number = 5) {
  return useQuery({
    queryKey: dataFetcherKeys.githubReleases(owner, repo),
    queryFn: async () => {
      const { data } = await dataFetcherClient.get<Release[]>(
        `/api/v1/github/repo/${owner}/${repo}/releases?limit=${limit}`
      );
      return data;
    },
    enabled: !!owner && !!repo,
  });
}

// ==================== RSS Hooks ====================

export function useRSSSources() {
  return useQuery({
    queryKey: dataFetcherKeys.rssSources(),
    queryFn: async () => {
      const { data } = await dataFetcherClient.get<RSSSource[]>('/api/v1/rss/sources');
      return data;
    },
  });
}

export function useRSSPreset(category: RSSPresetCategory, limit: number = 10) {
  return useQuery({
    queryKey: dataFetcherKeys.rssPreset(category),
    queryFn: async () => {
      const { data } = await dataFetcherClient.get<RSSFeed[]>(
        `/api/v1/rss/preset/${category}?limit=${limit}`
      );
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useRSSFetch(urls: string[], limit: number = 10) {
  return useQuery({
    queryKey: dataFetcherKeys.rssFetch(urls),
    queryFn: async () => {
      const params = new URLSearchParams();
      urls.forEach(url => params.append('urls', url));
      params.set('limit', limit.toString());
      const { data } = await dataFetcherClient.get<RSSFeed[]>(`/api/v1/rss/fetch?${params}`);
      return data;
    },
    enabled: urls.length > 0,
  });
}

// ==================== Hacker News Hooks ====================

export function useHNTop(limit: number = 30, minScore?: number) {
  return useQuery({
    queryKey: dataFetcherKeys.hnTop(limit, minScore),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      if (minScore) params.set('min_score', minScore.toString());
      const { data } = await dataFetcherClient.get<HNItem[]>(`/api/v1/hackernews/top?${params}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useHNSearch(query: string, tags?: string, limit: number = 20) {
  return useQuery({
    queryKey: dataFetcherKeys.hnSearch(query),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('query', query);
      if (tags) params.set('tags', tags);
      params.set('limit', limit.toString());
      const { data } = await dataFetcherClient.get<HNSearchResult[]>(
        `/api/v1/hackernews/search?${params}`
      );
      return data;
    },
    enabled: !!query,
  });
}

export function useHNItem(itemId: number, includeComments: boolean = false) {
  return useQuery({
    queryKey: dataFetcherKeys.hnItem(itemId),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (includeComments) params.set('include_comments', 'true');
      const { data } = await dataFetcherClient.get<HNItem | HNItemWithComments>(
        `/api/v1/hackernews/item/${itemId}?${params}`
      );
      return data;
    },
    enabled: !!itemId,
  });
}

// ==================== News Hooks ====================

export function useNews(filters: NewsFilters = {}) {
  return useQuery({
    queryKey: dataFetcherKeys.news(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.topics) params.set('topics', filters.topics);
      if (filters.topics_all) params.set('topics_all', filters.topics_all);
      if (filters.tags) params.set('tags', filters.tags);
      if (filters.keyword) params.set('keyword', filters.keyword);
      if (filters.source) params.set('source', filters.source);
      if (filters.min_importance) params.set('min_importance', filters.min_importance.toString());
      if (filters.days) params.set('days', filters.days.toString());
      if (filters.page) params.set('page', filters.page.toString());
      if (filters.page_size) params.set('page_size', filters.page_size.toString());
      const { data } = await dataFetcherClient.get<NewsListResponse>(`/api/v1/news?${params}`);
      return data;
    },
  });
}

export function useNewsItem(newsId: string) {
  return useQuery({
    queryKey: dataFetcherKeys.newsItem(newsId),
    queryFn: async () => {
      const { data } = await dataFetcherClient.get<NewsItem>(`/api/v1/news/${newsId}`);
      return data;
    },
    enabled: !!newsId,
  });
}

export function useAINews(days: number = 7, page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: [...dataFetcherKeys.all, 'news', 'ai', { days, page, pageSize }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('days', days.toString());
      params.set('page', page.toString());
      params.set('page_size', pageSize.toString());
      const { data } = await dataFetcherClient.get<NewsListResponse>(`/api/v1/news/ai?${params}`);
      return data;
    },
  });
}

export function useGameNews(days: number = 7, page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: [...dataFetcherKeys.all, 'news', 'game', { days, page, pageSize }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('days', days.toString());
      params.set('page', page.toString());
      params.set('page_size', pageSize.toString());
      const { data } = await dataFetcherClient.get<NewsListResponse>(`/api/v1/news/game?${params}`);
      return data;
    },
  });
}

// ==================== Collection Hooks ====================

export function useCollectionStats(days?: number) {
  return useQuery({
    queryKey: dataFetcherKeys.collectStats(days),
    queryFn: async () => {
      const params = days ? `?days=${days}` : '';
      const { data } = await dataFetcherClient.get<CollectionStats>(
        `/api/v1/collect/stats${params}`
      );
      return data;
    },
  });
}

export function useCollectDaily() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CollectRequest) => {
      const { data } = await dataFetcherClient.post<CollectResponse>(
        '/api/v1/collect/daily',
        request
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataFetcherKeys.collectStats() });
    },
  });
}

export function useBackfill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: BackfillRequest) => {
      const { data } = await dataFetcherClient.post<BackfillResponse>(
        '/api/v1/collect/backfill',
        request
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataFetcherKeys.collectStats() });
    },
  });
}

// ==================== Tag Hooks ====================

export function useTags(group?: string, activeOnly: boolean = true) {
  return useQuery({
    queryKey: dataFetcherKeys.tags(group),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (group) params.set('group', group);
      params.set('active_only', activeOnly.toString());
      const { data } = await dataFetcherClient.get<Tag[]>(`/api/v1/tags?${params}`);
      return data;
    },
  });
}

export function useTagGroups() {
  return useQuery({
    queryKey: dataFetcherKeys.tagGroups(),
    queryFn: async () => {
      const { data } = await dataFetcherClient.get<{ groups: string[] }>('/api/v1/tags/groups');
      return data.groups;
    },
  });
}

export function useTagStats() {
  return useQuery({
    queryKey: dataFetcherKeys.tagStats(),
    queryFn: async () => {
      const { data } = await dataFetcherClient.get<TagStats>('/api/v1/tags/stats/summary');
      return data;
    },
  });
}

export function useTopicStats() {
  return useQuery({
    queryKey: dataFetcherKeys.topicStats(),
    queryFn: async () => {
      const { data } = await dataFetcherClient.get<TopicStats>('/api/v1/tags/stats/topics');
      return data;
    },
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tag: TagCreate) => {
      const { data } = await dataFetcherClient.post<Tag>('/api/v1/tags', tag);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataFetcherKeys.tags() });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slug, ...update }: TagUpdate & { slug: string }) => {
      const { data } = await dataFetcherClient.put<Tag>(`/api/v1/tags/${slug}`, update);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataFetcherKeys.tags() });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slug: string) => {
      await dataFetcherClient.delete(`/api/v1/tags/${slug}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataFetcherKeys.tags() });
    },
  });
}

// ==================== Batch Tagging Hooks ====================

/**
 * Submit a batch tagging task
 */
export function useSubmitBatchTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: BatchTagRequest) => {
      const { data } = await dataFetcherClient.post<BatchTagResponse>(
        '/api/v1/collect/tag',
        request
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataFetcherKeys.batchTasks() });
      queryClient.invalidateQueries({ queryKey: dataFetcherKeys.collectStats() });
    },
  });
}

/**
 * Get batch tagging tasks list
 * @param status - Filter by status
 * @param enabled - Whether the query is enabled
 * @param refetchInterval - Polling interval in ms (0 to disable)
 */
export function useBatchTagTasks(
  status?: BatchTagStatus,
  enabled: boolean = true,
  refetchInterval: number = 0
) {
  return useQuery({
    queryKey: dataFetcherKeys.batchTasks(status),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      params.set('limit', '20');
      const { data } = await dataFetcherClient.get<BatchTagTasksResponse>(
        `/api/v1/callback/batch-tasks?${params}`
      );
      return data;
    },
    enabled,
    refetchInterval: refetchInterval > 0 ? refetchInterval : false,
  });
}

/**
 * Get a specific batch tagging task by ID
 * @param taskId - The task ID to fetch
 * @param enabled - Whether the query is enabled
 * @param refetchInterval - Polling interval in ms (0 to disable)
 */
export function useBatchTagTask(
  taskId: string,
  enabled: boolean = true,
  refetchInterval: number = 0
) {
  return useQuery({
    queryKey: dataFetcherKeys.batchTask(taskId),
    queryFn: async () => {
      const { data } = await dataFetcherClient.get<BatchTagTask>(
        `/api/v1/callback/batch-tasks/${taskId}`
      );
      return data;
    },
    enabled: !!taskId && enabled,
    refetchInterval: refetchInterval > 0 ? refetchInterval : false,
  });
}

// ==================== Batch Tag Helper Functions ====================

/**
 * Calculate progress percentage for a batch tag task
 */
export function calculateBatchTagProgress(task: BatchTagTask): number {
  if (task.total_items === 0) return 0;
  return Math.round((task.completed_items / task.total_items) * 100);
}

/**
 * Check if a batch tag task is still running (needs polling)
 */
export function isBatchTagRunning(task: BatchTagTask): boolean {
  return task.status === 'pending' || task.status === 'running';
}

/**
 * Get the most recent active batch tag task
 */
export function getMostRecentActiveBatchTag(tasks: BatchTagTask[]): BatchTagTask | null {
  const active = tasks.filter(t => isBatchTagRunning(t));
  if (active.length === 0) return null;
  return active.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];
}

// ==================== Argo Workflow Progress ====================

/**
 * Argo workflow status response (simplified)
 */
export interface ArgoWorkflowStatus {
  phase: 'Pending' | 'Running' | 'Succeeded' | 'Failed' | 'Error';
  progress: string;  // e.g., "12/248"
  startedAt: string;
  finishedAt?: string;
  message?: string;
}

/**
 * Get Argo workflow progress by llm_gateway_task_id
 * Workflow name format: llm-batch-{first 8 chars of task_id}-*
 */
export function useArgoWorkflowProgress(
  llmGatewayTaskId: string | undefined,
  enabled: boolean = true,
  refetchInterval: number = 5000
) {
  return useQuery({
    queryKey: ['argo', 'workflow', llmGatewayTaskId],
    queryFn: async (): Promise<ArgoWorkflowStatus | null> => {
      if (!llmGatewayTaskId) return null;

      // Workflow name prefix: llm-batch-{first 8 chars}
      const prefix = `llm-batch-${llmGatewayTaskId.substring(0, 8)}`;

      // List all workflows in argo namespace
      const { data } = await argoClient.get('/api/v1/workflows/argo');

      // Find matching workflow by name prefix
      const workflows = data?.items || [];
      const workflow = workflows.find((w: { metadata: { name: string } }) =>
        w.metadata.name.startsWith(prefix)
      );

      if (!workflow?.status) return null;

      return {
        phase: workflow.status.phase,
        progress: workflow.status.progress || '0/0',
        startedAt: workflow.status.startedAt,
        finishedAt: workflow.status.finishedAt,
        message: workflow.status.message,
      };
    },
    enabled: !!llmGatewayTaskId && enabled,
    refetchInterval: refetchInterval > 0 ? refetchInterval : false,
    retry: 1,
    staleTime: 2000,
  });
}

/**
 * Parse Argo progress string to numbers
 * @param progress - e.g., "12/248"
 * @returns { completed, total, percentage }
 */
export function parseArgoProgress(progress: string): { completed: number; total: number; percentage: number } {
  const match = progress.match(/^(\d+)\/(\d+)$/);
  if (!match) return { completed: 0, total: 0, percentage: 0 };
  const completed = parseInt(match[1], 10);
  const total = parseInt(match[2], 10);
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percentage };
}

// ==================== Health Hooks ====================

export function useDataFetcherHealth() {
  return useQuery({
    queryKey: dataFetcherKeys.health(),
    queryFn: async () => {
      const { data } = await dataFetcherClient.get<DataFetcherHealth>('/health');
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// ==================== Financial Hooks ====================

/**
 * Get financial summary (gold price, GBP/CNY rate)
 */
export function useFinancialSummary() {
  return useQuery({
    queryKey: dataFetcherKeys.financialSummary(),
    queryFn: async () => {
      const { data } = await dataFetcherClient.get<FinancialSummary>(
        '/api/v1/financial/summary'
      );
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get financial trend for a specific symbol
 * @param symbol - 'XAU/USD' (gold), 'GBP/CNY' (GBP/CNY rate), or 'USD/CNY' (USD/CNY rate)
 * @param days - Number of days of history (default 30)
 */
export function useFinancialTrend(symbol: 'XAU/USD' | 'GBP/CNY' | 'USD/CNY', days: number = 30) {
  return useQuery({
    queryKey: dataFetcherKeys.financialTrend(symbol, days),
    queryFn: async () => {
      const { data } = await dataFetcherClient.get<FinancialTrendResponse>(
        `/api/v1/financial/trend/${encodeURIComponent(symbol)}?days=${days}`
      );
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!symbol,
  });
}
