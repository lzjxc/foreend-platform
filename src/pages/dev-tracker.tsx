import { useState } from 'react';
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
  useCreateMilestone,
  useUpdateMilestone,
  useApps,
  useSpecs,
  useAdvanceSpec,
  useRetreatSpec,
  useTasks,
  useCreateTask,
  useUpdateTask,
  useActivities,
  useUnlinkedActivities,
  useSessions,
  useConfigBackups,
  useCompleteMilestone,
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
          <TimelineSessionRow key={session.id} session={session} />
        ))}
        {unlinkedCount > 0 && (
          <div className="flex items-center gap-2 py-2 px-2 text-sm text-amber-600 dark:text-amber-400">
            <span className="bg-amber-100 dark:bg-amber-900 rounded-full h-2 w-2" />
            <span className="font-medium">未归组</span>
            <span className="text-muted-foreground">{unlinkedCount} activities</span>
          </div>
        )}
      </div>

      {sessionCount === 0 && unlinkedCount === 0 && (
        <p className="text-sm text-muted-foreground py-2 italic">no activity</p>
      )}
    </div>
  );
}

function TimelineSessionRow({ session }: { session: TimelineSession }) {
  const commitCount = session.activities.filter(a => a.commit_sha).length;
  const timeStr = formatTime(session.created_at);

  return (
    <div className="flex items-center gap-2 py-2.5 px-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer">
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
  );
}

// ─── Milestones Tab ───

function MilestonesTab() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [showCreate, setShowCreate] = useState(false);
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
            <MilestoneCard key={m.id} milestone={m} onUpdate={updateMilestone.mutate} onComplete={(id) => completeMilestone.mutate(id)} />
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
  onUpdate,
  onComplete,
}: {
  milestone: MilestoneListItem;
  onUpdate: (data: { id: number; status?: string }) => void;
  onComplete?: (id: number) => void;
}) {
  const progress = m.task_count > 0 ? Math.round((m.tasks_done / m.task_count) * 100) : 0;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{m.title}</h3>
            <span className={cn('rounded-md px-2 py-0.5 text-xs font-semibold', statusColor(m.status))}>
              {m.status}
            </span>
          </div>
          {m.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{m.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
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
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
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
  const { data: specsData, isLoading } = useSpecs(1, 100, { phase: phaseFilter || undefined });
  const advanceSpec = useAdvanceSpec();
  const retreatSpec = useRetreatSpec();
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
              onAdvance={() => advanceSpec.mutate(spec.id)}
              onRetreat={() => retreatSpec.mutate(spec.id)}
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
  onAdvance,
  onRetreat,
}: {
  spec: SpecListItem;
  onAdvance: () => void;
  onRetreat: () => void;
}) {
  const progress = spec.task_count > 0 ? Math.round((spec.tasks_done / spec.task_count) * 100) : 0;
  const canAdvance = !['completed', 'cancelled'].includes(spec.phase);
  const canRetreat = !['brainstorming', 'cancelled'].includes(spec.phase);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{spec.title}</h3>
            <span className={cn('rounded-md px-2 py-0.5 text-xs font-semibold', phaseColor(spec.phase))}>
              {spec.phase}
            </span>
          </div>
          {spec.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{spec.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
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
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
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
    </Card>
  );
}

// ─── Tasks Tab ───

function TasksTab() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading } = useTasks(page, 20, { status: statusFilter || undefined, taskType: undefined, serviceId: undefined });
  const updateTask = useUpdateTask();

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
            <TaskCard key={task.id} task={task} onUpdate={updateTask.mutate} />
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
  onUpdate,
}: {
  task: TaskListItem;
  onUpdate: (data: { id: number; status?: string }) => void;
}) {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-sm truncate">{task.title}</span>
            <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-semibold', statusColor(task.status))}>
              {task.status}
            </span>
            <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-semibold', priorityColor(task.priority))}>
              {task.priority}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
        <div className="flex gap-1 flex-shrink-0">
          {task.status === 'todo' && (
            <Button variant="outline" size="sm" onClick={() => onUpdate({ id: task.id, status: 'in_progress' })}>
              Start
            </Button>
          )}
          {task.status === 'in_progress' && (
            <Button variant="outline" size="sm" onClick={() => onUpdate({ id: task.id, status: 'done' })}>
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Done
            </Button>
          )}
          {task.status === 'in_progress' && (
            <Button variant="ghost" size="sm" onClick={() => onUpdate({ id: task.id, status: 'todo' })}>
              Retreat
            </Button>
          )}
        </div>
      </div>
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
  const allActivitiesQuery = useActivities(page, 20, { serviceId: serviceId || undefined, activityType: activityType || undefined, source: source || undefined });
  const unlinkedActivitiesQuery = useUnlinkedActivities(page, 20);
  const activeQuery = unlinkedOnly ? unlinkedActivitiesQuery : allActivitiesQuery;

  const activities = activeQuery.data?.data || [];
  const total = activeQuery.data?.total || 0;
  const isLoading = activeQuery.isLoading;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={!unlinkedOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setUnlinkedOnly(false); setPage(1); }}
        >
          All
        </Button>
        <Button
          variant={unlinkedOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => { setUnlinkedOnly(true); setPage(1); }}
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

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-2">
          {activities.map((a) => (
            <ActivityCard key={a.id} activity={a} />
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

function ActivityCard({ activity: a }: { activity: Activity }) {
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between gap-3">
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
            <SessionCard key={s.id} session={s} />
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

function SessionCard({ session: s }: { session: SessionListItem }) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
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
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
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
          {s.summary && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.summary}</p>
          )}
          {s.tags && (s.tags as string[]).length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Tag className="h-3 w-3 text-muted-foreground" />
              {(s.tags as string[]).map((tag, i) => (
                <Badge key={i} variant="outline" className="text-xs py-0">{String(tag)}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Config Backups Tab ───

function BackupsTab() {
  const [page, setPage] = useState(1);
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
            <BackupCard key={b.id} backup={b} />
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

function BackupCard({ backup: b }: { backup: ConfigBackupListItem }) {
  const added = Array.isArray(b.files_added) ? b.files_added.length : 0;
  const removed = Array.isArray(b.files_removed) ? b.files_removed.length : 0;
  const modified = Array.isArray(b.files_modified) ? b.files_modified.length : 0;

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-sm">Backup #{b.id}</span>
            <span className={cn('rounded-md px-1.5 py-0.5 text-xs font-semibold', statusColor(b.status))}>
              {b.status}
            </span>
            <Badge variant="secondary" className="text-xs">{b.trigger}</Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span>{b.file_count} files</span>
            <span>{formatBytes(b.total_size)}</span>
            {b.hostname && <span>{b.hostname}</span>}
            {(added > 0 || removed > 0 || modified > 0) && (
              <span className="flex items-center gap-1.5">
                {added > 0 && <span className="text-green-600">+{added}</span>}
                {removed > 0 && <span className="text-red-600">-{removed}</span>}
                {modified > 0 && <span className="text-yellow-600">~{modified}</span>}
              </span>
            )}
            <span>{formatDateTime(b.created_at)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
