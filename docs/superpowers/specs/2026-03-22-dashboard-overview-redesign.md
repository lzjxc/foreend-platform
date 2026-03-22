# Design: Dashboard Overview Redesign + Unified Overview API

> Date: 2026-03-22

## 目标

1. Dashboard 系统运行概览布局从 4 列改为 2 列（4 行 x 2 列）
2. 每个卡片增加「最后活动时间」显示
3. 设计统一的 Overview API 接口规范，供所有后端服务实现

## Part 1: 统一 Overview API 规范

### 端点

```
GET /api/v1/overview?days=7
```

### 响应结构

```typescript
interface OverviewResponse {
  service_id: string;              // 服务标识，如 "msg-gw", "knowledge"
  title: string;                   // 显示名称，如 "消息通知"
  icon: string;                    // lucide 图标名，如 "MessageSquare"
  icon_color: string;              // tailwind 颜色，如 "blue", "purple", "orange"

  // 必填：主计数
  total: number;                   // 主数量
  total_label: string;             // 主数量标签，如 "总发送", "原子总数"

  // 必填：最后活动
  last_activity_at: string | null; // ISO 8601 datetime

  // 可选：自定义指标（前端动态渲染）
  metrics: OverviewMetric[];

  // 可选：趋势数据（按天聚合）
  trend: Record<string, number>;   // {"2026-03-15": 2, "2026-03-16": 5}
}

interface OverviewMetric {
  key: string;                     // 唯一标识，如 "channels", "succeeded"
  label: string;                   // 显示标签，如 "渠道数", "成功"
  value: number | string;          // 数值或文本
  type: "count" | "badge";        // count: 普通数值行, badge: 彩色标签
  color?: "green" | "red" | "blue" | "orange" | "default";
}
```

### 各服务映射示例

**消息通知 (msg-gw)**
```json
{
  "service_id": "msg-gw",
  "title": "消息通知",
  "icon": "MessageSquare",
  "icon_color": "blue",
  "total": 6,
  "total_label": "总发送",
  "last_activity_at": "2026-03-15T10:30:00Z",
  "metrics": [
    {"key": "channels", "label": "渠道数", "value": 1, "type": "count"},
    {"key": "failed", "label": "失败", "value": 0, "type": "count", "color": "red"}
  ],
  "trend": {"2026-03-15": 2, "2026-03-16": 1}
}
```

**定时任务 (cron-workflows)**
```json
{
  "service_id": "cron-workflows",
  "title": "定时任务",
  "icon": "Timer",
  "icon_color": "orange",
  "total": 10,
  "total_label": "任务数",
  "last_activity_at": "2026-03-22T09:00:00Z",
  "metrics": [
    {"key": "active", "label": "运行中", "value": 10, "type": "count"},
    {"key": "succeeded", "label": "成功", "value": 4392, "type": "count", "color": "green"},
    {"key": "failed", "label": "失败", "value": 403, "type": "count", "color": "red"}
  ],
  "trend": {"2026-03-21": 35, "2026-03-22": 42}
}
```

**知识库 (knowledge)**
```json
{
  "service_id": "knowledge",
  "title": "知识库",
  "icon": "Brain",
  "icon_color": "purple",
  "total": 59649,
  "total_label": "原子总数",
  "last_activity_at": "2026-03-20T14:00:00Z",
  "metrics": [
    {"key": "learning", "label": "学习", "value": 2, "type": "badge"},
    {"key": "mastered", "label": "掌握", "value": 1, "type": "badge"}
  ],
  "trend": {"2026-03-20": 15, "2026-03-21": 8}
}
```

**作业助手 (homework)**
```json
{
  "service_id": "homework",
  "title": "作业助手",
  "icon": "BookOpen",
  "icon_color": "green",
  "total": 18,
  "total_label": "已提交",
  "last_activity_at": "2026-01-29T10:00:00Z",
  "metrics": [
    {"key": "graded", "label": "已批改", "value": 18, "type": "count"}
  ],
  "trend": {}
}
```

**开发活动 (dev-tracker)**
```json
{
  "service_id": "dev-tracker",
  "title": "开发活动",
  "icon": "Code2",
  "icon_color": "indigo",
  "total": 40,
  "total_label": "本周活动",
  "last_activity_at": "2026-03-22T15:00:00Z",
  "metrics": [
    {"key": "todo", "label": "待办", "value": 3, "type": "badge"},
    {"key": "done", "label": "done", "value": 2, "type": "badge"},
    {"key": "in_progress", "label": "进行", "value": 1, "type": "badge"}
  ],
  "trend": {"2026-03-21": 12, "2026-03-22": 8}
}
```

