import { useState, useMemo } from 'react';
import {
  History,
  GitCommit,
  Tag,
  FileText,
  Rocket,
  AlertTriangle,
  Filter,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTimeline, useTimelineSummary } from '@/hooks/use-doc-service';
import type { EventType, TimelineEvent } from '@/types/doc-service';

const EVENT_TYPE_CONFIG: Record<
  EventType,
  { label: string; icon: typeof GitCommit; color: string }
> = {
  commit: {
    label: '提交',
    icon: GitCommit,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  release: {
    label: '发布',
    icon: Tag,
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  document: {
    label: '文档',
    icon: FileText,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  deployment: {
    label: '部署',
    icon: Rocket,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  incident: {
    label: '事件',
    icon: AlertTriangle,
    color: 'bg-red-100 text-red-800 border-red-200',
  },
};

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: typeof GitCommit;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineItem({ event }: { event: TimelineEvent }) {
  const config = EVENT_TYPE_CONFIG[event.type] || EVENT_TYPE_CONFIG.commit;
  const Icon = config.icon;

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex gap-4 pb-6 last:pb-0">
      <div className="relative flex flex-col items-center">
        <div className={`p-2 rounded-full border ${config.color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 w-px bg-border mt-2" />
      </div>
      <div className="flex-1 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={config.color}>
                {config.label}
              </Badge>
              <span className="text-sm text-muted-foreground">{formatTime(event.timestamp)}</span>
            </div>
            <h4 className="font-medium">{event.title}</h4>
            {event.description && (
              <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              {event.service_id && <span>服务: {event.service_id}</span>}
              {event.repo && <span>仓库: {event.repo}</span>}
            </div>
          </div>
          {event.url && (
            <Button variant="ghost" size="icon" asChild>
              <a href={event.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TimelinePage() {
  const [days, setDays] = useState<number>(7);
  const [eventType, setEventType] = useState<EventType | 'all'>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  const { data: summary } = useTimelineSummary(days);
  const { data: events, isLoading: isLoadingEvents } = useTimeline({
    days,
    event_type: eventType === 'all' ? undefined : eventType,
    limit: 100,
  });

  // Group events by date
  const groupedEvents = useMemo(() => {
    if (!events || !Array.isArray(events)) return {};

    let filtered = events;
    if (serviceFilter !== 'all') {
      filtered = events.filter((e) => e.repo === serviceFilter || e.service_id === serviceFilter);
    }

    return filtered.reduce(
      (acc, event) => {
        const date = new Date(event.timestamp).toLocaleDateString('zh-CN');
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(event);
        return acc;
      },
      {} as Record<string, TimelineEvent[]>
    );
  }, [events, serviceFilter]);

  // Get unique repos for filter
  const services = useMemo(() => {
    if (!summary?.active_repos) return [];
    return Object.keys(summary.active_repos);
  }, [summary]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">变更时间线</h1>
        <p className="text-muted-foreground">追踪代码提交、版本发布、文档更新等变更记录</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          title="总计"
          value={(summary?.total_commits ?? 0) + (summary?.total_releases ?? 0) + (summary?.total_document_updates ?? 0)}
          icon={History}
          color="bg-gray-100"
        />
        <StatCard
          title="提交"
          value={summary?.total_commits ?? 0}
          icon={GitCommit}
          color="bg-blue-50"
        />
        <StatCard
          title="发布"
          value={summary?.total_releases ?? 0}
          icon={Tag}
          color="bg-green-50"
        />
        <StatCard
          title="文档"
          value={summary?.total_document_updates ?? 0}
          icon={FileText}
          color="bg-purple-50"
        />
        <StatCard
          title="部署"
          value={0}
          icon={Rocket}
          color="bg-orange-50"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="时间范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">最近 7 天</SelectItem>
                <SelectItem value="14">最近 14 天</SelectItem>
                <SelectItem value="30">最近 30 天</SelectItem>
                <SelectItem value="90">最近 90 天</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={eventType}
              onValueChange={(v) => setEventType(v as EventType | 'all')}
            >
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="事件类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {Object.entries(EVENT_TYPE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {services.length > 0 && (
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="服务筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部服务</SelectItem>
                  {services.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            时间线
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingEvents ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">加载中...</div>
            </div>
          ) : Object.keys(groupedEvents).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mb-2 opacity-50" />
              <p>暂无事件记录</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedEvents).map(([date, dayEvents]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-sm font-medium text-muted-foreground px-2">
                      {date}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <div className="pl-2">
                    {dayEvents.map((event) => (
                      <TimelineItem key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
