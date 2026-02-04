import { useState, useMemo, useEffect } from 'react';
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
  Shield,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Loader2,
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
  useComplianceLatest,
  useComplianceTasks,
  useComplianceTask,
  useTriggerComplianceAudit,
} from '@/hooks/use-efficiency-evaluator';
import {
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  LEVEL_CONFIG,
  DIMENSION_LABELS,
  SEVERITY_CONFIG,
  type ServiceEvaluation,
  type RecommendationItem,
  type RoadmapItem,
  type EvaluationDimensions,
  type ComplianceServiceResult,
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
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
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

// Compliance Service Card
function ComplianceServiceCard({
  service,
  expanded,
  onToggle,
}: {
  service: ComplianceServiceResult;
  expanded: boolean;
  onToggle: () => void;
}) {
  const gradeConfig = LEVEL_CONFIG[service.grade?.charAt(0) || 'C'] || LEVEL_CONFIG['C'];
  const violationsBySeverity = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    service.violations.forEach(v => {
      if (counts[v.severity as keyof typeof counts] !== undefined) {
        counts[v.severity as keyof typeof counts]++;
      }
    });
    return counts;
  }, [service.violations]);

  return (
    <Card className="overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">{service.service_id}</h3>
              {service.grade && (
                <Badge className={cn(gradeConfig.bgColor, gradeConfig.color, "font-bold")}>
                  {service.grade} {service.score}分
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">{service.layer}</Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>{service.files_scanned} 文件扫描</span>
              <span>{service.violations.length} 违规</span>
              {violationsBySeverity.critical > 0 && (
                <span className="text-red-600 font-medium">
                  {violationsBySeverity.critical} 严重
                </span>
              )}
              {violationsBySeverity.high > 0 && (
                <span className="text-orange-600 font-medium">
                  {violationsBySeverity.high} 高
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {expanded && service.violations.length > 0 && (
        <div className="border-t p-4 space-y-3 bg-muted/20">
          {service.violations.map((v, idx) => {
            const sevConfig = SEVERITY_CONFIG[v.severity] || SEVERITY_CONFIG.medium;
            return (
              <div key={idx} className={cn("p-3 rounded-lg border", sevConfig.color.split(' ')[2])}>
                <div className="flex items-start gap-3">
                  <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", sevConfig.dotColor)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={cn("text-xs", sevConfig.color)}>{sevConfig.label}</Badge>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{v.rule_id}</code>
                      <span className="text-sm font-medium">{v.rule_name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{v.detail}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      <code>{v.file}{v.line ? `:${v.line}` : ''}</code>
                    </div>
                    {v.fix_suggestion && (
                      <div className="mt-2 text-xs bg-background p-2 rounded border">
                        <span className="font-medium">修复建议: </span>
                        {v.fix_suggestion}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {expanded && service.violations.length === 0 && (
        <div className="border-t p-4 bg-muted/20 text-center text-sm text-muted-foreground">
          <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
          全部合规
        </div>
      )}
    </Card>
  );
}

// Compliance Tab Component
function ComplianceTab() {
  const { data: latest, isLoading: latestLoading, refetch: refetchLatest } = useComplianceLatest();
  const { data: tasksData, refetch: refetchTasks } = useComplianceTasks();
  const triggerAudit = useTriggerComplianceAudit();
  const [pollingTaskId, setPollingTaskId] = useState<string | null>(null);
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [showMarkdown, setShowMarkdown] = useState(false);

  // Poll the pending task
  const { data: pollingTask } = useComplianceTask(pollingTaskId || '', !!pollingTaskId);

  // Stop polling when task completes and refresh data
  useEffect(() => {
    if (pollingTask && (pollingTask.status === 'completed' || pollingTask.status === 'failed')) {
      setPollingTaskId(null);
      refetchLatest();
      refetchTasks();
    }
  }, [pollingTask, refetchLatest, refetchTasks]);

  const handleTriggerAudit = async () => {
    const result = await triggerAudit.mutateAsync(undefined);
    setPollingTaskId(result.task_id);
  };

  const isAuditRunning = !!pollingTaskId || triggerAudit.isPending;
  const report = latest?.result;
  const services = report?.services || [];

  // Sort services: most violations first
  const sortedServices = useMemo(() => {
    return [...services].sort((a, b) => b.violations.length - a.violations.length);
  }, [services]);

  // Task history (excluding the latest one if it's already shown)
  const taskHistory = useMemo(() => {
    if (!tasksData?.tasks) return [];
    return tasksData.tasks.slice(0, 10);
  }, [tasksData]);

  if (latestLoading) {
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

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {latest?.completed_at && (
            <span>
              最近审计: {formatRelativeTime(latest.completed_at)}
            </span>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleTriggerAudit}
          disabled={isAuditRunning}
        >
          {isAuditRunning ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          {isAuditRunning ? '审计中...' : '触发审计'}
        </Button>
      </div>

      {/* Polling Status */}
      {pollingTaskId && pollingTask && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              <div>
                <p className="font-medium">审计进行中</p>
                <p className="text-sm text-muted-foreground">
                  状态: {pollingTask.status} | 任务 ID: {pollingTask.task_id.slice(0, 8)}...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {latest && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">合规评分</span>
              </div>
              <p className={cn(
                "text-3xl font-bold mt-2",
                (latest.system_score ?? 0) >= 80 ? 'text-green-600' :
                (latest.system_score ?? 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
              )}>
                {latest.system_score?.toFixed(0) ?? '-'}<span className="text-lg font-normal text-muted-foreground">/100</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">扫描服务</span>
              </div>
              <p className="text-3xl font-bold mt-2">{latest.total_services_scanned ?? 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">违规总数</span>
              </div>
              <p className={cn(
                "text-3xl font-bold mt-2",
                (latest.total_violations ?? 0) > 0 ? 'text-orange-600' : 'text-green-600'
              )}>
                {latest.total_violations ?? 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-muted-foreground">严重违规</span>
              </div>
              <p className={cn(
                "text-3xl font-bold mt-2",
                (latest.critical_count ?? 0) > 0 ? 'text-red-600' : 'text-green-600'
              )}>
                {latest.critical_count ?? 0}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Services Detail / Markdown Report Toggle */}
      {report && (
        <>
          <div className="flex items-center gap-2">
            <Button
              variant={showMarkdown ? 'outline' : 'default'}
              size="sm"
              onClick={() => setShowMarkdown(false)}
            >
              <Shield className="h-4 w-4 mr-2" />
              服务详情
            </Button>
            <Button
              variant={showMarkdown ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowMarkdown(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              完整报告
            </Button>
          </div>

          {showMarkdown ? (
            /* Markdown Report View */
            <Card>
              <CardContent className="pt-6">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{report.markdown_report}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Service Cards View */
            <div className="space-y-3">
              {sortedServices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                  <p>无服务被扫描</p>
                  <p className="text-sm">请确保服务仓库已配置 repo_url</p>
                </div>
              ) : (
                sortedServices.map(svc => (
                  <ComplianceServiceCard
                    key={svc.service_id}
                    service={svc}
                    expanded={expandedService === svc.service_id}
                    onToggle={() =>
                      setExpandedService(
                        expandedService === svc.service_id ? null : svc.service_id
                      )
                    }
                  />
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* No report yet */}
      {!latest && !latestLoading && (
        <div className="text-center py-12 text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>暂无审计报告</p>
          <p className="text-sm">点击"触发审计"开始首次合规检查</p>
        </div>
      )}

      {/* Task History */}
      {taskHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              审计历史
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {taskHistory.map(task => (
                <div
                  key={task.task_id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={task.status === 'completed' ? 'default' : task.status === 'failed' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {task.status === 'completed' ? '完成' :
                       task.status === 'failed' ? '失败' :
                       task.status === 'processing' ? '执行中' : '排队中'}
                    </Badge>
                    <code className="text-xs text-muted-foreground">
                      {task.task_id.slice(0, 8)}...
                    </code>
                  </div>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    {task.system_score != null && (
                      <span className="font-mono">{task.system_score.toFixed(0)}分</span>
                    )}
                    {task.total_violations != null && (
                      <span>{task.total_violations} 违规</span>
                    )}
                    <span className="text-xs">
                      {format(new Date(task.created_at), 'MM/dd HH:mm')}
                    </span>
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <Gauge className="h-4 w-4" />
            概览
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            服务评估
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-2">
            <Shield className="h-4 w-4" />
            规范体检
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

        <TabsContent value="compliance" className="mt-6">
          <ComplianceTab />
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
