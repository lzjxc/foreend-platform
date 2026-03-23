# Knowledge Hub — Phase 3 前端开发任务

> 交给 Claude Code 的开发任务。请先完整阅读前端项目的 `CLAUDE.md`，再按本文档规划和实现。
> 后端 API 规范见 `TASK-phase3-backend.md`。

## 任务概览

本文档包含三个功能模块，按依赖顺序实现：

| 顺序 | 功能 | 新增页面/入口 |
|------|------|------------|
| 1 | 技术文档导入 | Capture 页新增 Technical Docs tab |
| 2 | 知识复习系统 | 新增 `/knowledge/review` 页面 |
| 3 | 学习计划 | 新增 `/knowledge/plans` 页面 + 改造 Review 页面 |

**技术栈对齐：** React 18 + TypeScript + Tailwind + Radix UI + React Query + Zustand + Framer Motion（遵循项目 CLAUDE.md 规范）

---

# 模块一：技术文档导入

## 背景

Capture 页面现有 Excerpt / Chapter / Book / MCP 四种模式，新增 **Technical Docs** tab，让用户上传离线整理好的技术文档 ZIP 包。

后端接口：
- `POST /api/v1/capture/tech-doc`（multipart，返回 job_id）
- `GET /api/v1/capture/jobs/{job_id}`（轮询进度）

## UI 设计

在 `capture-panel.tsx` tabs 列表末尾追加 `{ id: 'tech_doc', label: 'Technical Docs', icon: BookOpen }`。

Tab 内部按操作步骤线性展示，状态机：

```
idle → file_selected → meta_parsed → submitting → polling → done / error
```

**idle / file_selected：上传区域**

```
┌──────────────────────────────────────────┐
│  📦 上传技术文档包                        │
│  ┌────────────────────────────────────┐  │
│  │   拖放 ZIP 文件到此处               │  │
│  │   或点击选择文件                    │  │
│  └────────────────────────────────────┘  │
│  支持格式：.zip（内含 .md + meta.json）   │
└──────────────────────────────────────────┘
```

**meta_parsed：预览区域**（ZIP 选中后前端自动解析 meta.json，无需上传）

```
┌──────────────────────────────────────────┐
│  ✅ 已解析 meta.json                      │
│  技术栈：Unreal Engine  版本：5.3         │
│  来源：技术文档 › Unreal Engine 官方 › Epic│
│  包含文件：3 个 .md 文件                  │
│    Actor/AActor.md                       │
│    Actor/ACharacter.md                   │
│    Components/UActorComponent.md         │
│                                          │
│                          [开始导入]       │
└──────────────────────────────────────────┘
```

meta.json 缺失时显示错误，按钮 disabled。

**polling：进度**

```
┌──────────────────────────────────────────┐
│  ⚙️ 正在导入...                           │
│  ████████████░░░░░░  2 / 3 文件          │
│  当前：UActorComponent.md  已生成 12 atoms│
└──────────────────────────────────────────┘
```

**done：完成**

```
┌──────────────────────────────────────────┐
│  ✅ 导入完成                              │
│  共生成 18 个知识原子  Unreal Engine 5.3  │
│  [查看导入的 Atoms]   [继续导入]          │
└──────────────────────────────────────────┘
```

"查看导入的 Atoms"跳转到 atoms 列表页，预设 domain 过滤为 meta.json 中的 domain。

## 新增文件

**`src/components/knowledge/tech-doc-upload.tsx`** — 主组件，无 props，内部管理完整状态机

**`src/hooks/use-tech-doc-import.ts`**

```typescript
interface UseTechDocImport {
  submit: (file: File) => Promise<void>
  jobStatus: JobStatus | null   // { status, total_pages, processed_pages, atoms_created }
  isPolling: boolean
  error: string | null
  reset: () => void
}
```

## 关键实现细节

**前端解析 meta.json（用 jszip，无需先上传）：**

```typescript
import JSZip from 'jszip'
const zip = await JSZip.loadAsync(file)
const metaFile = zip.file('meta.json')
if (!metaFile) throw new Error('缺少 meta.json')
const meta = JSON.parse(await metaFile.async('string'))
const mdFiles = Object.keys(zip.files).filter(f => f.endsWith('.md'))
```

- 轮询间隔 2s，收到 `completed` 或 `failed` 时停止
- 组件卸载时清除轮询 timer
- 进度条用 Radix UI `Progress` 组件
- 文件路径列表用等宽字体

## 新增依赖

```bash
npm install jszip          # 如项目无则安装
# react-dropzone 项目应已有，如无则安装
```

## 验收标准

1. Technical Docs tab 正常显示切换
2. 选择 ZIP 后自动解析展示 meta.json 内容
3. meta.json 缺失时报错，按钮禁用
4. 导入中展示实时进度
5. 完成后"查看 Atoms"能跳转到正确筛选结果
6. 失败时有友好提示

