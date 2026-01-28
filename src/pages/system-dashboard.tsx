import { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  DollarSign,
  TrendingUp,
  Layers,
  Network,
  ExternalLink,
  Copy,
  Check,
  Activity,
  Globe,
  Box,
  Monitor,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useServices,
  useCatalogHealth,
  useServiceHealth,
  configServiceKeys,
} from '@/hooks/use-config-service';
import type { ServiceInfo, ServiceLayer, CatalogHealthServiceItem } from '@/types/config-service';
import { LAYER_CONFIG, STATUS_CONFIG } from '@/types/config-service';

// Lazy load the architecture diagram to avoid loading React Flow when not needed
const ServiceArchitectureDiagram = lazy(() => import('@/components/system/service-architecture-diagram'));
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

type RefreshInterval = 'manual' | '1min' | '5min';

// Copy to clipboard hook
function useCopyToClipboard() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return { copiedText, copy };
}

// Service Card Component for dashboard
function ServiceCard({
  service,
  healthStatus,
  responseTime,
  onClick,
}: {
  service: ServiceInfo;
  healthStatus?: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number | null;
  onClick: () => void;
}) {
  const layerConfig = LAYER_CONFIG[service.layer];

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">{layerConfig.icon}</span>
          <CardTitle className="text-sm font-medium truncate">{service.name}</CardTitle>
        </div>
        {healthStatus === 'healthy' ? (
          <Badge variant="success" className="gap-1 shrink-0">
            <CheckCircle2 className="h-3 w-3" />
            在线
          </Badge>
        ) : healthStatus === 'unhealthy' ? (
          <Badge variant="destructive" className="gap-1 shrink-0">
            <XCircle className="h-3 w-3" />
            离线
          </Badge>
        ) : (
          <Badge variant="secondary" className="gap-1 shrink-0">
            未知
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground truncate text-xs">
            {service.id}
          </span>
          {responseTime != null && (
            <span className="flex items-center gap-1 text-muted-foreground shrink-0">
              <Clock className="h-3 w-3" />
              {responseTime}ms
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Service Detail Dialog
function ServiceDetailDialog({
  service,
  open,
  onOpenChange,
}: {
  service: ServiceInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { copiedText, copy } = useCopyToClipboard();
  const { data: health, isLoading: healthLoading } = useServiceHealth(
    service?.id || ''
  );

  if (!service) return null;

  const layerConfig = LAYER_CONFIG[service.layer];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{layerConfig.icon}</span>
            {service.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Health Status */}
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">健康状态</p>
              {healthLoading ? (
                <Skeleton className="h-4 w-24" />
              ) : (
                <p
                  className={`text-sm ${
                    health?.status === 'healthy'
                      ? 'text-green-600'
                      : health?.status === 'unhealthy'
                      ? 'text-red-600'
                      : 'text-gray-500'
                  }`}
                >
                  {health?.status === 'healthy'
                    ? `✅ 正常 (${health.response_time_ms}ms)`
                    : health?.status === 'unhealthy'
                    ? `❌ 异常: ${health.error}`
                    : '⚪ 未知'}
                </p>
              )}
            </div>
          </div>

          {/* URLs */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              服务地址
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                  {service.internal_url}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copy(service.internal_url)}
                >
                  {copiedText === service.internal_url ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {service.tailscale_url && (
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-blue-50 text-blue-800 p-2 rounded overflow-x-auto">
                    {service.tailscale_url}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copy(service.tailscale_url!)}
                  >
                    {copiedText === service.tailscale_url ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <a
                      href={service.tailscale_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Namespace</p>
              <p className="font-medium">{service.namespace}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Port</p>
              <p className="font-medium">{service.port}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Layer</p>
              <Badge className={layerConfig.color}>{layerConfig.name}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={STATUS_CONFIG[service.status].color}>
                {STATUS_CONFIG[service.status].name}
              </Badge>
            </div>
          </div>

          {/* Dependencies */}
          {service.dependencies.length > 0 && (
            <div>
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Box className="h-4 w-4" />
                依赖服务
              </h4>
              <div className="flex flex-wrap gap-2">
                {service.dependencies.map((dep) => (
                  <Badge key={dep} variant="secondary">
                    {dep}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {service.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">标签</h4>
              <div className="flex flex-wrap gap-2">
                {service.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="flex gap-2 pt-2 border-t">
            {service.docs_url && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={service.tailscale_url ? `${service.tailscale_url}/docs` : service.docs_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  API 文档
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            )}
            {service.health_endpoint && service.tailscale_url && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`${service.tailscale_url}${service.health_endpoint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  健康检查
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Breakdown API response types
interface BreakdownTotals {
  tokens: number;
  requests: number;
  cost: number;
}

interface AppBreakdown {
  app: string;
  tokens: number;
  requests: number;
  cost: number;
}

interface ModelBreakdown {
  model: string;
  subtotal: BreakdownTotals;
  apps: AppBreakdown[];
}

interface UsageBreakdown {
  period_start: string;
  period_end: string;
  totals: BreakdownTotals;
  by_model: ModelBreakdown[];
}

// Daily API response types
interface DailyBreakdown {
  date: string;
  totals: BreakdownTotals;
  by_model: ModelBreakdown[];
}

interface DailyUsageResponse {
  period_start: string;
  period_end: string;
  totals: BreakdownTotals;
  days: DailyBreakdown[];
}

interface ModelSpend {
  name: string;
  spend: number;
  tokens: number;
  requests: number;
  color: string;
  isLocal: boolean;
}

interface AppSpend {
  name: string;
  spend: number;
  tokens: number;
  requests: number;
  color: string;
}

// llm-gateway (our wrapper with breakdown API)
// Use proxy path - both dev (Vite) and prod (nginx) proxy to llm-gateway
const LLM_GATEWAY_API_URL = '/llm-gateway-api';

// Local models list (no cost)
const LOCAL_MODELS = [
  'qwen/qwen3-32b',
  'qwen3-32b',
  'llama',
  'mistral',
  'deepseek',
  // Add more local model patterns as needed
];

// Check if a model is local (free)
const isLocalModel = (modelName: string): boolean => {
  const lowerName = modelName.toLowerCase();
  return LOCAL_MODELS.some(local => lowerName.includes(local.toLowerCase()));
};

// Model colors for the pie chart
const MODEL_COLORS: Record<string, string> = {
  'claude-sonnet-4-20250514': '#8B5CF6',
  'claude-3-5-sonnet-20241022': '#A78BFA',
  'gpt-4o': '#10B981',
  'gpt-4o-mini': '#34D399',
  'gpt-4-turbo': '#059669',
  'default': '#6B7280',
  'local': '#9CA3AF',  // Gray for local models
};

// App colors for the app spend chart
// Keys match llm-gateway app names
const APP_COLORS: Record<string, string> = {
  'ai-weekly': '#F59E0B',         // Amber
  'game-weekly-api': '#EF4444',   // Red
  'homework-api': '#3B82F6',      // Blue
  'wordbook': '#10B981',          // Green
  'news-tagger': '#06B6D4',       // Cyan
  'frontend': '#8B5CF6',          // Purple
  'test': '#9CA3AF',              // Gray
  'default': '#6B7280',
};

// Layer order for display
const layerOrder: ServiceLayer[] = ['infra', 'shared', 'business', 'sensitive'];

export default function SystemDashboard() {
  const queryClient = useQueryClient();
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>('manual');
  const [selectedService, setSelectedService] = useState<ServiceInfo | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Config service hooks
  const { data: services = [], isLoading: servicesLoading, isFetching: servicesFetching } = useServices();
  const { data: catalogHealth, isLoading: healthLoading, isFetching: healthFetching } = useCatalogHealth();

  const isRefreshing = servicesFetching || healthFetching;

  // Convert health array to map for easy lookup
  // Note: catalog/health API returns 'id' field, not 'service_id'
  const healthMap = useMemo(() => {
    const map: Record<string, CatalogHealthServiceItem> = {};
    if (catalogHealth?.services) {
      catalogHealth.services.forEach((h) => {
        if (h.id) {
          map[h.id] = h;
        }
      });
    }
    return map;
  }, [catalogHealth]);

  // Group services by layer
  const groupedServices = useMemo(() => {
    const groups: Record<ServiceLayer, ServiceInfo[]> = {
      infra: [],
      shared: [],
      business: [],
      sensitive: [],
    };
    services.forEach(service => {
      if (groups[service.layer]) {
        groups[service.layer].push(service);
      }
    });
    return groups;
  }, [services]);

  // LLM Usage state
  const [usageBreakdown, setUsageBreakdown] = useState<UsageBreakdown | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsageResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // null = show all days summary
  const [isLoadingSpend, setIsLoadingSpend] = useState(true);
  const [, setIsRefreshingSpend] = useState(false); // For background refresh indicator (value unused)
  const [spendError, setSpendError] = useState<string | null>(null);

  const fetchUsageBreakdown = useCallback(async (isRefresh = false) => {
    // On refresh, don't show skeleton - keep existing data visible
    if (isRefresh) {
      setIsRefreshingSpend(true);
    } else {
      setIsLoadingSpend(true);
    }
    setSpendError(null);

    try {
      // Fetch both breakdown (for totals and model/app distribution) and daily (for trend chart) in parallel
      // Note: llm-gateway uses /usage/* endpoints (not /api/v1/usage/*)
      const [breakdownResponse, dailyResponse] = await Promise.all([
        fetch(`${LLM_GATEWAY_API_URL}/usage/breakdown?days=7`),
        fetch(`${LLM_GATEWAY_API_URL}/usage/daily?days=7`),
      ]);

      if (!breakdownResponse.ok) {
        throw new Error(`Breakdown API: HTTP ${breakdownResponse.status}`);
      }

      const breakdown: UsageBreakdown = await breakdownResponse.json();
      setUsageBreakdown(breakdown);

      // Daily data is optional - don't fail if it's not available
      if (dailyResponse.ok) {
        const daily: DailyUsageResponse = await dailyResponse.json();
        setDailyUsage(daily);
      } else {
        console.warn('Daily API not available:', dailyResponse.status);
        setDailyUsage(null);
      }
    } catch (error) {
      setSpendError(error instanceof Error ? error.message : 'Failed to fetch');
    } finally {
      setIsLoadingSpend(false);
      setIsRefreshingSpend(false);
    }
  }, []);

  // Refresh everything
  const refreshAll = useCallback(async () => {
    // Invalidate config-service queries to refetch services and health
    queryClient.invalidateQueries({ queryKey: configServiceKeys.all });
    // Also refresh LLM usage data
    fetchUsageBreakdown(true);
    setLastRefresh(new Date());
  }, [queryClient, fetchUsageBreakdown]);

  // Initial load for LLM usage
  useEffect(() => {
    fetchUsageBreakdown(false);
  }, [fetchUsageBreakdown]);

  // Auto refresh
  useEffect(() => {
    if (refreshInterval === 'manual') return;

    const intervalMs = refreshInterval === '1min' ? 60_000 : 300_000;
    const timer = setInterval(refreshAll, intervalMs);

    return () => clearInterval(timer);
  }, [refreshInterval, refreshAll]);

  // Calculate online count from health data
  // Use summary from catalog health if available, otherwise count from healthMap
  const onlineCount = catalogHealth?.summary?.healthy ?? Object.values(healthMap).filter((h) => h?.status === 'healthy').length;
  const totalCount = services.length;

  // Prepare daily data for chart (always from dailyUsage)
  const dailySpendData = useMemo(() => {
    if (!dailyUsage?.days) return [];
    return dailyUsage.days.map(d => ({
      date: d.date.substring(5), // MM-DD format
      fullDate: d.date, // Keep full date for selection
      spend: Number(d.totals.cost.toFixed(4)),
      tokens: d.totals.tokens,
    })).sort((a, b) => a.date.localeCompare(b.date)); // Sort by date ascending
  }, [dailyUsage]);

  // Get the data source based on selected date
  const currentDataSource = useMemo(() => {
    if (selectedDate && dailyUsage?.days) {
      // Find the selected day's data
      const dayData = dailyUsage.days.find(d => d.date === selectedDate);
      if (dayData) {
        return {
          totals: dayData.totals,
          by_model: dayData.by_model,
          label: selectedDate.substring(5), // MM-DD format
        };
      }
    }
    // Default: use overall breakdown data
    if (usageBreakdown) {
      return {
        totals: usageBreakdown.totals,
        by_model: usageBreakdown.by_model,
        label: '最近 7 天',
      };
    }
    return null;
  }, [selectedDate, dailyUsage, usageBreakdown]);

  // Process usage data (from either overall or selected day)
  const { totalSpend, totalTokens, totalRequests, cloudSpend, localModelRequests, modelSpendData, appSpendData, dataLabel } = useMemo(() => {
    if (!currentDataSource) {
      return {
        totalSpend: 0,
        totalTokens: 0,
        totalRequests: 0,
        cloudSpend: 0,
        localModelRequests: 0,
        modelSpendData: [] as ModelSpend[],
        appSpendData: [] as AppSpend[],
        dataLabel: '',
      };
    }

    const { totals, by_model, label } = currentDataSource;

    // Process model data
    const modelData: ModelSpend[] = by_model.map(m => {
      const isLocal = isLocalModel(m.model);
      const displayName = m.model.length > 25 ? m.model.substring(0, 25) + '...' : m.model;
      return {
        name: displayName + (isLocal ? ' (本地)' : ''),
        spend: m.subtotal.cost,
        tokens: m.subtotal.tokens,
        requests: m.subtotal.requests,
        color: isLocal ? MODEL_COLORS.local : (MODEL_COLORS[m.model] || MODEL_COLORS.default),
        isLocal,
      };
    }).sort((a, b) => {
      // Sort by requests if both have 0 cost (for local models)
      if (a.spend === 0 && b.spend === 0) return b.requests - a.requests;
      return b.spend - a.spend;
    });

    // Calculate cloud-only spend and local model requests
    const cloud = modelData.filter(m => !m.isLocal).reduce((sum, m) => sum + m.spend, 0);
    const localRequests = modelData.filter(m => m.isLocal).reduce((sum, m) => sum + m.requests, 0);

    // Aggregate app data from all models
    const appMap = new Map<string, { spend: number; tokens: number; requests: number }>();
    by_model.forEach(m => {
      m.apps.forEach(app => {
        const existing = appMap.get(app.app) || { spend: 0, tokens: 0, requests: 0 };
        existing.spend += app.cost;
        existing.tokens += app.tokens;
        existing.requests += app.requests;
        appMap.set(app.app, existing);
      });
    });

    const appData: AppSpend[] = Array.from(appMap.entries())
      .map(([name, data]) => ({
        name,
        spend: data.spend,
        tokens: data.tokens,
        requests: data.requests,
        color: APP_COLORS[name] || APP_COLORS.default,
      }))
      .sort((a, b) => {
        // Sort by requests if both have 0 cost
        if (a.spend === 0 && b.spend === 0) return b.requests - a.requests;
        return b.spend - a.spend;
      });

    return {
      totalSpend: totals.cost,
      totalTokens: totals.tokens,
      totalRequests: totals.requests,
      cloudSpend: cloud,
      localModelRequests: localRequests,
      modelSpendData: modelData,
      appSpendData: appData,
      dataLabel: label,
    };
  }, [currentDataSource]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">服务状态概览</h2>
          <p className="text-sm text-muted-foreground">
            {onlineCount}/{totalCount} 服务在线
            {lastRefresh && ` - 最后更新: ${lastRefresh.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(e.target.value as RefreshInterval)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="manual">手动刷新</option>
            <option value="1min">每 1 分钟</option>
            <option value="5min">每 5 分钟</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAll}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')}
            />
            刷新
          </Button>
        </div>
      </div>

      {/* Service Catalog by Layer */}
      {servicesLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      ) : (
        layerOrder.map((layer) => {
          const layerServices = groupedServices[layer];
          if (layerServices.length === 0) return null;
          const layerConfig = LAYER_CONFIG[layer];

          return (
            <div key={layer} className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <span>{layerConfig.icon}</span>
                {layerConfig.name}
                <Badge variant="secondary" className="text-xs">
                  {layerServices.length}
                </Badge>
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {layerServices.map((service) => {
                  const health = healthMap[service.id];
                  const healthStatus = healthLoading
                    ? undefined
                    : health?.status === 'healthy'
                    ? 'healthy'
                    : health?.status === 'unhealthy'
                    ? 'unhealthy'
                    : 'unknown';

                  return (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      healthStatus={healthStatus}
                      responseTime={health?.response_time_ms}
                      onClick={() => {
                        setSelectedService(service);
                        setDetailOpen(true);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* Service Detail Dialog */}
      <ServiceDetailDialog
        service={selectedService}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      {/* LLM Usage Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            LLM 用量统计 (最近 7 天)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSpend ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : spendError ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>加载失败: {spendError}</p>
            </div>
          ) : !usageBreakdown || (totalSpend === 0 && totalRequests === 0) ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>暂无用量数据</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">云端费用</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      ${cloudSpend.toFixed(4)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {totalRequests} 次请求
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-muted-foreground">本地调用</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      {localModelRequests}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      免费 (本地模型)
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-muted-foreground">总 Tokens</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      {totalTokens > 1000000
                        ? `${(totalTokens / 1000000).toFixed(2)}M`
                        : totalTokens > 1000
                          ? `${(totalTokens / 1000).toFixed(1)}K`
                          : totalTokens}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      输入+输出
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">使用模型数</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      {modelSpendData.length}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">使用应用数</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">
                      {appSpendData.length}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Daily Usage and Cost Charts */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium">每日趋势 (点击查看详情)</h4>
                  {selectedDate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedDate(null)}
                      className="h-7 text-xs"
                    >
                      清除选择
                    </Button>
                  )}
                </div>
                {dailySpendData.length > 0 ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    {/* Token Usage Trend */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <Cpu className="h-3 w-3" />
                        Token 用量趋势
                      </p>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={dailySpendData}
                            onClick={(data) => {
                              if (data?.activePayload?.[0]?.payload?.fullDate) {
                                const clickedDate = data.activePayload[0].payload.fullDate;
                                setSelectedDate(prev => prev === clickedDate ? null : clickedDate);
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 11 }}
                              className="text-muted-foreground"
                            />
                            <YAxis
                              tick={{ fontSize: 11 }}
                              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}
                              className="text-muted-foreground"
                              width={45}
                            />
                            <Tooltip
                              formatter={(value: number) => [
                                value >= 1000 ? `${(value / 1000).toFixed(1)}K tokens` : `${value} tokens`,
                                '用量'
                              ]}
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                            />
                            <Bar
                              dataKey="tokens"
                              radius={[4, 4, 0, 0]}
                            >
                              {dailySpendData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.fullDate === selectedDate ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.5)'}
                                  stroke={entry.fullDate === selectedDate ? 'hsl(var(--primary))' : 'transparent'}
                                  strokeWidth={2}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Cost Trend */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        费用趋势
                      </p>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={dailySpendData}
                            onClick={(data) => {
                              if (data?.activePayload?.[0]?.payload?.fullDate) {
                                const clickedDate = data.activePayload[0].payload.fullDate;
                                setSelectedDate(prev => prev === clickedDate ? null : clickedDate);
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 11 }}
                              className="text-muted-foreground"
                            />
                            <YAxis
                              tick={{ fontSize: 11 }}
                              tickFormatter={(value) => `$${value}`}
                              className="text-muted-foreground"
                              width={50}
                            />
                            <Tooltip
                              formatter={(value: number) => [
                                `$${value.toFixed(4)}`,
                                '费用'
                              ]}
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                            />
                            <Bar
                              dataKey="spend"
                              radius={[4, 4, 0, 0]}
                            >
                              {dailySpendData.map((entry, index) => (
                                <Cell
                                  key={`cost-cell-${index}`}
                                  fill={entry.fullDate === selectedDate ? '#10B981' : 'rgba(16, 185, 129, 0.5)'}
                                  stroke={entry.fullDate === selectedDate ? '#10B981' : 'transparent'}
                                  strokeWidth={2}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center rounded-lg border border-dashed">
                    <p className="text-sm text-muted-foreground">
                      暂无每日数据
                    </p>
                  </div>
                )}
              </div>

              {/* Nested Model → App Distribution */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h4 className="text-sm font-medium">模型 → 应用用量分布</h4>
                  <Badge variant={selectedDate ? "default" : "secondary"} className="text-xs">
                    {dataLabel}
                  </Badge>
                </div>
                <div className="space-y-4">
                  {currentDataSource?.by_model.map((modelData, modelIndex) => {
                    const isLocal = isLocalModel(modelData.model);
                    const currentTotalTokens = currentDataSource.totals.tokens;
                    const modelPercentage = currentTotalTokens > 0
                      ? (modelData.subtotal.tokens / currentTotalTokens) * 100
                      : 0;
                    const modelTokenDisplay = modelData.subtotal.tokens > 1000
                      ? `${(modelData.subtotal.tokens / 1000).toFixed(1)}K`
                      : modelData.subtotal.tokens.toString();
                    const modelColor = isLocal
                      ? MODEL_COLORS.local
                      : (MODEL_COLORS[modelData.model] || MODEL_COLORS.default);

                    return (
                      <div key={modelIndex} className="space-y-2">
                        {/* Model Header */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm font-medium">
                            <span className={cn(
                              "truncate max-w-[280px]",
                              isLocal && "text-muted-foreground"
                            )}>
                              {modelData.model}
                              {isLocal && <span className="ml-1 text-xs">(本地)</span>}
                            </span>
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <span className="font-mono text-xs">{modelTokenDisplay} tokens</span>
                              <span className="font-mono text-xs">{modelData.subtotal.requests}次</span>
                              {isLocal ? (
                                <span className="font-mono text-xs text-green-600">免费</span>
                              ) : (
                                <span className="font-mono text-xs">${modelData.subtotal.cost.toFixed(4)}</span>
                              )}
                              <span className="w-14 text-right">{modelPercentage.toFixed(1)}%</span>
                            </span>
                          </div>
                          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.max(modelPercentage, 0.5)}%`,
                                backgroundColor: modelColor,
                              }}
                            />
                          </div>
                        </div>

                        {/* Apps under this model */}
                        {modelData.apps.length > 0 && (
                          <div className="ml-4 pl-4 border-l-2 border-muted space-y-1.5">
                            {modelData.apps
                              .sort((a, b) => b.tokens - a.tokens)
                              .map((app, appIndex) => {
                                const appPercentage = modelData.subtotal.tokens > 0
                                  ? (app.tokens / modelData.subtotal.tokens) * 100
                                  : 0;
                                const appTokenDisplay = app.tokens > 1000
                                  ? `${(app.tokens / 1000).toFixed(1)}K`
                                  : app.tokens.toString();
                                const appColor = APP_COLORS[app.app] || APP_COLORS.default;

                                return (
                                  <div key={appIndex} className="space-y-0.5">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="truncate max-w-[200px] text-muted-foreground">
                                        {app.app}
                                      </span>
                                      <span className="flex items-center gap-2 text-muted-foreground">
                                        <span className="font-mono">{appTokenDisplay}</span>
                                        <span className="font-mono">{app.requests}次</span>
                                        <span className="w-12 text-right">{appPercentage.toFixed(0)}%</span>
                                      </span>
                                    </div>
                                    <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                          width: `${Math.max(appPercentage, 1)}%`,
                                          backgroundColor: appColor,
                                        }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(!usageBreakdown?.by_model || usageBreakdown.by_model.length === 0) && (
                    <p className="text-muted-foreground text-center py-8">暂无数据</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Architecture Diagram */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            系统架构图
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="h-[400px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            }
          >
            <ServiceArchitectureDiagram />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
