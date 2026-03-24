# Spec: Email Frontend Module

## Overview

Add email management UI to the 消息网关 (Message Gateway) page as two new tabs: 邮件概览 (Stats) and 邮件收件箱 (Inbox). Includes full reply workflow (generate draft → edit → send) and settings dialog.

## Navigation

- Location: 消息网关 page (`/msg-gateway`)
- Existing tabs: 提醒任务 | 渠道管理 | Provider 管理
- New tabs: **邮件概览** | **邮件收件箱**
- Settings: gear icon button → Dialog, accessible from either email tab

## Backend API (already deployed)

All endpoints via `msgGwClient` (`/notification-api` proxy).

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/v1/emails` | GET | List with pagination, filter (direction/importance/date), search |
| `/api/v1/emails/{id}` | GET | Full email detail |
| `/api/v1/emails/{id}/read` | PUT | Mark as read |
| `/api/v1/emails/stats?days=N` | GET | Daily trends, top senders, importance rate |
| `/api/v1/emails/settings` | GET | Get whitelist, LLM toggle, quiet hours |
| `/api/v1/emails/settings` | PUT | Update settings (merge semantics) |
| `/api/v1/emails/{id}/draft` | POST | Generate reply draft `{ intent }` → `{ draft, to, subject }` |
| `/api/v1/emails/{id}/send` | POST | Send reply `{ body }` → SMTP send + record |

### Response Format

**Important:** Email endpoints return data directly (no `{ success, data }` wrapper). This differs from the existing msg-gw provider/channel/stats endpoints which use `{ success: boolean; data: T }`. The hooks must NOT unwrap `.data.data` — just `.data`.

### Key Response Shapes

**EmailListResponse (GET /emails):**
```json
{ "items": EmailListItem[], "total": number, "page": number, "size": number }
```

**EmailListItem:** id (UUID), seq (number), direction, from_address, from_name, subject, body_preview (100 chars), email_date (ISO), is_important, importance_rule, is_read, reply_status, attachments_count

**EmailDetail (GET /emails/{id}):** all list fields + message_id, to_addresses (string[]), cc_addresses (string[]), body_text, body_html, stored_at, importance_reason, reply_to_id, reply_draft, attachments ({filename, size, content_type}[]), raw_headers

**EmailStatsResponse (GET /emails/stats):** period, total_received, total_sent, important_count, important_rate (float 0-1), daily_trend[{date, received, sent, important}], top_senders[{address, name, count}]

**EmailSettingsResponse (GET/PUT /emails/settings):** whitelist_senders[], whitelist_domains[], llm_analysis_enabled, quiet_hours

**Draft Response (POST /emails/{id}/draft):** `{ draft: string, to: string, subject: string }`

**Send Response (POST /emails/{id}/send):** `{ status: "sent", to: string, subject: string }`

## Tab 1: 邮件概览 (Email Stats)

### Layout (top to bottom)

1. **Summary Cards Row** — 4 horizontal cards:
   - 收到邮件 (total_received) — blue icon
   - 发送邮件 (total_sent) — green icon
   - 重要邮件 (important_count) — amber icon
   - 重要率 (important_rate) — percentage with color indicator

2. **Daily Trend Chart** — Recharts AreaChart:
   - X axis: date, Y axis: count
   - 3 area lines: received (blue), sent (green), important (amber)
   - Period selector buttons: 7天 | 14天 | 30天 (maps to `?days=` query param)

3. **Top Senders** — ranked list below chart:
   - Top 10 senders with name/address and count
   - Simple horizontal bar or numbered list

## Tab 2: 邮件收件箱 (Email Inbox) — Split Pane

### Left Panel (~40% width) — Email List

**Filter bar:**
- Direction toggle: 全部 | 收件 | 发件
- Importance filter: 全部 | 仅重要
- Search input (debounced, searches subject + from_address)
- Date range picker (collapsed by default, expand on click)

**List items:**
- Importance star (amber if important, gray otherwise)
- Sender name or address (from_name ?? from_address)
- Subject line (single line, truncated)
- Body preview (~60 chars, muted color)
- Relative time ("2分钟前", "3小时前")
- Unread indicator (bold text + blue dot for is_read=false)
- Reply status badge if not 'none' (草稿待确认 / 已发送)
- Selected state: highlighted background

**Pagination:** page controls at bottom of list panel.

### Right Panel (~60% width) — Email Detail

**Empty state:** centered "选择一封邮件查看详情" when no email selected.

**Header area:**
- Subject (large text)
- Importance badge with rule label (whitelist / llm) + importance_reason tooltip
- From address → To/CC addresses
- Formatted timestamp (email_date)
- Attachments list if any (filename, size, content_type)

**Body area:**
- Render body_html via dangerouslySetInnerHTML (sanitize with DOMPurify first — email HTML from external senders may contain scripts)
- Fallback to body_text with whitespace preservation
- Auto mark-as-read: call `PUT /emails/{id}/read` when email is selected (only if is_read=false, with guard against re-calls on same email; use optimistic update to flip is_read in cached list immediately)

**Reply area (bottom):**
- Initial state: "回复" button
- Click → shows intent input: "简要说明回复意图" + "生成草稿" button
- Loading state while LLM generates draft
- Draft generated → shows editable textarea pre-filled with draft
- "确认发送" (primary) and "取消" (ghost) buttons
- After send: success toast, update reply_status in list
- Reply status display: draft_pending (amber), confirmed (blue), sent (green)

## Settings Dialog

Triggered by gear icon button rendered inside the `TabsContent` of each email tab (not in the shared page header). This ensures the gear icon only appears when an email tab is active.

**Form fields:**
- 白名单发件人 — tag input, add/remove email addresses
- 白名单域名 — tag input, add/remove domains
- LLM 智能分析 — toggle switch (llm_analysis_enabled)
- 静默时段 — optional start/end time pickers (quiet_hours)

Save calls `PUT /api/v1/emails/settings` with merge semantics.

## File Structure

| File | Purpose |
|---|---|
| `src/types/email.ts` | TypeScript interfaces matching backend schemas |
| `src/api/emails.ts` | API layer: raw API call functions using `msgGwClient` (matches `api/msg-gw.ts` pattern) |
| `src/hooks/use-emails.ts` | React Query hooks that call `api/emails.ts` functions. Query keys extend `msgGwKeys` with `emails` branch |
| `src/components/email/email-stats.tsx` | Stats cards + trend chart + top senders |
| `src/components/email/email-inbox.tsx` | Split pane container (list + detail) |
| `src/components/email/email-list.tsx` | Left panel: filter bar + scrollable email list |
| `src/components/email/email-detail.tsx` | Right panel: email header + body + reply area |
| `src/components/email/email-settings-dialog.tsx` | Settings modal form |
| `src/pages/msg-gateway.tsx` | Modify: add 2 TabsTrigger + 2 TabsContent |

## Architecture: Three-Layer Pattern

Following the existing msg-gw module pattern (`api/msg-gw.ts` → `hooks/use-msg-gw.ts`):

1. **API layer** (`src/api/emails.ts`): Raw API functions using `msgGwClient`. No `{ success, data }` unwrapping — email endpoints return data directly.
2. **Hooks layer** (`src/hooks/use-emails.ts`): React Query hooks calling API layer. Extends `msgGwKeys` from `use-msg-gw.ts`:
   ```ts
   export const emailKeys = {
     all: [...msgGwKeys.all, 'emails'] as const,
     list: (filters) => [...emailKeys.all, 'list', filters] as const,
     detail: (id) => [...emailKeys.all, 'detail', id] as const,
     stats: (days) => [...emailKeys.all, 'stats', days] as const,
     settings: () => [...emailKeys.all, 'settings'] as const,
   };
   ```
3. **Components**: Import hooks, never call API directly.

## Patterns to Follow

- Three-layer pattern: `api/emails.ts` → `hooks/use-emails.ts` → components (matches `api/msg-gw.ts` → `hooks/use-msg-gw.ts`)
- Query keys extend existing `msgGwKeys` root to share the `['msg-gw']` namespace
- Recharts for charts (already used in finance dashboard)
- Sonner toast for notifications
- shadcn/ui components (Button, Input, Badge, Dialog, Tabs, Select)
- Lucide icons
- date-fns with zhCN locale for date formatting
- Framer Motion for subtle animations (card hover, panel transitions)

## Out of Scope

- Email composition (new emails, not replies) — not supported by backend
- Attachment download/preview — backend stores metadata only
- Drag-and-drop or keyboard shortcuts
- Real-time WebSocket updates — polling or manual refresh only

## Implementation Notes

- **LLM draft timeout:** The `POST /emails/{id}/draft` endpoint calls an LLM and may take 10-30s. The API client for this call should use a longer timeout (e.g. 60s) or the UI should show a clear loading state with a "generating..." message.
- **DOMPurify dependency:** Add `dompurify` + `@types/dompurify` to package.json for HTML sanitization.