---

# 模块二：知识复习系统

## 背景

新增 `/knowledge/review` 页面，实现 AI 出题 → 回答 → 反馈的完整复习流程。卡片按需生成，不预生成。

## 页面结构

路由 `/knowledge/review`，导航加"复习"入口。页面分两个视图：

### 视图一：复习队列

```
┌────────────────────────────────────────────────┐
│  📚 知识复习                                    │
│  [全部] [ue5] [k8s] ...  ← 动态 domain tabs    │
│                                                  │
│  待复习 8   学习中 5   已掌握 12  ← 可点击筛选  │
│                                                  │
│  🔴 AActor - 生命周期管理  ue5 · 未复习  [开始复习] │
│  🟡 AActor - 组件管理  ue5 · 复习中 · 连续2次  [继续] │
│  🟢 AActor - 网络复制  ue5 · 已掌握 · 7天前  [再次] │
│                                                  │
│                          [开始今日复习]          │
└────────────────────────────────────────────────┘
```

状态色：🔴 new，🟡 learning，🟢 mastered

### 视图二：复习卡片（全屏专注模式，隐藏侧边导航）

4个子步骤，Framer Motion `AnimatePresence` 切换：

**步骤1：题目**

```
← 退出         AActor - 生命周期管理    1/8

┌──────────────────────────────────────────┐
│  BeginPlay() 和 PostInitializeComponents │
│  的调用时机有什么区别？                   │
│  💡 提示：思考组件初始化顺序              │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│  输入你的回答...                 [字数]   │
└──────────────────────────────────────────┘

                              [提交回答]
```

**步骤2：加载中**（骨架屏，超 3s 显示"AI 正在思考..."）

**步骤3：反馈**

```
✅ 回答基本正确  （或 ❌ 回答有误）

AI 反馈：...（答错时额外显示正确答案）

─────────────────
你觉得这道题：
[😊 容易]  [😐 还行]  [😓 较难]
```

**步骤4：下一题**

```
连续答对 2 次 🔥  还有 6 道题
[下一题]   [结束本次复习]
```

### 复习结束总结

```
🎉 本次复习完成
复习 8 个  答对 6  答错 2  正确率 75%

新晋掌握：✅ AActor - 网络复制  ✅ AActor - 变换管理
需要加强：❌ AActor - 生命周期管理

[再练一遍错题]   [返回复习列表]
```

## 新增文件

**页面：** `src/pages/knowledge-review.tsx`

**组件：**

```
src/components/knowledge/review/
├── review-queue.tsx          # 队列列表
├── review-stats.tsx          # 统计卡片
├── review-atom-card.tsx      # 单个 atom 卡片
├── review-session.tsx        # 卡片主容器（4步状态机）
├── review-question.tsx       # 步骤1
├── review-feedback.tsx       # 步骤3
├── review-next.tsx           # 步骤4
└── review-summary.tsx        # 结束总结
```

**Hook：** `src/hooks/use-review.ts`

```typescript
const { atoms, stats, isLoading } = useReviewQueue(domain?: string)

const {
  generateCard,    // POST /review/card
  submitAnswer,    // POST /review/answer
  currentCard,     // { session_id, question, question_type, hint }
  feedback,        // { is_correct, feedback, correct_answer, updated_status }
  isGenerating,
  isSubmitting,
} = useReviewSession()
```

## API 对接

```typescript
GET  /api/v1/review/queue?domain=ue5&limit=20
GET  /api/v1/review/stats?domain=ue5
POST /api/v1/review/card    { atom_id }
POST /api/v1/review/answer  { session_id, answer, self_rating: 'easy'|'ok'|'hard' }
```

## 关键交互细节

- 答题框：多行，最小高度 120px，Shift+Enter 换行，Enter 不提交，显示字数，空答案禁止提交
- 自评按钮点击后立即提交，0.5s 后自动进入步骤4
- "再练一遍错题"：取本次答错 atoms 重新进入卡片视图
- domain tabs 从 `GET /review/stats` 动态获取，"全部"始终显示
- 反馈背景色柔和：答对绿色，答错红色（非纯色）

## 验收标准

1. 队列排序正确：new 在前，mastered 在后
2. AI 生成的题目正常展示
3. 提交回答后 AI 反馈展示，答对/答错视觉区分明显
4. 自评后进度正确更新，切换到下一题
5. 复习结束总结数据正确
6. 步骤切换动画流畅，loading 状态无卡顿感

---

# 模块三：学习计划

## 背景

新增 `/knowledge/plans` 页面，同时改造 Review 页面以感知当前计划。

## 新增页面：学习计划

路由 `/knowledge/plans`，导航加"计划"入口与"复习"并列。

### 计划列表视图

