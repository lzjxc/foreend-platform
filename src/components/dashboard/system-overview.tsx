import { useState } from 'react';
import {
  MessageSquare,
  Timer,
  Brain,
  BookOpen,
  Code2,
  Monitor,
  FileText,
  HeartPulse,
  CalendarDays,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  useMsgGwStats,
  useCronSummary,
  useKnowledgeStats,
  useHomeworkStats,
  useDevTrackerOverview,
  useDevTrackerSessions,
  useDevTrackerSpecs,
  useActivityTrend,
  useMsgGwTrend,
  useCronTrend,
  useKnowledgeTrend,
  useHomeworkTrend,
} from '@/hooks/use-system-overview';
import { cn } from '@/lib/utils';

// ==================== Types ====================

interface OverviewMetric {
  key: string;
  label: string;
  value: number | string;
  type: 'count' | 'badge';
  color?: 'green' | 'red' | 'blue' | 'orange' | 'default';
}

interface OverviewCardData {
  service_id: string;
  title: string;
  icon: React.ElementType;
  icon_color: string;
  total: number;
  total_label: string;
  last_activity_at: string | null;
  metrics: OverviewMetric[];
  trend: Record<string, number>;
}

interface HealthItem {
  name: string;
  status: 'loading' | 'error' | 'success';
}

interface ChartPoint {
  date: string;
  label: string;
  count: number;
}

// ==================== Helpers ====================

function formatRelativeTime(time?: string | null): string {
  if (!time) return '-';
  const date = new Date(time);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}小时前`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}天前`;
}

function trendToChartData(trend: Record<string, number>): ChartPoint[] {
  return Object.entries(trend)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, label: date.slice(5), count }));
}

function getDateRange(days: number): { min: string; max: string } {
  const now = new Date();
  const max = now.toISOString().slice(0, 10);
  const min = new Date(now);
  min.setDate(min.getDate() - days + 1);
  return { min: min.toISOString().slice(0, 10), max };
}

const colorMap: Record<string, string> = {
  green: 'text-green-600',
  red: 'text-red-500',
  blue: 'text-blue-600',
  orange: 'text-orange-500',
};

// ==================== Generic OverviewCard ====================

