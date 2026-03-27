import { useState } from 'react';
import { toast } from 'sonner';
import {
  Target,
  Activity as ActivityIcon,
  ListTodo,
  Calendar,
  Clock,
  GitCommit,
  ExternalLink,
  Plus,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Layers,
  FileText,
  HardDrive,
  MessageSquare,
  Tag,
  Filter,
  Loader2,
  RotateCcw,
  Trash2,
  Link2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  Hash,
  User,
  File,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useDevTrackerOverview,
  useTimeline,
  useCategories,
  useMilestones,
  useMilestone,
  useCreateMilestone,
  useUpdateMilestone,
  useCompleteMilestone,
  useApps,
  useSpecs,
  useSpec,
  useAdvanceSpec,
  useRetreatSpec,
  useCancelSpec,
  useSpecTasks,
  useTasks,
  useTask,
  useCreateTask,
  useUpdateTask,
  useCompleteTask,
  useRetreatTask,
  useActivities,
  useUnlinkedActivities,
  useBulkLinkActivities,
  useSessions,
  useSession,
  useReanalyzeSession,
  useDeleteSession,
  useConfigBackups,
} from '@/hooks/use-dev-tracker';
import type {
  MilestoneListItem,
  TimelineDay,
  TimelineSession,
  Activity,
  SpecListItem,
  TaskListItem,
  SessionListItem,
  ConfigBackupListItem,
  App,
} from '@/types/dev-tracker';

// ─── Tab definitions ───

