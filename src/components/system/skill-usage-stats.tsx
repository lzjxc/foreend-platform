import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react';
import { useSkillUsageStats } from '@/hooks/use-skills';

export function SkillUsageStats() {
  const [groupBy, setGroupBy] = useState<string>('skill');
  const [days, setDays] = useState<number>(30);

  const { data, isLoading } = useSkillUsageStats({
    group_by: groupBy,
    days,
  });

  const stats = data?.stats ?? [];
  const totalUsage = data?.total_usage ?? 0;

  // Calculate summary stats
  const totalSuccessCount = stats.reduce((sum, s) => sum + s.success_count, 0);
  const successRate = totalUsage > 0 ? ((totalSuccessCount / totalUsage) * 100).toFixed(1) : '0';
  const avgDuration = stats
    .filter((s) => s.avg_duration_ms != null)
    .reduce((sum, s, _, arr) => sum + (s.avg_duration_ms ?? 0) / arr.length, 0);

  // Prepare chart data
  const chartData = stats
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
    .map((s) => {
      let label = '';
      if (groupBy === 'skill' || groupBy === 'skill,app') {
        label = s.skill_id ?? 'unknown';
      } else if (groupBy === 'app') {
        label = s.app_id ?? 'unknown';
      } else if (groupBy === 'date' || groupBy === 'skill,date') {
        label = s.date ?? 'unknown';
      } else {
        label = s.skill_id || s.app_id || s.date || 'unknown';
      }
      // Truncate long labels
      if (label.length > 25) label = label.substring(0, 22) + '...';
      return {
        name: label,
        count: s.count,
        success: s.success_count,
        failCount: s.count - s.success_count,
      };
    });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <Select value={groupBy} onValueChange={setGroupBy}>
          <SelectTrigger className="w-[130px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="skill">按 Skill</SelectItem>
            <SelectItem value="app">按应用</SelectItem>
            <SelectItem value="date">按日期</SelectItem>
          </SelectContent>
        </Select>

        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-[110px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">最近 7 天</SelectItem>
            <SelectItem value="30">最近 30 天</SelectItem>
            <SelectItem value="90">最近 90 天</SelectItem>
          </SelectContent>
        </Select>

        {data?.period && (
          <span className="text-xs text-muted-foreground">
            {data.period.start} ~ {data.period.end}
          </span>
        )}
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">总调用次数</span>
              </div>
              <p className="text-2xl font-bold mt-1">{totalUsage}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">成功率</span>
              </div>
              <p className="text-2xl font-bold mt-1">{successRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">平均耗时</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {avgDuration > 0 ? `${avgDuration.toFixed(0)}ms` : '-'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart */}
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : chartData.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">暂无用量数据</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    width={160}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => [
                      value,
                      name === 'count' ? '总次数' : name === 'success' ? '成功' : '失败',
                    ]}
                  />
                  <Bar dataKey="success" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="failCount" stackId="a" fill="#EF4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-emerald-500" /> 成功
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-red-500" /> 失败
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
