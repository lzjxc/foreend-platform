# Email Compose & Drafts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add compose-email and drafts-box functionality within the existing email inbox split-pane UI.

**Architecture:** Extend the existing inbox (left list + right detail panel) so the right panel can switch between view mode and compose/edit mode. Drafts appear as a new direction filter in the email list. No new pages or tabs.

**Tech Stack:** React 18, TypeScript, React Query, Tailwind CSS, Radix UI, Lucide icons, Sonner toast

**Spec:** `docs/superpowers/specs/2026-03-25-email-compose-drafts-design.md`

---

### Task 1: Extend types

**Files:**
- Modify: `src/types/email.ts`

- [ ] **Step 1: Widen `direction` union on `EmailListItem` (line 4)**

Replace:
```typescript
direction: 'inbound' | 'outbound';
```
With:
```typescript
direction: 'inbound' | 'outbound' | 'draft';
```

- [ ] **Step 2: Widen `direction` on `EmailListFilters` (line 84)**

Replace:
```typescript
direction?: 'inbound' | 'outbound';
```
With:
```typescript
direction?: 'inbound' | 'outbound' | 'draft';
```

- [ ] **Step 3: Add new types at the end of the file**

Append after `SendResponse` (after line 101):
```typescript
export interface ComposeEmailInput {
  to: string;
  subject: string;
  body: string;
  send?: boolean;
}

export interface DraftUpdateInput {
  to?: string;
  subject?: string;
  body?: string;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/types/email.ts
git commit -m "feat(email): extend types for compose and drafts"
```

---

### Task 2: Add API functions

**Files:**
- Modify: `src/api/emails.ts`

- [ ] **Step 1: Add imports for new types**

Update the import block (line 2-11) to also import `ComposeEmailInput` and `DraftUpdateInput`:
```typescript
import type {
  EmailListResponse,
  EmailDetail,
  EmailStatsResponse,
  EmailSettingsResponse,
  EmailSettingsUpdate,
  EmailListFilters,
  DraftResponse,
  SendResponse,
  ComposeEmailInput,
  DraftUpdateInput,
} from '@/types/email';
```

- [ ] **Step 2: Add 6 new methods to `emailApi` object**

Append inside the `emailApi` object, after the `sendReply` method (after line 46):
```typescript
  compose: (data: ComposeEmailInput) =>
    msgGwClient.post<EmailDetail>('/api/v1/emails/compose', data),

  listDrafts: (page = 1, size = 20) =>
    msgGwClient.get<EmailListResponse>(`/api/v1/emails/drafts?page=${page}&size=${size}`),

  getDraft: (id: string) =>
    msgGwClient.get<EmailDetail>(`/api/v1/emails/drafts/${id}`),

  updateDraft: (id: string, data: DraftUpdateInput) =>
    msgGwClient.put<EmailDetail>(`/api/v1/emails/drafts/${id}`, data),

  deleteDraft: (id: string) =>
    msgGwClient.delete<{ status: string }>(`/api/v1/emails/drafts/${id}`),

  sendDraft: (id: string) =>
    msgGwClient.post<EmailDetail>(`/api/v1/emails/drafts/${id}/send`),
```

- [ ] **Step 3: Commit**

```bash
git add src/api/emails.ts
git commit -m "feat(email): add compose and drafts API functions"
```

---

### Task 3: Add React Query hooks

**Files:**
- Modify: `src/hooks/use-emails.ts`

- [ ] **Step 1: Add imports for new types**

Update import (line 4) to:
```typescript
import type { EmailListFilters, EmailSettingsUpdate, ComposeEmailInput, DraftUpdateInput } from '@/types/email';
```

- [ ] **Step 2: Add draft query keys**

Extend `emailKeys` object (after line 11, before the closing `}`):
```typescript
  drafts: () => [...emailKeys.all, 'drafts'] as const,
  draftList: (page: number, size: number) => [...emailKeys.all, 'drafts', 'list', page, size] as const,
  draftDetail: (id: string) => [...emailKeys.all, 'drafts', 'detail', id] as const,
```

