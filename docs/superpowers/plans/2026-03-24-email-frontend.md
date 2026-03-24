# Email Frontend Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add email management UI (stats overview + inbox with split-pane + reply workflow) to the Message Gateway page.

**Architecture:** Two new tabs in the existing msg-gateway page. Three-layer pattern: types → API layer → React Query hooks → components. Email endpoints return data directly (no `{ success, data }` wrapper unlike other msg-gw endpoints).

**Tech Stack:** React 18, TypeScript, Tailwind CSS, shadcn/ui, React Query, Recharts, DOMPurify, date-fns, Lucide icons, Framer Motion

**Spec:** `docs/superpowers/specs/2026-03-24-email-frontend-design.md`

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/types/email.ts` | Create | TypeScript interfaces for all email API shapes |
| `src/api/emails.ts` | Create | Raw API functions using `msgGwClient` |
| `src/hooks/use-emails.ts` | Create | React Query hooks extending `msgGwKeys` |
| `src/components/email/email-stats.tsx` | Create | Stats cards + trend chart + top senders |
| `src/components/email/email-inbox.tsx` | Create | Split pane container (list + detail) |
| `src/components/email/email-list.tsx` | Create | Left panel: filters + scrollable email list |
| `src/components/email/email-detail.tsx` | Create | Right panel: header + body + reply area |
| `src/components/email/email-settings-dialog.tsx` | Create | Settings modal (whitelist, LLM toggle, quiet hours) |
| `src/pages/msg-gateway.tsx` | Modify | Add 2 TabsTrigger + 2 TabsContent for email tabs |

---

### Task 1: TypeScript Types

**Files:**
- Create: `src/types/email.ts`

- [ ] **Step 1: Create type definitions**

```typescript
// src/types/email.ts

export interface EmailListItem {
  id: string;
  seq: number;
  direction: 'inbound' | 'outbound';
  from_address: string;
  from_name: string | null;
  subject: string | null;
  body_preview: string;
  email_date: string;
  is_important: boolean;
  importance_rule: 'whitelist' | 'llm' | null;
  is_read: boolean;
  reply_status: 'none' | 'draft_pending' | 'confirmed' | 'sent';
  attachments_count: number;
}

export interface EmailDetail extends EmailListItem {
  message_id: string | null;
  to_addresses: string[];
  cc_addresses: string[];
  body_text: string | null;
  body_html: string | null;
  stored_at: string;
  importance_reason: string | null;
  reply_to_id: string | null;
  reply_draft: string | null;
  attachments: EmailAttachment[];
  raw_headers: Record<string, unknown>;
}

export interface EmailAttachment {
  filename: string;
  size: number;
  content_type: string;
}

export interface EmailListResponse {
  items: EmailListItem[];
  total: number;
  page: number;
  size: number;
}

export interface DailyTrend {
  date: string;
  received: number;
  sent: number;
  important: number;
}

export interface TopSender {
  address: string;
  name: string | null;
  count: number;
}

export interface EmailStatsResponse {
  period: string;
  total_received: number;
  total_sent: number;
  important_count: number;
  important_rate: number;
  daily_trend: DailyTrend[];
  top_senders: TopSender[];
}

export interface EmailSettingsResponse {
  whitelist_senders: string[];
  whitelist_domains: string[];
  llm_analysis_enabled: boolean;
  quiet_hours: { start: string; end: string } | null;
}

export interface EmailSettingsUpdate {
  whitelist_senders?: string[];
  whitelist_domains?: string[];
  llm_analysis_enabled?: boolean;
  quiet_hours?: { start: string; end: string } | null;
}

