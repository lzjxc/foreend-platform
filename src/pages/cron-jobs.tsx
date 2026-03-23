import { useState } from 'react';
import {
  Clock,
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Calendar,
  Server,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  useCronWorkflows,
  useSuspendCronWorkflow,
  useResumeCronWorkflow,
} from '@/hooks/use-cron-workflows';
import type { CronWorkflowDisplayInfo } from '@/types/cron-workflow';
import { cn } from '@/lib/utils';

function formatSchedule(schedule: string): string {
  // Common cron patterns to human-readable
  if (schedule.startsWith('*/')) {
    const mins = schedule.match(/^\*\/(\d+) \* \* \* \*$/);
    if (mins) return `每 ${mins[1]} 分钟`;
  }
  const daily = schedule.match(/^(\d+) (\d+) \* \* \*$/);
  if (daily) return `每天 ${daily[2].padStart(2, '0')}:${daily[1].padStart(2, '0')}`;

  const weekly = schedule.match(/^(\d+) (\d+) \* \* (\d)$/);
  if (weekly) {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return `每周${days[parseInt(weekly[3])]} ${weekly[2].padStart(2, '0')}:${weekly[1].padStart(2, '0')}`;
  }

  const hourly = schedule.match(/^0 \*\/(\d+) \* \* \*$/);
  if (hourly) return `每 ${hourly[1]} 小时`;

  return schedule;
}

function formatLastRun(time?: string): string {
  if (!time) return '-';
  const date = new Date(time);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} 小时前`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} 天前`;
}

function CronJobCard({
  job,
  onSuspend,
  onResume,
  isSuspending,
  isResuming,
}: {
  job: CronWorkflowDisplayInfo;
  onSuspend: (name: string) => void;
  onResume: (name: string) => void;
  isSuspending: boolean;
  isResuming: boolean;
}) {
  const total = job.succeeded + job.failed;
  const successRate = total > 0 ? Math.round((job.succeeded / total) * 100) : 0;

  return (
    <Card
      className={cn(
        'transition-colors',
        job.suspended && 'opacity-60'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Info */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title row */}
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm truncate">{job.name}</h3>
              <Badge
                variant={job.suspended ? 'destructive' : job.phase === 'Active' ? 'default' : 'secondary'}
                className="text-xs shrink-0"
              >
                {job.suspended ? '已暂停' : job.phase === 'Active' ? '运行中' : job.phase}
              </Badge>
            </div>

            {/* App + Description */}
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="text-xs shrink-0">
                <Server className="h-3 w-3 mr-1" />
                {job.appName}
              </Badge>
              {job.description && (
                <span className="text-muted-foreground truncate">{job.description}</span>
              )}
            </div>

            {/* Schedule + Last run */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatSchedule(job.schedule)}
                <span className="text-muted-foreground/60">({job.timezone})</span>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatLastRun(job.lastScheduledTime)}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                {job.succeeded}
              </span>
              <span className="flex items-center gap-1 text-red-500">
                <XCircle className="h-3 w-3" />
                {job.failed}
              </span>
              {total > 0 && (
                <span className="text-muted-foreground">
                  成功率 {successRate}%
                </span>
              )}
            </div>
          </div>

          {/* Right: Action */}
          <div className="shrink-0">
            {job.suspended ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onResume(job.name)}
                disabled={isResuming}
              >
                <Play className="h-4 w-4 mr-1" />
                恢复
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSuspend(job.name)}
                disabled={isSuspending}
              >
                <Pause className="h-4 w-4 mr-1" />
                暂停
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CronJobsPage() {
  const { data: jobs, isLoading, refetch } = useCronWorkflows();
  const suspendMutation = useSuspendCronWorkflow();
  const resumeMutation = useResumeCronWorkflow();
  const [actionTarget, setActionTarget] = useState<string | null>(null);

  const handleSuspend = async (name: string) => {
    setActionTarget(name);
    try {
      await suspendMutation.mutateAsync(name);
      toast.success(`已暂停 ${name}`);
    } catch {
      toast.error(`暂停 ${name} 失败`);
    } finally {
      setActionTarget(null);
    }
  };

  const handleResume = async (name: string) => {
    setActionTarget(name);
    try {
      await resumeMutation.mutateAsync(name);
      toast.success(`已恢复 ${name}`);
    } catch {
      toast.error(`恢复 ${name} 失败`);
    } finally {
      setActionTarget(null);
    }
  };

  const activeCount = jobs?.filter((j) => !j.suspended).length ?? 0;
  const suspendedCount = jobs?.filter((j) => j.suspended).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">定时任务</h1>
          <p className="text-muted-foreground">
            Argo CronWorkflow 定时任务管理
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          刷新
        </Button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="text-sm">
          共 {jobs?.length ?? 0} 个任务
        </Badge>
        <Badge variant="default" className="text-sm">
          {activeCount} 运行中
        </Badge>
        {suspendedCount > 0 && (
          <Badge variant="destructive" className="text-sm">
            {suspendedCount} 已暂停
          </Badge>
        )}
      </div>

      {/* Job List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      ) : !jobs || jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mb-2 opacity-50" />
            <p>暂无定时任务</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {jobs.map((job) => (
            <CronJobCard
              key={job.name}
              job={job}
              onSuspend={handleSuspend}
              onResume={handleResume}
              isSuspending={suspendMutation.isPending && actionTarget === job.name}
              isResuming={resumeMutation.isPending && actionTarget === job.name}
            />
          ))}
        </div>
      )}
    </div>
  );
}
