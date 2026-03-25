# Spec: 邮件写信 & 草稿箱功能

## 目标

在现有"邮件收件箱"分栏 UI 内集成写邮件和草稿箱功能，无需新增页面或 Tab。

## 后端 API（已部署）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/emails/compose` | 写新邮件（`send=false` 存草稿，`send=true` 立即发送） |
| GET | `/api/v1/emails/drafts` | 草稿箱列表（分页） |
| GET | `/api/v1/emails/drafts/{id}` | 草稿详情 |
| PUT | `/api/v1/emails/drafts/{id}` | 编辑草稿（to, subject, body） |
| DELETE | `/api/v1/emails/drafts/{id}` | 删除草稿 |
| POST | `/api/v1/emails/drafts/{id}/send` | 发送草稿 |

所有端点通过 `msgGwClient`（`/notification-api`）访问。

## 架构决策

- **收件箱内集成**：在现有左右分栏中增强，不新增 Tab
- **紧凑表单式编辑器**：收件人/主题单行排列，正文区域最大化，操作按钮在顶部
- **草稿项黄色高亮**：列表中草稿有黄色左边框 + "草稿" badge + "→ 收件人" 格式

## 变更清单

### 1. Types (`src/types/email.ts`)

修改现有类型：

```typescript
// EmailListItem.direction 扩展（原为 'inbound' | 'outbound'）
direction: 'inbound' | 'outbound' | 'draft';

// EmailListFilters.direction 扩展（原为 'inbound' | 'outbound'）
direction?: 'inbound' | 'outbound' | 'draft';
```

新增类型：

```typescript
// 写邮件请求
interface ComposeEmailInput {
  to: string;
  subject: string;
  body: string;
  send?: boolean; // true=立即发送, false/undefined=存草稿
}

// 草稿更新请求
interface DraftUpdateInput {
  to?: string;
  subject?: string;
  body?: string;
}

// compose API 返回 EmailDetail（direction="draft" 或 "outbound"）
// drafts list 返回 EmailListResponse（items 为 EmailListItem[]，direction="draft"）
// draft detail 返回 EmailDetail（direction="draft"）
// sendDraft 返回 EmailDetail（direction 变为 "outbound"）
// deleteDraft 返回 { status: "deleted" }
```

### 2. API (`src/api/emails.ts`)

在 `emailApi` 对象中新增 6 个方法：

```typescript
compose(data: ComposeEmailInput)        // POST /api/v1/emails/compose
listDrafts(page?: number, size?: number) // GET /api/v1/emails/drafts
getDraft(id: string)                     // GET /api/v1/emails/drafts/{id}
updateDraft(id: string, data: DraftUpdateInput) // PUT /api/v1/emails/drafts/{id}
deleteDraft(id: string)                  // DELETE /api/v1/emails/drafts/{id}
sendDraft(id: string)                    // POST /api/v1/emails/drafts/{id}/send
```

### 3. Hooks (`src/hooks/use-emails.ts`)

新增 query keys：

```typescript
emailKeys.drafts: () => [...emailKeys.all, 'drafts']
emailKeys.draftList: (page, size) => [...emailKeys.drafts(), 'list', page, size]
emailKeys.draftDetail: (id) => [...emailKeys.drafts(), 'detail', id]
```

新增 hooks：

| Hook | 类型 | 用途 |
|------|------|------|
| `useDraftList(page, size)` | Query | 草稿列表 |
| `useDraftDetail(id)` | Query | 草稿详情（加载完整 body） |
| `useCompose()` | Mutation | 写新邮件（存草稿或发送） |
| `useUpdateDraft()` | Mutation | 编辑草稿 |
| `useDeleteDraft()` | Mutation | 删除草稿 |
| `useSendDraft()` | Mutation | 发送草稿 |

缓存失效策略：
- `compose({send:true})` / `sendDraft` → invalidate `drafts` + `emailKeys.lists()` + `emailKeys.stats()`（发件列表和统计变化）
- `compose({send:false})` / `updateDraft` / `deleteDraft` → invalidate `drafts` only