- [ ] **Step 3: Add `useDraftList` hook**

Append after `useEmailSettings` (after line 53):
```typescript
export function useDraftList(page = 1, size = 20) {
  return useQuery({
    queryKey: emailKeys.draftList(page, size),
    queryFn: async () => {
      const { data } = await emailApi.listDrafts(page, size);
      return data;
    },
  });
}

export function useDraftDetail(id: string) {
  return useQuery({
    queryKey: emailKeys.draftDetail(id),
    queryFn: async () => {
      const { data } = await emailApi.getDraft(id);
      return data;
    },
    enabled: !!id,
  });
}
```

- [ ] **Step 4: Add mutation hooks**

Append after the query hooks:
```typescript
export function useCompose() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ComposeEmailInput) => {
      const { data } = await emailApi.compose(input);
      return data;
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: emailKeys.drafts() });
      if (input.send) {
        qc.invalidateQueries({ queryKey: [...emailKeys.all, 'list'] });
        qc.invalidateQueries({ queryKey: [...emailKeys.all, 'stats'] });
      }
    },
  });
}

export function useUpdateDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & DraftUpdateInput) => {
      const { data: result } = await emailApi.updateDraft(id, data);
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: emailKeys.drafts() });
    },
  });
}

export function useDeleteDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await emailApi.deleteDraft(id);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: emailKeys.drafts() });
    },
  });
}

export function useSendDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await emailApi.sendDraft(id);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: emailKeys.drafts() });
      qc.invalidateQueries({ queryKey: [...emailKeys.all, 'list'] });
      qc.invalidateQueries({ queryKey: [...emailKeys.all, 'stats'] });
    },
  });
}
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-emails.ts
git commit -m "feat(email): add draft query and mutation hooks"
```

---

### Task 4: Create `EmailCompose` component

**Files:**
- Create: `src/components/email/email-compose.tsx`

- [ ] **Step 1: Create the compose/edit-draft editor component**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Save, Trash2, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useDraftDetail, useCompose, useUpdateDraft, useDeleteDraft, useSendDraft } from '@/hooks/use-emails';

interface EmailComposeProps {
  draftId?: string;
  onClose: () => void;
}

