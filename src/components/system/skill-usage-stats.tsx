import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  AreaChart,
  Area,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  CheckCircle2,
  Clock,
  Zap,
  X,
  CalendarDays,
  Activity,
  AppWindow,
  FilterX,
} from 'lucide-react';
import { useSkillUsageStats } from '@/hooks/use-skills';

interface DateChartData {
  name: string;
  fullDate: string;
  count: number;
  success: number;
  failCount: number;
}

interface DistributionData {
  name: string;
  fullName: string;
  count: number;
  success: number;
  failCount: number;
  directCount: number;
  nestedCount: number;
}

export function SkillUsageStats() {
  const [days, setDays] = useState<number>(30);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  // Fetch all three groupings with cross-filters
  // Date trend - filtered by selected skill AND app
  const { data: dateData, isLoading: dateLoading } = useSkillUsageStats({
    group_by: 'date',
    days,
    skill_id: selectedSkill ?? undefined,
    app_id: selectedApp ?? undefined,
  });

  // Skill distribution - filtered by selected app AND selected date
  const { data: skillData, isLoading: skillLoading } = useSkillUsageStats({
    group_by: 'skill',
    days,
    app_id: selectedApp ?? undefined,
    date: selectedDate ?? undefined,
  });

  // App distribution - filtered by selected skill AND selected date
  const { data: appData, isLoading: appLoading } = useSkillUsageStats({
    group_by: 'app',
    days,
    skill_id: selectedSkill ?? undefined,
    date: selectedDate ?? undefined,
  });

  const isLoading = dateLoading || skillLoading || appLoading;
  const hasAnyFilter = selectedDate || selectedSkill || selectedApp;

  // Calculate summary stats from date data (most accurate for totals)
  const summaryStats = useMemo(() => {
    const stats = dateData?.stats ?? [];
    const totalUsage = dateData?.total_usage ?? 0;
    const totalSuccessCount = stats.reduce((sum, s) => sum + s.success_count, 0);
    const successRate = totalUsage > 0 ? ((totalSuccessCount / totalUsage) * 100).toFixed(1) : '0';
    const avgDuration = stats
      .filter((s) => s.avg_duration_ms != null)
      .reduce((sum, s, _, arr) => sum + (s.avg_duration_ms ?? 0) / arr.length, 0);

    return { totalUsage, successRate, avgDuration };
  }, [dateData]);

  // Prepare date trend chart data
  const dateChartData = useMemo((): DateChartData[] => {
    const stats = dateData?.stats ?? [];
    return stats
      .filter((s) => s.count > 0 && s.date)
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
      .map((s) => {
        let label = s.date ?? '';
        try {
          label = format(parseISO(s.date ?? ''), 'MM/dd');
        } catch {
          label = s.date ?? 'unknown';
        }
        return {
          name: label,
          fullDate: s.date ?? '',
          count: s.count,
          success: s.success_count,
          failCount: s.count - s.success_count,
        };
      });
  }, [dateData]);

  // Prepare skill distribution data
  const skillChartData = useMemo((): DistributionData[] => {
    const stats = skillData?.stats ?? [];
    return stats
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((s) => {
        const fullName = s.skill_id ?? 'unknown';
        let label = fullName;
        if (label.length > 20) label = label.substring(0, 17) + '...';
        return {
          name: label,
          fullName,
          count: s.count,
          success: s.success_count,
          failCount: s.count - s.success_count,
          directCount: s.direct_count ?? 0,
          nestedCount: s.nested_count ?? 0,
        };
      });
  }, [skillData]);

  // Prepare app distribution data
  const appChartData = useMemo((): DistributionData[] => {
    const stats = appData?.stats ?? [];
    return stats
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((s) => {
        const fullName = s.app_id ?? 'unknown';
        let label = fullName;
        if (label.length > 20) label = label.substring(0, 17) + '...';
        return {
          name: label,
          fullName,
          count: s.count,
          success: s.success_count,
          failCount: s.count - s.success_count,
          directCount: s.direct_count ?? 0,
          nestedCount: s.nested_count ?? 0,
        };
      });
  }, [appData]);

  // Handle date click on area chart
  const handleDateClick = (data: { activePayload?: Array<{ payload: DateChartData }> }) => {
    if (data?.activePayload?.[0]?.payload?.fullDate) {
      const clickedDate = data.activePayload[0].payload.fullDate;
      if (selectedDate === clickedDate) {
        setSelectedDate(null);
      } else {
        setSelectedDate(clickedDate);
      }
    }
  };

  // Handle skill click on bar chart
  const handleSkillClick = (data: { activePayload?: Array<{ payload: DistributionData }> }) => {
    if (data?.activePayload?.[0]?.payload?.fullName) {
      const clicked = data.activePayload[0].payload.fullName;
      setSelectedSkill(selectedSkill === clicked ? null : clicked);
    }
  };

  // Handle app click on bar chart
  const handleAppClick = (data: { activePayload?: Array<{ payload: DistributionData }> }) => {
    if (data?.activePayload?.[0]?.payload?.fullName) {
      const clicked = data.activePayload[0].payload.fullName;
      setSelectedApp(selectedApp === clicked ? null : clicked);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedDate(null);
    setSelectedSkill(null);
    setSelectedApp(null);
  };

  // Get selected date stats
  const selectedDateStats = useMemo(() => {
    if (!selectedDate) return null;
    const found = dateChartData.find((d) => d.fullDate === selectedDate);
    if (!found) return null;
    return {
      date: selectedDate,
      displayDate: found.name,
      count: found.count,
      success: found.success,
      failCount: found.failCount,
      successRate: found.count > 0 ? ((found.success / found.count) * 100).toFixed(1) : '0',
    };
  }, [selectedDate, dateChartData]);

  // Truncate skill/app name for display
  const truncateName = (name: string, maxLen = 15) => {
    if (name.length <= maxLen) return name;
    return name.substring(0, maxLen - 3) + '...';
  };

  return (
    <div className="space-y-4">
      {/* Header: Period Selector + Filter Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-[120px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">最近 7 天</SelectItem>
            <SelectItem value="30">最近 30 天</SelectItem>
            <SelectItem value="90">最近 90 天</SelectItem>
          </SelectContent>
        </Select>

        {dateData?.period && (
          <span className="text-xs text-muted-foreground">
            {dateData.period.start} ~ {dateData.period.end}
          </span>
        )}

        <div className="flex-1" />

        {/* Filter badges */}
        {selectedSkill && (
          <Badge
            variant="default"
            className="cursor-pointer hover:bg-primary/80 gap-1"
            onClick={() => setSelectedSkill(null)}
          >
            <Activity className="h-3 w-3" />
            {truncateName(selectedSkill)}
            <X className="h-3 w-3" />
          </Badge>
        )}
        {selectedApp && (
          <Badge
            variant="secondary"
            className="cursor-pointer hover:bg-secondary/80 gap-1"
            onClick={() => setSelectedApp(null)}
          >
            <AppWindow className="h-3 w-3" />
            {truncateName(selectedApp)}
            <X className="h-3 w-3" />
          </Badge>
        )}
        {selectedDate && (
          <Badge
            variant="outline"
            className="cursor-pointer hover:bg-muted gap-1"
            onClick={() => setSelectedDate(null)}
          >
            <CalendarDays className="h-3 w-3" />
            {selectedDateStats?.displayDate}
            <X className="h-3 w-3" />
          </Badge>
        )}
        {hasAnyFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={clearAllFilters}
          >
            <FilterX className="h-3 w-3 mr-1" />
            清除筛选
          </Button>
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
                <span className="text-sm text-muted-foreground">
                  {selectedDate ? '当日调用' : hasAnyFilter ? '筛选后调用' : '总调用次数'}
                </span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {selectedDate ? selectedDateStats?.count ?? 0 : summaryStats.totalUsage}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  {selectedDate ? '当日成功率' : '成功率'}
                </span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {selectedDate ? selectedDateStats?.successRate : summaryStats.successRate}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">平均耗时</span>
              </div>
              <p className="text-2xl font-bold mt-1">
                {summaryStats.avgDuration > 0 ? `${summaryStats.avgDuration.toFixed(0)}ms` : '-'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Date Trend Chart - Full Width */}
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : dateChartData.length === 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              每日调用趋势
              {(selectedSkill || selectedApp) && (
                <span className="text-xs font-normal text-muted-foreground">
                  (已筛选)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">暂无用量数据</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              每日调用趋势
              {(selectedSkill || selectedApp) && (
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  (已筛选{selectedSkill ? `: ${truncateName(selectedSkill, 12)}` : ''}
                  {selectedSkill && selectedApp ? ' + ' : ''}
                  {selectedApp ? `${!selectedSkill ? ': ' : ''}${truncateName(selectedApp, 12)}` : ''})
                </span>
              )}
              <span className="text-xs font-normal text-muted-foreground ml-auto">
                点击日期查看详情
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dateChartData}
                  margin={{ left: 0, right: 20, top: 5, bottom: 5 }}
                  onClick={handleDateClick}
                  style={{ cursor: 'pointer' }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => [
                      value,
                      name === 'success' ? '成功' : '失败',
                    ]}
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="success"
                    stackId="1"
                    stroke="#059669"
                    fill="#10B981"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="failCount"
                    stackId="1"
                    stroke="#DC2626"
                    fill="#EF4444"
                    fillOpacity={0.6}
                  />
                </AreaChart>
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

      {/* Selected Date Detail Card */}
      {selectedDateStats && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span className="font-medium">{selectedDateStats.date} 详情</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span>
                  总调用: <strong>{selectedDateStats.count}</strong>
                </span>
                <span className="text-emerald-600">
                  成功: <strong>{selectedDateStats.success}</strong>
                </span>
                <span className="text-red-600">
                  失败: <strong>{selectedDateStats.failCount}</strong>
                </span>
                <span>
                  成功率: <strong>{selectedDateStats.successRate}%</strong>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribution Charts - Side by Side */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Skill Distribution */}
        {isLoading ? (
          <Skeleton className="h-72" />
        ) : skillChartData.length === 0 ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Skill 调用分布
                {(selectedApp || selectedDate) && (
                  <span className="text-xs font-normal text-muted-foreground">
                    ({[
                      selectedDate && selectedDateStats?.displayDate,
                      selectedApp && `被 ${truncateName(selectedApp, 12)} 调用`,
                    ].filter(Boolean).join(' · ')})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">暂无数据</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Skill 调用分布
                {(selectedApp || selectedDate) ? (
                  <span className="text-xs font-normal text-muted-foreground">
                    ({[
                      selectedDate && selectedDateStats?.displayDate,
                      selectedApp && `被 ${truncateName(selectedApp, 12)} 调用`,
                    ].filter(Boolean).join(' · ')})
                  </span>
                ) : (
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    Top 10
                  </span>
                )}
                <span className="text-xs font-normal text-muted-foreground ml-auto">
                  点击筛选
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={skillChartData}
                    layout="vertical"
                    margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
                    onClick={handleSkillClick}
                    style={{ cursor: 'pointer' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={({ x, y, payload }) => {
                        const isSelected = selectedSkill === skillChartData.find(d => d.name === payload.value)?.fullName;
                        return (
                          <text
                            x={x}
                            y={y}
                            dy={4}
                            textAnchor="end"
                            fontSize={10}
                            fill={isSelected ? 'hsl(var(--primary))' : 'currentColor'}
                            fontWeight={isSelected ? 600 : 400}
                          >
                            {payload.value}
                          </text>
                        );
                      }}
                      width={130}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0].payload as DistributionData;
                        return (
                          <div className="bg-card border rounded-lg p-2 shadow-lg text-xs">
                            <p className="font-medium mb-1">{item.fullName}</p>
                            <p>总调用: <span className="font-medium">{item.count}</span></p>
                            <p className="text-emerald-600">成功: {item.success}</p>
                            <p className="text-red-600">失败: {item.failCount}</p>
                            <hr className="my-1 border-muted" />
                            <p className="text-muted-foreground">
                              直接: {item.directCount} / 嵌套: {item.nestedCount}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="success" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="failCount" stackId="a" fill="#EF4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* App Distribution */}
        {isLoading ? (
          <Skeleton className="h-72" />
        ) : appChartData.length === 0 ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AppWindow className="h-4 w-4" />
                应用调用分布
                {(selectedSkill || selectedDate) && (
                  <span className="text-xs font-normal text-muted-foreground">
                    ({[
                      selectedDate && selectedDateStats?.displayDate,
                      selectedSkill && `调用 ${truncateName(selectedSkill, 12)}`,
                    ].filter(Boolean).join(' · ')})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">暂无数据</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AppWindow className="h-4 w-4" />
                应用调用分布
                {(selectedSkill || selectedDate) ? (
                  <span className="text-xs font-normal text-muted-foreground">
                    ({[
                      selectedDate && selectedDateStats?.displayDate,
                      selectedSkill && `调用 ${truncateName(selectedSkill, 12)}`,
                    ].filter(Boolean).join(' · ')})
                  </span>
                ) : (
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    Top 10
                  </span>
                )}
                <span className="text-xs font-normal text-muted-foreground ml-auto">
                  点击筛选
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={appChartData}
                    layout="vertical"
                    margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
                    onClick={handleAppClick}
                    style={{ cursor: 'pointer' }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={({ x, y, payload }) => {
                        const isSelected = selectedApp === appChartData.find(d => d.name === payload.value)?.fullName;
                        return (
                          <text
                            x={x}
                            y={y}
                            dy={4}
                            textAnchor="end"
                            fontSize={10}
                            fill={isSelected ? 'hsl(var(--secondary-foreground))' : 'currentColor'}
                            fontWeight={isSelected ? 600 : 400}
                          >
                            {payload.value}
                          </text>
                        );
                      }}
                      width={130}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const item = payload[0].payload as DistributionData;
                        return (
                          <div className="bg-card border rounded-lg p-2 shadow-lg text-xs">
                            <p className="font-medium mb-1">{item.fullName}</p>
                            <p>总调用: <span className="font-medium">{item.count}</span></p>
                            <p className="text-emerald-600">成功: {item.success}</p>
                            <p className="text-red-600">失败: {item.failCount}</p>
                            <hr className="my-1 border-muted" />
                            <p className="text-muted-foreground">
                              直接: {item.directCount} / 嵌套: {item.nestedCount}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="success" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="failCount" stackId="a" fill="#EF4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