```
┌────────────────────────────────────────────────┐
│  🗺️ 学习计划                      [+ 新建计划] │
│                                                  │
│  进行中                                          │
│  Roguelite 游戏开发  ue5                        │
│  ████████████░░░  6/15  创建于2月20日  [继续学习]│
│                                                  │
│  已完成                                          │
│  UE5 基础入门  ████████████████  12/12  [查看]  │
└────────────────────────────────────────────────┘
```

### 创建计划（三步向导，Framer Motion 动画）

**步骤1：描述目标**

```
← 取消

你想学什么？
┌──────────────────────────────────────────┐
│ 我要开发一个 Roguelite 游戏...            │
└──────────────────────────────────────────┘
知识域（可选）[ue5 ▼]   最多条目 [15 ▼]

                            [AI 生成计划 →]
```

**步骤2：审查草稿**（AI 生成期间展示骨架屏）

```
← 重新生成              Roguelite 游戏开发

AI 推荐了 15 个知识点，可拖拽调整顺序

⠿  1  AActor - 生命周期管理
       所有游戏对象的基础...          [移除]
⠿  2  AActor - 组件管理
       添加碰撞、网格组件...          [移除]

⚠️ 程序化地图生成相关文档尚未导入...

[+ 手动添加知识点]

                              [保存计划]
```

**步骤3：保存成功**

```
🎉 计划已创建
Roguelite 游戏开发  15 个知识点

[立即开始学习]   [稍后再说]
```

### 计划详情（路由 `/knowledge/plans/{plan_id}`）

```
← 返回         Roguelite 游戏开发        [归档]

████████████░░░  6/15  40%
目标：我要开发一个 Roguelite 游戏...

✅  1  AActor - 生命周期管理   已掌握
✅  2  AActor - 组件管理       已掌握
🔵  3  APawn - 角色控制        学习中 ●●○
○   4  UCharacterMovement      未开始

                  [继续学习（3个待复习）]
```

状态图标：✅ 已掌握，🔵 学习中（●●○ 表示 correct_streak/3），○ 未开始

## 改造 Review 页面

在 Review 页面队列视图顶部，有 active 计划时显示：

```
当前计划：Roguelite 游戏开发  6/15
[继续计划学习 →]

─────────────────────
自由复习
[全部] [ue5] ...（原有队列）
```

点击"继续计划学习"时调用 `GET /api/v1/plans/{plan_id}/review-queue` 获取队列，其余复习卡片流程完全复用。无 active 计划时不显示此区域。

## 新增文件

**页面：**
```
src/pages/knowledge-plans.tsx
src/pages/knowledge-plan-detail.tsx
```

**组件：**
```
src/components/knowledge/plan/
├── plan-list.tsx
├── plan-card.tsx              # 含进度条
├── plan-create-wizard.tsx     # 三步向导容器
├── plan-goal-input.tsx        # 步骤1
├── plan-draft-review.tsx      # 步骤2，含拖拽排序
├── plan-atom-row.tsx          # 可拖拽的单行 atom
├── plan-missing-alert.tsx     # 知识缺失提示
├── plan-detail.tsx
└── plan-atom-status.tsx       # 状态行（✅🔵○）
```

**Hook：** `src/hooks/use-plans.ts`

```typescript
const { plans, isLoading } = usePlans(status?: 'active' | 'completed' | 'archived')

const { generateDraft, savePlan, draft, isGenerating, isSaving } = useCreatePlan()

const { plan, isLoading } = usePlan(plan_id: string)

const { activePlan } = useActivePlan()  // Review 页面用，缓存5分钟
```

## API 对接

```typescript
GET    /api/v1/plans?status=active
POST   /api/v1/plans/draft          // 生成草稿，不写库
POST   /api/v1/plans
GET    /api/v1/plans/{id}
PUT    /api/v1/plans/{id}
PATCH  /api/v1/plans/{id}/archive
GET    /api/v1/plans/{id}/review-queue
```

## 新增依赖

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
# 如项目已有则跳过
```

## 关键交互细节

**拖拽排序：**
- 拖拽时有视觉占位符，松手后序号自动重新编号
- 移除 atom 有淡出动画

**手动添加知识点：**
- Popover 内嵌搜索框，调用 `GET /api/v1/search?q=xxx&domain=ue5`
- 已在计划中的 atom 显示"已添加"，不可重复
- 点击添加后追加到列表末尾

**生成草稿失败：** 回到步骤1，显示错误 + 重试按钮

## 验收标准

1. 三步创建向导完整，步骤间动画流畅
2. AI 草稿可拖拽调整顺序，移除正常
3. missing_topics 有内容时展示警告
4. 手动添加搜索正常，不能重复添加
5. 保存后进入计划详情或复习
6. Review 页面有 active 计划时显示"继续计划学习"入口
7. 按计划顺序复习流程与自由复习相同
8. 计划详情正确展示每个 atom 的掌握状态
