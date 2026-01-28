import { useState } from 'react';
import {
  Settings2,
  Server,
  GitBranch,
  Package,
  Variable,
  ChevronRight,
  Check,
  X,
  Edit2,
  Save,
  RefreshCw,
  Upload,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import {
  useArgoAppsByLayer,
  useArgoAppConfig,
  useArgoGitStatus,
  useUpdateArgoEnvVar,
  useArgoGitPush,
} from '@/hooks/use-doc-service';
import type { ArgoApp, ArgoLayer, ArgoEnvVar } from '@/types/doc-service';
import { cn } from '@/lib/utils';

const LAYER_CONFIG: Record<ArgoLayer, { label: string; color: string }> = {
  apps: { label: '应用层', color: 'bg-blue-100 text-blue-800' },
  infra: { label: '基础设施', color: 'bg-purple-100 text-purple-800' },
  'shared-services': { label: '共享服务', color: 'bg-green-100 text-green-800' },
  personal: { label: '个人服务', color: 'bg-orange-100 text-orange-800' },
};

function GitStatusBadge() {
  const { data: gitStatus, isLoading, refetch } = useArgoGitStatus();
  const pushMutation = useArgoGitPush();

  if (isLoading) {
    return <Badge variant="outline">加载中...</Badge>;
  }

  if (!gitStatus) {
    return <Badge variant="destructive">无法获取状态</Badge>;
  }

  const hasChanges =
    (gitStatus.modified_files?.length ?? 0) > 0 ||
    (gitStatus.untracked_files?.length ?? 0) > 0 ||
    (gitStatus.staged_files?.length ?? 0) > 0;

  const handlePush = async () => {
    try {
      await pushMutation.mutateAsync('Update from web UI');
      toast.success('推送成功');
    } catch (error) {
      toast.error('推送失败');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant={gitStatus.clean ? 'secondary' : 'default'}>
        <GitBranch className="h-3 w-3 mr-1" />
        {gitStatus.current_branch || 'unknown'}
      </Badge>
      {hasChanges ? (
        <>
          <Badge variant="destructive">
            {(gitStatus.modified_files?.length ?? 0) + (gitStatus.staged_files?.length ?? 0)} 个更改
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePush}
            disabled={pushMutation.isPending}
          >
            <Upload className="h-4 w-4 mr-1" />
            推送
          </Button>
        </>
      ) : (
        <Badge variant="outline" className="text-green-600">
          <Check className="h-3 w-3 mr-1" />
          已同步
        </Badge>
      )}
      <Button variant="ghost" size="icon" onClick={() => refetch()}>
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
}

function AppListItem({
  app,
  isSelected,
  onClick,
}: {
  app: ArgoApp;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors',
        isSelected
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-muted'
      )}
    >
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4" />
        <span>{app.name}</span>
      </div>
      <ChevronRight className="h-4 w-4" />
    </button>
  );
}