const tabs = [
  { value: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { value: 'milestones', label: 'Milestones', icon: Target },
  { value: 'apps', label: 'Apps', icon: Layers },
  { value: 'specs', label: 'Specs', icon: FileText },
  { value: 'tasks', label: 'Tasks', icon: ListTodo },
  { value: 'activities', label: 'Activities', icon: ActivityIcon },
  { value: 'sessions', label: 'Sessions', icon: MessageSquare },
  { value: 'backups', label: 'Config Backups', icon: HardDrive },
];

// ─── Color helpers ───

function statusColor(status: string) {
  switch (status) {
    case 'active':
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'done':
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'planning':
    case 'todo':
    case 'pending':
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

function phaseColor(phase: string) {
  switch (phase) {
    case 'brainstorming':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'designing':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'implementing':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'verifying':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

function priorityColor(priority: string) {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'low':
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

function sourceColor(source: string) {
  switch (source) {
    case 'claude_code':
      return 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200';
    case 'github':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    case 'manual':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
}

function activityTypeColor(t: string) {
  switch (t) {
    case 'feature':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
    case 'bugfix':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'refactor':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
    case 'docs':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
    case 'chore':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
}

const categoryLabels: Record<string, string> = {
  'k8s-dev': 'K8s 系统开发',
  'game-dev': '游戏开发',
  'life-exp': '生活经验',
  'other': '其他计划',
  'design': '设计',
  'devops': 'DevOps',
};

function categoryColor(cat: string | null | undefined) {
  if (!cat) return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  const colors: Record<string, string> = {
    'k8s-dev': 'bg-blue-600 text-white',
    'game-dev': 'bg-purple-600 text-white',
    'life-exp': 'bg-orange-500 text-white',
    'other': 'bg-gray-500 text-white',
    'design': 'bg-cyan-600 text-white',
    'devops': 'bg-emerald-600 text-white',
  };
  return colors[cat] || 'bg-gray-500 text-white';
}

function categoryLabel(cat: string | null | undefined) {
  if (!cat) return '';
  return categoryLabels[cat] || cat;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '-';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

// ─── Main Page ───

export default function DevTrackerPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dev Tracker</h1>
        <p className="text-muted-foreground">Development activity tracking and milestone management</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap',
                activeTab === tab.value
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'dashboard' && <DashboardTab />}
      {activeTab === 'milestones' && <MilestonesTab />}
      {activeTab === 'apps' && <AppsTab />}
      {activeTab === 'specs' && <SpecsTab />}
      {activeTab === 'tasks' && <TasksTab />}
      {activeTab === 'activities' && <ActivitiesTab />}
      {activeTab === 'sessions' && <SessionsTab />}
      {activeTab === 'backups' && <BackupsTab />}
    </div>
  );
}

// ─── Conversation Renderer ───

function ConversationView({ conversation }: { conversation: Array<Record<string, unknown>> | null }) {
  const [showAll, setShowAll] = useState(false);
  if (!conversation || conversation.length === 0) {
    return <p className="text-sm text-muted-foreground italic py-2">No conversation data</p>;
  }
  const MAX_PREVIEW = 20;
  const items = showAll ? conversation : conversation.slice(0, MAX_PREVIEW);

  return (
    <div className="space-y-2">
      {items.map((msg, i) => {
        const role = String(msg.role || msg.type || 'unknown');
        const isUser = role === 'user' || role === 'human';
        const content = String(msg.content || msg.text || JSON.stringify(msg));
        const truncated = content.length > 500 ? content.substring(0, 500) + '...truncated' : content;
        return (
          <div
            key={i}
            className={cn(
              'border-l-4 pl-3 py-1.5 text-sm',
              isUser
                ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-gray-300 bg-gray-50/50 dark:bg-gray-900/30'
            )}
          >
            <span className={cn('text-xs font-semibold', isUser ? 'text-blue-600' : 'text-gray-500')}>
              {role}
            </span>
            <p className="text-xs mt-0.5 whitespace-pre-wrap break-words">{truncated}</p>
          </div>
        );
      })}
      {conversation.length > MAX_PREVIEW && !showAll && (
        <Button variant="ghost" size="sm" onClick={() => setShowAll(true)}>
          Show all {conversation.length} messages
        </Button>
      )}
    </div>
  );
}

// ─── Dashboard Tab ───

function DashboardTab() {
  const [days, setDays] = useState(7);
  const [category, setCategory] = useState<string | undefined>();
  const { data: overview, isLoading: loadingOverview } = useDevTrackerOverview();
  const { data: timeline, isLoading: loadingTimeline } = useTimeline(days, category);
  const { data: categories } = useCategories();

  const tasksByStatus = overview?.tasks_by_status || {};

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loadingOverview ? <Loader2 className="h-6 w-6 animate-spin" /> : overview?.active_milestones ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loadingOverview ? <Loader2 className="h-6 w-6 animate-spin" /> : overview?.weekly_activities ?? 0}
            </div>
            {overview?.unlinked_activities ? (
              <p className="text-xs text-muted-foreground mt-1">
                {overview.unlinked_activities} unlinked
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingOverview ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="flex flex-wrap gap-2">
                {Object.entries(tasksByStatus).map(([status, count]) => (
                  <span
                    key={status}
                    className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold', statusColor(status))}
                  >
                    {status}: {count}
                  </span>
                ))}
                {Object.keys(tasksByStatus).length === 0 && (
                  <span className="text-sm text-muted-foreground">No tasks</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Days:</span>
          {[7, 14, 30].map((d) => (
            <Button
              key={d}
              variant={days === d ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(d)}
            >
              {d}
            </Button>
          ))}
        </div>

        <Select value={category || '__all__'} onValueChange={(v) => setCategory(v === '__all__' ? undefined : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All categories</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      {loadingTimeline ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {timeline?.map((day, i) => (
            <TimelineDayCard key={day.date} day={day} index={i} />
          ))}
          {timeline?.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No activity in the selected period</p>
          )}
        </div>
      )}
    </div>
  );
}

function isToday(dateStr: string) {
  return dateStr === new Date().toISOString().split('T')[0];
}

const dayColors = [
  'border-green-500',
  'border-blue-500',
  'border-purple-500',
  'border-orange-500',
  'border-pink-500',
  'border-cyan-500',
  'border-yellow-500',
];

const dayDotColors = [
  'bg-green-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-yellow-500',
];

function TimelineDayCard({ day, index }: { day: TimelineDay; index: number }) {
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);
  const [unlinkedExpanded, setUnlinkedExpanded] = useState(false);
  const today = isToday(day.date);
  const colorIdx = index % dayColors.length;
  const borderColor = today ? 'border-green-500' : dayColors[colorIdx];
  const dotColor = today ? 'bg-green-500' : dayDotColors[colorIdx];
  const dateShort = day.date.slice(5); // "03-27" -> "3/27"
  const [m, d] = dateShort.split('-');
  const dateLabel = `${parseInt(m)}/${parseInt(d)}`;
  const weekdayMap: Record<string, string> = { Mon: '周一', Tue: '周二', Wed: '周三', Thu: '周四', Fri: '周五', Sat: '周六', Sun: '周日' };
  const weekdayLabel = weekdayMap[day.weekday] || day.weekday;
  const unlinkedCount = day.unlinked.length;
  const sessionCount = day.sessions.length;

  return (
    <div className={cn('border-l-4 pl-4', borderColor)}>
      {/* Day header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn('h-3 w-3 rounded-full', dotColor)} />
          <span className="font-bold text-lg">{dateLabel}</span>
          <span className="text-sm text-muted-foreground">{weekdayLabel}{today ? ' (Today)' : ''}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {sessionCount} session{sessionCount !== 1 ? 's' : ''}
          {unlinkedCount > 0 && ` + ${unlinkedCount} unlinked`}
        </span>
      </div>

      {/* Sessions */}
      <div className="space-y-1">
        {day.sessions.map((session) => (
          <TimelineSessionRow
            key={session.id}
            session={session}
            expanded={expandedSessionId === session.id}
            onToggle={() => setExpandedSessionId(prev => prev === session.id ? null : session.id)}
          />
        ))}
        {unlinkedCount > 0 && (
          <div>
            <div
              className="flex items-center gap-2 py-2 px-2 text-sm text-amber-600 dark:text-amber-400 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors"
              onClick={() => setUnlinkedExpanded(!unlinkedExpanded)}
            >
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', unlinkedExpanded ? '' : '-rotate-90')} />
              <span className="bg-amber-100 dark:bg-amber-900 rounded-full h-2 w-2" />
              <span className="font-medium">未归组</span>
              <span className="text-muted-foreground">{unlinkedCount} activities</span>
            </div>
            {unlinkedExpanded && (
              <div className="ml-8 mt-1 space-y-1 border-l-2 border-amber-200 dark:border-amber-800 pl-3">
                {day.unlinked.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 py-1 text-xs">
                    <span className="text-muted-foreground w-12 flex-shrink-0">{formatTime(a.created_at)}</span>
                    <span className={cn('rounded px-1.5 py-0.5 font-medium', activityTypeColor(a.activity_type))}>
                      {a.activity_type}
                    </span>
                    <span className="font-mono text-muted-foreground">{a.service_id}</span>
                    <span className="truncate">{a.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {sessionCount === 0 && unlinkedCount === 0 && (
        <p className="text-sm text-muted-foreground py-2 italic">no activity</p>
      )}
    </div>
  );
}

function TimelineSessionRow({ session, expanded, onToggle }: { session: TimelineSession; expanded: boolean; onToggle: () => void }) {
  const [showConversation, setShowConversation] = useState(false);
  const commitCount = session.activities.filter(a => a.commit_sha).length;
  const timeStr = formatTime(session.created_at);

  // Lazy load session detail when conversation is requested
  const { data: sessionDetail, isLoading: loadingDetail } = useSession(
    showConversation ? session.id : 0
  );

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2.5 px-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
        onClick={onToggle}
      >
        {/* Expand indicator */}
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform flex-shrink-0', expanded ? '' : '-rotate-90')} />

        {/* Category badge - left side, fixed width */}
        <div className="w-24 flex-shrink-0">
          {session.category && (
            <span className={cn('rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap', categoryColor(session.category))}>
              {categoryLabel(session.category)}
            </span>
          )}
        </div>

        {/* Source badges */}
        <div className="flex items-center gap-1 w-32 flex-shrink-0">
          {session.environment && (
            <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              {session.environment}
            </span>
          )}
          {session.trigger_source && (
            <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300">
              {session.trigger_source}
            </span>
          )}
        </div>

        {/* Title - bold */}
        <span className="font-semibold text-sm truncate flex-1 min-w-0">
          {session.title || 'Untitled session'}
        </span>

        {/* Service ID */}
        <span className="text-xs text-muted-foreground flex-shrink-0 w-36 truncate">
          {session.service_id}
        </span>

        {/* Time range */}
        <span className="text-xs text-muted-foreground flex-shrink-0 w-16 text-right">
          {timeStr}
        </span>

        {/* Commits */}
        <span className="text-xs text-muted-foreground flex-shrink-0 w-20 text-right">
          {commitCount > 0 ? `${commitCount} commits` : ''}
        </span>
      </div>

      {/* Expanded session detail */}
      {expanded && (
        <div className="ml-6 mb-2 border-l-4 border-primary/30 pl-4 py-2 space-y-3">
          {/* Dev purpose banner */}
          {session.dev_purpose && (
            <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-2 text-sm text-blue-800 dark:text-blue-200">
              <span className="font-medium">Purpose:</span> {session.dev_purpose}
            </div>
          )}

          {/* Topics */}
          {session.topics && session.topics.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Topics:</span>
              <div className="flex flex-wrap gap-1">
                {session.topics.map((topic, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {topic.title}
                    {topic.tags?.map((t, ti) => (
                      <span key={ti} className="ml-1 opacity-60">#{t}</span>
                    ))}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Activities list */}
          {session.activities.length > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Activities ({session.activities.length}):</span>
              {session.activities.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-xs py-0.5">
                  <span className="text-muted-foreground w-12 flex-shrink-0">{formatTime(a.created_at)}</span>
                  <span className={cn('rounded px-1.5 py-0.5 font-medium', activityTypeColor(a.activity_type))}>
                    {a.activity_type}
                  </span>
                  <span className="font-mono text-muted-foreground">{a.service_id}</span>
                  {a.commit_sha && (
                    <span className="font-mono text-muted-foreground flex items-center gap-0.5">
                      <GitCommit className="h-3 w-3" />{a.commit_sha.substring(0, 7)}
                    </span>
                  )}
                  <span className="truncate">{a.title}</span>
                </div>
              ))}
            </div>
          )}

          {/* Duration/message stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {session.duration_seconds != null && (
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDuration(session.duration_seconds)}</span>
            )}
            {session.message_count != null && (
              <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{session.message_count} messages</span>
            )}
          </div>

          {/* Conversation toggle */}
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => { e.stopPropagation(); setShowConversation(!showConversation); }}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              {showConversation ? 'Hide Conversation' : 'Show Conversation'}
            </Button>
          </div>
          {showConversation && (
            <div className="mt-2">
              {loadingDetail ? (
                <div className="flex items-center gap-2 py-4"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm text-muted-foreground">Loading conversation...</span></div>
              ) : (
                <ConversationView conversation={sessionDetail?.conversation || null} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Milestones Tab ───

function MilestonesTab() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { data: milestonesData, isLoading } = useMilestones(1, 100, { status: statusFilter || undefined });
  const completeMilestone = useCompleteMilestone();
  const updateMilestone = useUpdateMilestone();
  const milestones = milestonesData?.data || [];

  const statuses = ['planning', 'active', 'completed'];

  return (
    <div className="space-y-4">
      {/* Filters + create */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {['All', ...statuses].map((s) => (
            <Button
              key={s}
              variant={(!statusFilter && s === 'All') || statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s === 'All' ? undefined : s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Milestone
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-3">
          {milestones.map((m) => (
            <MilestoneCard
              key={m.id}
              milestone={m}
              expanded={expandedId === m.id}
              onToggle={() => setExpandedId(prev => prev === m.id ? null : m.id)}
              onUpdate={updateMilestone.mutate}
              onComplete={(id) => completeMilestone.mutate(id)}
            />
          ))}
          {milestones.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No milestones found</p>
          )}
        </div>
      )}

      <CreateMilestoneDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}

function MilestoneCard({
  milestone: m,
  expanded,
  onToggle,
  onUpdate,
  onComplete,
}: {
  milestone: MilestoneListItem;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (data: { id: number; status?: string }) => void;
  onComplete?: (id: number) => void;
}) {
  const progress = m.task_count > 0 ? Math.round((m.tasks_done / m.task_count) * 100) : 0;

  // Lazy-load full milestone detail when expanded
  const { data: detail, isLoading: loadingDetail } = useMilestone(expanded ? m.id : 0);

  return (
    <Card className="p-4">
      <div
        className="flex items-start justify-between gap-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform flex-shrink-0', expanded ? '' : '-rotate-90')} />
            <h3 className="font-semibold truncate">{m.title}</h3>
            <span className={cn('rounded-md px-2 py-0.5 text-xs font-semibold', statusColor(m.status))}>
              {m.status}
            </span>
          </div>
          {m.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 ml-6">{m.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground ml-6">
            <span className="flex items-center gap-1">
              <ListTodo className="h-3 w-3" />
              Tasks: {m.tasks_done}/{m.task_count}
            </span>
            {m.target_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Target: {m.target_date}
              </span>
            )}
            {m.tags && m.tags.length > 0 && (
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {m.tags.join(', ')}
              </span>
            )}
          </div>
          {m.task_count > 0 && (
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden ml-6">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {m.status === 'planning' && (
            <Button variant="outline" size="sm" onClick={() => onUpdate({ id: m.id, status: 'active' })}>
              Activate
            </Button>
          )}
          {m.status === 'active' && onComplete && (
            <Button variant="outline" size="sm" onClick={() => onComplete(m.id)}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Complete
            </Button>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-4 ml-6 border-l-4 border-primary/30 pl-4 space-y-3">
          {loadingDetail ? (
            <div className="flex items-center gap-2 py-2"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm text-muted-foreground">Loading details...</span></div>
          ) : detail ? (
            <>
              {/* Full description */}
              {detail.description && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Description:</span>
                  <p className="text-sm mt-1">{detail.description}</p>
                </div>
              )}
              {/* Scope */}
              {detail.scope && detail.scope.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Scope:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {detail.scope.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {/* Summary doc */}
              {detail.summary_doc && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Summary:</span>
                  <div className="text-sm mt-1 bg-muted/50 rounded p-3 whitespace-pre-wrap">{detail.summary_doc}</div>
                </div>
              )}
              {/* Deviation report */}
              {detail.deviation_report && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Deviation Report:</span>
                  <div className="text-sm mt-1 bg-amber-50 dark:bg-amber-950/30 rounded p-3 whitespace-pre-wrap">{detail.deviation_report}</div>
                </div>
              )}
              {/* Task info */}
              <div className="text-xs text-muted-foreground">
                Tasks: {m.tasks_done}/{m.task_count} ({progress}% complete)
                {detail.completed_at && <span className="ml-2">Completed: {formatDateTime(detail.completed_at)}</span>}
              </div>
            </>
          ) : null}
        </div>
      )}
    </Card>
  );
}

function CreateMilestoneDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const createMilestone = useCreateMilestone();

  const handleSubmit = () => {
    if (!title.trim()) return;
    createMilestone.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        target_date: targetDate || null,
      },
      {
        onSuccess: () => {
          setTitle('');
          setDescription('');
          setTargetDate('');
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Milestone</DialogTitle>
          <DialogDescription>Create a new milestone to track progress</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ms-title">Title *</Label>
            <Input id="ms-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Milestone title" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ms-desc">Description</Label>
            <Input id="ms-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ms-date">Target Date</Label>
            <Input id="ms-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || createMilestone.isPending}>
            {createMilestone.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Apps Tab ───

function AppsTab() {
  const [categorySlug, setCategorySlug] = useState<string | undefined>();
  const { data: categories } = useCategories();
  const categoryId = categorySlug ? categories?.find(c => c.slug === categorySlug)?.id : undefined;
  const { data: apps, isLoading } = useApps(categoryId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant={!categorySlug ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCategorySlug(undefined)}
        >
          All
        </Button>
        {categories?.map((c) => (
          <Button
            key={c.slug}
            variant={categorySlug === c.slug ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategorySlug(c.slug)}
          >
            {c.name}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps?.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
          {apps?.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-8">No apps found</p>
          )}
        </div>
      )}
    </div>
  );
}

function AppCard({ app }: { app: App }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold">{app.name}</h3>
          <p className="text-xs text-muted-foreground font-mono">{app.slug}</p>
        </div>
        {app.repo_url && (
          <a href={app.repo_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
      {app.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{app.description}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {app.category_slugs?.map((slug) => (
          <span key={slug} className={cn('rounded-md px-1.5 py-0.5 text-xs font-medium', categoryColor(slug))}>
            {slug}
          </span>
        ))}
        <Badge variant="secondary" className="text-xs">
          {app.milestone_count} milestone{app.milestone_count !== 1 ? 's' : ''}
        </Badge>
      </div>
    </Card>
  );
}

// ─── Specs Tab ───

function SpecsTab() {
  const [phaseFilter, setPhaseFilter] = useState<string | undefined>();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { data: specsData, isLoading } = useSpecs(1, 100, { phase: phaseFilter || undefined });
  const advanceSpec = useAdvanceSpec();
  const retreatSpec = useRetreatSpec();
  const cancelSpec = useCancelSpec();
  const specs = specsData?.data || [];

  const phases = ['brainstorming', 'designing', 'implementing', 'verifying', 'completed', 'cancelled'];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={!phaseFilter ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPhaseFilter(undefined)}
        >
          All
        </Button>
        {phases.map((p) => (
          <Button
            key={p}
            variant={phaseFilter === p ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPhaseFilter(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-3">
          {specs.map((spec) => (
            <SpecCard
              key={spec.id}
              spec={spec}
              expanded={expandedId === spec.id}
              onToggle={() => setExpandedId(prev => prev === spec.id ? null : spec.id)}
              onAdvance={() => {
                advanceSpec.mutate(spec.id, {
                  onSuccess: () => toast.success(`Spec "${spec.title}" advanced`),
                  onError: () => toast.error('Failed to advance spec'),
                });
              }}
              onRetreat={() => {
                retreatSpec.mutate(spec.id, {
                  onSuccess: () => toast.success(`Spec "${spec.title}" retreated`),
                  onError: () => toast.error('Failed to retreat spec'),
                });
              }}
              onCancel={() => {
                if (!confirm(`Cancel spec "${spec.title}"? This action may not be easily undone.`)) return;
                cancelSpec.mutate(spec.id, {
                  onSuccess: () => toast.success(`Spec "${spec.title}" cancelled`),
                  onError: () => toast.error('Failed to cancel spec'),
                });
              }}
            />
          ))}
          {specs.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No specs found</p>
          )}
        </div>
      )}
    </div>
  );
}

function SpecCard({
  spec,
  expanded,
  onToggle,
  onAdvance,
  onRetreat,
  onCancel,
}: {
  spec: SpecListItem;
  expanded: boolean;
  onToggle: () => void;
  onAdvance: () => void;
  onRetreat: () => void;
  onCancel: () => void;
}) {
  const progress = spec.task_count > 0 ? Math.round((spec.tasks_done / spec.task_count) * 100) : 0;
  const canAdvance = !['completed', 'cancelled'].includes(spec.phase);
  const canRetreat = !['brainstorming', 'cancelled'].includes(spec.phase);
  const canCancel = !['cancelled', 'completed'].includes(spec.phase);

  // Lazy-load full spec detail when expanded
  const { data: detail, isLoading: loadingDetail } = useSpec(expanded ? spec.id : 0);
  const { data: specTasks } = useSpecTasks(expanded ? spec.id : 0, 1, 50);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4 cursor-pointer" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform flex-shrink-0', expanded ? '' : '-rotate-90')} />
            <h3 className="font-semibold truncate">{spec.title}</h3>
            <span className={cn('rounded-md px-2 py-0.5 text-xs font-semibold', phaseColor(spec.phase))}>
              {spec.phase}
            </span>
          </div>
          {spec.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 ml-6">{spec.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap ml-6">
            <span>Tasks: {spec.tasks_done}/{spec.task_count}</span>
            {spec.scope_services && spec.scope_services.length > 0 && (
              <span className="flex items-center gap-1">
                {spec.scope_services.map((s) => (
                  <Badge key={s} variant="outline" className="text-xs py-0">{s}</Badge>
                ))}
              </span>
            )}
            {spec.version && <span>v{spec.version}</span>}
          </div>
          {spec.task_count > 0 && (
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden ml-6">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {canRetreat && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRetreat} title="Retreat phase">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          {canAdvance && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAdvance} title="Advance phase">
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-4 ml-6 border-l-4 border-primary/30 pl-4 space-y-3">
          {loadingDetail ? (
            <div className="flex items-center gap-2 py-2"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm text-muted-foreground">Loading details...</span></div>
          ) : detail ? (
            <>
              {/* Full description */}
              {detail.description && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Description:</span>
                  <p className="text-sm mt-1">{detail.description}</p>
                </div>
              )}

              {/* Scope services */}
              {detail.scope_services && detail.scope_services.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Scope Services:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {detail.scope_services.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Phase history */}
              {detail.phase_history && detail.phase_history.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Phase History:</span>
                  <div className="mt-1 space-y-1">
                    {detail.phase_history.map((entry, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className={cn('rounded px-1.5 py-0.5 font-medium', phaseColor(String(entry.phase || entry.to || '')))}>
                          {String(entry.phase || entry.to || 'unknown')}
                        </span>
                        {entry.timestamp ? (
                          <span className="text-muted-foreground">{formatDateTime(String(entry.timestamp))}</span>
                        ) : null}
                        {entry.reason ? (
                          <span className="text-muted-foreground italic">{String(entry.reason)}</span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expected files */}
              {detail.expected_files && detail.expected_files.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Expected Files ({detail.expected_files.length}):</span>
                  <div className="mt-1 space-y-0.5">
                    {detail.expected_files.map((f, i) => (
                      <div key={i} className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                        <File className="h-3 w-3" />{f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Linked tasks */}
              {specTasks && specTasks.data.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Tasks ({specTasks.total}):</span>
                  <div className="mt-1 space-y-1">
                    {specTasks.data.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 text-xs">
                        <span className={cn('rounded px-1.5 py-0.5 font-medium', statusColor(t.status))}>{t.status}</span>
                        <span>{t.title}</span>
                        <span className="font-mono text-muted-foreground">{t.service_id}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                {canAdvance && (
                  <Button variant="outline" size="sm" onClick={onAdvance}>
                    <ArrowRight className="h-3.5 w-3.5 mr-1" /> Advance
                  </Button>
                )}
                {canRetreat && (
                  <Button variant="outline" size="sm" onClick={onRetreat}>
                    <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Retreat
                  </Button>
                )}
                {canCancel && (
                  <Button variant="destructive" size="sm" onClick={onCancel}>
                    <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
                  </Button>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
    </Card>
  );
}

// ─── Tasks Tab ───

function TasksTab() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { data, isLoading } = useTasks(page, 20, { status: statusFilter || undefined, taskType: undefined, serviceId: undefined });
  const updateTask = useUpdateTask();
  const completeTask = useCompleteTask();
  const retreatTask = useRetreatTask();

  const tasks = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={statusFilter || '__all__'} onValueChange={(v) => { setStatusFilter(v === '__all__' ? undefined : v); setPage(1); }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Status</SelectItem>
              <SelectItem value="todo">Todo</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter || '__all__'} onValueChange={(v) => { setPriorityFilter(v === '__all__' ? undefined : v); setPage(1); }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Task
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              expanded={expandedId === task.id}
              onToggle={() => setExpandedId(prev => prev === task.id ? null : task.id)}
              onStart={() => {
                completeTask; // suppress unused
                updateTask.mutate({ id: task.id, status: 'in_progress' }, {
                  onSuccess: () => toast.success('Task started'),
                  onError: () => toast.error('Failed to start task'),
                });
              }}
              onComplete={() => {
                completeTask.mutate(task.id, {
                  onSuccess: () => toast.success('Task completed'),
                  onError: () => toast.error('Failed to complete task'),
                });
              }}
              onRetreat={() => {
                retreatTask.mutate(task.id, {
                  onSuccess: () => toast.success('Task retreated to todo'),
                  onError: () => toast.error('Failed to retreat task'),
                });
              }}
            />
          ))}
          {tasks.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No tasks found</p>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{total} total tasks</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <CreateTaskDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}

function TaskCard({
  task,
  expanded,
  onToggle,
  onStart,
  onComplete,
  onRetreat,
}: {
  task: TaskListItem;
  expanded: boolean;
  onToggle: () => void;
  onStart: () => void;
  onComplete: () => void;
  onRetreat: () => void;
}) {
  // Lazy-load full task detail when expanded
  const { data: detail, isLoading: loadingDetail } = useTask(expanded ? task.id : 0);

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between gap-3 cursor-pointer" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform flex-shrink-0', expanded ? '' : '-rotate-90')} />
            <span className="font-medium text-sm truncate">{task.title}</span>
            <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-semibold', statusColor(task.status))}>
              {task.status}
            </span>
            <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-semibold', priorityColor(task.priority))}>
              {task.priority}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground ml-5">
            <span className="font-mono">{task.service_id}</span>
            {task.task_type && <span>{task.task_type}</span>}
            <span>{task.activity_count} activit{task.activity_count !== 1 ? 'ies' : 'y'}</span>
            {task.tags && task.tags.length > 0 && (
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {task.tags.join(', ')}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {task.status === 'todo' && (
            <Button variant="outline" size="sm" onClick={onStart}>
              Start
            </Button>
          )}
          {task.status === 'in_progress' && (
            <Button variant="outline" size="sm" onClick={onComplete}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Done
            </Button>
          )}
          {task.status === 'in_progress' && (
            <Button variant="ghost" size="sm" onClick={onRetreat}>
              Undo
            </Button>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-3 ml-5 border-l-4 border-primary/30 pl-4 space-y-3">
          {loadingDetail ? (
            <div className="flex items-center gap-2 py-2"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm text-muted-foreground">Loading details...</span></div>
          ) : detail ? (
            <>
              {/* Full description */}
              {detail.description && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Description:</span>
                  <p className="text-sm mt-1">{detail.description}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span>Source: <span className={cn('rounded px-1.5 py-0.5 font-medium', sourceColor(detail.source))}>{detail.source}</span></span>
                <span>Type: {detail.task_type}</span>
                {detail.origin_service_id && <span>Origin: {detail.origin_service_id}</span>}
                {detail.started_at && <span>Started: {formatDateTime(detail.started_at)}</span>}
                {detail.completed_at && <span>Completed: {formatDateTime(detail.completed_at)}</span>}
              </div>

              {/* Plan/Landing doc paths */}
              {detail.plan_doc_path && (
                <div className="text-xs"><span className="text-muted-foreground">Plan doc:</span> <span className="font-mono">{detail.plan_doc_path}</span></div>
              )}
              {detail.landing_doc_path && (
                <div className="text-xs"><span className="text-muted-foreground">Landing doc:</span> <span className="font-mono">{detail.landing_doc_path}</span></div>
              )}

              {/* Check result */}
              {detail.check_result && Object.keys(detail.check_result).length > 0 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Check Result:</span>
                  <div className="mt-1 bg-muted/50 rounded p-3 text-xs space-y-1">
                    {detail.check_result.coverage != null && (
                      <div>Coverage: <span className="font-semibold">{String(detail.check_result.coverage)}%</span></div>
                    )}
                    {Array.isArray(detail.check_result.missing_files) && (detail.check_result.missing_files as string[]).length > 0 && (
                      <div>
                        <span className="text-red-600 font-medium">Missing files:</span>
                        <ul className="list-disc ml-4 mt-0.5">
                          {(detail.check_result.missing_files as string[]).map((f, i) => (
                            <li key={i} className="font-mono">{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(detail.check_result.unexpected_files) && (detail.check_result.unexpected_files as string[]).length > 0 && (
                      <div>
                        <span className="text-amber-600 font-medium">Unexpected files:</span>
                        <ul className="list-disc ml-4 mt-0.5">
                          {(detail.check_result.unexpected_files as string[]).map((f, i) => (
                            <li key={i} className="font-mono">{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Fallback: show raw JSON for other fields */}
                    {!detail.check_result.coverage && !detail.check_result.missing_files && !detail.check_result.unexpected_files && (
                      <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(detail.check_result, null, 2)}</pre>
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons in expanded view */}
              <div className="flex items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                {task.status === 'todo' && (
                  <Button variant="outline" size="sm" onClick={onStart}>
                    <ArrowRight className="h-3.5 w-3.5 mr-1" /> Start
                  </Button>
                )}
                {task.status === 'in_progress' && (
                  <>
                    <Button variant="outline" size="sm" onClick={onComplete}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Complete
                    </Button>
                    <Button variant="ghost" size="sm" onClick={onRetreat}>
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Undo
                    </Button>
                  </>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
    </Card>
  );
}

function CreateTaskDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [title, setTitle] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [taskType, setTaskType] = useState('feature');
  const createTask = useCreateTask();

  const handleSubmit = () => {
    if (!title.trim() || !serviceId.trim()) return;
    createTask.mutate(
      {
        title: title.trim(),
        service_id: serviceId.trim(),
        priority,
        task_type: taskType,
      },
      {
        onSuccess: () => {
          setTitle('');
          setServiceId('');
          setPriority('medium');
          setTaskType('feature');
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
          <DialogDescription>Create a new development task</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Title *</Label>
            <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-service">Service ID *</Label>
            <Input id="task-service" value={serviceId} onChange={(e) => setServiceId(e.target.value)} placeholder="e.g. personal-info" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature">Feature</SelectItem>
                  <SelectItem value="bugfix">Bugfix</SelectItem>
                  <SelectItem value="refactor">Refactor</SelectItem>
                  <SelectItem value="chore">Chore</SelectItem>
                  <SelectItem value="docs">Docs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || !serviceId.trim() || createTask.isPending}>
            {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Activities Tab ───

function ActivitiesTab() {
  const [page, setPage] = useState(1);
  const [serviceId, setServiceId] = useState<string | undefined>();
  const [activityType, setActivityType] = useState<string | undefined>();
  const [source, setSource] = useState<string | undefined>();
  const [unlinkedOnly, setUnlinkedOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [linkTaskId, setLinkTaskId] = useState<string>('');
  const allActivitiesQuery = useActivities(page, 20, { serviceId: serviceId || undefined, activityType: activityType || undefined, source: source || undefined });
  const unlinkedActivitiesQuery = useUnlinkedActivities(page, 20);
  const activeQuery = unlinkedOnly ? unlinkedActivitiesQuery : allActivitiesQuery;
  const bulkLink = useBulkLinkActivities();

  // Fetch tasks for linking dropdown
  const { data: tasksForLink } = useTasks(1, 100);

  const activities = activeQuery.data?.data || [];
  const total = activeQuery.data?.total || 0;
  const isLoading = activeQuery.isLoading;
  const totalPages = Math.ceil(total / 20);

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkLink = () => {
    const taskId = parseInt(linkTaskId);
    if (!taskId || selectedIds.size === 0) return;
    bulkLink.mutate(
      { activity_ids: Array.from(selectedIds), task_id: taskId },
      {
        onSuccess: () => {
          toast.success(`Linked ${selectedIds.size} activities to task`);
          setSelectedIds(new Set());
          setLinkTaskId('');
        },
        onError: () => toast.error('Failed to link activities'),
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={!unlinkedOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setUnlinkedOnly(false); setPage(1); setSelectedIds(new Set()); }}
        >
          All
        </Button>
        <Button
          variant={unlinkedOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setUnlinkedOnly(true); setPage(1); setSelectedIds(new Set()); }}
        >
          <AlertCircle className="h-3.5 w-3.5 mr-1" /> Unlinked
        </Button>

        <Select value={activityType || '__all__'} onValueChange={(v) => { setActivityType(v === '__all__' ? undefined : v); setPage(1); }}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Types</SelectItem>
            <SelectItem value="feature">Feature</SelectItem>
            <SelectItem value="bugfix">Bugfix</SelectItem>
            <SelectItem value="refactor">Refactor</SelectItem>
            <SelectItem value="docs">Docs</SelectItem>
            <SelectItem value="chore">Chore</SelectItem>
          </SelectContent>
        </Select>

        <Select value={source || '__all__'} onValueChange={(v) => { setSource(v === '__all__' ? undefined : v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Sources</SelectItem>
            <SelectItem value="claude_code">Claude Code</SelectItem>
            <SelectItem value="github">GitHub</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>

        <Input
          className="w-48"
          placeholder="Filter by service..."
          value={serviceId || ''}
          onChange={(e) => { setServiceId(e.target.value || undefined); setPage(1); }}
        />
      </div>

      {/* Bulk link controls for unlinked mode */}
      {unlinkedOnly && selectedIds.size > 0 && (
        <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
          <span className="text-sm text-muted-foreground">{selectedIds.size} selected</span>
          <Select value={linkTaskId || '__none__'} onValueChange={(v) => setLinkTaskId(v === '__none__' ? '' : v)}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select task to link..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Select a task...</SelectItem>
              {tasksForLink?.data?.map((t) => (
                <SelectItem key={t.id} value={String(t.id)}>
                  #{t.id} {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={!linkTaskId || bulkLink.isPending}
            onClick={handleBulkLink}
          >
            {bulkLink.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Link2 className="h-3.5 w-3.5 mr-1" />}
            Link Selected
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {activities.map((a) => (
            <ActivityCard
              key={a.id}
              activity={a}
              showCheckbox={unlinkedOnly}
              checked={selectedIds.has(a.id)}
              onCheck={() => toggleSelect(a.id)}
            />
          ))}
          {activities.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No activities found</p>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{total} total</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityCard({ activity: a, showCheckbox, checked, onCheck }: {
  activity: Activity;
  showCheckbox?: boolean;
  checked?: boolean;
  onCheck?: () => void;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between gap-3">
        {showCheckbox && (
          <input
            type="checkbox"
            checked={checked || false}
            onChange={onCheck}
            className="h-4 w-4 rounded border-gray-300 flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-sm truncate">{a.title}</span>
            <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-medium', activityTypeColor(a.activity_type))}>
              {a.activity_type}
            </span>
            <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-medium', sourceColor(a.source))}>
              {a.source}
            </span>
            {!a.task_id && (
              <span className="rounded-md px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                unlinked
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-mono">{a.service_id}</span>
            {a.commit_sha && (
              <span className="flex items-center gap-1 font-mono">
                <GitCommit className="h-3 w-3" />
                {a.commit_sha.substring(0, 7)}
              </span>
            )}
            {a.branch && <span>{a.branch}</span>}
            <span>{formatDateTime(a.created_at)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Sessions Tab ───

function SessionsTab() {
  const [page, setPage] = useState(1);
  const [serviceId, setServiceId] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { data, isLoading } = useSessions(page, 20, { serviceId: serviceId || undefined, status: statusFilter || undefined });

  const sessions = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={statusFilter || '__all__'} onValueChange={(v) => { setStatusFilter(v === '__all__' ? undefined : v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processed">Processed</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>

        <Input
          className="w-48"
          placeholder="Filter by service..."
          value={serviceId || ''}
          onChange={(e) => { setServiceId(e.target.value || undefined); setPage(1); }}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              expanded={expandedId === s.id}
              onToggle={() => setExpandedId(prev => prev === s.id ? null : s.id)}
            />
          ))}
          {sessions.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No sessions found</p>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{total} total</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({ session: s, expanded, onToggle }: {
  session: SessionListItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [detailTab, setDetailTab] = useState<'analysis' | 'conversation'>('analysis');

  // Lazy load full session detail when expanded
  const { data: detail, isLoading: loadingDetail } = useSession(expanded ? s.id : 0);
  const reanalyze = useReanalyzeSession();
  const deleteSession = useDeleteSession();

  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-3 cursor-pointer" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform flex-shrink-0', expanded ? '' : '-rotate-90')} />
            <span className="font-medium text-sm truncate">{s.title || 'Untitled'}</span>
            <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-semibold', statusColor(s.status))}>
              {s.status}
            </span>
            {s.category && (
              <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-medium', categoryColor(s.category))}>
                {s.category}
              </span>
            )}
            {s.is_dev_related && (
              <Badge variant="outline" className="text-xs py-0">dev</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap ml-5">
            <span className="font-mono">{s.service_id}</span>
            {s.message_count != null && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {s.message_count} msg
              </span>
            )}
            {s.duration_seconds != null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(s.duration_seconds)}
              </span>
            )}
            {s.environment && <span>{s.environment}</span>}
            {s.trigger_source && <span>via {s.trigger_source}</span>}
            <span>{formatDateTime(s.created_at)}</span>
          </div>
          {!expanded && s.summary && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 ml-5">{s.summary}</p>
          )}
          {!expanded && s.tags && (s.tags as string[]).length > 0 && (
            <div className="flex items-center gap-1 mt-1 ml-5">
              <Tag className="h-3 w-3 text-muted-foreground" />
              {(s.tags as string[]).map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs py-0">{String(tag)}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expanded session detail */}
      {expanded && (
        <div className="mt-3 ml-5 border-l-4 border-primary/30 pl-4 space-y-3">
          {loadingDetail ? (
            <div className="flex items-center gap-2 py-4"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm text-muted-foreground">Loading session details...</span></div>
          ) : detail ? (
            <>
              {/* Stats row */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                {detail.message_count != null && (
                  <span><MessageSquare className="h-3 w-3 inline mr-1" />Total: {detail.message_count} messages</span>
                )}
                {detail.user_message_count != null && (
                  <span><User className="h-3 w-3 inline mr-1" />User: {detail.user_message_count}</span>
                )}
                {detail.assistant_message_count != null && (
                  <span>Assistant: {detail.assistant_message_count}</span>
                )}
                {detail.duration_seconds != null && (
                  <span><Clock className="h-3 w-3 inline mr-1" />{formatDuration(detail.duration_seconds)}</span>
                )}
                {detail.file_size != null && (
                  <span><File className="h-3 w-3 inline mr-1" />{formatBytes(detail.file_size)}</span>
                )}
              </div>

              {/* Dev purpose */}
              {detail.dev_purpose && (
                <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-2 text-sm text-blue-800 dark:text-blue-200">
                  <span className="font-medium">Purpose:</span> {detail.dev_purpose}
                </div>
              )}

              {/* Tab switch: Analysis / Conversation */}
              <div className="flex gap-1 border-b">
                <button
                  onClick={(e) => { e.stopPropagation(); setDetailTab('analysis'); }}
                  className={cn('px-3 py-1.5 text-xs font-medium border-b-2 -mb-px', detailTab === 'analysis' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}
                >
                  Analysis
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDetailTab('conversation'); }}
                  className={cn('px-3 py-1.5 text-xs font-medium border-b-2 -mb-px', detailTab === 'conversation' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}
                >
                  Conversation
                </button>
              </div>

              {detailTab === 'analysis' && (
                <div className="space-y-3">
                  {/* Topics */}
                  {detail.topics && (detail.topics as Array<Record<string, unknown>>).length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Topics:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(detail.topics as Array<Record<string, unknown>>).map((topic, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {String(topic.title || topic.name || JSON.stringify(topic))}
                            {Array.isArray(topic.tags) && (topic.tags as string[]).map((t, ti) => (
                              <span key={ti} className="ml-1 opacity-60">#{t}</span>
                            ))}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {detail.summary && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Summary:</span>
                      <p className="text-sm mt-1 bg-muted/50 rounded p-3 whitespace-pre-wrap">{detail.summary}</p>
                    </div>
                  )}

                  {/* Decisions */}
                  {detail.decisions && (detail.decisions as unknown[]).length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Decisions:</span>
                      <ul className="mt-1 space-y-1">
                        {(detail.decisions as unknown[]).map((d, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{typeof d === 'string' ? d : JSON.stringify(d)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Files changed */}
                  {detail.files_changed && (detail.files_changed as unknown[]).length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Files Changed ({(detail.files_changed as unknown[]).length}):</span>
                      <div className="mt-1 space-y-0.5 max-h-40 overflow-y-auto">
                        {(detail.files_changed as unknown[]).map((f, i) => (
                          <div key={i} className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                            <File className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{typeof f === 'string' ? f : JSON.stringify(f)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {detail.tags && (detail.tags as string[]).length > 0 && (
                    <div className="flex items-center gap-1">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      {(detail.tags as string[]).map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs py-0">{String(tag)}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'conversation' && (
                <ConversationView conversation={detail.conversation || null} />
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={reanalyze.isPending}
                  onClick={() => {
                    reanalyze.mutate(s.id, {
                      onSuccess: () => toast.success('Session reanalysis started'),
                      onError: () => toast.error('Failed to reanalyze session'),
                    });
                  }}
                >
                  {reanalyze.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RotateCcw className="h-3.5 w-3.5 mr-1" />}
                  Reanalyze
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (!confirm(`Delete session "${s.title || s.session_id}"? This cannot be undone.`)) return;
                    deleteSession.mutate(s.id, {
                      onSuccess: () => toast.success('Session deleted'),
                      onError: () => toast.error('Failed to delete session'),
                    });
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </Card>
  );
}

// ─── Config Backups Tab ───

function BackupsTab() {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { data, isLoading } = useConfigBackups(page, 20);

  const backups = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {backups.map((b) => (
            <BackupCard
              key={b.id}
              backup={b}
              expanded={expandedId === b.id}
              onToggle={() => setExpandedId(prev => prev === b.id ? null : b.id)}
            />
          ))}
          {backups.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No backups found</p>
          )}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{total} total</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function BackupCard({ backup: b, expanded, onToggle }: {
  backup: ConfigBackupListItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const added = Array.isArray(b.files_added) ? b.files_added : [];
  const removed = Array.isArray(b.files_removed) ? b.files_removed : [];
  const modified = Array.isArray(b.files_modified) ? b.files_modified : [];
  const addedCount = added.length;
  const removedCount = removed.length;
  const modifiedCount = modified.length;

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between gap-3 cursor-pointer" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform flex-shrink-0', expanded ? '' : '-rotate-90')} />
            <span className="font-medium text-sm">Backup #{b.id}</span>
            <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-semibold', statusColor(b.status))}>
              {b.status}
            </span>
            <Badge variant="secondary" className="text-xs">{b.trigger}</Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap ml-5">
            <span>{b.file_count} files</span>
            <span>{formatBytes(b.total_size)}</span>
            {b.hostname && <span>{b.hostname}</span>}
            {(addedCount > 0 || removedCount > 0 || modifiedCount > 0) && (
              <span className="flex items-center gap-1.5">
                {addedCount > 0 && <span className="text-green-600">+{addedCount}</span>}
                {removedCount > 0 && <span className="text-red-600">-{removedCount}</span>}
                {modifiedCount > 0 && <span className="text-yellow-600">~{modifiedCount}</span>}
              </span>
            )}
            <span>{formatDateTime(b.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-3 ml-5 border-l-4 border-primary/30 pl-4 space-y-3">
          {/* Metadata */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span><Hash className="h-3 w-3 inline mr-1" />Hash: <span className="font-mono">{b.content_hash.substring(0, 12)}</span></span>
            <span>Trigger: {b.trigger}</span>
            {b.hostname && <span>Host: {b.hostname}</span>}
          </div>

          {/* Files added */}
          {addedCount > 0 && (
            <div>
              <span className="text-xs font-medium text-green-600">Added ({addedCount}):</span>
              <div className="mt-1 space-y-0.5">
                {added.map((f, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs font-mono text-green-700 dark:text-green-400">
                    <Plus className="h-3 w-3" />{String(f)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files removed */}
          {removedCount > 0 && (
            <div>
              <span className="text-xs font-medium text-red-600">Removed ({removedCount}):</span>
              <div className="mt-1 space-y-0.5">
                {removed.map((f, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs font-mono text-red-700 dark:text-red-400">
                    <Trash2 className="h-3 w-3" />{String(f)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files modified */}
          {modifiedCount > 0 && (
            <div>
              <span className="text-xs font-medium text-yellow-600">Modified ({modifiedCount}):</span>
              <div className="mt-1 space-y-0.5">
                {modified.map((f, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs font-mono text-yellow-700 dark:text-yellow-400">
                    <FileText className="h-3 w-3" />{String(f)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {addedCount === 0 && removedCount === 0 && modifiedCount === 0 && (
            <p className="text-xs text-muted-foreground italic">No file changes detected (initial backup or identical)</p>
          )}
        </div>
      )}
    </Card>
  );
}
