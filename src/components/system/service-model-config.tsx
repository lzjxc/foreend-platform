import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Settings2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Shield,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLLMConfigs } from '@/hooks/use-config-service';
import { ServiceModelEditSheet } from './service-model-edit-sheet';
import type { LLMConfigItem } from '@/types/config-service';

interface ServiceModelConfigProps {
  usageByApp?: Map<string, { requests: number; tokens: number; cost: number; models: { model: string; requests: number }[] }>;
  availableModels?: string[];
}

export function ServiceModelConfig({ usageByApp, availableModels = [] }: ServiceModelConfigProps) {
  const { data: configs, isLoading, error } = useLLMConfigs();
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<LLMConfigItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleEdit = (config: LLMConfigItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConfig(config);
    setSheetOpen(true);
  };

  const toggleExpand = (serviceId: string) => {
    setExpandedService(prev => prev === serviceId ? null : serviceId);
  };

  // Try to match service_id to usage data (usage keys may use different naming)
  const findUsage = (serviceId: string) => {
    if (!usageByApp) return undefined;
    // Try exact match first
    if (usageByApp.has(serviceId)) return usageByApp.get(serviceId);
    // Try with -api suffix
    if (usageByApp.has(`${serviceId}-api`)) return usageByApp.get(`${serviceId}-api`);
    // Try removing -api suffix
    const withoutApi = serviceId.replace(/-api$/, '');
    if (usageByApp.has(withoutApi)) return usageByApp.get(withoutApi);
    return undefined;
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-base">
              <Settings2 className="h-5 w-5" />
              服务模型配置
            </span>
            {configs && (
              <Badge variant="secondary">{configs.length} 个服务</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : error ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              加载失败: {error instanceof Error ? error.message : '未知错误'}
            </div>
          ) : !configs || configs.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">暂无配置</div>
          ) : (
            <div className="space-y-2">
              {configs.map(config => {
                const isExpanded = expandedService === config.service_id;
                const usage = findUsage(config.service_id);
                const policyMode = config.llm_policy_mode;
                const configSource = config.llm_config_source;

                return (
                  <div key={config.service_id} className="rounded-lg border overflow-hidden">
                    {/* Main row */}
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/30 transition-colors"
                      onClick={() => toggleExpand(config.service_id)}
                    >
                      {/* Service name + badges */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">{config.service_name}</span>
                          {policyMode && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] px-1.5 gap-0.5',
                                policyMode === 'enforce'
                                  ? 'border-red-200 text-red-600 bg-red-50'
                                  : 'border-blue-200 text-blue-600 bg-blue-50'
                              )}
                            >
                              {policyMode === 'enforce' ? (
                                <><Shield className="h-2.5 w-2.5" />强制</>
                              ) : (
                                <><MessageSquare className="h-2.5 w-2.5" />建议</>
                              )}
                            </Badge>
                          )}
                          {configSource && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] px-1.5',
                                configSource === 'manual'
                                  ? 'border-blue-200 text-blue-600 bg-blue-50'
                                  : 'border-gray-200 text-gray-500 bg-gray-50'
                              )}
                            >
                              {configSource === 'manual' ? '自定义' : '系统默认'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {config.llm_model || '—'}
                          {config.llm_temperature != null && <span className="ml-2">t={config.llm_temperature}</span>}
                          {config.llm_max_tokens != null && <span className="ml-2">max={config.llm_max_tokens}</span>}
                          {config.llm_timeout != null && <span className="ml-2">timeout={config.llm_timeout}s</span>}
                        </p>
                      </div>

                      {/* Usage badge */}
                      {usage && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {usage.requests} 次
                        </Badge>
                      )}

                      {/* Edit + Expand */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={(e) => handleEdit(config, e)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      }
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t px-3 py-2.5 bg-muted/30 space-y-2">
                        {/* Config details grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">模型</span>
                            <p className="font-mono font-medium">{config.llm_model || '—'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Temperature</span>
                            <p className="font-mono font-medium">{config.llm_temperature ?? '—'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Max Tokens</span>
                            <p className="font-mono font-medium">{config.llm_max_tokens ?? '—'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">超时</span>
                            <p className="font-mono font-medium">{config.llm_timeout ? `${config.llm_timeout}s` : '—'}</p>
                          </div>
                        </div>

                        {/* Fallback model */}
                        {config.llm_fallback_model && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">Fallback: </span>
                            <span className="font-mono">{config.llm_fallback_model}</span>
                          </div>
                        )}

                        {/* Models used */}
                        {config.llm_models_used.length > 0 && (
                          <div>
                            <span className="text-xs text-muted-foreground">已用模型:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {config.llm_models_used.map(m => (
                                <Badge key={m} variant="outline" className="text-[10px] font-mono">
                                  {m}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Usage stats from breakdown */}
                        {usage && (
                          <div className="pt-1 border-t border-muted">
                            <span className="text-xs text-muted-foreground">最近 7 天调用:</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {usage.models.map(um => (
                                <Badge key={um.model} variant="secondary" className="text-[10px] font-normal gap-1">
                                  {um.model}
                                  <span className="text-muted-foreground">({um.requests})</span>
                                </Badge>
                              ))}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              总计 {usage.requests} 次 · {usage.tokens > 1000 ? `${(usage.tokens / 1000).toFixed(1)}K` : usage.tokens} tokens
                              {usage.cost > 0 && ` · $${usage.cost.toFixed(4)}`}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ServiceModelEditSheet
        config={editingConfig}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        availableModels={availableModels}
      />
    </>
  );
}
