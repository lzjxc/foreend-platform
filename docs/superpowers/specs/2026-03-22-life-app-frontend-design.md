# Design: Life App Frontend Integration

> Date: 2026-03-22

## 目标

在 foreend-platform 侧边栏新增「生活助手」入口，对接 backend-life-app 的 3 个模块（旅游计划、找房、住宿搜索），提供完整的用户交互。

## 后端服务

- **Service**: `life-app`
- **LAN URL**: `http://192.168.1.191:32009`
- **Proxy prefix**: `/life-api`
- **API base**: `/api/v1`
- **模块**: rental (找房), accommodation (住宿), travel (旅游)

## 页面结构

### 路由设计

```
/life                        → Landing 页（3 模块卡片入口）
/life/travel                 → 旅游计划列表
/life/travel/:planId         → 旅游计划详情（天数切换）
/life/rental                 → 找房（房源列表 + Sheet 搜索）
/life/rental/:propertyId     → 房源详情
/life/accommodation          → 住宿搜索（住宿列表 + Sheet 搜索 + 比较）
/life/accommodation/:id      → 住宿详情
```

### 侧边栏

新增 1 个导航项「生活助手」，图标 `Compass`，路由 `/life`。

## Landing 页 — /life

3 个模块卡片，白底，grid 3 列：

| 卡片 | 图标色 | 描述 | 统计 |
|------|--------|------|------|
| 旅游计划 | `bg-indigo-500` ✈ | AI 生成行程 · 预算估算 | N 个计划 |
| 找房 | `bg-orange-500` 🏠 | Rightmove · 房源搜索追踪 | N 套房源 |
| 住宿搜索 | `bg-green-500` 🏨 | Booking · 比价比较 | N 条记录 |

点击卡片 → 导航到对应子页面。

每个子页面顶部有「← 返回生活助手」面包屑链接。

## 旅游计划模块

### 计划列表 — /life/travel

- 顶部：标题「旅行计划」+ 「+ 新建计划」按钮
- 列表：每个计划一个卡片，显示：
  - 标题（如 "York·Sheffield·Cambridge"）
  - 副标题（日期 · 人数 · 出发城市）
  - 状态标签：`pending` 待处理 / `generating` 生成中 / `searching_accommodation` 搜索住宿 / `completed` 已完成 / `failed` 失败
- 点击卡片 → 进入详情页
- 「+ 新建计划」→ 打开 Sheet 表单

### 新建计划 Sheet

表单字段：
- 标题 (text)
- 出发日期 / 结束日期 (date)
- 出发城市 (text, default "London")
- 途经城市 (tag input, 可添加多个)
- 每城住宿天数 (每个城市一个数字输入)
- 成人数 / 儿童数 (number)
- 儿童年龄 (tag input)
- 交通方式 (select: public_transit / car / coach)
- 偏好：节奏 (select: relaxed / moderate / intensive)
- 兴趣标签 (multi-select)

提交 → `POST /api/v1/travel/plans` → 返回 202 + plan_id → 跳转列表页，显示「生成中...」状态 → 轮询 `GET /api/v1/travel/plans/{id}` 直到完成。

### 计划详情 — /life/travel/:planId

**顶部信息栏**：
- 面包屑「← 返回计划列表」
- 标题
- 摘要行：📅 日期 | 👥 人数 | 🚂 交通 | 💰 预算
- 「导出 Markdown」按钮 → 调用 `GET /api/v1/travel/plans/{id}/export`

**天数切换 Tab**：
- 「概览」tab：交通段表格 + 预算汇总表
- D1/D2/D3... tab：每天的活动时间线

**活动时间线**（每天的内容）：
- 左边框颜色区分类型：
  - 蓝/靛色 `#6366f1` → transport 交通
  - 绿色 `#22c55e` → attraction 景点
  - 橙色 `#f97316` → meal 用餐
  - 紫色 `#8b5cf6` → rest 休闲
- 每行显示：时间 | 名称 | 副信息（类型·价格·时长·亲子评级）
- 浅色背景条与左边框颜色对应

**异步状态处理**：
- `pending`/`generating`/`searching_accommodation` → 显示 loading 状态 + 进度提示
- `failed` → 显示错误信息
- `completed` → 正常渲染

## 找房模块

### 房源列表 — /life/rental

- 顶部：标题「房源列表」+ 「+ 新建搜索」按钮
- 搜索条件标签（灰底）：位置、预算、卧室数
- 房源卡片列表，每个显示：
  - 地址 + 月租（绿色=预算内，橙色=超预算）
  - 房屋类型 · 卧室浴室 · 特征
  - 标签：预算状态、EPC 评级
- 排序：按价格 asc（默认）
- 分页

### 新建搜索 Sheet