export interface EmailListFilters {
  page?: number;
  size?: number;
  direction?: 'inbound' | 'outbound';
  important?: boolean;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface DraftResponse {
  draft: string;
  to: string;
  subject: string;
}

export interface SendResponse {
  status: string;
  to: string;
  subject: string;
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/types/email.ts
git commit -m "feat(email): add TypeScript type definitions"
```

---

### Task 2: API Layer

**Files:**
- Create: `src/api/emails.ts`

- [ ] **Step 1: Create API functions**

```typescript
// src/api/emails.ts
import { msgGwClient } from './client';
import type {
  EmailListResponse,
  EmailDetail,
  EmailStatsResponse,
  EmailSettingsResponse,
  EmailSettingsUpdate,
  EmailListFilters,
  DraftResponse,
  SendResponse,
} from '@/types/email';

export const emailApi = {
  list: (filters: EmailListFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.page != null) params.set('page', String(filters.page));
    if (filters.size != null) params.set('size', String(filters.size));
    if (filters.direction) params.set('direction', filters.direction);
    if (filters.important !== undefined) params.set('important', String(filters.important));
    if (filters.search) params.set('search', filters.search);
    if (filters.date_from) params.set('date_from', filters.date_from);
    if (filters.date_to) params.set('date_to', filters.date_to);
    const qs = params.toString();
    return msgGwClient.get<EmailListResponse>(`/api/v1/emails${qs ? `?${qs}` : ''}`);
  },

  detail: (id: string) =>
    msgGwClient.get<EmailDetail>(`/api/v1/emails/${id}`),

  markRead: (id: string) =>
    msgGwClient.put<{ status: string }>(`/api/v1/emails/${id}/read`),

  stats: (days = 30) =>
    msgGwClient.get<EmailStatsResponse>(`/api/v1/emails/stats?days=${days}`),

  getSettings: () =>
    msgGwClient.get<EmailSettingsResponse>('/api/v1/emails/settings'),

  updateSettings: (data: EmailSettingsUpdate) =>
    msgGwClient.put<EmailSettingsResponse>('/api/v1/emails/settings', data),

  generateDraft: (id: string, intent: string) =>
    msgGwClient.post<DraftResponse>(`/api/v1/emails/${id}/draft`, { intent }, { timeout: 60000 }),

  sendReply: (id: string, body: string) =>
    msgGwClient.post<SendResponse>(`/api/v1/emails/${id}/send`, { body }),
};
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/api/emails.ts
git commit -m "feat(email): add API layer for email endpoints"
```

---

### Task 3: React Query Hooks

**Files:**
- Create: `src/hooks/use-emails.ts`

- [ ] **Step 1: Create hooks file**

Note: Email endpoints return data directly (no `{ success, data }` wrapper). So unwrap with `.data` only (not `.data.data`).

```typescript
// src/hooks/use-emails.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { msgGwKeys } from './use-msg-gw';
import { emailApi } from '@/api/emails';
import type { EmailListFilters, EmailSettingsUpdate } from '@/types/email';

export const emailKeys = {
  all: [...msgGwKeys.all, 'emails'] as const,
  list: (filters: EmailListFilters) => [...emailKeys.all, 'list', filters] as const,
  detail: (id: string) => [...emailKeys.all, 'detail', id] as const,
  stats: (days: number) => [...emailKeys.all, 'stats', days] as const,
  settings: () => [...emailKeys.all, 'settings'] as const,
};

export function useEmailList(filters: EmailListFilters = {}) {
  return useQuery({
    queryKey: emailKeys.list(filters),
    queryFn: async () => {
      const { data } = await emailApi.list(filters);
      return data;
    },
  });
}

export function useEmailDetail(id: string) {
  return useQuery({
    queryKey: emailKeys.detail(id),
    queryFn: async () => {
      const { data } = await emailApi.detail(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useEmailStats(days = 30) {
  return useQuery({
    queryKey: emailKeys.stats(days),
    queryFn: async () => {
      const { data } = await emailApi.stats(days);
      return data;
    },
  });
}

export function useEmailSettings() {
  return useQuery({
    queryKey: emailKeys.settings(),
    queryFn: async () => {
      const { data } = await emailApi.getSettings();
      return data;
    },
  });
}

export function useUpdateEmailSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: EmailSettingsUpdate) => {
      const { data } = await emailApi.updateSettings(input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: emailKeys.settings() });
    },
  });
}

export function useMarkEmailRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await emailApi.markRead(id);
      return data;
    },
    onMutate: async (id) => {
      // Optimistic: flip is_read in cached list immediately
      await qc.cancelQueries({ queryKey: [...emailKeys.all, 'list'] });
      qc.setQueriesData(
        { queryKey: [...emailKeys.all, 'list'] },
        (old: any) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.map((item: any) =>
              item.id === id ? { ...item, is_read: true } : item
            ),
          };
        }
      );
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: emailKeys.detail(id) });
    },
  });
}

