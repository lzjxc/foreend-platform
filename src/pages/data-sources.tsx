import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { toast } from 'sonner';
import {
  Database,
  Github,
  Rss,
  Newspaper,
  Tag,
  BarChart3,
  RefreshCw,
  Search,
  ExternalLink,
  Star,
  GitFork,
  Clock,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Link,
  Calendar,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Coins,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useGitHubTrending,
  useNews,
  useCollectionStats,
  useTags,
  useTagStats,
  useTopicStats,
  useCollectDaily,
  useDataFetcherHealth,
  useBatchTagTasks,
  useSubmitBatchTag,
  getMostRecentActiveBatchTag,
  useFinancialSummary,
  useFinancialTrend,
  useArgoWorkflowProgress,
  parseArgoProgress,
  ArgoWorkflowStatus,
} from '@/hooks/use-data-fetcher';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { NewsFilters, DataSource, NewsItem, BatchTagTask } from '@/types/data-fetcher';

// Date filter options for news queries
const DATE_OPTIONS = [
  { value: '1', label: '今天' },
  { value: '3', label: '3天内' },
  { value: '7', label: '7天内' },
  { value: '14', label: '14天内' },
  { value: '30', label: '30天内' },
  { value: '90', label: '90天内' },
];

// Strip HTML tags and decode entities from text (for preview)
function stripHtml(html: string | null | undefined): string {
  if (!html) return '';
  // Remove HTML tags
  const withoutTags = html.replace(/<[^>]*>/g, '');
  // Decode common HTML entities
  const decoded = withoutTags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  return decoded;
}

// Sanitize and clean HTML content for detail view
function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';

  // Configure DOMPurify to allow safe tags
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                   'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'span', 'div', 'section',
                   'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });

  return clean;
}

// ==================== Batch Task Status Component ====================

interface BatchTaskStatusCardProps {
  task: BatchTagTask;
  argoStatus?: ArgoWorkflowStatus | null;
}

