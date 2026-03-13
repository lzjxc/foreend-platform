import { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Network,
  ExternalLink,
  Copy,
  Check,
  Activity,
  Globe,
  Box,
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

// Lazy load skill components
const SkillList = lazy(() => import('@/components/system/skill-list').then(m => ({ default: m.SkillList })));
const SkillUsageStats = lazy(() => import('@/components/system/skill-usage-stats').then(m => ({ default: m.SkillUsageStats })));

// Lazy load model management
const ModelManagement = lazy(() => import('@/components/system/model-management').then(m => ({ default: m.ModelManagement })));
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

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

// Layer order for display
const layerOrder: ServiceLayer[] = ['infra', 'shared', 'business', 'sensitive'];

export default function SystemDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'services';
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

  // Refresh everything
  const refreshAll = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: configServiceKeys.all });
    setLastRefresh(new Date());
  }, [queryClient]);

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

  return (
    <Tabs
      value={currentTab}
      onValueChange={(value) => setSearchParams({ tab: value })}
      className="space-y-4"
    >
      <TabsList>
        <TabsTrigger value="services">服务概览</TabsTrigger>
        <TabsTrigger value="models">模型管理</TabsTrigger>
        <TabsTrigger value="skills">Skill 管理</TabsTrigger>
      </TabsList>

      <TabsContent value="services" className="space-y-6">
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
      </TabsContent>

      <TabsContent value="models" className="space-y-6">
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <ModelManagement />
        </Suspense>
      </TabsContent>

      <TabsContent value="skills" className="space-y-6">
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <SkillUsageStats />
          <SkillList />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}