function OverviewCard({
  data,
  selectedDate,
  dayValue,
}: {
  data: OverviewCardData;
  selectedDate: string | null;
  dayValue: number | null;
}) {
  const Icon = data.icon;
  const chartData = trendToChartData(data.trend);
  // Map tailwind color name to hex for recharts
  const colorHexMap: Record<string, string> = {
    'bg-blue-500': '#3b82f6',
    'bg-orange-500': '#f97316',
    'bg-purple-500': '#a855f7',
    'bg-green-500': '#22c55e',
    'bg-indigo-500': '#6366f1',
    'bg-cyan-500': '#06b6d4',
    'bg-amber-500': '#f59e0b',
  };
  const chartColor = colorHexMap[data.icon_color] || '#6366f1';

  // Group badge metrics together
  const countMetrics = data.metrics.filter((m) => m.type === 'count');
  const badgeMetrics = data.metrics.filter((m) => m.type === 'badge');

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header: icon + title + service_id + lastActivityAt */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn('rounded-lg p-1.5', data.icon_color)}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{data.title}</span>
            <span className="text-xs text-muted-foreground/50">{data.service_id}</span>
          </div>
          <div className="flex items-center gap-2">
            {data.last_activity_at !== undefined && (
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(data.last_activity_at)}
              </span>
            )}
            {selectedDate && dayValue != null && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0 font-mono">
                {selectedDate.slice(5)}: {dayValue}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          {/* Primary stat: total_label + total */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{data.total_label}</span>
            <span className="font-semibold text-base">{data.total.toLocaleString()}</span>
          </div>

          {/* Count metrics */}
          {countMetrics.map((m) => (
            <div key={m.key} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{m.label}</span>
              <span className={cn('font-medium', m.color && colorMap[m.color])}>
                {typeof m.value === 'number' ? m.value.toLocaleString() : m.value}
              </span>
            </div>
          ))}

          {/* Badge metrics */}
          {badgeMetrics.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {badgeMetrics.map((m) => (
                <Badge key={m.key} variant="secondary" className="text-xs px-1.5 py-0">
                  {m.label} {m.value}
                </Badge>
              ))}
            </div>
          )}

          {/* Trend chart */}
          {chartData.length > 0 && (
            <div className="mt-2 -mx-1">
              <ResponsiveContainer width="100%" height={40}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 2, right: 2, bottom: 0, left: 2 }}
                  style={{ cursor: 'pointer' }}
                >
                  <defs>
                    <linearGradient id={`trend-${data.service_id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={chartColor} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      fontSize: '11px',
                      padding: '4px 8px',
                    }}
                    labelFormatter={(v) => String(v).slice(5)}
                    formatter={(value: number) => [`${value}`, '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={chartColor}
                    strokeWidth={1.5}
                    fill={`url(#trend-${data.service_id})`}
                    dot={false}
                    activeDot={{ r: 3, fill: chartColor }}
                  />
                  {selectedDate && (
                    <ReferenceLine x={selectedDate} stroke={chartColor} strokeDasharray="3 3" strokeWidth={1} />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function HealthCard({ items }: { items: HealthItem[] }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="rounded-lg p-1.5 bg-rose-500">
            <HeartPulse className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">服务健康</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {items.map((s) => (
            <div key={s.name} className="flex items-center gap-1.5">
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  s.status === 'success' && 'bg-green-500',
                  s.status === 'error' && 'bg-red-500',
                  s.status === 'loading' && 'bg-gray-400 animate-pulse',
                )}
              />
              <span className="text-xs text-muted-foreground">{s.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Data Transformers ====================

function useMsgGwOverview(days: number): { data: OverviewCardData | null; isLoading: boolean; isError: boolean } {
  const { data, isLoading, isError } = useMsgGwStats();
  const { data: trend } = useMsgGwTrend(days);
  if (!data) return { data: null, isLoading, isError };
  return {
    data: {
      service_id: 'msg-gw',
      title: '消息通知',
      icon: MessageSquare,
      icon_color: 'bg-blue-500',
      total: data.totalSent,
      total_label: '总发送',
      last_activity_at: data.lastSent,
      metrics: [
        { key: 'channels', label: '渠道数', value: data.channelCount, type: 'count' },
        ...(data.totalFailed > 0
          ? [{ key: 'failed', label: '失败', value: data.totalFailed, type: 'count' as const, color: 'red' as const }]
          : []),
      ],
      trend: trend || {},
    },
    isLoading,
    isError,
  };
}

function useCronOverview(days: number): { data: OverviewCardData | null; isLoading: boolean; isError: boolean } {
  const { data, isLoading, isError } = useCronSummary();
  const { data: trend } = useCronTrend(days);
  if (!data) return { data: null, isLoading, isError };
  return {
    data: {
      service_id: 'cron-workflows',
      title: '定时任务',
      icon: Timer,
      icon_color: 'bg-orange-500',
      total: data.total,
      total_label: '任务数',
      last_activity_at: data.lastActivityAt,
      metrics: [
        { key: 'active', label: '运行中', value: `${data.active} / ${data.total}`, type: 'count' },
        { key: 'succeeded', label: '成功', value: data.totalSucceeded, type: 'count', color: 'green' },
        { key: 'failed', label: '失败', value: data.totalFailed, type: 'count', color: 'red' },
      ],
      trend: trend || {},
    },
    isLoading,
    isError,
  };
}

function useKnowledgeOverview(days: number): { data: OverviewCardData | null; isLoading: boolean; isError: boolean } {
  const { data, isLoading, isError } = useKnowledgeStats();
  const { data: trend } = useKnowledgeTrend(days);
  if (!data) return { data: null, isLoading, isError };
  return {
    data: {
      service_id: 'knowledge',
      title: '知识库',
      icon: Brain,
      icon_color: 'bg-purple-500',
      total: data.totalAtoms,
      total_label: '原子总数',
      last_activity_at: data.lastActivityAt,
      metrics: [
        { key: 'learning', label: '学习', value: data.byStatus.learning, type: 'badge' },
        { key: 'mastered', label: '掌握', value: data.byStatus.mastered, type: 'badge' },
      ],
      trend: trend || {},
    },
    isLoading,
    isError,
  };
}

function useHomeworkOverview(days: number): { data: OverviewCardData | null; isLoading: boolean; isError: boolean } {
  const { data, isLoading, isError } = useHomeworkStats();
  const { data: trend } = useHomeworkTrend(days);
  if (!data) return { data: null, isLoading, isError };
  return {
    data: {
      service_id: 'homework',
      title: '作业助手',
      icon: BookOpen,
      icon_color: 'bg-green-500',
      total: data.total,
      total_label: '已提交',
      last_activity_at: data.lastSubmittedAt ?? null,
      metrics: [
        { key: 'graded', label: '已批改', value: data.graded, type: 'count' },
      ],
      trend: trend || {},
    },
    isLoading,
    isError,
  };
}

function useDevActivityOverview(days: number): { data: OverviewCardData | null; isLoading: boolean; isError: boolean } {
  const { data, isLoading, isError } = useDevTrackerOverview();
  const { data: trend } = useActivityTrend(days);
  if (!data) return { data: null, isLoading, isError };
  const statusLabels: Record<string, string> = { todo: '待办', in_progress: '进行', done: 'done' };
  return {
    data: {
      service_id: 'dev-tracker',
      title: '开发活动',
      icon: Code2,
      icon_color: 'bg-indigo-500',
      total: data.weekly_activities,
      total_label: '本周活动',
      last_activity_at: data.lastActivityAt,
      metrics: Object.entries(data.tasks_by_status || {}).map(([status, count]) => ({
        key: status,
        label: statusLabels[status] || status,
        value: count,
        type: 'badge' as const,
      })),
      trend: trend || {},
    },
    isLoading,
    isError,
  };
}

function useSessionsOverview(): { data: OverviewCardData | null; isLoading: boolean; isError: boolean } {
  const { data, isLoading, isError } = useDevTrackerSessions();
  if (!data) return { data: null, isLoading, isError };
  return {
    data: {
      service_id: 'dev-tracker-sessions',
      title: 'Sessions',
      icon: Monitor,
      icon_color: 'bg-cyan-500',
      total: data.total,
      total_label: '总会话',
      last_activity_at: null,
      metrics: [
        { key: 'completed', label: '完成', value: data.completed, type: 'count' },
        { key: 'user_messages', label: '用户消息', value: data.total_user_messages, type: 'count' },
        ...data.topProjects.slice(0, 5).map(([name, count]) => ({
          key: `proj-${name}`,
          label: name,
          value: count,
          type: 'badge' as const,
        })),
      ],
      trend: {},
    },
    isLoading,
    isError,
  };
}

function useSpecsOverview(): { data: OverviewCardData | null; isLoading: boolean; isError: boolean } {
  const { data, isLoading, isError } = useDevTrackerSpecs();
  if (!data) return { data: null, isLoading, isError };
  const phaseLabels: Record<string, string> = {
    brainstorming: '头脑风暴',
    spec_writing: '撰写中',
    implementing: '实现中',
    done: '已完成',
    cancelled: '已取消',
  };
  return {
    data: {
      service_id: 'dev-tracker-specs',
      title: 'Specs',
      icon: FileText,
      icon_color: 'bg-amber-500',
      total: data.total,
      total_label: '总数',
      last_activity_at: null,
      metrics: Object.entries(data.byPhase).map(([phase, count]) => ({
        key: phase,
        label: phaseLabels[phase] || phase,
        value: count,
        type: 'badge' as const,
      })),
      trend: {},
    },
    isLoading,
    isError,
  };
}

// ==================== Main Component ====================

export function SystemOverview() {
  const [days, setDays] = useState(7);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { min, max } = getDateRange(days);

  // All overview data
  const msgGw = useMsgGwOverview(days);
  const cron = useCronOverview(days);
  const knowledge = useKnowledgeOverview(days);
  const homework = useHomeworkOverview(days);
  const devActivity = useDevActivityOverview(days);
  const sessions = useSessionsOverview();
  const specs = useSpecsOverview();

  const allCards = [msgGw, cron, knowledge, homework, devActivity, sessions, specs];

  const toStatus = (q: { isLoading: boolean; isError: boolean }) =>
    q.isLoading ? 'loading' as const : q.isError ? 'error' as const : 'success' as const;

  const healthItems: HealthItem[] = [
    { name: '消息网关', status: toStatus(msgGw) },
    { name: '定时任务', status: toStatus(cron) },
    { name: '知识库', status: toStatus(knowledge) },
    { name: '作业助手', status: toStatus(homework) },
    { name: '开发追踪', status: toStatus(devActivity) },
    { name: 'Sessions', status: toStatus(sessions) },
    { name: 'Specs', status: toStatus(specs) },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold tracking-tight">系统运行概览</h2>
          {selectedDate && (
            <Badge
              variant="secondary"
              className="text-xs cursor-pointer"
              onClick={() => setSelectedDate(null)}
            >
              {selectedDate.slice(5)} &times;
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[7, 14, 30].map((d) => (
              <Button
                key={d}
                variant={days === d ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setDays(d); setSelectedDate(null); }}
                className="h-7 px-2.5 text-xs"
              >
                {d}天
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate || ''}
              min={min}
              max={max}
              onChange={(e) => setSelectedDate(e.target.value || null)}
              className="h-7 w-[140px] text-xs px-2"
            />
          </div>
        </div>
      </div>

      {/* 4x2 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {allCards.map((card) => {
          if (!card.data) {
            // Loading placeholder
            const placeholderIcon = card === msgGw ? MessageSquare : card === cron ? Timer : card === knowledge ? Brain : card === homework ? BookOpen : card === devActivity ? Code2 : card === sessions ? Monitor : FileText;
            const placeholderColor = card === msgGw ? 'bg-blue-500' : card === cron ? 'bg-orange-500' : card === knowledge ? 'bg-purple-500' : card === homework ? 'bg-green-500' : card === devActivity ? 'bg-indigo-500' : card === sessions ? 'bg-cyan-500' : 'bg-amber-500';
            const PlaceholderIcon = placeholderIcon;
            return (
              <Card key={placeholderColor}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn('rounded-lg p-1.5', placeholderColor)}>
                      <PlaceholderIcon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm text-muted-foreground">加载中...</span>
                  </div>
                </CardContent>
              </Card>
            );
          }
          const dayValue = selectedDate && card.data.trend[selectedDate] != null
            ? card.data.trend[selectedDate]
            : null;
          return (
            <OverviewCard
              key={card.data.service_id}
              data={card.data}
              selectedDate={selectedDate}
              dayValue={dayValue}
            />
          );
        })}
        <HealthCard items={healthItems} />
      </div>
    </div>
  );
}