**Sessions (dev-tracker, 第二张卡)**
```json
{
  "service_id": "dev-tracker-sessions",
  "title": "Sessions",
  "icon": "Monitor",
  "icon_color": "cyan",
  "total": 74,
  "total_label": "总会话",
  "last_activity_at": "2026-03-22T16:00:00Z",
  "metrics": [
    {"key": "completed", "label": "完成", "value": 61, "type": "count"},
    {"key": "user_messages", "label": "用户消息", "value": 6532, "type": "count"}
  ],
  "trend": {}
}
```

**Specs (dev-tracker, 第三张卡)**
```json
{
  "service_id": "dev-tracker-specs",
  "title": "Specs",
  "icon": "FileText",
  "icon_color": "amber",
  "total": 2,
  "total_label": "总数",
  "last_activity_at": null,
  "metrics": [
    {"key": "brainstorming", "label": "头脑风暴", "value": 1, "type": "badge"},
    {"key": "spec_writing", "label": "撰写中", "value": 1, "type": "badge"}
  ],
  "trend": {}
}
```

### metric type 渲染规则

| type | 渲染方式 | 示例 |
|------|---------|------|
| `count` | `StatRow` — 左 label 右 value，可带颜色图标 | 成功: 4,392 (绿色) |
| `badge` | `Badge` 组件 — 紧凑标签 | `[学习 2] [掌握 1]` |

### 多卡片服务

一个服务可能提供多张卡片（如 dev-tracker 提供 3 张）。端点返回数组：

```
GET /api/v1/overview?days=7  →  OverviewResponse[]
```

单卡片服务返回长度为 1 的数组。前端遍历数组渲染所有卡片。

### 设计原则

- **渐进迁移**：前端先保持现有 hooks，后续各服务实现 `/api/v1/overview` 后逐步切换
- **向后兼容**：metrics 为空数组时卡片只显示 total + last_activity_at
- **trend 数据类型**：值为整数（计数），不支持浮点数
- **trend 的 days 参数**：由前端传入（1-90），服务端按天聚合返回
- **metrics 上限**：每张卡片建议不超过 6 个 metrics
- **错误处理**：服务不可用时前端显示卡片级错误状态，不影响其他卡片
- **数字格式化**：大数字由前端 `toLocaleString()` 格式化

### icon_color vs metric.color

两个不同的颜色字段，作用域不同：

- `icon_color`：卡片图标背景色，映射为 `bg-{color}-500`，可选值 `blue | orange | purple | green | indigo | cyan | amber | rose`
- `metric.color`：指标文字颜色，映射为 `text-{color}-500/600`，可选值 `green | red | blue | orange | default`

## Part 2: Dashboard 布局变更

### 布局

从 `lg:grid-cols-4` 改为 `lg:grid-cols-2`：

```
Row 1: 消息通知     | 定时任务
Row 2: 知识库       | 作业助手
Row 3: 开发活动     | Sessions
Row 4: Specs        | 服务健康
```

### 卡片变更

**StatCard 增加 `lastActivityAt` 属性**：

- 在标题行右侧显示相对时间（如 `3天前`）
- 使用 `text-xs text-muted-foreground` 样式
- 为 null 时显示 `-`

**各卡片数据源补充 lastActivityAt**：

| 卡片 | 现有数据 | 新增来源 |
|------|---------|---------|
| 消息通知 | 已有 `lastSent` | 直接复用 |
| 定时任务 | 无 | 从 workflow items 取最新 `startedAt` |
| 知识库 | 无 | 从 atoms 取最新 `created_at` |
| 作业助手 | 已有 `lastSubmittedAt` | 直接复用 |
| 开发活动 | 无 | 从 trend 取最新有数据的日期 |
| Sessions | 无 | 不显示（无明确时间戳） |
| Specs | 无 | 不显示（无明确时间戳） |
| 服务健康 | 无 | 不适用 |

### 服务健康卡片

改为根据各卡片实际请求状态动态渲染：

**机制**：`SystemOverview` 组件收集所有 hook 的 query 状态，传入 `HealthCard`：

```typescript
// SystemOverview 中收集状态
const healthItems = [
  { name: '消息网关', status: msgGwQuery.status },
  { name: '定时任务', status: cronQuery.status },
  // ...
];
<HealthCard items={healthItems} />
```

**渲染**：每个服务显示状态点
- 绿色圆点 = success
- 红色圆点 = error
- 灰色脉冲点 = loading

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/dashboard/system-overview.tsx` | 修改 | 布局 4→2 列, StatCard 增加 lastActivityAt, HealthCard 动态化 |
| `src/hooks/use-system-overview.ts` | 修改 | CronSummary/KnowledgeStats 补充 lastActivityAt 字段 |
| `~/.claude/overview-api-spec.md` | 新增 | 统一 Overview API 接口规范文档 |
