import { useQuery } from '@tanstack/react-query';
import { msgGwClient, argoClient, knowledgeClient, homeworkClient, devTrackerClient } from '@/api/client';

// ==================== Trend Helper ====================

export function fillTrendDates(trend: Record<string, number>, days: number): Record<string, number> {
  const filled: Record<string, number> = {};
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    filled[key] = trend[key] || 0;
  }
  return filled;
}

// ==================== Message Gateway Stats ====================

interface MsgGwChannelStat {
  channel_name: string;
  total_count: number;
  success_count: number;
  fail_count: number;
  last_sent_at: string | null;
}

export function useMsgGwStats() {
  return useQuery({
    queryKey: ['system-overview', 'msg-gw-stats'],
    queryFn: async () => {
      const { data } = await msgGwClient.get<{ success: boolean; data: MsgGwChannelStat[] }>(
        '/api/v1/stats'
      );
      const channels = data.data || [];
      const totalSent = channels.reduce((sum, c) => sum + c.total_count, 0);
      const totalFailed = channels.reduce((sum, c) => sum + c.fail_count, 0);
      const lastSent = channels
        .filter((c) => c.last_sent_at)
        .sort((a, b) => new Date(b.last_sent_at!).getTime() - new Date(a.last_sent_at!).getTime())[0]
        ?.last_sent_at;
      return { totalSent, totalFailed, channelCount: channels.length, lastSent };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ==================== Cron Workflow Summary ====================

interface CronWorkflowItem {
  metadata: { name: string };
  spec: { suspend?: boolean };
  status?: { succeeded?: number; failed?: number; phase?: string; lastScheduledTime?: string };
}

export function useCronSummary() {
  return useQuery({
    queryKey: ['system-overview', 'cron-summary'],
    queryFn: async () => {
      const { data } = await argoClient.get<{ items: CronWorkflowItem[] }>(
        '/api/v1/cron-workflows/argo'
      );
      const items = data.items || [];
      const total = items.length;
      const active = items.filter((i) => !i.spec.suspend).length;
      const totalSucceeded = items.reduce((s, i) => s + (i.status?.succeeded ?? 0), 0);
      const totalFailed = items.reduce((s, i) => s + (i.status?.failed ?? 0), 0);
      const lastActivityAt = items
        .map((i) => i.status?.lastScheduledTime)
        .filter(Boolean)
        .sort()
        .pop() || null;
      return { total, active, totalSucceeded, totalFailed, lastActivityAt };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ==================== Knowledge Stats ====================

export function useKnowledgeStats() {
  return useQuery({
    queryKey: ['system-overview', 'knowledge-stats'],
    queryFn: async () => {
      const [atomsRes, reviewRes] = await Promise.all([
        knowledgeClient.get<{ total: number; atoms: { created_at: string }[] }>(
          '/api/v1/atoms?page=1&page_size=1&sort=-created_at'
        ),
        knowledgeClient.get<{
          by_status: { new: number; learning: number; mastered: number };
          recent_sessions: number;
          accuracy_rate: number;
        }>('/api/v1/review/stats'),
      ]);
      const atoms = atomsRes.data.atoms || [];
      const lastActivityAt = atoms.length > 0 ? atoms[0].created_at : null;
      return {
        totalAtoms: atomsRes.data.total,
        byStatus: reviewRes.data.by_status,
        recentSessions: reviewRes.data.recent_sessions,
        accuracyRate: reviewRes.data.accuracy_rate,
        lastActivityAt,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ==================== Homework Stats ====================

interface HomeworkSubmission {
  id: number;
  homework_type: string;
  status: string;
  submitted_at: string;
  graded_at: string | null;
  total_correct: number | null;
  total_wrong: number | null;
}

export function useHomeworkStats() {
  return useQuery({
    queryKey: ['system-overview', 'homework-stats'],
    queryFn: async () => {
      const { data } = await homeworkClient.get<{
        success: boolean;
        data: HomeworkSubmission[];
      }>('/api/v1/grade/submissions/confirmed-standalone');
      const submissions = data.data || [];
      const total = submissions.length;
      const graded = submissions.filter((s) => s.graded_at).length;
      const lastSubmission = submissions.length > 0
        ? submissions.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())[0]
        : null;
      return { total, graded, lastSubmittedAt: lastSubmission?.submitted_at };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ==================== Trend Hooks ====================

export function useMsgGwTrend(days: number) {
  return useQuery({
    queryKey: ['system-overview', 'msg-gw-trend', days],
    queryFn: async () => {
      // First get channel names from stats
      const statsRes = await msgGwClient.get<{
        success: boolean;
        data: MsgGwChannelStat[];
      }>('/api/v1/stats');
      const channels = statsRes.data.data || [];

      // Fetch logs for each channel in parallel
      const logsResults = await Promise.all(
        channels.map((ch) =>
          msgGwClient
            .get<{ success: boolean; data: { sent_at: string }[] }>(
              `/api/v1/stats/logs/${ch.channel_name}?limit=500`
            )
            .then((r) => r.data.data || [])
            .catch(() => [] as { sent_at: string }[])
        )
      );

      const trend: Record<string, number> = {};
      for (const logs of logsResults) {
        for (const log of logs) {
          if (log.sent_at) {
            const date = log.sent_at.slice(0, 10);
            trend[date] = (trend[date] || 0) + 1;
          }
        }
      }
      return fillTrendDates(trend, days);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCronTrend(days: number) {
  return useQuery({
    queryKey: ['system-overview', 'cron-trend', days],
    queryFn: async () => {
      const { data } = await argoClient.get<{
        items: { status?: { startedAt?: string } }[];
      }>('/api/v1/workflows/argo?listOptions.limit=200');
      const items = data.items || [];
      const trend: Record<string, number> = {};
      for (const item of items) {
        const startedAt = item.status?.startedAt;
        if (startedAt) {
          const date = startedAt.slice(0, 10);
          trend[date] = (trend[date] || 0) + 1;
        }
      }
      return fillTrendDates(trend, days);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useKnowledgeTrend(days: number) {
  return useQuery({
    queryKey: ['system-overview', 'knowledge-trend', days],
    queryFn: async () => {
      const { data } = await knowledgeClient.get<{
        atoms: { created_at: string }[];
        total: number;
      }>('/api/v1/atoms?page=1&page_size=300&sort=-created_at');
      const atoms = data.atoms || [];
      const trend: Record<string, number> = {};
      for (const atom of atoms) {
        if (atom.created_at) {
          const date = atom.created_at.slice(0, 10);
          trend[date] = (trend[date] || 0) + 1;
        }
      }
      return fillTrendDates(trend, days);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useHomeworkTrend(days: number) {
  return useQuery({
    queryKey: ['system-overview', 'homework-trend', days],
    queryFn: async () => {
      const { data } = await homeworkClient.get<{
        success: boolean;
        data: HomeworkSubmission[];
      }>('/api/v1/grade/submissions/confirmed-standalone');
      const submissions = data.data || [];
      const trend: Record<string, number> = {};
      for (const sub of submissions) {
        if (sub.submitted_at) {
          const date = sub.submitted_at.slice(0, 10);
          trend[date] = (trend[date] || 0) + 1;
        }
      }
      return fillTrendDates(trend, days);
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ==================== Dev Tracker Stats ====================

interface DevTrackerOverview {
  active_milestones: number;
  tasks_by_status: Record<string, number>;
  weekly_activities: number;
  unlinked_activities: number;
}

interface SessionStats {
  total: number;
  completed: number;
  pending: number;
  total_user_messages: number;
  by_service: Record<string, number>;
}

interface ActivityTrend {
  days: number;
  trend: Record<string, number>;
}

export function useDevTrackerOverview() {
  return useQuery({
    queryKey: ['system-overview', 'dev-tracker-overview'],
    queryFn: async () => {
      const { data } = await devTrackerClient.get<DevTrackerOverview>('/api/v1/stats/overview');
      return {
        ...data,
        lastActivityAt: data.weekly_activities > 0 ? new Date().toISOString() : null,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useDevTrackerSessions() {
  return useQuery({
    queryKey: ['system-overview', 'dev-tracker-sessions'],
    queryFn: async () => {
      const { data } = await devTrackerClient.get<SessionStats>('/api/v1/sessions/stats');
      // Top 5 projects by session count
      const topProjects = Object.entries(data.by_service)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
      return { ...data, topProjects };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useDevTrackerSpecs() {
  return useQuery({
    queryKey: ['system-overview', 'dev-tracker-specs'],
    queryFn: async () => {
      const { data } = await devTrackerClient.get<{
        data: { id: number; phase: string }[];
        total: number;
      }>('/api/v1/specs/?limit=100');
      const specs = data.data || [];
      const byPhase: Record<string, number> = {};
      for (const s of specs) {
        byPhase[s.phase] = (byPhase[s.phase] || 0) + 1;
      }
      return { total: data.total, byPhase };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useActivityTrend(days = 7) {
  return useQuery({
    queryKey: ['system-overview', 'activity-trend', days],
    queryFn: async () => {
      const { data } = await devTrackerClient.get<ActivityTrend>(
        `/api/v1/stats/activity-trend?days=${days}`
      );
      return fillTrendDates(data.trend || {}, days);
    },
    staleTime: 5 * 60 * 1000,
  });
}
