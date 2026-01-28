import { useState, useMemo } from 'react';
import {
  Gauge,
  RefreshCw,
  Search,
  Play,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Map,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useEvaluations,
  useRecommendations,
  useRoadmap,
  useSystemSummary,
  useTriggerEvaluation,
  useServiceHistory,
} from '@/hooks/use-efficiency-evaluator';
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  LEVEL_CONFIG,
  DIMENSION_LABELS,
  type ServiceEvaluation,
  type RecommendationItem,
  type RoadmapItem,
  type EvaluationDimensions,
} from '@/types/efficiency-evaluator';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// Helper function to format relative time
function formatRelativeTime(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: zhCN });
  } catch {
    return dateStr;
  }
}

// Overview Tab Component
function OverviewTab() {
  const { data: summary, isLoading: summaryLoading } = useSystemSummary();
  const { data: evaluations, isLoading: evaluationsLoading } = useEvaluations();
  const { data: recommendations } = useRecommendations();

  const isLoading = summaryLoading || evaluationsLoading;

  // Prepare radar chart data for dimension averages
  const radarData = useMemo(() => {
    const dimensionAverages = summary?.dimension_averages;
    if (!dimensionAverages) return [];
    return Object.entries(DIMENSION_LABELS).map(([key, label]) => ({
      dimension: label,
      score: dimensionAverages[key] || 0,
      fullMark: 100,
    }));
  }, [summary]);

  // Prepare bar chart data for service ranking
  const rankingData = useMemo(() => {
    if (!evaluations || !Array.isArray(evaluations)) return [];
    return [...evaluations]
      .sort((a, b) => b.overall_score - a.overall_score)
      .slice(0, 10)
      .map(e => ({
        name: e.service_name,
        score: e.overall_score,
        level: e.overall_level,
      }));
  }, [evaluations]);

  // Count pending recommendations by priority
  const recommendationCounts = useMemo(() => {
    if (!recommendations || !Array.isArray(recommendations)) return { critical: 0, high: 0, medium: 0, low: 0 };
    return recommendations.reduce((acc, r) => {
      acc[r.priority] = (acc[r.priority] || 0) + 1;
      return acc;
    }, { critical: 0, high: 0, medium: 0, low: 0 } as Record<string, number>);
  }, [recommendations]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Normalize summary fields
  const normalizedSummary = summary ? {
    total_services: summary.total_services ?? 0,
    average_score: summary.average_score ?? 0,
    average_level: summary.average_level ?? 'C',
    dimension_averages: summary.dimension_averages ?? {},
    grade_distribution: summary.grade_distribution ?? {},
    last_evaluated_at: summary.last_evaluated_at ?? new Date().toISOString(),
  } : null;

  if (!normalizedSummary || normalizedSummary.total_services === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Gauge className="h-12 w-12 mb-4 opacity-50" />
        <p>暂无评估数据</p>
        <p className="text-sm">点击"触发评估"按钮开始首次系统评估</p>
      </div>
    );
  }

  const averageLevel = normalizedSummary.average_level || 'C';
  const levelConfig = LEVEL_CONFIG[averageLevel.toString().charAt(0)] || LEVEL_CONFIG['C'];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">整体评分</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={cn("text-3xl font-bold", levelConfig.color)}>
                {normalizedSummary.average_level}
              </span>
              <span className="text-lg text-muted-foreground">
                {normalizedSummary.average_score.toFixed(0)}分
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">服务数量</span>
            </div>
            <p className="text-3xl font-bold mt-2">{normalizedSummary.total_services}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">待优化项</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-orange-600">
                {recommendationCounts.critical + recommendationCounts.high}
              </span>
              <span className="text-sm text-muted-foreground">
                高优先级
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">最近评估</span>
            </div>
            <p className="text-lg font-medium mt-2">
              {formatRelativeTime(normalizedSummary.last_evaluated_at)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Dimension Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">维度评分分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="评分"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.3}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Service Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">服务评分排行</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankingData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}分`, '评分']}
                  />
                  <Bar
                    dataKey="score"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution */}
      {normalizedSummary.grade_distribution && Object.keys(normalizedSummary.grade_distribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">评级分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              {['A', 'B', 'C', 'D', 'F'].map(grade => {
                const count = normalizedSummary.grade_distribution[grade] || 0;
                const config = LEVEL_CONFIG[grade] || LEVEL_CONFIG['C'];
                return (
                  <div
                    key={grade}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg",
                      config.bgColor
                    )}
                  >
                    <span className={cn("text-2xl font-bold", config.color)}>
                      {grade}
                    </span>
                    <span className="text-muted-foreground">
                      {count} 个服务
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Service Evaluation Card
function ServiceEvaluationCard({
  evaluation,
  expanded,
  onToggle,
}: {
  evaluation: ServiceEvaluation;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { data: history } = useServiceHistory(expanded ? evaluation.service_id : '');

  const overallLevel = evaluation.overall_level || 'C';
  const levelConfig = LEVEL_CONFIG[overallLevel.toString().charAt(0)] || LEVEL_CONFIG['C'];

  // History chart data
  const historyData = useMemo(() => {
    if (!history || !Array.isArray(history)) return [];
    return [...history]
      .sort((a, b) => new Date(a.evaluated_at).getTime() - new Date(b.evaluated_at).getTime())
      .slice(-10)
      .map(h => ({
        date: new Date(h.evaluated_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        score: h.overall_score,
      }));
  }, [history]);

  return (
    <Card className="overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">{evaluation.service_name}</h3>
              <Badge className={cn(levelConfig.bgColor, levelConfig.color, "font-bold")}>
                {evaluation.overall_level} {evaluation.overall_score.toFixed(0)}分
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {evaluation.service_id}
            </p>
          </div>
          <Button variant="ghost" size="icon">
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Dimension badges */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {evaluation.dimensions && Object.entries(DIMENSION_LABELS).map(([key, label]) => {
            const dim = evaluation.dimensions[key as keyof EvaluationDimensions];
            if (!dim) return null;
            const dimConfig = LEVEL_CONFIG[dim.level] || LEVEL_CONFIG['C'];
            return (
              <Badge
                key={key}
                variant="outline"
                className={cn("text-xs", dimConfig.color)}
              >
                {label} {dim.level}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && evaluation.dimensions && (
        <div className="border-t p-4 space-y-4 bg-muted/20">
          {Object.entries(DIMENSION_LABELS).map(([key, label]) => {
            const dim = evaluation.dimensions[key as keyof EvaluationDimensions];
            if (!dim) return null;
            const dimConfig = LEVEL_CONFIG[dim.level] || LEVEL_CONFIG['C'];

            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{label}</span>
                  <Badge className={cn(dimConfig.bgColor, dimConfig.color)}>
                    {dim.level} {dim.score}分
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${dim.score}%`,
                      backgroundColor: `hsl(var(--primary))`,
                    }}
                  />
                </div>

                {/* Strengths, Issues, Suggestions */}
                <div className="grid gap-2 text-sm">
                  {dim.strengths.length > 0 && (
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <div className="text-muted-foreground">
                        {dim.strengths.join('；')}
                      </div>
                    </div>
                  )}
                  {dim.issues.length > 0 && (
                    <div className="flex gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                      <div className="text-muted-foreground">
                        {dim.issues.join('；')}
                      </div>
                    </div>
                  )}
                  {dim.suggestions.length > 0 && (
                    <div className="flex gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      <div className="text-muted-foreground">
                        {dim.suggestions.join('；')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* History chart */}
          {historyData.length > 1 && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                评分趋势
              </h4>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} width={30} />
                    <Tooltip formatter={(v: number) => [`${v}分`, '评分']} />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// Evaluations Tab Component
function EvaluationsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: evaluations, isLoading } = useEvaluations();

  const filteredEvaluations = useMemo(() => {
    if (!evaluations || !Array.isArray(evaluations)) return [];
    if (!searchQuery) return evaluations;
    const query = searchQuery.toLowerCase();
    return evaluations.filter(
      e =>
        e.service_name.toLowerCase().includes(query) ||
        e.service_id.toLowerCase().includes(query)
    );
  }, [evaluations, searchQuery]);

  // Sort by score descending
  const sortedEvaluations = useMemo(() => {
    return [...filteredEvaluations].sort((a, b) => b.overall_score - a.overall_score);
  }, [filteredEvaluations]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="搜索服务名称或 ID..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Evaluation list */}
      <div className="space-y-3">
        {sortedEvaluations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery ? '未找到匹配的服务' : '暂无评估数据'}
          </div>
        ) : (
          sortedEvaluations.map(evaluation => (
            <ServiceEvaluationCard
              key={evaluation.service_id}
              evaluation={evaluation}
              expanded={expandedId === evaluation.service_id}
              onToggle={() =>
                setExpandedId(
                  expandedId === evaluation.service_id ? null : evaluation.service_id
                )
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

// Recommendations Tab Component
function RecommendationsTab() {
  const { data: recommendations, isLoading } = useRecommendations();

  // Group by priority
  const groupedRecommendations = useMemo(() => {
    if (!recommendations || !Array.isArray(recommendations)) return {};
    const groups: Record<string, RecommendationItem[]> = {
      critical: [],
      high: [],
      medium: [],
      low: [],
    };
    recommendations.forEach(r => {
      if (groups[r.priority]) {
        groups[r.priority].push(r);
      }
    });
    return groups;
  }, [recommendations]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-24" />
          </div>
        ))}
      </div>
    );
  }

  const priorityOrder = ['critical', 'high', 'medium', 'low'] as const;

  return (
    <div className="space-y-6">
      {priorityOrder.map(priority => {
        const items = groupedRecommendations[priority];
        if (!items || items.length === 0) return null;

        const config = PRIORITY_CONFIG[priority];

        return (
          <div key={priority}>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <span>{config.icon}</span>
              {config.label} ({items.length})
            </h3>
            <div className="space-y-3">
              {items.map(item => (
                <Card key={item.id} className={cn("border", config.color.split(' ')[2])}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            分类: <Badge variant="outline">{item.category}</Badge>
                          </span>
                          {item.affected_services && item.affected_services.length > 0 && (
                            <span>
                              影响: {item.affected_services.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm shrink-0">
                        <div className="text-muted-foreground">
                          工作量: {item.estimated_effort}
                        </div>
                        <div className="text-muted-foreground mt-1">
                          预期效果: {item.expected_impact}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {Object.values(groupedRecommendations).every(arr => !arr || arr.length === 0) && (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
          <p>暂无优化建议</p>
          <p className="text-sm">系统运行良好！</p>
        </div>
      )}
    </div>
  );
}

// Roadmap Tab Component
function RoadmapTab() {
  const { data: roadmap, isLoading } = useRoadmap();

  // Group by phase
  const groupedRoadmap = useMemo(() => {
    if (!roadmap || !Array.isArray(roadmap)) return {};
    const groups: Record<string, RoadmapItem[]> = {};
    roadmap.forEach(item => {
      const phase = item.phase || '未分类';
      if (!groups[phase]) {
        groups[phase] = [];
      }
      groups[phase].push(item);
    });
    return groups;
  }, [roadmap]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <div className="ml-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const phases = Object.keys(groupedRoadmap).sort();

  return (
    <div className="space-y-6">
      {phases.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Map className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>暂无演进路线</p>
        </div>
      ) : (
        phases.map((phase, phaseIndex) => {
          const items = groupedRoadmap[phase];
          // Determine phase status based on item statuses
          const allCompleted = items.every(i => i.status === 'completed');
          const anyInProgress = items.some(i => i.status === 'in_progress');
          const phaseStatus = allCompleted ? 'completed' : anyInProgress ? 'in_progress' : 'planned';
          const statusConfig = STATUS_CONFIG[phaseStatus];

          return (
            <div key={phase} className="relative">
              {/* Timeline line */}
              {phaseIndex < phases.length - 1 && (
                <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-muted" />
              )}

              {/* Phase header */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-sm",
                    phaseStatus === 'completed' ? 'bg-green-100' :
                    phaseStatus === 'in_progress' ? 'bg-blue-100' : 'bg-gray-100'
                  )}
                >
                  {statusConfig.icon}
                </div>
                <h3 className="font-semibold">{phase}</h3>
                <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
              </div>

              {/* Phase items */}
              <div className="ml-9 space-y-2">
                {items.map(item => {
                  const itemStatus = item.status || 'planned';
                  const itemConfig = STATUS_CONFIG[itemStatus as keyof typeof STATUS_CONFIG] || STATUS_CONFIG['planned'];
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-2 p-3 rounded-lg bg-muted/30"
                    >
                      <span className="text-sm shrink-0">{itemConfig.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{item.title}</div>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                          <span>预计: {item.estimated_duration}</span>
                          {item.dependencies && item.dependencies.length > 0 && (
                            <span>依赖: {item.dependencies.join(', ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// Main Page Component
export default function EfficiencyEvaluatorPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const triggerMutation = useTriggerEvaluation();
  const { refetch, isRefetching } = useEvaluations();

  const handleRefresh = () => {
    refetch();
  };

  const handleTriggerEvaluation = async () => {
    await triggerMutation.mutateAsync();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Gauge className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">效能评估</h1>
            <p className="text-sm text-muted-foreground">
              系统服务效能评估与优化建议
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefetching}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} />
            刷新
          </Button>
          <Button
            size="sm"
            onClick={handleTriggerEvaluation}
            disabled={triggerMutation.isPending}
          >
            <Play className={cn("h-4 w-4 mr-2", triggerMutation.isPending && "animate-pulse")} />
            触发评估
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <Gauge className="h-4 w-4" />
            概览
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            服务评估
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            优化建议
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="gap-2">
            <Map className="h-4 w-4" />
            演进路线
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="evaluations" className="mt-6">
          <EvaluationsTab />
        </TabsContent>

        <TabsContent value="recommendations" className="mt-6">
          <RecommendationsTab />
        </TabsContent>

        <TabsContent value="roadmap" className="mt-6">
          <RoadmapTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
