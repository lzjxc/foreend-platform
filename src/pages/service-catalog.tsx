import { useState, useMemo } from 'react';
import {
  Server,
  Search,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Activity,
  Globe,
  Box,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useServices,
  useCatalogHealth,
  useServiceHealth,
  configServiceKeys,
} from '@/hooks/use-config-service';
import type { ServiceInfo, ServiceLayer } from '@/types/config-service';
import { LAYER_CONFIG, STATUS_CONFIG } from '@/types/config-service';

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

// Service Card Component
function ServiceCard({
  service,
  healthStatus,
  onClick,
}: {
  service: ServiceInfo;
  healthStatus?: 'healthy' | 'unhealthy' | 'unknown';
  onClick: () => void;
}) {
  const layerConfig = LAYER_CONFIG[service.layer];
  const statusConfig = STATUS_CONFIG[service.status];

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{layerConfig.icon}</span>
            <div>
              <h3 className="font-semibold">{service.name}</h3>
              <p className="text-xs text-muted-foreground">{service.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {healthStatus && (
              <span
                className={`w-2 h-2 rounded-full ${
                  healthStatus === 'healthy'
                    ? 'bg-green-500'
                    : healthStatus === 'unhealthy'
                    ? 'bg-red-500'
                    : 'bg-gray-400'
                }`}
              />
            )}
            <Badge variant="secondary" className={statusConfig.color}>
              {statusConfig.name}
            </Badge>
          </div>
        </div>
        {service.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {service.description}
          </p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {service.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {service.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{service.tags.length - 3}
            </Badge>
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

// Main Page Component
export default function ServiceCatalogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceInfo | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const queryClient = useQueryClient();
  const { data: services, isLoading, isRefetching } = useServices();
  const { data: catalogHealth } = useCatalogHealth();

  // Group services by layer
  const groupedServices = useMemo((): Partial<Record<ServiceLayer, ServiceInfo[]>> => {
    if (!services) return {};

    const filtered = services.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return filtered.reduce((acc, service) => {
      const layer = service.layer;
      if (!acc[layer]) acc[layer] = [];
      acc[layer]!.push(service);
      return acc;
    }, {} as Partial<Record<ServiceLayer, ServiceInfo[]>>);
  }, [services, searchQuery]);

  // Get health status for a service
  const getHealthStatus = (serviceId: string) => {
    return catalogHealth?.services.find((h) => h.id === serviceId)?.status;
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: configServiceKeys.all });
  };

  const handleServiceClick = (service: ServiceInfo) => {
    setSelectedService(service);
    setDetailOpen(true);
  };

  const layerOrder: ServiceLayer[] = ['infra', 'shared', 'business', 'sensitive'];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Server className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">服务目录</h1>
            <p className="text-sm text-muted-foreground">
              查看和管理系统中的所有服务
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefetching}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`}
          />
          刷新
        </Button>
      </div>

      {/* Health Summary */}
      {catalogHealth?.summary && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">总服务数</p>
              <p className="text-2xl font-bold">{catalogHealth.summary.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">正常</p>
              <p className="text-2xl font-bold text-green-600">
                {catalogHealth.summary.healthy}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">异常</p>
              <p className="text-2xl font-bold text-red-600">
                {catalogHealth.summary.unhealthy}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">未知</p>
              <p className="text-2xl font-bold text-gray-400">
                {catalogHealth.summary.total - catalogHealth.summary.healthy - catalogHealth.summary.unhealthy}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索服务名称、ID 或标签..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Service List by Layer */}
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {layerOrder.map((layer) => {
            const layerServices = groupedServices[layer];
            if (!layerServices || layerServices.length === 0) return null;

            const config = LAYER_CONFIG[layer];

            return (
              <div key={layer}>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span>{config.icon}</span>
                  {config.name}
                  <Badge variant="secondary" className="ml-2">
                    {layerServices.length}
                  </Badge>
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {layerServices.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      healthStatus={getHealthStatus(service.id)}
                      onClick={() => handleServiceClick(service)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {Object.keys(groupedServices).length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              未找到匹配的服务
            </div>
          )}
        </div>
      )}

      {/* Service Detail Dialog */}
      <ServiceDetailDialog
        service={selectedService}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
