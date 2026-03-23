import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { argoClient } from '@/api/client';
import type { CronWorkflow, CronWorkflowList, CronWorkflowDisplayInfo } from '@/types/cron-workflow';

const NAMESPACE = 'argo';

export const cronWorkflowKeys = {
  all: ['cron-workflows'] as const,
  list: () => [...cronWorkflowKeys.all, 'list'] as const,
};

// Parse target service name from workflow templates' entrypoint URL
function parseAppName(cw: CronWorkflow): string {
  const entrypoint = cw.spec.workflowSpec.entrypoint;
  const templates = cw.spec.workflowSpec.templates;

  // Find the entrypoint template first, then check others
  const sorted = [...templates].sort((a, b) =>
    a.name === entrypoint ? -1 : b.name === entrypoint ? 1 : 0
  );

  for (const tpl of sorted) {
    // Check steps for URL parameters
    if (tpl.steps) {
      for (const stepGroup of tpl.steps) {
        for (const step of stepGroup) {
          const urlParam = step.arguments?.parameters?.find((p) => p.name === 'url');
          if (urlParam?.value) {
            const match = urlParam.value.match(/https?:\/\/([^.]+)\./);
            if (match) return match[1];
          }
        }
      }
    }
    // Check container args for target service URLs (skip notification/alert URLs)
    if (tpl.container?.args) {
      for (const arg of tpl.container.args) {
        const urls = [...arg.matchAll(/https?:\/\/([^.]+)\./g)];
        // Skip notification/alert endpoints — they're not the target service
        const targetUrl = urls.find((m) => !['msg-gw', 'notification'].includes(m[1]));
        if (targetUrl) return targetUrl[1];
      }
    }
  }
  // Fallback: derive app name from CronWorkflow name
  // Known prefixes that are multi-segment service names
  const name = cw.metadata.name;
  const knownPrefixes = ['data-fetcher', 'doc-service', 'file-gateway', 'efficiency-evaluator', 'knowledge-review'];
  for (const prefix of knownPrefixes) {
    if (name.startsWith(prefix)) return prefix;
  }
  // Single-segment app name (everything before last hyphen segment)
  const parts = name.split('-');
  return parts.length > 1 ? parts[0] : name;
}

// Auto-generate Chinese description from CronWorkflow name and spec
function generateDescription(cw: CronWorkflow): string {
  // Annotation takes priority
  const anno = cw.metadata.annotations?.['description'];
  if (anno) return anno;

  const name = cw.metadata.name;
  const schedule = cw.spec.schedule;

  // Map common keywords in the name to Chinese descriptions (already include frequency)
  const keywords: [RegExp, string][] = [
    [/health[-_]?monitor/, '应用健康状态监控与告警'],
    [/collect[-_]?daily/, '每日数据源采集'],
    [/financial[-_]?summary/, '每日财务数据摘要生成'],
    [/financial/, '每日金融数据采集'],
    [/backup/, '定时数据备份'],
    [/weekly[-_]?report/, '周报生成'],
    [/review[-_]?push/, '每日复习提醒推送'],
    [/daily/, '每日定时任务'],
    [/weekly/, '每周定时任务'],
    [/sync/, '数据同步'],
    [/cleanup|clean/, '数据清理'],
    [/notify|alert/, '通知告警'],
  ];

  for (const [pattern, desc] of keywords) {
    if (pattern.test(name)) return desc;
  }

  // Fallback based on schedule frequency
  if (schedule.startsWith('*/')) return '定时任务';
  if (/\d+ \d+ \* \* [0-6]$/.test(schedule)) return '每周定时任务';
  return '每日定时任务';
}

function toDisplayInfo(cw: CronWorkflow): CronWorkflowDisplayInfo {
  return {
    name: cw.metadata.name,
    appName: parseAppName(cw),
    description: generateDescription(cw),
    schedule: cw.spec.schedule,
    timezone: cw.spec.timezone || 'UTC',
    lastScheduledTime: cw.status?.lastScheduledTime,
    phase: cw.status?.phase || 'Unknown',
    suspended: cw.spec.suspend === true,
    succeeded: cw.status?.succeeded ?? 0,
    failed: cw.status?.failed ?? 0,
    createdAt: cw.metadata.creationTimestamp,
  };
}

export function useCronWorkflows() {
  return useQuery({
    queryKey: cronWorkflowKeys.list(),
    queryFn: async () => {
      const { data } = await argoClient.get<CronWorkflowList>(
        `/api/v1/cron-workflows/${NAMESPACE}`
      );
      return (data.items || []).map(toDisplayInfo);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useSuspendCronWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      await argoClient.put(
        `/api/v1/cron-workflows/${NAMESPACE}/${name}/suspend`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cronWorkflowKeys.list() });
    },
  });
}

export function useResumeCronWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      await argoClient.put(
        `/api/v1/cron-workflows/${NAMESPACE}/${name}/resume`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cronWorkflowKeys.list() });
    },
  });
}