function BatchTaskStatusCard({ task, argoStatus }: BatchTaskStatusCardProps) {
  // Use Argo progress if available, otherwise fall back to database
  const argoProgress = argoStatus ? parseArgoProgress(argoStatus.progress) : null;
  // When Argo total is 0 (workflow not started yet), use database total_items
  const displayCompleted = argoProgress?.completed ?? task.completed_items;
  const displayTotal = (argoProgress && argoProgress.total > 0) ? argoProgress.total : task.total_items;
  const displayPercentage = displayTotal > 0
    ? Math.round((displayCompleted / displayTotal) * 100)
    : 0;

  // Determine effective status based on Argo phase
  const effectiveStatus = argoStatus?.phase === 'Running' ? 'running' :
    argoStatus?.phase === 'Succeeded' ? 'completed' :
    argoStatus?.phase === 'Failed' ? 'failed' :
    argoStatus?.phase === 'Pending' ? 'pending' :
    task.status;

  const isRunning = effectiveStatus === 'running' || effectiveStatus === 'pending';

  const getStatusIcon = () => {
    switch (effectiveStatus) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'partial':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (effectiveStatus) {
      case 'pending':
        return '等待处理';
      case 'running':
        return '处理中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
      case 'partial':
        return '部分完成';
      default:
        return String(effectiveStatus);
    }
  };

  const getStatusColor = () => {
    switch (effectiveStatus) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={isRunning ? 'border-blue-200 bg-blue-50/50' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="font-medium">批处理打标任务</span>
            {argoStatus && (
              <span className="text-xs text-muted-foreground">(实时)</span>
            )}
          </div>
          <Badge className={getStatusColor()}>{getStatusText()}</Badge>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>进度: {displayCompleted} / {displayTotal}</span>
            <span>{displayPercentage}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                effectiveStatus === 'failed' ? 'bg-red-500' :
                effectiveStatus === 'completed' ? 'bg-green-500' :
                'bg-blue-500'
              }`}
              style={{ width: `${displayPercentage}%` }}
            />
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">已完成</p>
            <p className="font-medium text-green-600">{displayCompleted}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">失败</p>
            <p className="font-medium text-red-600">{task.failed_items}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">总数</p>
            <p className="font-medium">{displayTotal}</p>
          </div>
        </div>

        {/* Time info */}
        <div className="mt-2 text-xs text-muted-foreground">
          <span>创建于: {new Date(task.created_at).toLocaleString()}</span>
          {(argoStatus?.startedAt || task.started_at) && (
            <span className="ml-3">开始于: {new Date(argoStatus?.startedAt || task.started_at!).toLocaleString()}</span>
          )}
          {(argoStatus?.finishedAt || task.completed_at) && (
            <span className="ml-3">完成于: {new Date(argoStatus?.finishedAt || task.completed_at!).toLocaleString()}</span>
          )}
        </div>

        {/* Error message */}
        {(task.error_message || argoStatus?.message) && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
            {argoStatus?.message || task.error_message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== Stats Overview Tab ====================

function StatsOverview() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useCollectionStats(7);
  const { data: health } = useDataFetcherHealth();
  const { data: tagStats } = useTagStats();
  const { data: topicStats } = useTopicStats();
  const collectDaily = useCollectDaily();
  const submitBatchTag = useSubmitBatchTag();

  // Batch task status - poll when there's an active task
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const { data: batchTasksData, refetch: refetchBatchTasks } = useBatchTagTasks(
    undefined,  // No status filter
    true,
    pollingEnabled ? 3000 : 0  // Poll every 3 seconds when enabled
  );

  // Get the most recent task that the database thinks is running
  const dbActiveTask = useMemo(() => {
    if (!batchTasksData?.tasks) return null;
    return getMostRecentActiveBatchTag(batchTasksData.tasks);
  }, [batchTasksData]);

  // Get real-time Argo workflow progress for the db-active task
  const { data: argoStatus } = useArgoWorkflowProgress(
    dbActiveTask?.llm_gateway_task_id,
    !!dbActiveTask,
    5000  // Poll every 5 seconds
  );

  // Determine if the task is truly active (considering Argo terminal states)
  // If Argo says Failed/Succeeded/Error, the task is no longer active even if DB hasn't caught up
  const isArgoTerminal = argoStatus?.phase === 'Failed' || argoStatus?.phase === 'Succeeded' || argoStatus?.phase === 'Error';
  const activeTask = dbActiveTask && !isArgoTerminal ? dbActiveTask : null;

  // The most recent task for display (active or just-finished)
  const displayTask = dbActiveTask;

  // Get recent tasks (last 5)
  const recentTasks = useMemo(() => {
    if (!batchTasksData?.tasks) return [];
    return batchTasksData.tasks
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [batchTasksData]);

  // Enable/disable polling based on active task
  useEffect(() => {
    if (activeTask) {
      setPollingEnabled(true);
    } else {
      setPollingEnabled(false);
    }
  }, [activeTask]);

  // Show toast when task completes (via Argo terminal state or DB status)
  useEffect(() => {
    if (dbActiveTask && isArgoTerminal && pollingEnabled) {
      if (argoStatus?.phase === 'Succeeded') {
        toast.success(`打标任务完成: ${dbActiveTask.completed_items} 条数据已处理`);
      } else {
        toast.error(`打标任务失败: ${argoStatus?.message || dbActiveTask.error_message || '未知错误'}`);
      }
      refetchStats();
      refetchBatchTasks();
      setPollingEnabled(false);
    }
  }, [dbActiveTask, isArgoTerminal, argoStatus, pollingEnabled, refetchStats, refetchBatchTasks]);

  // Also handle DB status changes for completed/failed
  useEffect(() => {
    if (recentTasks.length > 0) {
      const latestTask = recentTasks[0];
      if (latestTask.status === 'completed' && pollingEnabled) {
        toast.success(`打标任务完成: ${latestTask.completed_items} 条数据已处理`);
        refetchStats();
        setPollingEnabled(false);
      } else if (latestTask.status === 'failed' && pollingEnabled) {
        toast.error(`打标任务失败: ${latestTask.error_message || '未知错误'}`);
        setPollingEnabled(false);
      }
    }
  }, [recentTasks, pollingEnabled, refetchStats]);

  const handleCollect = async () => {
    try {
      const result = await collectDaily.mutateAsync({
        sources: ['github', 'rss', 'hackernews'],
        submit_tagging: false,  // Don't auto-submit tagging, let user control it
      });
      const total = (result.collected.github || 0) + (result.collected.rss || 0) + (result.collected.hackernews || 0);
      if (total > 0) {
        toast.success(`采集完成，新增 ${total} 条数据`);
      } else {
        toast.info('没有新数据需要采集');
      }
      refetchStats();
    } catch {
      toast.error('采集失败，请稍后重试');
    }
  };

  const handleBatchTag = async () => {
    if (activeTask) {
      toast.warning('已有打标任务在处理中，请等待完成后再试');
      return;
    }
    try {
      const result = await submitBatchTag.mutateAsync({
        source_type: 'mixed',
        limit: 100,  // Process up to 100 items per batch
        force_retag: false,
      });
      if (result.status === 'submitted' && result.items_count > 0) {
        toast.success(`已提交 ${result.items_count} 条数据进行打标 (任务ID: ${result.task_id?.slice(0, 8)}...)`);
        setPollingEnabled(true);
        // Refresh batch tasks to pick up the new task
        setTimeout(() => refetchBatchTasks(), 1000);
      } else if (result.status === 'no_items') {
        toast.info('没有待打标的数据');
      } else {
        toast.info(result.message);
      }
      refetchStats();
    } catch {
      toast.error('打标任务提交失败');
    }
  };

  const untaggedCount = (stats?.news_items.untagged || 0) + (stats?.github_projects.untagged || 0);

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">数据采集统计 (最近7天)</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchStats()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button
            size="sm"
            onClick={handleCollect}
            disabled={collectDaily.isPending}
          >
            {collectDaily.isPending ? '采集中...' : '立即采集'}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleBatchTag}
            disabled={submitBatchTag.isPending || !!activeTask || untaggedCount === 0}
          >
            {activeTask ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Tag className="h-4 w-4 mr-2" />
            )}
            {submitBatchTag.isPending ? '提交中...' : activeTask ? '处理中...' : `立即打标 (${untaggedCount})`}
          </Button>
        </div>
      </div>

      {/* Active or just-finished Batch Task Status */}
      {displayTask && (
        <BatchTaskStatusCard task={displayTask} argoStatus={argoStatus} />
      )}

      {/* Recent Batch Tasks (collapsed) - only show when no displayTask */}
      {!displayTask && recentTasks.length > 0 && recentTasks[0].status !== 'pending' && recentTasks[0].status !== 'running' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              最近打标任务
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {recentTasks[0].status === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : recentTasks[0].status === 'failed' ? (
                  <XCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <span>
                  {recentTasks[0].status === 'completed' ? '已完成' :
                   recentTasks[0].status === 'failed' ? '失败' : '部分完成'}
                  : {recentTasks[0].completed_items}/{recentTasks[0].total_items} 条
                </span>
              </div>
              <span className="text-muted-foreground">
                {new Date(recentTasks[0].completed_at || recentTasks[0].started_at || recentTasks[0].created_at).toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              新闻总数
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.news_items.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  已标注: {stats?.news_items.tagged || 0} / 未标注: {stats?.news_items.untagged || 0}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              GitHub 项目
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.github_projects.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  平均重要度: {((stats?.github_projects.avg_importance || 0) * 100).toFixed(0)}%
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              缓存命中率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health ? `${(health.cache.hit_rate * 100).toFixed(1)}%` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              缓存大小: {health?.cache.size || 0} / {health?.cache.max_size || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              标签使用
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tagStats?.total_tags_used || 0}</div>
            <p className="text-xs text-muted-foreground">
              覆盖新闻: {tagStats?.total_news || 0} 条
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Topic Distribution */}
      {topicStats?.by_topic && Object.keys(topicStats.by_topic).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">主题分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(topicStats.by_topic).map(([topic, stats]) => (
                <Badge key={topic} variant="secondary" className="text-sm">
                  {topic}: {stats.total}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tag Stats by Group */}
      {tagStats?.by_group && Object.keys(tagStats.by_group).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">标签统计 (按分组)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(tagStats.by_group).map(([group, tags]) => (
                <div key={group}>
                  <h4 className="font-medium mb-2 capitalize">{group}</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(tags || {}).slice(0, 10).map(([tag, count]) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==================== News Detail Dialog ====================

function NewsDetailDialog({
  item,
  open,
  onOpenChange,
}: {
  item: NewsItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="pr-8 text-lg leading-tight">
            {item.title}
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {item.topics.map((topic) => (
              <Badge key={topic} variant="outline" className="text-xs">
                {topic}
              </Badge>
            ))}
            {item.source_name && (
              <span className="text-xs text-muted-foreground">
                {item.source_name}
              </span>
            )}
            {item.published_at && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(item.published_at).toLocaleDateString()}
              </span>
            )}
            {item.importance_score > 0 && (
              <Badge
                variant={item.importance_score >= 0.7 ? 'default' : 'secondary'}
              >
                重要度: {(item.importance_score * 100).toFixed(0)}%
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(85vh-200px)] pr-4 -mr-4">
          <div className="space-y-4 pb-4">
            {/* Content - render sanitized HTML */}
            {item.summary ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none
                  prose-headings:font-semibold prose-headings:text-foreground
                  prose-p:text-foreground prose-p:leading-relaxed prose-p:my-3
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-foreground prose-em:text-foreground
                  prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
                  prose-code:bg-muted prose-code:px-1 prose-code:rounded
                  prose-pre:bg-muted prose-pre:text-foreground
                  prose-hr:border-border
                  [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
                  [&_img]:hidden [&_section]:block [&_div]:block"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(item.summary),
                }}
              />
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">
                暂无内容，请点击下方按钮查看原文
              </div>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">标签</h4>
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer with link */}
        {item.url && (
          <div className="flex-shrink-0 pt-4 border-t">
            <Button asChild className="w-full">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Link className="h-4 w-4 mr-2" />
                查看原文
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ==================== News Browser Tab ====================

function NewsBrowser() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read filters from URL params
  const filters: NewsFilters = {
    page: Number(searchParams.get('news_page')) || 1,
    page_size: 20,
    days: Number(searchParams.get('news_days')) || 7,
    source: (searchParams.get('news_source') as DataSource) || undefined,
    topics: searchParams.get('news_topic') || undefined,
    keyword: searchParams.get('news_keyword') || undefined,
  };

  const [keyword, setKeyword] = useState(filters.keyword || '');
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, isLoading, refetch } = useNews(filters);
  const { data: topicStats } = useTopicStats();

  // Update URL params helper
  const updateFilters = useCallback((updates: Partial<NewsFilters>) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);

      if (updates.page !== undefined) {
        if (updates.page === 1) newParams.delete('news_page');
        else newParams.set('news_page', String(updates.page));
      }
      if (updates.days !== undefined) {
        if (updates.days === 7) newParams.delete('news_days');
        else newParams.set('news_days', String(updates.days));
      }
      if (updates.source !== undefined) {
        if (!updates.source) newParams.delete('news_source');
        else newParams.set('news_source', updates.source);
      }
      if (updates.topics !== undefined) {
        if (!updates.topics) newParams.delete('news_topic');
        else newParams.set('news_topic', updates.topics);
      }
      if (updates.keyword !== undefined) {
        if (!updates.keyword) newParams.delete('news_keyword');
        else newParams.set('news_keyword', updates.keyword);
      }

      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  const handleSearch = () => {
    updateFilters({ keyword, page: 1 });
  };

  const handleSourceChange = (source: string) => {
    updateFilters({
      source: source === 'all' ? undefined : source as DataSource,
      page: 1,
    });
  };

  const handleTopicChange = (topic: string) => {
    updateFilters({
      topics: topic === 'all' ? undefined : topic,
      page: 1,
    });
  };

  const handleDaysChange = (days: string) => {
    updateFilters({ days: Number(days), page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage });
  };

  const handleNewsClick = (item: NewsItem) => {
    setSelectedNews(item);
    setDetailOpen(true);
  };

  const sourceIcon = (source: string) => {
    switch (source) {
      case 'github':
        return <Github className="h-4 w-4" />;
      case 'rss':
        return <Rss className="h-4 w-4" />;
      case 'hackernews':
        return <Newspaper className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* News Detail Dialog */}
      <NewsDetailDialog
        item={selectedNews}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <div className="flex gap-2">
            <Input
              placeholder="搜索关键词..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button variant="outline" size="icon" onClick={handleSearch}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Select value={filters.source || 'all'} onValueChange={handleSourceChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="数据源" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部来源</SelectItem>
            <SelectItem value="github">GitHub</SelectItem>
            <SelectItem value="rss">RSS</SelectItem>
            <SelectItem value="hackernews">Hacker News</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.topics || 'all'} onValueChange={handleTopicChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="主题" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部主题</SelectItem>
            {topicStats?.by_topic && Object.keys(topicStats.by_topic).length > 0 ? (
              Object.entries(topicStats.by_topic)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([topic, stats]) => (
                  <SelectItem key={topic} value={topic}>
                    {topic} ({stats.total})
                  </SelectItem>
                ))
            ) : (
              <>
                <SelectItem value="ai">AI</SelectItem>
                <SelectItem value="game">游戏</SelectItem>
                <SelectItem value="tech">科技</SelectItem>
                <SelectItem value="finance">金融</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>

        <Select value={String(filters.days || 7)} onValueChange={handleDaysChange}>
          <SelectTrigger className="w-[120px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          共 {data?.total || 0} 条结果
          {data?.page && ` (第 ${data.page} 页)`}
        </span>
        <span>每页 {filters.page_size} 条</span>
      </div>

      {/* News List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : data?.items.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              没有找到匹配的数据
            </CardContent>
          </Card>
        ) : (
          data?.items.map((item) => (
            <Card
              key={item.id}
              className="hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => handleNewsClick(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-muted-foreground">
                    {sourceIcon(item.source)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium line-clamp-2 hover:text-primary">
                        {item.title}
                      </h4>
                      {item.importance_score > 0 && (
                        <Badge
                          variant={item.importance_score >= 0.7 ? 'default' : 'secondary'}
                          className="shrink-0"
                        >
                          {(item.importance_score * 100).toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                    {item.summary && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {stripHtml(item.summary)}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {item.topics.map((topic) => (
                        <Badge key={topic} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                      {item.source_name && (
                        <span className="text-xs text-muted-foreground">
                          {item.source_name}
                        </span>
                      )}
                      {item.published_at && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(item.published_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
                      onClick={(e) => e.stopPropagation()}
                      title="打开原文链接"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {data && data.total > (filters.page_size || 20) && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page === 1}
            onClick={() => handlePageChange((filters.page || 1) - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {filters.page || 1} / {Math.ceil(data.total / (filters.page_size || 20))} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!data.has_more}
            onClick={() => handlePageChange((filters.page || 1) + 1)}
          >
            下一页
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ==================== GitHub Trending Tab ====================

function GitHubTrending() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read filters from URL params
  const language = searchParams.get('gh_lang') || 'all';
  const since = searchParams.get('gh_since') || 'daily';

  const { data, isLoading, refetch } = useGitHubTrending(
    language === 'all' ? undefined : language,
    since
  );

  const languages = ['python', 'javascript', 'typescript', 'go', 'rust', 'java', 'c++'];

  const handleLanguageChange = (lang: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (lang === 'all') newParams.delete('gh_lang');
      else newParams.set('gh_lang', lang);
      return newParams;
    }, { replace: true });
  };

  const handleSinceChange = (value: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (value === 'daily') newParams.delete('gh_since');
      else newParams.set('gh_since', value);
      return newParams;
    }, { replace: true });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="编程语言" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部语言</SelectItem>
            {languages.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={since} onValueChange={handleSinceChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">今日</SelectItem>
            <SelectItem value="weekly">本周</SelectItem>
            <SelectItem value="monthly">本月</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* Repo List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-1/2 mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))
        ) : data?.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              没有找到趋势项目
            </CardContent>
          </Card>
        ) : (
          data?.map((repo) => (
            <Card key={repo.full_name} className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Github className="h-4 w-4 text-muted-foreground shrink-0" />
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:underline truncate"
                      >
                        {repo.full_name}
                      </a>
                      {repo.language && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {repo.language}
                        </Badge>
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        {repo.stars.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitFork className="h-4 w-4" />
                        {repo.forks.toLocaleString()}
                      </span>
                      {repo.stars_today > 0 && (
                        <span className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          +{repo.stars_today} today
                        </span>
                      )}
                    </div>
                    {repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {repo.topics.slice(0, 5).map((topic) => (
                          <Badge key={topic} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground ml-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ==================== RSS Feeds Tab ====================

function RSSFeeds() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read filters from URL params
  const filters: NewsFilters = {
    source: 'rss',
    page: Number(searchParams.get('rss_page')) || 1,
    page_size: 20,
    days: Number(searchParams.get('rss_days')) || 7,
    topics: searchParams.get('rss_topic') || undefined,
  };

  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, isLoading, refetch } = useNews(filters);
  const { data: topicStats } = useTopicStats();

  // Update URL params helper
  const updateFilters = useCallback((updates: Partial<NewsFilters>) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);

      if (updates.page !== undefined) {
        if (updates.page === 1) newParams.delete('rss_page');
        else newParams.set('rss_page', String(updates.page));
      }
      if (updates.days !== undefined) {
        if (updates.days === 7) newParams.delete('rss_days');
        else newParams.set('rss_days', String(updates.days));
      }
      if (updates.topics !== undefined) {
        if (!updates.topics) newParams.delete('rss_topic');
        else newParams.set('rss_topic', updates.topics);
      }

      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  const handleTopicChange = (topic: string) => {
    updateFilters({
      topics: topic === 'all' ? undefined : topic,
      page: 1,
    });
  };

  const handleDaysChange = (days: string) => {
    updateFilters({ days: Number(days), page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage });
  };

  const handleNewsClick = (item: NewsItem) => {
    setSelectedNews(item);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* News Detail Dialog */}
      <NewsDetailDialog
        item={selectedNews}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Select value={filters.topics || 'all'} onValueChange={handleTopicChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="主题" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部主题</SelectItem>
            {topicStats?.by_topic && Object.keys(topicStats.by_topic).length > 0 ? (
              Object.entries(topicStats.by_topic)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([topic, stats]) => (
                  <SelectItem key={topic} value={topic}>
                    {topic} ({stats.total})
                  </SelectItem>
                ))
            ) : (
              <>
                <SelectItem value="ai">AI</SelectItem>
                <SelectItem value="game">游戏</SelectItem>
                <SelectItem value="tech">科技</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>

        <Select value={String(filters.days || 7)} onValueChange={handleDaysChange}>
          <SelectTrigger className="w-[120px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          共 {data?.total || 0} 条 RSS 新闻
          {data?.page && ` (第 ${data.page} 页)`}
        </span>
        <span>每页 {filters.page_size} 条</span>
      </div>

      {/* Feed Items */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : data?.items.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              没有找到 RSS 新闻数据
            </CardContent>
          </Card>
        ) : (
          data?.items.map((item) => (
            <Card
              key={item.id}
              className="hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => handleNewsClick(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Rss className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium line-clamp-2 hover:text-primary">
                        {item.title}
                      </h4>
                      {item.importance_score > 0 && (
                        <Badge
                          variant={item.importance_score >= 0.7 ? 'default' : 'secondary'}
                          className="shrink-0"
                        >
                          {(item.importance_score * 100).toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                    {item.summary && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {stripHtml(item.summary)}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {item.topics.map((topic) => (
                        <Badge key={topic} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                      {item.source_name && (
                        <span className="text-xs text-muted-foreground">
                          {item.source_name}
                        </span>
                      )}
                      {item.published_at && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(item.published_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
                      onClick={(e) => e.stopPropagation()}
                      title="打开原文链接"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {data && data.total > (filters.page_size || 20) && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page === 1}
            onClick={() => handlePageChange((filters.page || 1) - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {filters.page || 1} / {Math.ceil(data.total / (filters.page_size || 20))} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!data.has_more}
            onClick={() => handlePageChange((filters.page || 1) + 1)}
          >
            下一页
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ==================== Hacker News Tab ====================

function HackerNewsFeed() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read filters from URL params
  const filters: NewsFilters = {
    source: 'hackernews',
    page: Number(searchParams.get('hn_page')) || 1,
    page_size: 20,
    days: Number(searchParams.get('hn_days')) || 7,
    topics: searchParams.get('hn_topic') || undefined,
  };

  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data, isLoading, refetch } = useNews(filters);
  const { data: topicStats } = useTopicStats();

  // Update URL params helper
  const updateFilters = useCallback((updates: Partial<NewsFilters>) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);

      if (updates.page !== undefined) {
        if (updates.page === 1) newParams.delete('hn_page');
        else newParams.set('hn_page', String(updates.page));
      }
      if (updates.days !== undefined) {
        if (updates.days === 7) newParams.delete('hn_days');
        else newParams.set('hn_days', String(updates.days));
      }
      if (updates.topics !== undefined) {
        if (!updates.topics) newParams.delete('hn_topic');
        else newParams.set('hn_topic', updates.topics);
      }

      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  const handleTopicChange = (topic: string) => {
    updateFilters({
      topics: topic === 'all' ? undefined : topic,
      page: 1,
    });
  };

  const handleDaysChange = (days: string) => {
    updateFilters({ days: Number(days), page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage });
  };

  const handleNewsClick = (item: NewsItem) => {
    setSelectedNews(item);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* News Detail Dialog */}
      <NewsDetailDialog
        item={selectedNews}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Select value={filters.topics || 'all'} onValueChange={handleTopicChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="主题" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部主题</SelectItem>
            {topicStats?.by_topic && Object.keys(topicStats.by_topic).length > 0 ? (
              Object.entries(topicStats.by_topic)
                .sort((a, b) => b[1].total - a[1].total)
                .map(([topic, stats]) => (
                  <SelectItem key={topic} value={topic}>
                    {topic} ({stats.total})
                  </SelectItem>
                ))
            ) : (
              <>
                <SelectItem value="ai">AI</SelectItem>
                <SelectItem value="game">游戏</SelectItem>
                <SelectItem value="tech">科技</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>

        <Select value={String(filters.days || 7)} onValueChange={handleDaysChange}>
          <SelectTrigger className="w-[120px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          共 {data?.total || 0} 条 Hacker News
          {data?.page && ` (第 ${data.page} 页)`}
        </span>
        <span>每页 {filters.page_size} 条</span>
      </div>

      {/* Stories */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : data?.items.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              没有找到 Hacker News 数据
            </CardContent>
          </Card>
        ) : (
          data?.items.map((item) => (
            <Card
              key={item.id}
              className="hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => handleNewsClick(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-4 w-4 text-orange-500 mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium line-clamp-2 hover:text-primary">
                        {item.title}
                      </h4>
                      {item.importance_score > 0 && (
                        <Badge
                          variant={item.importance_score >= 0.7 ? 'default' : 'secondary'}
                          className="shrink-0"
                        >
                          {(item.importance_score * 100).toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                    {item.summary && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {stripHtml(item.summary)}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {item.topics.map((topic) => (
                        <Badge key={topic} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                      {item.author && (
                        <span className="text-xs text-muted-foreground">
                          by {item.author}
                        </span>
                      )}
                      {item.published_at && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(item.published_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
                      onClick={(e) => e.stopPropagation()}
                      title="打开原文链接"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {data && data.total > (filters.page_size || 20) && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page === 1}
            onClick={() => handlePageChange((filters.page || 1) - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {filters.page || 1} / {Math.ceil(data.total / (filters.page_size || 20))} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!data.has_more}
            onClick={() => handlePageChange((filters.page || 1) + 1)}
          >
            下一页
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ==================== Tags Management Tab ====================

function TagsManagement() {
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const { data: tags, isLoading } = useTags(selectedGroup || undefined);
  const { data: tagStats } = useTagStats();

  const groups = tagStats?.by_group ? Object.keys(tagStats.by_group) : [];

  return (
    <div className="space-y-4">
      {/* Group Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedGroup === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedGroup('')}
        >
          全部
        </Button>
        {groups.map((group) => (
          <Button
            key={group}
            variant={selectedGroup === group ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedGroup(group)}
          >
            {group}
          </Button>
        ))}
      </div>

      {/* Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))
        ) : tags?.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center text-muted-foreground">
              没有找到标签
            </CardContent>
          </Card>
        ) : (
          tags?.map((tag) => (
            <Card key={tag.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{tag.name}</span>
                      {tag.color && (
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {tag.slug} · {tag.group}
                    </p>
                    {tag.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {tag.description}
                      </p>
                    )}
                  </div>
                  <Badge variant={tag.is_active ? 'default' : 'secondary'}>
                    {tag.is_active ? '启用' : '禁用'}
                  </Badge>
                </div>
                {tag.keywords && tag.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tag.keywords.slice(0, 5).map((kw) => (
                      <Badge key={kw} variant="outline" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// ==================== Financial Trends Tab ====================

// Custom tooltip for financial charts
function FinancialTooltip({ active, payload, label, unit }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  unit: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-lg font-bold">
          {unit}{payload[0].value.toFixed(unit === '¥' ? 4 : 2)}
        </p>
      </div>
    );
  }
  return null;
}

function FinancialTrendChart({
  title,
  data,
  isLoading,
  unit,
  color,
  latestPrice,
  changePercent,
}: {
  title: string;
  data: Array<{ date: string; price: number }>;
  isLoading: boolean;
  unit: string;
  color: string;
  latestPrice?: number;
  changePercent?: number | null;
}) {
  // Calculate min/max for Y-axis domain
  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.1;
  const yDomain = [
    Math.floor((minPrice - padding) * 100) / 100,
    Math.ceil((maxPrice + padding) * 100) / 100,
  ];

  // Calculate average for reference line
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Coins className="h-4 w-4" style={{ color }} />
            {title}
          </CardTitle>
          {latestPrice !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">
                {unit}{latestPrice.toFixed(unit === '¥' ? 4 : 2)}
              </span>
              {changePercent !== null && changePercent !== undefined && (
                <Badge
                  variant={changePercent >= 0 ? 'default' : 'destructive'}
                  className="flex items-center gap-1"
                >
                  {changePercent >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(changePercent).toFixed(2)}%
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            暂无数据
          </div>
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis
                  domain={yDomain}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${unit}${value.toFixed(unit === '¥' ? 2 : 0)}`}
                  width={unit === '¥' ? 65 : 55}
                />
                <Tooltip content={<FinancialTooltip unit={unit} />} />
                <ReferenceLine
                  y={avgPrice}
                  stroke="#888"
                  strokeDasharray="3 3"
                  label={{ value: '平均', position: 'right', fontSize: 10 }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FinancialTrends() {
  const [days, setDays] = useState(30);
  const { data: summary, refetch: refetchSummary } = useFinancialSummary();
  const { data: goldTrend, isLoading: goldLoading, refetch: refetchGold } = useFinancialTrend('XAU/USD', days);
  const { data: gbpTrend, isLoading: gbpLoading, refetch: refetchGbp } = useFinancialTrend('GBP/CNY', days);
  const { data: usdTrend, isLoading: usdLoading, refetch: refetchUsd } = useFinancialTrend('USD/CNY', days);

  const handleRefresh = () => {
    refetchSummary();
    refetchGold();
    refetchGbp();
    refetchUsd();
    toast.success('数据已刷新');
  };

  const goldData = useMemo(() => {
    if (!goldTrend?.prices) return [];
    return goldTrend.prices.map(p => ({
      date: p.date,
      price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
    }));
  }, [goldTrend]);

  const gbpData = useMemo(() => {
    if (!gbpTrend?.prices) return [];
    return gbpTrend.prices.map(p => ({
      date: p.date,
      price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
    }));
  }, [gbpTrend]);

  const usdData = useMemo(() => {
    if (!usdTrend?.prices) return [];
    return usdTrend.prices.map(p => ({
      date: p.date,
      price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
    }));
  }, [usdTrend]);

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">金融数据趋势</h3>
        <div className="flex items-center gap-2">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 天</SelectItem>
              <SelectItem value="14">14 天</SelectItem>
              <SelectItem value="30">30 天</SelectItem>
              <SelectItem value="60">60 天</SelectItem>
              <SelectItem value="90">90 天</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Coins className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">黄金价格</p>
                    <p className="text-xl font-bold">${parseFloat(summary.gold.price).toFixed(2)}</p>
                  </div>
                </div>
                {summary.gold.change_percent !== null && (
                  <Badge
                    variant={summary.gold.change_percent >= 0 ? 'default' : 'destructive'}
                    className="text-sm"
                  >
                    {summary.gold.change_percent >= 0 ? '+' : ''}
                    {summary.gold.change_percent.toFixed(2)}%
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                更新于: {new Date(summary.gold.recorded_at).toLocaleString('zh-CN')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">$</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">美元/人民币</p>
                    <p className="text-xl font-bold">¥{summary.usd_cny ? parseFloat(summary.usd_cny.price).toFixed(4) : '-'}</p>
                  </div>
                </div>
                {summary.usd_cny?.change_percent !== null && summary.usd_cny?.change_percent !== undefined && (
                  <Badge
                    variant={summary.usd_cny.change_percent >= 0 ? 'default' : 'destructive'}
                    className="text-sm"
                  >
                    {summary.usd_cny.change_percent >= 0 ? '+' : ''}
                    {summary.usd_cny.change_percent.toFixed(2)}%
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                更新于: {summary.usd_cny ? new Date(summary.usd_cny.recorded_at).toLocaleString('zh-CN') : '-'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">£</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">英镑/人民币</p>
                    <p className="text-xl font-bold">¥{parseFloat(summary.gbp_cny.price).toFixed(4)}</p>
                  </div>
                </div>
                {summary.gbp_cny.change_percent !== null && (
                  <Badge
                    variant={summary.gbp_cny.change_percent >= 0 ? 'default' : 'destructive'}
                    className="text-sm"
                  >
                    {summary.gbp_cny.change_percent >= 0 ? '+' : ''}
                    {summary.gbp_cny.change_percent.toFixed(2)}%
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                更新于: {new Date(summary.gbp_cny.recorded_at).toLocaleString('zh-CN')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <FinancialTrendChart
          title="黄金价格 (USD/oz)"
          data={goldData}
          isLoading={goldLoading}
          unit="$"
          color="#eab308"
          latestPrice={goldTrend?.current_price ? (typeof goldTrend.current_price === 'string' ? parseFloat(goldTrend.current_price) : goldTrend.current_price) : undefined}
          changePercent={goldTrend?.change_1d}
        />

        <FinancialTrendChart
          title="美元/人民币汇率"
          data={usdData}
          isLoading={usdLoading}
          unit="¥"
          color="#22c55e"
          latestPrice={usdTrend?.current_price ? (typeof usdTrend.current_price === 'string' ? parseFloat(usdTrend.current_price) : usdTrend.current_price) : undefined}
          changePercent={usdTrend?.change_1d}
        />

        <FinancialTrendChart
          title="英镑/人民币汇率"
          data={gbpData}
          isLoading={gbpLoading}
          unit="¥"
          color="#3b82f6"
          latestPrice={gbpTrend?.current_price ? (typeof gbpTrend.current_price === 'string' ? parseFloat(gbpTrend.current_price) : gbpTrend.current_price) : undefined}
          changePercent={gbpTrend?.change_1d}
        />
      </div>

      {/* Data source info */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            数据来源: 金融数据 API · 每日自动采集 · 上次更新: {summary?.last_updated ? new Date(summary.last_updated).toLocaleString('zh-CN') : '-'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== Main Page ====================

export default function DataSourcesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6" />
          数据源管理
        </h1>
        <p className="text-muted-foreground mt-1">
          管理外部数据采集、查看原始数据、订阅源和标签配置
        </p>
      </div>

      <Tabs defaultValue="stats" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">统计</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="gap-2">
            <Coins className="h-4 w-4" />
            <span className="hidden sm:inline">金融</span>
          </TabsTrigger>
          <TabsTrigger value="news" className="gap-2">
            <Newspaper className="h-4 w-4" />
            <span className="hidden sm:inline">新闻</span>
          </TabsTrigger>
          <TabsTrigger value="github" className="gap-2">
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">GitHub</span>
          </TabsTrigger>
          <TabsTrigger value="rss" className="gap-2">
            <Rss className="h-4 w-4" />
            <span className="hidden sm:inline">RSS</span>
          </TabsTrigger>
          <TabsTrigger value="hackernews" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">HN</span>
          </TabsTrigger>
          <TabsTrigger value="tags" className="gap-2">
            <Tag className="h-4 w-4" />
            <span className="hidden sm:inline">标签</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <StatsOverview />
        </TabsContent>

        <TabsContent value="financial">
          <FinancialTrends />
        </TabsContent>

        <TabsContent value="news">
          <NewsBrowser />
        </TabsContent>

        <TabsContent value="github">
          <GitHubTrending />
        </TabsContent>

        <TabsContent value="rss">
          <RSSFeeds />
        </TabsContent>

        <TabsContent value="hackernews">
          <HackerNewsFeed />
        </TabsContent>

        <TabsContent value="tags">
          <TagsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
