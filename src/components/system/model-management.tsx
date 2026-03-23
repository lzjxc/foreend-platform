import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Cpu,
  DollarSign,
  TrendingUp,
  Layers,
  Monitor,
  Eye,
  Wrench,
  Server,
  Cloud,
  HardDrive,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ServiceModelConfig } from './service-model-config';
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

// ==================== Types ====================

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  model_type: string;
  description: string | null;
  is_local: boolean;
  supports_vision: boolean;
  supports_tools: boolean;
  context_window: number | null;
  max_output_tokens: number | null;
}

interface ModelsResponse {
  models: ModelInfo[];
  total: number;
}

// Breakdown API response types (same as system-dashboard)
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

// ==================== Constants ====================

const LLM_GATEWAY_API_URL = '/llm-gateway-api';

const LOCAL_MODELS = [
  'qwen/qwen3-32b',
  'qwen3-32b',
  'qwen3-local',
  'qwen3-vl',
  'llama',
  'mistral',
  'deepseek',
];

const isLocalModel = (modelName: string): boolean => {
  const lowerName = modelName.toLowerCase();
  return LOCAL_MODELS.some(local => lowerName.includes(local.toLowerCase()));
};

const MODEL_COLORS: Record<string, string> = {
  'claude-sonnet-4-20250514': '#8B5CF6',
  'claude-3-5-sonnet-20241022': '#A78BFA',
  'claude-opus': '#7C3AED',
  'claude-sonnet': '#8B5CF6',
  'gpt-4o': '#10B981',
  'gpt-4o-mini': '#34D399',
  'gpt-4-turbo': '#059669',
  'gpt-5': '#047857',
  default: '#6B7280',
  local: '#9CA3AF',
};

const APP_COLORS: Record<string, string> = {
  'ai-weekly': '#F59E0B',
  'game-weekly-api': '#EF4444',
  'homework-api': '#3B82F6',
  'wordbook': '#10B981',
  'news-tagger': '#06B6D4',
  'frontend': '#8B5CF6',
  'test': '#9CA3AF',
  default: '#6B7280',
};

// ==================== Component ====================

