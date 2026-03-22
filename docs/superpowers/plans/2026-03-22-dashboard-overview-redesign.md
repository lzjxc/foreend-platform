# Dashboard Overview Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change dashboard overview grid from 4-column to 2-column layout, add last-activity timestamps to all cards, and make HealthCard dynamic.

**Architecture:** Modify `StatCard` to accept an optional `lastActivityAt` prop displayed in the header. Update each card's hook to return `lastActivityAt`. Change grid CSS from `lg:grid-cols-4` to `lg:grid-cols-2`. Refactor `HealthCard` to receive query statuses from parent.

**Tech Stack:** React, TypeScript, Tailwind CSS, Recharts, TanStack Query

**Spec:** `docs/superpowers/specs/2026-03-22-dashboard-overview-redesign.md`

**Scope:** This plan covers Part 2 (layout + UI changes) only. Part 1 (unified Overview API) is deferred — services will implement the API incrementally, and the frontend will migrate to it later.

---

### Task 1: Update StatCard to show lastActivityAt

**Files:**
- Modify: `src/components/dashboard/system-overview.tsx:93-134` (StatCard component)

- [ ] **Step 1: Add `lastActivityAt` prop to StatCard**

In `system-overview.tsx`, update the `StatCard` function signature and JSX. Add `lastActivityAt?: string | null` to props. Display it in the header row right side (before the dayValue badge):

```typescript
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
```

- [ ] **Step 2: Verify the app still compiles**

Run: `cd E:/projects/coding/python/foreend-platform && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors (existing cards don't pass the prop yet, it's optional)

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/system-overview.tsx
git commit -m "feat(dashboard): add lastActivityAt prop to StatCard"
```

---

### Task 2: Update hooks to return lastActivityAt

**Files:**
- Modify: `src/hooks/use-system-overview.ts:56-72` (useCronSummary)
- Modify: `src/hooks/use-system-overview.ts:76-97` (useKnowledgeStats)
- Modify: `src/hooks/use-system-overview.ts:259-268` (useDevTrackerOverview)

- [ ] **Step 1: Add lastActivityAt to useCronSummary**

In `use-system-overview.ts`, update `useCronSummary` to extract the most recent `startedAt` from workflow items:

```typescript
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
```

Also update the `CronWorkflowItem` interface to include `lastScheduledTime`:

```typescript
interface CronWorkflowItem {
  metadata: { name: string };
  spec: { suspend?: boolean };
  status?: { succeeded?: number; failed?: number; phase?: string; lastScheduledTime?: string };
}
```

- [ ] **Step 2: Add lastActivityAt to useKnowledgeStats**

Update `useKnowledgeStats` to return the most recent atom's `created_at`:

```typescript
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
```

- [ ] **Step 3: Add lastActivityAt to useDevTrackerOverview**

Update `useDevTrackerOverview` — the API already returns data, derive lastActivityAt from it. Use a pragmatic approach: take the current date if `weekly_activities > 0`, otherwise null:

```typescript
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
```

- [ ] **Step 4: Verify compilation**

Run: `cd E:/projects/coding/python/foreend-platform && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-system-overview.ts
git commit -m "feat(dashboard): add lastActivityAt to cron/knowledge/devTracker hooks"
```

---

### Task 3: Wire lastActivityAt into each card component

**Files:**
- Modify: `src/components/dashboard/system-overview.tsx:215-450` (all card components)

- [ ] **Step 1: Update MsgGwCard — pass lastActivityAt**

Already has `data.lastSent`. Add `lastActivityAt={data?.lastSent}` to StatCard. Remove the `StatRow label="最后发送"` line since it's now in the header:

```typescript
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
```

- [ ] **Step 2: Update CronCard — pass lastActivityAt**

```typescript
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
```

- [ ] **Step 3: Update KnowledgeCard — pass lastActivityAt**

Add `lastActivityAt={data?.lastActivityAt}` to StatCard props.

- [ ] **Step 4: Update HomeworkCard — pass lastActivityAt, remove duplicate row**

Already has `data.lastSubmittedAt`. Pass as `lastActivityAt`. Remove the `StatRow label="最近提交"` since it's now in the header:

```typescript
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
```

- [ ] **Step 5: Update DevActivityCard — pass lastActivityAt**

Add `lastActivityAt={data?.lastActivityAt}` to StatCard props.

- [ ] **Step 6: Verify compilation**

Run: `cd E:/projects/coding/python/foreend-platform && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add src/components/dashboard/system-overview.tsx
git commit -m "feat(dashboard): wire lastActivityAt into all card components"
```

---

### Task 4: Change grid layout to 2-column and update HealthCard

**Files:**
- Modify: `src/components/dashboard/system-overview.tsx:427-450` (HealthCard)
- Modify: `src/components/dashboard/system-overview.tsx:454-531` (SystemOverview)

- [ ] **Step 1: Refactor HealthCard to accept dynamic health items**

Add the `HealthItem` interface to the Types section at the top of the file (after `ChartPoint`), then replace the static HealthCard:

```typescript
// Add to Types section (after ChartPoint interface, around line 55)
interface HealthItem {
  name: string;
  status: 'loading' | 'error' | 'success';
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
```

- [ ] **Step 2: Update SystemOverview — collect query statuses and change grid**

Refactor `SystemOverview` to call hooks at the top level, pass results to cards, collect statuses for HealthCard, and change grid to 2-column:

```typescript
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
```

Key changes:
- Grid: `grid-cols-1 sm:grid-cols-2 gap-3` (removed `lg:grid-cols-4`)
- Comment: `2x4 grid` → `4x2 grid`
- Hooks called at top level, statuses collected for HealthCard
- Note: individual card components still call their own hooks for data — the top-level calls are only for health status. This causes duplicate requests but is acceptable since `staleTime: 5min` means React Query deduplicates them automatically (same queryKey).

- [ ] **Step 3: Verify compilation**

Run: `cd E:/projects/coding/python/foreend-platform && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 4: Visual verification**

Run: `cd E:/projects/coding/python/foreend-platform && npm run dev`
Open browser, verify:
- Cards are in 2 columns on desktop
- Each card shows relative time in header (e.g., "7天前")
- HealthCard shows colored dots per service
- Trend charts still work

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/system-overview.tsx
git commit -m "feat(dashboard): 2-column layout + dynamic HealthCard"
```

---

### Task 5: Final cleanup and build verification

**Files:**
- Verify: `src/components/dashboard/system-overview.tsx`
- Verify: `src/hooks/use-system-overview.ts`

- [ ] **Step 1: Run full build**

Run: `cd E:/projects/coding/python/foreend-platform && npm run build 2>&1 | tail -10`
Expected: Build succeeds with no errors

- [ ] **Step 2: Verify no unused imports**

Check that `CheckCircle2` and `XCircle` imports are still used (they are, in CronCard). No imports were removed, so this should be fine.

- [ ] **Step 3: Final commit if any cleanup was needed**

Only commit if changes were made during cleanup.
