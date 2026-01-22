import { useState, useMemo } from 'react';
import { RefreshCw, Filter, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReportCard } from '@/components/ai-news/report-card';
import { useAIReports } from '@/hooks/use-ai-reports';
import type { ReportsQueryParams } from '@/types/ai-report';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'daily' | 'weekly';

export default function AINewsPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Build query params based on filter
  const queryParams: ReportsQueryParams = {
    limit: 50,
    ...(filter !== 'all' && { type: filter }),
  };

  const { data: reports, isLoading, isFetching, refetch } = useAIReports(queryParams);

  // Filter reports by search query
  const filteredReports = useMemo(() => {
    if (!reports || !searchQuery.trim()) {
      return reports;
    }
    const query = searchQuery.toLowerCase();
    return reports.filter((report) => {
      const titleMatch = report.title?.toLowerCase().includes(query);
      const contentMatch = report.content?.toLowerCase().includes(query);
      const summaryMatch = report.summary?.toLowerCase().includes(query);
      return titleMatch || contentMatch || summaryMatch;
    });
  }, [reports, searchQuery]);

  const handleFilterChange = (value: string) => {
    setFilter(value as FilterType);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI 日报</h1>
          <p className="text-sm text-muted-foreground mt-1">
            浏览 AI 领域的最新动态和深度报告
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[120px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="daily">日报</SelectItem>
              <SelectItem value="weekly">周报</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isFetching && 'animate-spin')} />
            刷新
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索报告内容..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => setSearchQuery('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Report List */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex justify-between">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))
        ) : filteredReports && filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
            />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>{searchQuery ? '未找到匹配的报告' : '暂无报告'}</p>
            <p className="text-sm mt-1">
              {searchQuery
                ? '尝试其他关键词搜索'
                : filter !== 'all'
                  ? '尝试切换筛选条件查看更多'
                  : '报告将在采集后自动显示'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
