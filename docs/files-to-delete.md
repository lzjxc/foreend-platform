# 待删除文件清单

## 2026-01-22 - 重复配置文件

- `vite.config.js` - 已有 vite.config.ts，此文件为旧版重复配置

## 2026-01-23 - 菜单重构：移除独立页面

以下页面功能已整合到家庭成员详情页 (`/members/:id`) 中的 Tabs，独立页面可删除：

- `src/pages/documents.tsx` - 证件管理（已整合到成员详情页）
- `src/pages/addresses.tsx` - 地址管理（已整合到成员详情页）
- `src/pages/bank-accounts.tsx` - 银行账户（已整合到成员详情页）
- `src/pages/ai-news.tsx` - AI日报（功能移除）
- `src/components/ai-news/` - AI日报相关组件（整个目录）

路由已改为重定向到 `/members` 或 `/dashboard`
