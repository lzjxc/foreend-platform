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
  CheckCircle2,
  XCircle,
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

interface TrendProps {
  days: number;
  selectedDate: string | null;
  onDateClick: (date: string) => void;
}

interface ChartPoint {
  date: string;
  label: string;
  count: number;
}

interface HealthItem {
  name: string;
  status: 'loading' | 'error' | 'success';
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
    .map(([date, count]) => ({
      date,
      label: date.slice(5),
      count,
    }));
}

function getDateRange(days: number): { min: string; max: string } {
  const now = new Date();
  const max = now.toISOString().slice(0, 10);
  const min = new Date(now);
  min.setDate(min.getDate() - days + 1);
  return { min: min.toISOString().slice(0, 10), max };
}

// ==================== Shared Components ====================

function StatCard({
  icon: Icon,
  title,
  children,
  isLoading,
  iconColor,
  dayValue,
  selectedDate,
  lastActivityAt,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  iconColor?: string;
  dayValue?: number | null;
  selectedDate?: string | null;
  lastActivityAt?: string | null;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn('rounded-lg p-1.5', iconColor || 'bg-primary/10')}>
              <Icon className={cn('h-4 w-4', iconColor ? 'text-white' : 'text-primary')} />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            {lastActivityAt !== undefined && (
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(lastActivityAt)}
              </span>
            )}
            {selectedDate && dayValue != null && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0 font-mono">
                {selectedDate.slice(5)}: {dayValue}
              </Badge>
            )}
          </div>
        </div>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">加载中...</div>
        ) : (
          <div className="space-y-1.5">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

function StatRow({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="font-medium">{value}</span>
        {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

function MiniTrend({
  data,
  color,
  selectedDate,
  onDateClick,
}: {
  data: ChartPoint[];
  color: string;
  selectedDate: string | null;
  onDateClick: (date: string) => void;
}) {
  const gradId = `trend-${color.replace('#', '')}`;
  return (
    <div className="mt-2 -mx-1">
      <ResponsiveContainer width="100%" height={40}>
        <AreaChart
          data={data}
          margin={{ top: 2, right: 2, bottom: 0, left: 2 }}
          onClick={(e) => {
            const date = e?.activePayload?.[0]?.payload?.date;
            if (date) onDateClick(date);
          }}
          style={{ cursor: 'pointer' }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
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
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{ r: 3, fill: color }}
          />
          {selectedDate && (
            <ReferenceLine
              x={selectedDate}
              stroke={color}
              strokeDasharray="3 3"
              strokeWidth={1}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ==================== Cards ====================

function MsgGwCard({ days, selectedDate, onDateClick }: TrendProps) {
  const { data, isLoading } = useMsgGwStats();
  const { data: trend } = useMsgGwTrend(days);
  const chartData = trend ? trendToChartData(trend) : [];
  const dayValue = selectedDate && trend ? (trend[selectedDate] ?? 0) : null;

  return (
    <StatCard icon={MessageSquare} title="消息通知" isLoading={isLoading} iconColor="bg-blue-500" dayValue={dayValue} selectedDate={selectedDate} lastActivityAt={data?.lastSent}>
      {data && (
        <>
          <StatRow
            label="总发送"
            value={
              <span className="flex items-center gap-1">
                {data.totalSent}
                {data.totalFailed > 0 && (
                  <span className="text-xs text-red-500">({data.totalFailed} 失败)</span>
                )}
              </span>
            }
          />
          <StatRow label="渠道数" value={data.channelCount} />
          {chartData.length > 0 && (
            <MiniTrend data={chartData} color="#3b82f6" selectedDate={selectedDate} onDateClick={onDateClick} />
          )}
        </>
      )}
    </StatCard>
  );
}

function CronCard({ days, selectedDate, onDateClick }: TrendProps) {
  const { data, isLoading } = useCronSummary();
  const { data: trend } = useCronTrend(days);
  const chartData = trend ? trendToChartData(trend) : [];
  const dayValue = selectedDate && trend ? (trend[selectedDate] ?? 0) : null;

  return (
    <StatCard icon={Timer} title="定时任务" isLoading={isLoading} iconColor="bg-orange-500" dayValue={dayValue} selectedDate={selectedDate} lastActivityAt={data?.lastActivityAt}>
      {data && (
        <>
          <StatRow label="任务数" value={`${data.active} / ${data.total}`} sub="运行中" />
          <StatRow
            label="成功"
            value={
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                {data.totalSucceeded.toLocaleString()}
              </span>
            }
          />
          <StatRow
            label="失败"
            value={
              <span className="flex items-center gap-1 text-red-500">
                <XCircle className="h-3 w-3" />
                {data.totalFailed.toLocaleString()}
              </span>
            }
          />
          {chartData.length > 0 && (
            <MiniTrend data={chartData} color="#f97316" selectedDate={selectedDate} onDateClick={onDateClick} />
          )}
        </>
      )}
    </StatCard>
  );
}

function KnowledgeCard({ days, selectedDate, onDateClick }: TrendProps) {
  const { data, isLoading } = useKnowledgeStats();
  const { data: trend } = useKnowledgeTrend(days);
  const chartData = trend ? trendToChartData(trend) : [];
  const dayValue = selectedDate && trend ? (trend[selectedDate] ?? 0) : null;

  return (
    <StatCard icon={Brain} title="知识库" isLoading={isLoading} iconColor="bg-purple-500" dayValue={dayValue} selectedDate={selectedDate} lastActivityAt={data?.lastActivityAt}>
      {data && (
        <>
          <StatRow label="原子总数" value={data.totalAtoms.toLocaleString()} />
          <StatRow
            label="复习状态"
            value={
              <span className="flex items-center gap-1.5">
                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                  学习 {data.byStatus.learning}
                </Badge>
                <Badge variant="default" className="text-xs px-1.5 py-0">
                  掌握 {data.byStatus.mastered}
                </Badge>
              </span>
            }
          />
          {chartData.length > 0 && (
            <MiniTrend data={chartData} color="#a855f7" selectedDate={selectedDate} onDateClick={onDateClick} />
          )}
        </>
      )}
    </StatCard>
  );
}

function HomeworkCard({ days, selectedDate, onDateClick }: TrendProps) {
  const { data, isLoading } = useHomeworkStats();
  const { data: trend } = useHomeworkTrend(days);
  const chartData = trend ? trendToChartData(trend) : [];
  const dayValue = selectedDate && trend ? (trend[selectedDate] ?? 0) : null;

  return (
    <StatCard icon={BookOpen} title="作业助手" isLoading={isLoading} iconColor="bg-green-500" dayValue={dayValue} selectedDate={selectedDate} lastActivityAt={data?.lastSubmittedAt}>
      {data && (
        <>
          <StatRow label="已提交" value={data.total} />
          <StatRow label="已批改" value={data.graded} />
          {chartData.length > 0 && (
            <MiniTrend data={chartData} color="#22c55e" selectedDate={selectedDate} onDateClick={onDateClick} />
          )}
        </>
      )}
    </StatCard>
  );
}

function DevActivityCard({ days, selectedDate, onDateClick }: TrendProps) {
  const { data, isLoading } = useDevTrackerOverview();
  const { data: trend } = useActivityTrend(days);
  const chartData = trend ? trendToChartData(trend) : [];
  const dayValue = selectedDate && trend ? (trend[selectedDate] ?? 0) : null;

  return (
    <StatCard icon={Code2} title="开发活动" isLoading={isLoading} iconColor="bg-indigo-500" dayValue={dayValue} selectedDate={selectedDate} lastActivityAt={data?.lastActivityAt}>
      {data && (
        <>
          <StatRow label="本周活动" value={data.weekly_activities} />
          <StatRow
            label="Task 状态"
            value={
              <span className="flex items-center gap-1.5">
                {Object.entries(data.tasks_by_status || {}).map(([status, count]) => (
                  <Badge
                    key={status}
                    variant={status === 'in_progress' ? 'default' : 'secondary'}
                    className="text-xs px-1.5 py-0"
                  >
                    {status === 'todo' ? '待办' : status === 'in_progress' ? '进行' : status} {count}
                  </Badge>
                ))}
              </span>
            }
          />
          {chartData.length > 0 && (
            <MiniTrend data={chartData} color="#6366f1" selectedDate={selectedDate} onDateClick={onDateClick} />
          )}
        </>
      )}
    </StatCard>
  );
}

function SessionsCard() {
  const { data, isLoading } = useDevTrackerSessions();
  return (
    <StatCard icon={Monitor} title="Sessions" isLoading={isLoading} iconColor="bg-cyan-500">
      {data && (
        <>
          <StatRow label="总会话" value={data.total} sub={`${data.completed} 完成`} />
          <StatRow label="用户消息" value={data.total_user_messages.toLocaleString()} />
          <div className="mt-1">
            <span className="text-xs text-muted-foreground">Top 项目</span>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {data.topProjects.map(([name, count]) => (
                <Badge key={name} variant="outline" className="text-xs px-1.5 py-0">
                  {name} ({count})
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </StatCard>
  );
}

function SpecsCard() {
  const { data, isLoading } = useDevTrackerSpecs();
  const phaseLabels: Record<string, string> = {
    brainstorming: '头脑风暴',
    spec_writing: '撰写中',
    implementing: '实现中',
    done: '已完成',
    cancelled: '已取消',
  };
  return (
    <StatCard icon={FileText} title="Specs" isLoading={isLoading} iconColor="bg-amber-500">
      {data && (
        <>
          <StatRow label="总数" value={data.total} />
          <div className="flex flex-wrap gap-1">
            {Object.entries(data.byPhase).map(([phase, count]) => (
              <Badge key={phase} variant="outline" className="text-xs px-1.5 py-0">
                {phaseLabels[phase] || phase} {count}
              </Badge>
            ))}
          </div>
        </>
      )}
    </StatCard>
  );
}

function HealthCard({ items }: { items: HealthItem[] }) {
  return (
    <StatCard icon={HeartPulse} title="服务健康" iconColor="bg-rose-500">
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
    </StatCard>
  );
}

// ==================== Main Component ====================

export function SystemOverview() {
  const [days, setDays] = useState(7);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleDateClick = (date: string) => {
    setSelectedDate((prev) => (prev === date ? null : date));
  };

  const { min, max } = getDateRange(days);

  const trendProps: TrendProps = { days, selectedDate, onDateClick: handleDateClick };

  // Collect query statuses for HealthCard
  // Note: these hooks share queryKeys with the ones inside each card component,
  // so React Query deduplicates the requests automatically (same staleTime).
  const msgGwQuery = useMsgGwStats();
  const cronQuery = useCronSummary();
  const knowledgeQuery = useKnowledgeStats();
  const homeworkQuery = useHomeworkStats();
  const devQuery = useDevTrackerOverview();
  const sessionsQuery = useDevTrackerSessions();
  const specsQuery = useDevTrackerSpecs();

  const toStatus = (q: { isLoading: boolean; isError: boolean }) =>
    q.isLoading ? 'loading' as const : q.isError ? 'error' as const : 'success' as const;

  const healthItems: HealthItem[] = [
    { name: '消息网关', status: toStatus(msgGwQuery) },
    { name: '定时任务', status: toStatus(cronQuery) },
    { name: '知识库', status: toStatus(knowledgeQuery) },
    { name: '作业助手', status: toStatus(homeworkQuery) },
    { name: '开发追踪', status: toStatus(devQuery) },
    { name: 'Sessions', status: toStatus(sessionsQuery) },
    { name: 'Specs', status: toStatus(specsQuery) },
  ];

  return (
    <div className="space-y-4">
      {/* Header: title + date filter + date picker */}
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
          {/* Date range buttons */}
          <div className="flex items-center gap-1">
            {[7, 14, 30].map((d) => (
              <Button
                key={d}
                variant={days === d ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDays(d);
                  setSelectedDate(null);
                }}
                className="h-7 px-2.5 text-xs"
              >
                {d}天
              </Button>
            ))}
          </div>
          {/* Single date picker */}
          <div className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate || ''}
              min={min}
              max={max}
              onChange={(e) => {
                const v = e.target.value;
                setSelectedDate(v || null);
              }}
              className="h-7 w-[140px] text-xs px-2"
            />
          </div>
        </div>
      </div>

      {/* 4x2 grid: all 8 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <MsgGwCard {...trendProps} />
        <CronCard {...trendProps} />
        <KnowledgeCard {...trendProps} />
        <HomeworkCard {...trendProps} />
        <DevActivityCard {...trendProps} />
        <SessionsCard />
        <SpecsCard />
        <HealthCard items={healthItems} />
      </div>
    </div>
  );
}