export function ModelManagement() {
  // Models state
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);

  // Usage state
  const [usageBreakdown, setUsageBreakdown] = useState<UsageBreakdown | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsageResponse | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoadingSpend, setIsLoadingSpend] = useState(true);
  const [spendError, setSpendError] = useState<string | null>(null);

  // Expanded model cards
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  // Fetch models
  const fetchModels = useCallback(async () => {
    setIsLoadingModels(true);
    setModelsError(null);
    try {
      const resp = await fetch(`${LLM_GATEWAY_API_URL}/v1/models`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: ModelsResponse = await resp.json();
      setModels(data.models);
    } catch (error) {
      setModelsError(error instanceof Error ? error.message : 'Failed to fetch models');
    } finally {
      setIsLoadingModels(false);
    }
  }, []);

  // Fetch usage
  const fetchUsageBreakdown = useCallback(async () => {
    setIsLoadingSpend(true);
    setSpendError(null);
    try {
      const [breakdownResponse, dailyResponse] = await Promise.all([
        fetch(`${LLM_GATEWAY_API_URL}/usage/breakdown?days=7`),
        fetch(`${LLM_GATEWAY_API_URL}/usage/daily?days=7`),
      ]);
      if (!breakdownResponse.ok) throw new Error(`HTTP ${breakdownResponse.status}`);
      setUsageBreakdown(await breakdownResponse.json());
      if (dailyResponse.ok) {
        setDailyUsage(await dailyResponse.json());
      }
    } catch (error) {
      setSpendError(error instanceof Error ? error.message : 'Failed to fetch');
    } finally {
      setIsLoadingSpend(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
    fetchUsageBreakdown();
  }, [fetchModels, fetchUsageBreakdown]);

  // Default model
  const defaultModel = models.find(m => m.id === 'default');
  const localModels = models.filter(m => m.is_local && m.id !== 'default');
  const cloudModels = models.filter(m => !m.is_local);

  // Build usage-by-app map for ServiceModelConfig
  const usageByAppMap = useMemo(() => {
    if (!usageBreakdown?.by_model) return new Map();
    const map = new Map<string, { requests: number; tokens: number; cost: number; models: { model: string; requests: number }[] }>();
    usageBreakdown.by_model.forEach(m => {
      m.apps.forEach(app => {
        const existing = map.get(app.app) || { requests: 0, tokens: 0, cost: 0, models: [] };
        existing.requests += app.requests;
        existing.tokens += app.tokens;
        existing.cost += app.cost;
        existing.models.push({ model: m.model, requests: app.requests });
        map.set(app.app, existing);
      });
    });
    return map;
  }, [usageBreakdown]);

  // Available model IDs for the edit sheet dropdown
  const availableModelIds = useMemo(() => {
    return models.filter(m => m.id !== 'default').map(m => m.id);
  }, [models]);

  // Daily chart data
  const dailySpendData = useMemo(() => {
    if (!dailyUsage?.days) return [];
    return dailyUsage.days.map(d => ({
      date: d.date.substring(5),
      fullDate: d.date,
      spend: Number(d.totals.cost.toFixed(4)),
      tokens: d.totals.tokens,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [dailyUsage]);

  // Current data source based on selected date
  const currentDataSource = useMemo(() => {
    if (selectedDate && dailyUsage?.days) {
      const dayData = dailyUsage.days.find(d => d.date === selectedDate);
      if (dayData) return { totals: dayData.totals, by_model: dayData.by_model, label: selectedDate.substring(5) };
    }
    if (usageBreakdown) return { totals: usageBreakdown.totals, by_model: usageBreakdown.by_model, label: '最近 7 天' };
    return null;
  }, [selectedDate, dailyUsage, usageBreakdown]);

  // Processed usage data
  const { totalSpend, totalTokens, totalRequests, cloudSpend, localModelRequests, modelSpendData, appSpendData, dataLabel } = useMemo(() => {
    if (!currentDataSource) {
      return { totalSpend: 0, totalTokens: 0, totalRequests: 0, cloudSpend: 0, localModelRequests: 0, modelSpendData: [] as ModelSpend[], appSpendData: [] as { name: string; spend: number; tokens: number; requests: number; color: string }[], dataLabel: '' };
    }
    const { totals, by_model, label } = currentDataSource;
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
      if (a.spend === 0 && b.spend === 0) return b.requests - a.requests;
      return b.spend - a.spend;
    });

    const cloud = modelData.filter(m => !m.isLocal).reduce((sum, m) => sum + m.spend, 0);
    const localReqs = modelData.filter(m => m.isLocal).reduce((sum, m) => sum + m.requests, 0);

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
    const appData = Array.from(appMap.entries())
      .map(([name, data]) => ({ name, ...data, color: APP_COLORS[name] || APP_COLORS.default }))
      .sort((a, b) => (a.spend === 0 && b.spend === 0) ? b.requests - a.requests : b.spend - a.spend);

    return { totalSpend: totals.cost, totalTokens: totals.tokens, totalRequests: totals.requests, cloudSpend: cloud, localModelRequests: localReqs, modelSpendData: modelData, appSpendData: appData, dataLabel: label };
  }, [currentDataSource]);

  return (
    <div className="space-y-6">
      {/* ==================== Model Registry ==================== */}

      {/* Default Model Banner */}
      {defaultModel && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">默认模型</span>
                  <Badge variant="outline" className="text-xs">default</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{defaultModel.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Model Registry */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-base">
              <Cpu className="h-5 w-5" />
              已注册模型
            </span>
            {!isLoadingModels && (
              <Badge variant="secondary">{models.filter(m => m.id !== 'default').length} 个模型</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingModels ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : modelsError ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              加载失败: {modelsError}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Local Models */}
              {localModels.length > 0 && (
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <HardDrive className="h-4 w-4" />
                    本地模型
                    <Badge variant="secondary" className="text-xs">{localModels.length}</Badge>
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {localModels.map(m => (
                      <ModelCard key={m.id} model={m} expanded={expandedModel === m.id} onToggle={() => setExpandedModel(expandedModel === m.id ? null : m.id)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Cloud Models */}
              {cloudModels.length > 0 && (
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Cloud className="h-4 w-4" />
                    云端模型
                    <Badge variant="secondary" className="text-xs">{cloudModels.length}</Badge>
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {cloudModels.map(m => (
                      <ModelCard key={m.id} model={m} expanded={expandedModel === m.id} onToggle={() => setExpandedModel(expandedModel === m.id ? null : m.id)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ==================== Service Model Config ==================== */}
      <ServiceModelConfig usageByApp={usageByAppMap} availableModels={availableModelIds} />

      {/* ==================== LLM Usage Stats ==================== */}
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
                    <p className="text-2xl font-bold mt-2">${cloudSpend.toFixed(4)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{totalRequests} 次请求</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-muted-foreground">本地调用</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">{localModelRequests}</p>
                    <p className="text-xs text-muted-foreground mt-1">免费 (本地模型)</p>
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
                    <p className="text-xs text-muted-foreground mt-1">输入+输出</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">使用模型数</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">{modelSpendData.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">使用应用数</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">{appSpendData.length}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Daily Charts */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium">每日趋势 (点击查看详情)</h4>
                  {selectedDate && (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)} className="h-7 text-xs">
                      清除选择
                    </Button>
                  )}
                </div>
                {dailySpendData.length > 0 ? (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <Cpu className="h-3 w-3" /> Token 用量趋势
                      </p>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={dailySpendData}
                            onClick={(data) => {
                              if (data?.activePayload?.[0]?.payload?.fullDate) {
                                const d = data.activePayload[0].payload.fullDate;
                                setSelectedDate(prev => prev === d ? null : d);
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} className="text-muted-foreground" width={45} />
                            <Tooltip
                              formatter={(value: number) => [value >= 1000 ? `${(value / 1000).toFixed(1)}K tokens` : `${value} tokens`, '用量']}
                              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                            />
                            <Bar dataKey="tokens" radius={[4, 4, 0, 0]}>
                              {dailySpendData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fullDate === selectedDate ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.5)'} stroke={entry.fullDate === selectedDate ? 'hsl(var(--primary))' : 'transparent'} strokeWidth={2} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> 费用趋势
                      </p>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={dailySpendData}
                            onClick={(data) => {
                              if (data?.activePayload?.[0]?.payload?.fullDate) {
                                const d = data.activePayload[0].payload.fullDate;
                                setSelectedDate(prev => prev === d ? null : d);
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} className="text-muted-foreground" width={50} />
                            <Tooltip
                              formatter={(value: number) => [`$${value.toFixed(4)}`, '费用']}
                              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                            />
                            <Bar dataKey="spend" radius={[4, 4, 0, 0]}>
                              {dailySpendData.map((entry, index) => (
                                <Cell key={`cost-cell-${index}`} fill={entry.fullDate === selectedDate ? '#10B981' : 'rgba(16, 185, 129, 0.5)'} stroke={entry.fullDate === selectedDate ? '#10B981' : 'transparent'} strokeWidth={2} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center rounded-lg border border-dashed">
                    <p className="text-sm text-muted-foreground">暂无每日数据</p>
                  </div>
                )}
              </div>

              {/* Model → App Distribution */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <h4 className="text-sm font-medium">模型 → 应用用量分布</h4>
                  <Badge variant={selectedDate ? 'default' : 'secondary'} className="text-xs">{dataLabel}</Badge>
                </div>
                <div className="space-y-4">
                  {currentDataSource?.by_model.map((modelData, modelIndex) => {
                    const isLocal = isLocalModel(modelData.model);
                    const currentTotalTokens = currentDataSource.totals.tokens;
                    const modelPercentage = currentTotalTokens > 0 ? (modelData.subtotal.tokens / currentTotalTokens) * 100 : 0;
                    const modelTokenDisplay = modelData.subtotal.tokens > 1000 ? `${(modelData.subtotal.tokens / 1000).toFixed(1)}K` : modelData.subtotal.tokens.toString();
                    const modelColor = isLocal ? MODEL_COLORS.local : (MODEL_COLORS[modelData.model] || MODEL_COLORS.default);

                    return (
                      <div key={modelIndex} className="space-y-2">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm font-medium">
                            <span className={cn('truncate max-w-[280px]', isLocal && 'text-muted-foreground')}>
                              {modelData.model}
                              {isLocal && <span className="ml-1 text-xs">(本地)</span>}
                            </span>
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <span className="font-mono text-xs">{modelTokenDisplay} tokens</span>
                              <span className="font-mono text-xs">{modelData.subtotal.requests}次</span>
                              {isLocal
                                ? <span className="font-mono text-xs text-green-600">免费</span>
                                : <span className="font-mono text-xs">${modelData.subtotal.cost.toFixed(4)}</span>
                              }
                              <span className="w-14 text-right">{modelPercentage.toFixed(1)}%</span>
                            </span>
                          </div>
                          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(modelPercentage, 0.5)}%`, backgroundColor: modelColor }} />
                          </div>
                        </div>
                        {modelData.apps.length > 0 && (
                          <div className="ml-4 pl-4 border-l-2 border-muted space-y-1.5">
                            {modelData.apps.sort((a, b) => b.tokens - a.tokens).map((app, appIndex) => {
                              const appPercentage = modelData.subtotal.tokens > 0 ? (app.tokens / modelData.subtotal.tokens) * 100 : 0;
                              const appTokenDisplay = app.tokens > 1000 ? `${(app.tokens / 1000).toFixed(1)}K` : app.tokens.toString();
                              const appColor = APP_COLORS[app.app] || APP_COLORS.default;
                              return (
                                <div key={appIndex} className="space-y-0.5">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="truncate max-w-[200px] text-muted-foreground">{app.app}</span>
                                    <span className="flex items-center gap-2 text-muted-foreground">
                                      <span className="font-mono">{appTokenDisplay}</span>
                                      <span className="font-mono">{app.requests}次</span>
                                      <span className="w-12 text-right">{appPercentage.toFixed(0)}%</span>
                                    </span>
                                  </div>
                                  <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(appPercentage, 1)}%`, backgroundColor: appColor }} />
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
    </div>
  );
}

// ==================== Model Card ====================

function ModelCard({ model, expanded, onToggle }: { model: ModelInfo; expanded: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-accent/30 transition-colors" onClick={onToggle}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
            model.is_local ? 'bg-gray-500/10' : 'bg-violet-500/10',
          )}>
            {model.is_local ? <HardDrive className="h-4 w-4 text-gray-500" /> : <Cloud className="h-4 w-4 text-violet-500" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{model.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{model.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {model.supports_vision && <Eye className="h-3.5 w-3.5 text-blue-500" />}
          {model.supports_tools && <Wrench className="h-3.5 w-3.5 text-amber-500" />}
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground ml-1" /> : <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />}
        </div>
      </div>
      {expanded && (
        <div className="border-t px-3 py-2.5 space-y-2 text-xs">
          {model.description && <p className="text-muted-foreground">{model.description}</p>}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="text-[10px]">{model.model_type}</Badge>
            {model.context_window && <Badge variant="outline" className="text-[10px]">{(model.context_window / 1000).toFixed(0)}K ctx</Badge>}
            {model.max_output_tokens && <Badge variant="outline" className="text-[10px]">{(model.max_output_tokens / 1000).toFixed(0)}K out</Badge>}
            {model.supports_vision && <Badge variant="outline" className="text-[10px] text-blue-600">视觉</Badge>}
            {model.supports_tools && <Badge variant="outline" className="text-[10px] text-amber-600">工具</Badge>}
          </div>
        </div>
      )}
    </div>
  );
}