### 4. 新组件：`src/components/email/email-compose.tsx`

紧凑表单式编辑器，用于新邮件和草稿编辑两种场景。

Props：
```typescript
interface EmailComposeProps {
  draftId?: string;          // 有值=编辑草稿模式，无=新邮件模式
  onClose: () => void;       // 关闭编辑器，回到查看模式
}
```

数据加载：
- 新邮件模式（`draftId` 为空）：表单初始为空
- 编辑草稿模式（`draftId` 有值）：组件内部调用 `useDraftDetail(draftId)` 加载完整草稿数据，填充表单

布局（紧凑表单式）：
- 顶部栏：标题（"新邮件" / "编辑草稿"）+ 操作按钮（存草稿 | 发送）
- 收件人行：`收件人` label + Input
- 主题行：`主题` label + Input
- 正文区：flex-1 textarea 最大化
- 底部：删除按钮（仅草稿模式）

行为：
- 新邮件 → `useCompose({ send: false })` 存草稿 / `useCompose({ send: true })` 发送
- 编辑草稿 → `useUpdateDraft()` 保存 / `useSendDraft()` 发送 / `useDeleteDraft()` 删除
- 成功后 toast 提示 + `onClose()`
- ESC 键：`EmailCompose` 内部监听 `keydown`，触发 `onClose()`

### 5. 修改：`src/components/email/email-inbox.tsx`

新增状态：
```typescript
type RightPanelMode = 'view' | 'compose' | 'edit-draft';
const [panelMode, setPanelMode] = useState<RightPanelMode>('view');
const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
```

右侧面板渲染逻辑：
- `panelMode === 'view'` → `<EmailDetail>` （现有）
- `panelMode === 'compose'` → `<EmailCompose onClose={...}>`
- `panelMode === 'edit-draft'` → `<EmailCompose draftId={editingDraftId} ...>`

新增回调传给 EmailList（扩展 EmailListProps）：
- `onCompose: () => void` → 切换到 compose 模式
- `onSelectDraft: (id: string) => void` → 切换到 edit-draft 模式

### 6. 修改：`src/components/email/email-list.tsx`

变更点：
1. **顶部加"写邮件"按钮**：列表标题栏右侧，`PenSquare` 图标 + "写邮件"
2. **Direction 筛选加"草稿"**：`全部 | 收件 | 发件 | 草稿`
3. **草稿模式数据源切换**：direction === 'draft' 时用 `useDraftList` 替代 `useEmailList`
4. **草稿项样式**：黄色左边框 `border-l-3 border-amber-500` + `bg-amber-500/5` + "草稿" badge + "→ 收件人"
5. **点击草稿**：调用 `onSelectDraft(id)` 而非 `onSelect(email)`

## 交互流程

```
1. 点"写邮件" → panelMode='compose' → 右侧显示空编辑器
2. 填写 to/subject/body
   → 点"存草稿" → compose({send:false}) → toast + 关闭
   → 点"发送" → compose({send:true}) → toast + 关闭
3. Direction 选"草稿" → 列表切为草稿列表
4. 点击草稿项 → panelMode='edit-draft' → 右侧显示预填编辑器
   → 可编辑字段 → 点"保存" / "发送" / "删除"
5. ESC / 点非草稿邮件 → panelMode='view' → 回到正常查看模式
```

## 边界情况

- **草稿列表空状态**：显示"暂无草稿"提示
- **编辑中切换**：切换面板时不做未保存提示（V1 简化处理，用户可手动存草稿）

## 不做的事

- 附件上传（后端暂不支持）
- 富文本编辑器（纯文本即可）
- CC/BCC 字段（后端 compose API 暂不支持）
- 邮件模板
- 自动保存草稿 / 定时保存
- 未保存更改提示弹窗（V1 简化）

## 引用上下文

- rules/service-calls.md
- references/service-urls.md