表单字段：
- 位置 (text, default "Rotherhithe")
- Location Identifier (text, Rightmove 区域 ID)
- 最高月租 (number, default 2800)
- 最少卧室 (number, default 3)
- 房屋类型 (multi-select: detached / semi-detached / terraced)
- 搜索半径 (number, miles)
- 排除 (multi-select: houseShare)

底部提示「⏳ 搜索约需 1-3 分钟」。

提交 → `POST /api/v1/rental/search` → 202 + search_id → 轮询状态 → 完成后刷新列表。

### 房源详情 — /life/rental/:propertyId

展示完整房源信息：
- 价格（月/周）、地址
- 房屋详情：类型、卧室、浴室、面积、装修状态
- 条款：入住日期、押金、最短租期、Council Tax
- 设施：花园、停车位
- 描述文本、关键特征列表
- 中介信息
- 图片画廊
- 「打开 Rightmove」链接 → `source_url`

## 住宿搜索模块

### 住宿列表 — /life/accommodation

- 顶部：标题「住宿记录」+ 「比较已选 (N)」+ 「+ 新建搜索」
- 搜索条件标签：目的地、日期、人数
- 住宿卡片网格（2 列），每个显示：
  - 勾选框（用于比较）
  - 名称、评分(review_count)、每晚价格、总价
  - 距市中心距离
  - 特征标签（免费取消、含早、WiFi、停车等）
- 排序切换：按价格/评分/距离
- 分页

### 新建搜索 Sheet

表单字段：
- 目的地 (text)
- 入住日期 / 退房日期 (date)
- 成人数 / 儿童数 (number)
- 儿童年龄 (tag input)
- 房间数 (number, default 1)
- 最高总价 (number, optional)
- 排序 (select: price / rating / distance)
- 最低评分 (number, optional)

提交 → `POST /api/v1/accommodation/search` → 202 → 轮询 → 完成后刷新。

### 比较功能

选择 2+ 个住宿 → 点「比较已选」→ 调用 `GET /api/v1/accommodation/compare?ids=uuid1,uuid2` → 弹出 Dialog 或新页面，表格对比：

| 字段 | Hilton York | The Grand |
|------|-------------|-----------|
| 总价 | £240 | £360 |
| 每晚 | £120 | £180 |
| 评分 | 8.5 | 9.1 |
| 厨房 | ❌ | ❌ |
| 免费取消 | ✅ | ✅ |
| 含早 | ✅ | ❌ |

### 住宿详情 — /life/accommodation/:id

完整住宿信息 + 「验证链接」按钮（调用 `POST /verify`）+ 「打开 Booking」链接。

## 文件清单

### 新增文件

| 文件 | 说明 |
|------|------|
| `src/api/life-app.ts` | life-app API 客户端函数 |
| `src/types/life-app.ts` | TypeScript 类型定义 |
| `src/hooks/use-life-app.ts` | React Query hooks（travel/rental/accommodation） |
| `src/pages/life-landing.tsx` | Landing 页（3 模块卡片） |
| `src/pages/life-travel.tsx` | 旅游计划列表 |
| `src/pages/life-travel-detail.tsx` | 旅游计划详情（天数切换） |
| `src/pages/life-rental.tsx` | 找房列表 + Sheet |
| `src/pages/life-rental-detail.tsx` | 房源详情 |
| `src/pages/life-accommodation.tsx` | 住宿列表 + Sheet + 比较 |
| `src/pages/life-accommodation-detail.tsx` | 住宿详情 |

### 修改文件

| 文件 | 变更 |
|------|------|
| `src/api/client.ts` | 新增 `lifeAppClient` |
| `src/App.tsx` | 新增 `/life/*` 路由 |
| `src/components/layout/sidebar.tsx` | 新增「生活助手」导航项 |
| `vite.config.ts` | 新增 `/life-api` 代理 |
| `nginx.conf` | 新增 `/life-api/` 反向代理 |

## 异步搜索轮询模式

旅游计划、找房、住宿搜索都是异步操作。统一轮询模式：

```typescript
// 提交搜索 → 获取 task_id → 轮询结果
const { mutateAsync: createSearch } = useCreateSearch();
const result = await createSearch(params);  // 202 + { id, status: "pending" }

// 轮询 hook（refetchInterval 自动轮询）
const { data } = useSearchResult(result.id, {
  refetchInterval: (data) =>
    data?.status === 'completed' || data?.status === 'failed'
      ? false   // 停止轮询
      : 3000,   // 每 3 秒轮询
});
```

## Overview 卡片

life-app 后端已实现 `/api/v1/overview` 端点（符合统一 Overview API 规范），后续可直接接入 Dashboard 系统运行概览。本次不实现。