function EnvVarEditor({
  layer,
  appName,
  envVar,
  onUpdate,
}: {
  layer: string;
  appName: string;
  envVar: ArgoEnvVar;
  onUpdate: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const displayValue = envVar.is_secret ? '••••••••' : (envVar.value ?? '');
  const [editValue, setEditValue] = useState(envVar.value ?? '');
  const updateMutation = useUpdateArgoEnvVar();

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        layer,
        name: appName,
        key: envVar.name,
        value: editValue,
      });
      setIsEditing(false);
      onUpdate();
      toast.success(`已更新 ${envVar.name}`);
    } catch (error) {
      toast.error('更新失败');
    }
  };

  const handleCancel = () => {
    setEditValue(envVar.value ?? '');
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-2 py-1">
      <span className="font-mono text-sm text-muted-foreground w-[200px] truncate" title={envVar.name}>
        {envVar.name}
      </span>
      {envVar.is_secret && !isEditing ? (
        <code className="flex-1 text-sm bg-muted px-2 py-1 rounded truncate text-muted-foreground italic">
          {displayValue}
        </code>
      ) : isEditing ? (
        <>
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 h-8 font-mono text-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            <Save className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleCancel}
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </>
      ) : (
        <>
          <code className="flex-1 text-sm bg-muted px-2 py-1 rounded truncate">
            {displayValue}
          </code>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}

function AppConfigPanel({
  layer,
  appName,
}: {
  layer: string;
  appName: string;
}) {
  const { data: config, isLoading, refetch } = useArgoAppConfig(layer, appName);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">加载配置中...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">无法加载配置</div>
      </div>
    );
  }

  const envVars = Array.isArray(config.env_vars) ? config.env_vars : [];

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-sm text-muted-foreground">Namespace</span>
          <p className="font-medium">{config.namespace}</p>
        </div>
        {config.replicas !== undefined && (
          <div>
            <span className="text-sm text-muted-foreground">Replicas</span>
            <p className="font-medium">{config.replicas}</p>
          </div>
        )}
        {config.image && (
          <div className="col-span-2">
            <span className="text-sm text-muted-foreground">Image</span>
            <p className="font-mono text-sm truncate">{config.image}:{config.image_tag || 'latest'}</p>
          </div>
        )}
        {config.deployment_path && (
          <div className="col-span-2">
            <span className="text-sm text-muted-foreground">Deployment Path</span>
            <p className="font-mono text-sm truncate">{config.deployment_path}</p>
          </div>
        )}
      </div>

      {/* Resources */}
      {config.resources && (
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Server className="h-4 w-4" />
            资源配置
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-muted rounded-lg p-3">
              <span className="text-muted-foreground">Requests</span>
              <p>CPU: {config.resources.requests?.cpu || '-'}</p>
              <p>Memory: {config.resources.requests?.memory || '-'}</p>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <span className="text-muted-foreground">Limits</span>
              <p>CPU: {config.resources.limits?.cpu || '-'}</p>
              <p>Memory: {config.resources.limits?.memory || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Environment Variables */}
      {envVars.length > 0 && (
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Variable className="h-4 w-4" />
            环境变量 ({envVars.length})
          </h4>
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {envVars.map((envVar) => (
              <EnvVarEditor
                key={envVar.name}
                layer={layer}
                appName={appName}
                envVar={envVar}
                onUpdate={refetch}
              />
            ))}
          </div>
        </div>
      )}

      {/* External Secrets */}
      {config.external_secrets && config.external_secrets.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">External Secrets</h4>
          <div className="flex flex-wrap gap-2">
            {config.external_secrets.map((secret) => (
              <Badge key={secret} variant="outline">
                {secret}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Ports */}
      {config.ports && config.ports.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">端口配置</h4>
          <div className="flex flex-wrap gap-2">
            {config.ports.map((port) => (
              <Badge key={port.name} variant="secondary">
                {port.name}: {port.port} → {port.targetPort}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ArgoConfigPage() {
  const [selectedApp, setSelectedApp] = useState<{ layer: string; name: string } | null>(
    null
  );
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(
    new Set(['apps', 'shared-services'])
  );

  const { data: appsByLayer, isLoading } = useArgoAppsByLayer();

  const toggleLayer = (layer: string) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) {
        next.delete(layer);
      } else {
        next.add(layer);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">K8s 配置管理</h1>
          <p className="text-muted-foreground">
            查看和编辑 ArgoCD 应用配置、环境变量
          </p>
        </div>
        <GitStatusBadge />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* App List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              应用列表
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">加载中...</div>
              </div>
            ) : !appsByLayer || Object.keys(appsByLayer).length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                暂无应用
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(appsByLayer).map(([layer, apps]) => {
                  const layerConfig = LAYER_CONFIG[layer as ArgoLayer] || {
                    label: layer,
                    color: 'bg-gray-100 text-gray-800',
                  };
                  return (
                    <Collapsible
                      key={layer}
                      open={expandedLayers.has(layer)}
                      onOpenChange={() => toggleLayer(layer)}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted">
                          <div className="flex items-center gap-2">
                            <Badge className={layerConfig.color}>{layerConfig.label}</Badge>
                            <span className="text-sm text-muted-foreground">
                              ({apps.length})
                            </span>
                          </div>
                          <ChevronRight
                            className={cn(
                              'h-4 w-4 transition-transform',
                              expandedLayers.has(layer) && 'rotate-90'
                            )}
                          />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-2 mt-1 space-y-1 border-l pl-2">
                          {apps.map((app: ArgoApp) => (
                            <AppListItem
                              key={`${layer}-${app.name}`}
                              app={app}
                              isSelected={
                                selectedApp?.layer === layer &&
                                selectedApp?.name === app.name
                              }
                              onClick={() =>
                                setSelectedApp({ layer, name: app.name })
                              }
                            />
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Config Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              {selectedApp ? (
                <>
                  {selectedApp.name}
                  <Badge variant="outline">{selectedApp.layer}</Badge>
                </>
              ) : (
                '应用配置'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedApp ? (
              <AppConfigPanel layer={selectedApp.layer} appName={selectedApp.name} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Settings2 className="h-12 w-12 mb-2 opacity-50" />
                <p>选择左侧应用查看配置</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