export function EmailCompose({ draftId, onClose }: EmailComposeProps) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const { data: draft, isLoading: isDraftLoading } = useDraftDetail(draftId || '');
  const compose = useCompose();
  const updateDraft = useUpdateDraft();
  const deleteDraft = useDeleteDraft();
  const sendDraft = useSendDraft();

  // Populate form when draft loads
  useEffect(() => {
    if (draft) {
      setTo(draft.to_addresses?.[0] || '');
      setSubject(draft.subject || '');
      setBody(draft.body_text || '');
    }
  }, [draft]);

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isBusy = compose.isPending || updateDraft.isPending || deleteDraft.isPending || sendDraft.isPending;

  const handleSaveDraft = useCallback(async () => {
    if (!to.trim()) { toast.error('请填写收件人'); return; }
    try {
      if (draftId) {
        await updateDraft.mutateAsync({ id: draftId, to: to.trim(), subject, body });
        toast.success('草稿已保存');
      } else {
        await compose.mutateAsync({ to: to.trim(), subject, body, send: false });
        toast.success('草稿已保存');
      }
      onClose();
    } catch {
      toast.error('保存失败');
    }
  }, [draftId, to, subject, body, compose, updateDraft, onClose]);

  const handleSend = useCallback(async () => {
    if (!to.trim()) { toast.error('请填写收件人'); return; }
    if (!subject.trim()) { toast.error('请填写主题'); return; }
    try {
      if (draftId) {
        // Save changes first, then send
        await updateDraft.mutateAsync({ id: draftId, to: to.trim(), subject, body });
        await sendDraft.mutateAsync(draftId);
      } else {
        await compose.mutateAsync({ to: to.trim(), subject, body, send: true });
      }
      toast.success('邮件已发送');
      onClose();
    } catch {
      toast.error('发送失败');
    }
  }, [draftId, to, subject, body, compose, updateDraft, sendDraft, onClose]);

  const handleDelete = useCallback(async () => {
    if (!draftId) return;
    try {
      await deleteDraft.mutateAsync(draftId);
      toast.success('草稿已删除');
      onClose();
    } catch {
      toast.error('删除失败');
    }
  }, [draftId, deleteDraft, onClose]);

  if (draftId && isDraftLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b p-3">
        <span className="font-semibold">{draftId ? '编辑草稿' : '新邮件'}</span>
        <div className="flex items-center gap-2">
          {draftId && (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isBusy}>
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              删除
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={isBusy}>
            {(compose.isPending || updateDraft.isPending) && !sendDraft.isPending ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1 h-3.5 w-3.5" />
            )}
            存草稿
          </Button>
          <Button size="sm" onClick={handleSend} disabled={isBusy}>
            {sendDraft.isPending ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="mr-1 h-3.5 w-3.5" />
            )}
            发送
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* To field */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <span className="w-10 flex-shrink-0 text-xs text-muted-foreground">收件人</span>
        <Input
          className="h-8 border-0 p-0 text-sm shadow-none focus-visible:ring-0"
          placeholder="email@example.com"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>

      {/* Subject field */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <span className="w-10 flex-shrink-0 text-xs text-muted-foreground">主题</span>
        <Input
          className="h-8 border-0 p-0 text-sm shadow-none focus-visible:ring-0"
          placeholder="邮件主题"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      {/* Body */}
      <textarea
        className="flex-1 resize-none bg-background p-3 text-sm focus:outline-none"
        placeholder="在此输入正文..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/email/email-compose.tsx
git commit -m "feat(email): add EmailCompose component for new mail and draft editing"
```

---

### Task 5: Update `EmailList` — add compose button, draft direction, draft item styling

**Files:**
- Modify: `src/components/email/email-list.tsx`

- [ ] **Step 1: Add imports and extend props**

Add `PenSquare` to lucide imports (line 5):
```typescript
import { Star, Search, ChevronLeft, ChevronRight, X, CalendarDays, PenSquare } from 'lucide-react';
```

Add `useDraftList` import (after line 9):
```typescript
import { useEmailList, useDraftList } from '@/hooks/use-emails';
```

- [ ] **Step 2: Add 'draft' to DIRECTIONS array**

Replace the `DIRECTIONS` constant (lines 12-16):
```typescript
const DIRECTIONS = [
  { label: '全部', value: undefined },
  { label: '收件', value: 'inbound' as const },
  { label: '发件', value: 'outbound' as const },
  { label: '草稿', value: 'draft' as const },
];
```

- [ ] **Step 3: Extend `EmailListProps`**

Replace interface (lines 24-29):
```typescript
interface EmailListProps {
  selectedId: string | null;
  onSelect: (email: EmailListItem) => void;
  onCompose: () => void;
  onSelectDraft: (id: string) => void;
  dateFilter?: string;
  onClearDateFilter?: () => void;
}
```

- [ ] **Step 4: Update component signature and add draft data source**

Replace the function signature and data hooks (lines 31-48):
```typescript
export function EmailList({ selectedId, onSelect, onCompose, onSelectDraft, dateFilter, onClearDateFilter }: EmailListProps) {
  const [filters, setFilters] = useState<EmailListFilters>({ page: 1, size: 20 });
  const [searchInput, setSearchInput] = useState('');

  const isDraftMode = filters.direction === 'draft';

  // Strip 'draft' from filters before passing to useEmailList (backend doesn't support direction=draft on /emails)
  const emailFilters = isDraftMode ? { ...filters, direction: undefined } : filters;

  // Apply external date filter from chart click
  useEffect(() => {
    if (dateFilter) {
      const nextDay = new Date(dateFilter);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];
      setFilters((f) => ({ ...f, date_from: dateFilter, date_to: nextDayStr, page: 1 }));
    } else {
      setFilters((f) => ({ ...f, date_from: undefined, date_to: undefined, page: 1 }));
    }
  }, [dateFilter]);

  // Both hooks always called (React rules), but only one result is used
  const emailQuery = useEmailList(emailFilters);
  const draftQuery = useDraftList(filters.page || 1, filters.size || 20);

  const data = isDraftMode ? draftQuery.data : emailQuery.data;
  const isLoading = isDraftMode ? draftQuery.isLoading : emailQuery.isLoading;
```

- [ ] **Step 5: Add "写邮件" button in the filter bar**

Replace the filter bar `<div className="space-y-2 border-b p-3">` section. Add the compose button as the first child:
```typescript
      <div className="space-y-2 border-b p-3">
        <div className="flex items-center justify-between">
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
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant={filters.important ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFilters((f) => ({ ...f, important: f.important ? undefined : true, page: 1 }))}
            >
              <Star className="mr-1 h-3 w-3" />
              仅重要
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={onCompose}
            >
              <PenSquare className="mr-1 h-3 w-3" />
              写邮件
            </Button>
          </div>
        </div>
```

The search bar and date filter badge remain unchanged below this.

- [ ] **Step 6: Update the email list items to handle draft styling and click**

Replace the email items `map` section (the `data.items.map(...)` block, lines 115-158).

**Important:** `EmailListItem` does NOT have `to_addresses` — only `EmailDetail` does. For drafts, the "草稿" badge is the differentiator; `from_name/from_address` shows the sender account, and subject/body_preview show the content. This is simple and consistent.

```typescript
          data.items.map((email) => {
            const isDraft = email.direction === 'draft';
            return (
              <div
                key={email.id}
                onClick={() => isDraft ? onSelectDraft(email.id) : onSelect(email)}
                className={cn(
                  'cursor-pointer border-b p-3 transition-colors hover:bg-accent/50',
                  selectedId === email.id && 'bg-accent',
                  !email.is_read && !isDraft && 'bg-accent/20',
                  isDraft && 'border-l-[3px] border-l-amber-500 bg-amber-500/5',
                )}
              >
                <div className="flex items-start gap-2">
                  {!isDraft && (
                    <Star
                      className={cn(
                        'mt-0.5 h-4 w-4 flex-shrink-0',
                        email.is_important ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground/30',
                      )}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        {isDraft && (
                          <Badge variant="outline" className="flex-shrink-0 border-amber-500/50 bg-amber-500/10 text-xs text-amber-500">
                            草稿
                          </Badge>
                        )}
                        <span className={cn('truncate text-sm', !email.is_read && !isDraft && 'font-semibold')}>
                          {email.from_name || email.from_address}
                        </span>
                      </div>
                      <span className="flex-shrink-0 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(email.email_date), { addSuffix: true, locale: zhCN })}
                      </span>
                    </div>
                    <p className={cn('truncate text-sm', !email.is_read && !isDraft ? 'text-foreground' : 'text-muted-foreground')}>
                      {email.subject || '(无主题)'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {email.body_preview}
                    </p>
                    {!isDraft && email.reply_status !== 'none' && REPLY_STATUS_MAP[email.reply_status] && (
                      <Badge variant="outline" className={cn('mt-1 text-xs', REPLY_STATUS_MAP[email.reply_status].className)}>
                        {REPLY_STATUS_MAP[email.reply_status].label}
                      </Badge>
                    )}
                  </div>
                  {!isDraft && !email.is_read && (
                    <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                  )}
                </div>
              </div>
            );
          })
```

- [ ] **Step 7: Update empty state text for drafts**

Replace the empty state (line 113):
```typescript
          <p className="p-4 text-center text-sm text-muted-foreground">
            {isDraftMode ? '暂无草稿' : '暂无邮件'}
          </p>
```

- [ ] **Step 8: Update pagination label for drafts**

Replace the count label (line 166):
```typescript
            {data?.total ?? 0} {isDraftMode ? '封草稿' : '封邮件'}
```

- [ ] **Step 9: Commit**

```bash
git add src/components/email/email-list.tsx
git commit -m "feat(email): add compose button, draft filter and draft item styling to list"
```

---

### Task 6: Update `EmailInbox` — panel mode switching

**Files:**
- Modify: `src/components/email/email-inbox.tsx`

- [ ] **Step 1: Replace the entire file**

```typescript
import { useState } from 'react';
import { EmailList } from './email-list';
import { EmailDetail } from './email-detail';
import { EmailCompose } from './email-compose';
import type { EmailListItem } from '@/types/email';

type RightPanelMode = 'view' | 'compose' | 'edit-draft';

interface EmailInboxProps {
  dateFilter?: string;
  onClearDateFilter?: () => void;
}

export function EmailInbox({ dateFilter, onClearDateFilter }: EmailInboxProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<RightPanelMode>('view');
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);

  const handleSelect = (email: EmailListItem) => {
    setSelectedId(email.id);
    setPanelMode('view');
  };

  const handleCompose = () => {
    setPanelMode('compose');
    setEditingDraftId(null);
  };

  const handleSelectDraft = (id: string) => {
    setEditingDraftId(id);
    setPanelMode('edit-draft');
  };

  const handleCloseCompose = () => {
    setPanelMode('view');
    setEditingDraftId(null);
  };

  return (
    <div className="flex h-[calc(100vh-220px)] gap-0 overflow-hidden rounded-lg border">
      {/* Left panel: email list */}
      <div className="w-[40%] border-r">
        <EmailList
          selectedId={panelMode === 'view' ? selectedId : null}
          onSelect={handleSelect}
          onCompose={handleCompose}
          onSelectDraft={handleSelectDraft}
          dateFilter={dateFilter}
          onClearDateFilter={onClearDateFilter}
        />
      </div>
      {/* Right panel: detail or compose */}
      <div className="w-[60%]">
        {panelMode === 'view' && (
          <EmailDetail emailId={selectedId} />
        )}
        {panelMode === 'compose' && (
          <EmailCompose onClose={handleCloseCompose} />
        )}
        {panelMode === 'edit-draft' && editingDraftId && (
          <EmailCompose draftId={editingDraftId} onClose={handleCloseCompose} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/email/email-inbox.tsx
git commit -m "feat(email): add panel mode switching for compose and draft editing"
```

---

### Task 7: Build verification

**Files:** None (verification only)

- [ ] **Step 1: Run TypeScript type check**

```bash
npx tsc --noEmit
```

Expected: No errors. If there are errors, fix them.

- [ ] **Step 2: Run dev build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit any fixes if needed**

---

### Task 8: Deploy and browser verification

- [ ] **Step 1: Build Docker image and push**

Follow project CI/CD pipeline or manual build:
```bash
docker build -t lzjxccode/personal-info-frontend:<commit-hash> .
docker push lzjxccode/personal-info-frontend:<commit-hash>
```

- [ ] **Step 2: Update k8s-argo deployment manifest**

Update the image tag in the k8s-argo repo's deployment yaml for this frontend service.

- [ ] **Step 3: Browser verification with Playwright MCP**

After ArgoCD syncs:
1. Navigate to the msg-gateway page, email inbox tab
2. Verify "写邮件" button appears in the filter bar
3. Click "写邮件" — verify right panel shows compose editor
4. Fill in to/subject/body, click "存草稿" — verify toast "草稿已保存"
5. Click "草稿" direction filter — verify draft appears in list with amber styling
6. Click the draft item — verify right panel shows editor with pre-filled data
7. Click "发送" — verify toast "邮件已发送"
8. Screenshot each step for verification record

## 引用上下文

- docs/superpowers/specs/2026-03-25-email-compose-drafts-design.md
- rules/service-calls.md
- rules/dev-workflow.md
