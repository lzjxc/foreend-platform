# Personal Info Frontend 实施计划

> **创建日期**: 2026-01-20
> **状态**: ✅ 已完成 (2026-01-20)
> **开发策略**: 渐进式 (先 Web 后 Electron)

## 项目概述

开发一个 **个人信息管理系统前端**，用于管理家庭成员敏感信息（证件、地址、银行账户、医疗记录等），支持表单自动填充功能。

**开发策略**: 先完成 Web 版本，后续再添加 Electron 支持
**后端 API**: `http://personal-info.tail2984bd.ts.net` (已部署)

---

## 完成状态

### 已完成任务

- [x] Task 1.1: 项目初始化 - Vite + React + TypeScript
- [x] Task 2.1: API 客户端层 (Axios + 拦截器)
- [x] Task 2.2: TypeScript 类型定义
- [x] Task 2.3: React Query Hooks
- [x] Task 2.4: Zustand 状态管理
- [x] Task 3.1: 基础 UI 组件 (shadcn/ui 风格)
- [x] Task 3.2: 布局组件 (侧边栏/Header)
- [x] Task 4.1: 家庭成员模块
- [x] Task 5.4: 系统资源看板
- [x] Task 5.5: MinIO 文件管理

### 待完成任务 (后续迭代)

- [ ] Task 4.2: 证件管理模块 (完整表单)
- [ ] Task 4.3: 地址管理模块 (完整表单)
- [ ] Task 4.4: 银行账户模块 (完整表单)
- [ ] Task 4.5: 医疗信息模块 (完整表单)
- [ ] Task 5.2: 表单填充功能
- [ ] Task 1.2: Electron 集成

---

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | React | ^18.2.0 |
| 桌面应用 | Electron (后续) | ^28.x |
| 语言 | TypeScript | ^5.x |
| 构建工具 | Vite | ^5.x |
| 样式 | Tailwind CSS | ^3.x |
| UI 组件 | Radix UI (shadcn/ui 风格) | latest |
| 状态管理 | Zustand | ^4.x |
| 数据获取 | React Query | ^5.x |
| 表单 | React Hook Form + Zod | ^7.x / ^3.x |
| 路由 | React Router DOM | ^6.x |
| 图表 | Recharts | ^2.x |
| 流程图 | @xyflow/react (React Flow) | ^12.x |

---

## 项目结构

```
src/
├── api/
│   ├── client.ts        # Axios 实例 + 拦截器
│   └── types.ts         # API 响应类型
├── components/
│   ├── layout/
│   │   ├── main-layout.tsx
│   │   ├── sidebar.tsx
│   │   └── header.tsx
│   ├── members/
│   │   └── member-form.tsx
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       └── skeleton.tsx
├── hooks/
│   ├── use-persons.ts
│   ├── use-documents.ts
│   ├── use-addresses.ts
│   ├── use-contacts.ts
│   ├── use-bank-accounts.ts
│   ├── use-medical.ts
│   ├── use-files.ts
│   ├── use-dashboard.ts
│   └── index.ts
├── pages/
│   ├── dashboard.tsx
│   ├── system-dashboard.tsx
│   ├── members.tsx
│   ├── member-detail.tsx
│   ├── documents.tsx
│   ├── addresses.tsx
│   ├── bank-accounts.tsx
│   ├── medical.tsx
│   ├── files.tsx
│   ├── form-filling.tsx
│   └── settings.tsx
├── stores/
│   ├── ui-store.ts
│   ├── person-store.ts
│   └── index.ts
├── types/
│   ├── person.ts
│   ├── document.ts
│   ├── address.ts
│   ├── contact.ts
│   ├── bank-account.ts
│   ├── medical.ts
│   └── index.ts
├── lib/
│   └── utils.ts
├── App.tsx
├── main.tsx
└── index.css
```

---

## 路由结构

```
/                    → 重定向到 /dashboard
/dashboard           → 仪表盘 (个人信息概览)
/system              → 系统资源看板 (服务状态/用量/架构图)
/members             → 成员列表
/members/:id         → 成员详情
/documents           → 证件管理
/addresses           → 地址管理
/bank-accounts       → 银行账户
/medical             → 医疗信息
/files               → 文件管理 (上传/浏览/删除)
/form-filling        → 表单填充
/settings            → 设置
```

---

## 启动方式

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查
npx tsc --noEmit

# 构建
npm run build
```

---

## 安全注意事项

1. **X-Service-ID**: 所有 API 请求必须携带 `X-Service-ID: personal-info-frontend`
2. **敏感数据脱敏**: 证件号、银行账号默认隐藏，需用户确认后显示
3. **内网访问**: 仅通过 Tailscale 内网访问后端
4. **Electron 安全**: 使用 contextIsolation，禁用 nodeIntegration (后续实现)