export function useGenerateDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, intent }: { id: string; intent: string }) => {
      const { data } = await emailApi.generateDraft(id, intent);
      return data;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: emailKeys.detail(id) });
      qc.invalidateQueries({ queryKey: [...emailKeys.all, 'list'] });
    },
  });
}

export function useSendReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: string }) => {
      const { data } = await emailApi.sendReply(id, body);
      return data;
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: emailKeys.detail(id) });
      qc.invalidateQueries({ queryKey: [...emailKeys.all, 'list'] });
      qc.invalidateQueries({ queryKey: emailKeys.stats(30) });
    },
  });
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-emails.ts
git commit -m "feat(email): add React Query hooks for email operations"
```

---

### Task 4: Email Stats Component

**Files:**
- Create: `src/components/email/email-stats.tsx`

- [ ] **Step 1: Create stats component**

Reference `src/components/financial/currency-stats.tsx` for Recharts patterns.

```typescript
// src/components/email/email-stats.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Send, Star, TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useEmailStats } from '@/hooks/use-emails';

const PERIOD_OPTIONS = [
  { label: '7天', value: 7 },
  { label: '14天', value: 14 },
  { label: '30天', value: 30 },
];

export function EmailStats() {
  const [days, setDays] = useState(30);
  const { data: stats, isLoading } = useEmailStats(days);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">加载中...</p>;
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          暂无邮件数据
        </CardContent>
      </Card>
    );
  }

  const cards = [
    { title: '收到邮件', value: stats.total_received, icon: Mail, color: 'text-blue-500' },
    { title: '发送邮件', value: stats.total_sent, icon: Send, color: 'text-green-500' },
    { title: '重要邮件', value: stats.important_count, icon: Star, color: 'text-amber-500' },
    { title: '重要率', value: `${(stats.important_rate * 100).toFixed(1)}%`, icon: TrendingUp, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{stats.period}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily Trend Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">每日趋势</CardTitle>
          <div className="flex gap-1">
            {PERIOD_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={days === opt.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDays(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.daily_trend} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorImportant" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip />
              <Area type="monotone" dataKey="received" name="收到" stroke="#3b82f6" fill="url(#colorReceived)" />
              <Area type="monotone" dataKey="sent" name="发送" stroke="#22c55e" fill="url(#colorSent)" />
              <Area type="monotone" dataKey="important" name="重要" stroke="#f59e0b" fill="url(#colorImportant)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Senders */}
      {stats.top_senders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">发件人排行</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.top_senders.map((sender, i) => (
                <div key={sender.address} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{sender.name || sender.address}</p>
                      {sender.name && (
                        <p className="text-xs text-muted-foreground">{sender.address}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium">{sender.count} 封</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/components/email/email-stats.tsx
git commit -m "feat(email): add stats overview component with trend chart"
```

---

### Task 5: Email List Component (Left Panel)

**Files:**
- Create: `src/components/email/email-list.tsx`

- [ ] **Step 1: Create email list component**

```typescript
// src/components/email/email-list.tsx
import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useEmailList } from '@/hooks/use-emails';
import type { EmailListItem, EmailListFilters } from '@/types/email';

const DIRECTIONS = [
  { label: '全部', value: undefined },
  { label: '收件', value: 'inbound' as const },
  { label: '发件', value: 'outbound' as const },
];

const REPLY_STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  draft_pending: { label: '草稿待确认', variant: 'secondary' },
  confirmed: { label: '已确认', variant: 'outline' },
  sent: { label: '已回复', variant: 'default' },
};

interface EmailListProps {
  selectedId: string | null;
  onSelect: (email: EmailListItem) => void;
}

export function EmailList({ selectedId, onSelect }: EmailListProps) {
  const [filters, setFilters] = useState<EmailListFilters>({ page: 1, size: 20 });
  const [searchInput, setSearchInput] = useState('');
  const { data, isLoading } = useEmailList(filters);

  const handleSearch = useCallback(() => {
    setFilters((f) => ({ ...f, search: searchInput || undefined, page: 1 }));
  }, [searchInput]);

  const totalPages = data ? Math.ceil(data.total / (filters.size || 20)) : 0;

  return (
    <div className="flex h-full flex-col">
      {/* Filter bar */}
      <div className="space-y-2 border-b p-3">
        <div className="flex gap-1">
          {DIRECTIONS.map((d) => (
            <Button
              key={d.label}
              variant={filters.direction === d.value ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFilters((f) => ({ ...f, direction: d.value, page: 1 }))}
            >
              {d.label}
            </Button>
          ))}
          <Button
            variant={filters.important ? 'default' : 'ghost'}
            size="sm"
            className="ml-auto h-7 text-xs"
            onClick={() => setFilters((f) => ({ ...f, important: f.important ? undefined : true, page: 1 }))}
          >
            <Star className="mr-1 h-3 w-3" />
            仅重要
          </Button>
        </div>
        <div className="flex gap-1">
          <Input
            placeholder="搜索主题或发件人..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="h-8 text-xs"
          />
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="p-4 text-center text-sm text-muted-foreground">加载中...</p>
        ) : !data?.items.length ? (
          <p className="p-4 text-center text-sm text-muted-foreground">暂无邮件</p>
        ) : (
          data.items.map((email) => (
            <div
              key={email.id}
              onClick={() => onSelect(email)}
              className={cn(
                'cursor-pointer border-b p-3 transition-colors hover:bg-accent/50',
                selectedId === email.id && 'bg-accent',
                !email.is_read && 'bg-accent/20',
              )}
            >
              <div className="flex items-start gap-2">
                <Star
                  className={cn(
                    'mt-0.5 h-4 w-4 flex-shrink-0',
                    email.is_important ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/30',
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn('truncate text-sm', !email.is_read && 'font-semibold')}>
                      {email.from_name || email.from_address}
                    </span>
                    <span className="flex-shrink-0 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(email.email_date), { addSuffix: true, locale: zhCN })}
                    </span>
                  </div>
                  <p className={cn('truncate text-sm', !email.is_read ? 'text-foreground' : 'text-muted-foreground')}>
                    {email.subject || '(无主题)'}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {email.body_preview}
                  </p>
                  {email.reply_status !== 'none' && REPLY_STATUS_LABELS[email.reply_status] && (
                    <Badge variant={REPLY_STATUS_LABELS[email.reply_status].variant} className="mt-1 text-xs">
                      {REPLY_STATUS_LABELS[email.reply_status].label}
                    </Badge>
                  )}
                </div>
                {!email.is_read && (
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-3 py-2">
          <span className="text-xs text-muted-foreground">
            {data?.total ?? 0} 封邮件
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={(filters.page || 1) <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs">
              {filters.page || 1} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={(filters.page || 1) >= totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/components/email/email-list.tsx
git commit -m "feat(email): add email list component with filters and pagination"
```

---

### Task 6: Email Detail Component (Right Panel)

**Files:**
- Create: `src/components/email/email-detail.tsx`

- [ ] **Step 1: Create email detail component**

```typescript
// src/components/email/email-detail.tsx
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Mail, Star, Paperclip, Send, Loader2, X } from 'lucide-react';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';
import { useEmailDetail, useMarkEmailRead, useGenerateDraft, useSendReply } from '@/hooks/use-emails';

interface EmailDetailProps {
  emailId: string | null;
}

const IMPORTANCE_LABELS: Record<string, string> = {
  whitelist: '白名单',
  llm: 'AI 分析',
};

export function EmailDetail({ emailId }: EmailDetailProps) {
  const { data: email, isLoading } = useEmailDetail(emailId || '');
  const markRead = useMarkEmailRead();
  const generateDraft = useGenerateDraft();
  const sendReply = useSendReply();

  const [replyMode, setReplyMode] = useState<'idle' | 'intent' | 'draft'>('idle');
  const [intent, setIntent] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const markedRef = useRef<string | null>(null);

  // Auto mark-as-read (guard against re-calls)
  useEffect(() => {
    if (email && !email.is_read && markedRef.current !== email.id) {
      markedRef.current = email.id;
      markRead.mutate(email.id);
    }
  }, [email?.id, email?.is_read]);

  // Reset reply mode when switching emails
  useEffect(() => {
    setReplyMode('idle');
    setIntent('');
    setDraftBody('');
  }, [emailId]);

  if (!emailId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Mail className="mx-auto mb-2 h-12 w-12 opacity-30" />
          <p>选择一封邮件查看详情</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        邮件未找到
      </div>
    );
  }

  const handleGenerateDraft = async () => {
    if (!intent.trim()) return;
    try {
      const result = await generateDraft.mutateAsync({ id: email.id, intent });
      setDraftBody(result.draft);
      setReplyMode('draft');
    } catch {
      toast.error('生成草稿失败');
    }
  };

  const handleSendReply = async () => {
    if (!draftBody.trim()) return;
    try {
      await sendReply.mutateAsync({ id: email.id, body: draftBody });
      toast.success('回复已发送');
      setReplyMode('idle');
      setIntent('');
      setDraftBody('');
    } catch {
      toast.error('发送失败');
    }
  };

  const sanitizedHtml = email.body_html
    ? DOMPurify.sanitize(email.body_html, { USE_PROFILES: { html: true } })
    : null;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-start gap-2">
          <h2 className="flex-1 text-lg font-semibold">{email.subject || '(无主题)'}</h2>
          {email.is_important && (
            <Badge variant="outline" className="flex-shrink-0 border-amber-500 text-amber-500">
              <Star className="mr-1 h-3 w-3 fill-amber-500" />
              {IMPORTANCE_LABELS[email.importance_rule || ''] || '重要'}
            </Badge>
          )}
        </div>
        {email.is_important && email.importance_reason && (
          <p className="mt-1 text-xs text-muted-foreground">{email.importance_reason}</p>
        )}
        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">{email.from_name || email.from_address}</span>
            {email.from_name && <span className="ml-1">&lt;{email.from_address}&gt;</span>}
          </p>
          <p>收件人: {email.to_addresses.join(', ')}</p>
          {email.cc_addresses.length > 0 && (
            <p>抄送: {email.cc_addresses.join(', ')}</p>
          )}
          <p>{format(new Date(email.email_date), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</p>
        </div>
        {email.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {email.attachments.map((att, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                <Paperclip className="mr-1 h-3 w-3" />
                {att.filename} ({(att.size / 1024).toFixed(0)}KB)
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 p-4">
        {sanitizedHtml ? (
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        ) : (
          <pre className="whitespace-pre-wrap text-sm">{email.body_text}</pre>
        )}
      </div>

      {/* Reply area — only for inbound emails */}
      {email.direction === 'inbound' && (
        <div className="border-t p-4">
          {replyMode === 'idle' && (
            <Button variant="outline" onClick={() => setReplyMode('intent')}>
              <Send className="mr-2 h-4 w-4" />
              回复
            </Button>
          )}

          {replyMode === 'intent' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">简要说明回复意图：</p>
              <div className="flex gap-2">
                <Input
                  placeholder="例如：同意这个方案、请求延期..."
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateDraft()}
                />
                <Button onClick={handleGenerateDraft} disabled={generateDraft.isPending || !intent.trim()}>
                  {generateDraft.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  生成草稿
                </Button>
                <Button variant="ghost" onClick={() => setReplyMode('idle')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {generateDraft.isPending && (
                <p className="text-xs text-muted-foreground">正在生成回复草稿，请稍候...</p>
              )}
            </div>
          )}

          {replyMode === 'draft' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">回复草稿（可编辑）：</p>
              <textarea
                className="min-h-[120px] w-full rounded-md border bg-background p-3 text-sm"
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={handleSendReply} disabled={sendReply.isPending || !draftBody.trim()}>
                  {sendReply.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  确认发送
                </Button>
                <Button variant="ghost" onClick={() => { setReplyMode('idle'); setDraftBody(''); }}>
                  取消
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/components/email/email-detail.tsx
git commit -m "feat(email): add email detail component with reply workflow"
```

---

### Task 7: Email Inbox Container (Split Pane)

**Files:**
- Create: `src/components/email/email-inbox.tsx`

- [ ] **Step 1: Create split pane inbox**

```typescript
// src/components/email/email-inbox.tsx
import { useState } from 'react';
import { EmailList } from './email-list';
import { EmailDetail } from './email-detail';
import type { EmailListItem } from '@/types/email';

export function EmailInbox() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    {/* 220px = header(64) + page padding(48) + tabs bar(40) + tab content margin(16) + settings bar(52) */}
    <div className="flex h-[calc(100vh-220px)] gap-0 overflow-hidden rounded-lg border">
      {/* Left panel: email list */}
      <div className="w-[40%] border-r">
        <EmailList
          selectedId={selectedId}
          onSelect={(email: EmailListItem) => setSelectedId(email.id)}
        />
      </div>
      {/* Right panel: email detail */}
      <div className="w-[60%]">
        <EmailDetail emailId={selectedId} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/components/email/email-inbox.tsx
git commit -m "feat(email): add split-pane inbox container"
```

---

### Task 8: Email Settings Dialog

**Files:**
- Create: `src/components/email/email-settings-dialog.tsx`

- [ ] **Step 1: Create settings dialog**

```typescript
// src/components/email/email-settings-dialog.tsx
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEmailSettings, useUpdateEmailSettings } from '@/hooks/use-emails';

interface EmailSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailSettingsDialog({ open, onOpenChange }: EmailSettingsDialogProps) {
  const { data: settings } = useEmailSettings();
  const updateSettings = useUpdateEmailSettings();

  const [senders, setSenders] = useState<string[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [llmEnabled, setLlmEnabled] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('08:00');
  const [newSender, setNewSender] = useState('');
  const [newDomain, setNewDomain] = useState('');

  useEffect(() => {
    if (settings) {
      setSenders(settings.whitelist_senders);
      setDomains(settings.whitelist_domains);
      setLlmEnabled(settings.llm_analysis_enabled);
      setQuietHoursEnabled(!!settings.quiet_hours);
      if (settings.quiet_hours) {
        setQuietStart(settings.quiet_hours.start);
        setQuietEnd(settings.quiet_hours.end);
      }
    }
  }, [settings]);

  const addSender = () => {
    const v = newSender.trim();
    if (v && !senders.includes(v)) {
      setSenders([...senders, v]);
      setNewSender('');
    }
  };

  const addDomain = () => {
    const v = newDomain.trim();
    if (v && !domains.includes(v)) {
      setDomains([...domains, v]);
      setNewDomain('');
    }
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        whitelist_senders: senders,
        whitelist_domains: domains,
        llm_analysis_enabled: llmEnabled,
        quiet_hours: quietHoursEnabled ? { start: quietStart, end: quietEnd } : null,
      });
      toast.success('设置已保存');
      onOpenChange(false);
    } catch {
      toast.error('保存失败');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>邮件设置</DialogTitle>
          <DialogDescription>管理邮件白名单和分析设置</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Whitelist senders */}
          <div>
            <label className="text-sm font-medium">白名单发件人</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {senders.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1">
                  {s}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSenders(senders.filter((x) => x !== s))}
                  />
                </Badge>
              ))}
            </div>
            <div className="mt-1 flex gap-1">
              <Input
                placeholder="添加发件人邮箱..."
                value={newSender}
                onChange={(e) => setNewSender(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSender()}
                className="h-8 text-sm"
              />
              <Button variant="ghost" size="sm" onClick={addSender}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Whitelist domains */}
          <div>
            <label className="text-sm font-medium">白名单域名</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {domains.map((d) => (
                <Badge key={d} variant="secondary" className="gap-1">
                  {d}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setDomains(domains.filter((x) => x !== d))}
                  />
                </Badge>
              ))}
            </div>
            <div className="mt-1 flex gap-1">
              <Input
                placeholder="添加域名..."
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addDomain()}
                className="h-8 text-sm"
              />
              <Button variant="ghost" size="sm" onClick={addDomain}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* LLM toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">LLM 智能分析</label>
              <p className="text-xs text-muted-foreground">使用 AI 分析邮件重要性</p>
            </div>
            <Button
              variant={llmEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLlmEnabled(!llmEnabled)}
            >
              {llmEnabled ? '已启用' : '已禁用'}
            </Button>
          </div>

          {/* Quiet hours */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">静默时段</label>
                <p className="text-xs text-muted-foreground">在指定时段内不推送重要邮件通知</p>
              </div>
              <Button
                variant={quietHoursEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuietHoursEnabled(!quietHoursEnabled)}
              >
                {quietHoursEnabled ? '已启用' : '已禁用'}
              </Button>
            </div>
            {quietHoursEnabled && (
              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="time"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                  className="h-8 w-28 text-sm"
                />
                <span className="text-sm text-muted-foreground">至</span>
                <Input
                  type="time"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                  className="h-8 w-28 text-sm"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
git add src/components/email/email-settings-dialog.tsx
git commit -m "feat(email): add settings dialog for whitelist and LLM toggle"
```

---

### Task 9: Integrate into Message Gateway Page

**Files:**
- Modify: `src/pages/msg-gateway.tsx` (lines 1-15 imports, lines 1010-1015 tabs, add settings state)

- [ ] **Step 1: Add imports and settings state**

At top of `msg-gateway.tsx`, add imports:
```typescript
import { Settings } from 'lucide-react';
import { EmailStats } from '@/components/email/email-stats';
import { EmailInbox } from '@/components/email/email-inbox';
import { EmailSettingsDialog } from '@/components/email/email-settings-dialog';
```

Inside the component function, add state:
```typescript
const [emailSettingsOpen, setEmailSettingsOpen] = useState(false);
```

- [ ] **Step 2: Add email tabs to TabsList**

In the `<TabsList>` block (around line 1011-1015), add 2 new triggers:

```typescript
<TabsTrigger value="email-stats">邮件概览</TabsTrigger>
<TabsTrigger value="email-inbox">邮件收件箱</TabsTrigger>
```

- [ ] **Step 3: Add email TabsContent blocks**

After the providers `</TabsContent>` (around line 1089), before `</Tabs>`, add:

```tsx
{/* Email Stats Tab */}
<TabsContent value="email-stats">
  <div className="mb-4 flex items-center justify-end">
    <Button variant="ghost" size="sm" onClick={() => setEmailSettingsOpen(true)}>
      <Settings className="mr-1 h-4 w-4" />
      邮件设置
    </Button>
  </div>
  <EmailStats />
</TabsContent>

{/* Email Inbox Tab */}
<TabsContent value="email-inbox">
  <div className="mb-4 flex items-center justify-end">
    <Button variant="ghost" size="sm" onClick={() => setEmailSettingsOpen(true)}>
      <Settings className="mr-1 h-4 w-4" />
      邮件设置
    </Button>
  </div>
  <EmailInbox />
</TabsContent>
```

- [ ] **Step 4: Add settings dialog**

After the existing `<DeleteDialog>` (around line 1119-1125), before the closing `</div>`, add:

```tsx
<EmailSettingsDialog
  open={emailSettingsOpen}
  onOpenChange={setEmailSettingsOpen}
/>
```

- [ ] **Step 5: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 6: Dev server smoke test**

Run: `npm run dev` and verify the page loads without console errors. The 2 new tabs should appear. Data may be empty if the backend has no emails yet — that's fine, verify the empty states render correctly.

- [ ] **Step 7: Commit**

```bash
git add src/pages/msg-gateway.tsx
git commit -m "feat(email): integrate email stats and inbox tabs into msg-gateway page"
```

---

### Task 10: Build Verification

- [ ] **Step 1: Run production build**

Run: `npm run build`
Expected: No errors, build completes successfully.

- [ ] **Step 2: Fix any build errors if found**

- [ ] **Step 3: Final commit if any fixes were needed**
