# Personal Info Frontend - Claude Code 开发规范

> 最后更新: 2026-02-07
>
> 本文档为 Claude Code 提供项目开发上下文，确保代码生成符合项目规范。

## 1. 项目概述

### 1.1 项目定位

统一家庭管理前端平台 - 集成个人信息管理、作业助手、单词本、文件管理、系统监控、财务统计、效能评估等多个功能模块。通过 nginx 反向代理对接多个后端微服务，部署在 K8s 集群中。

### 1.2 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| **框架** | React | ^18.2.0 |
| **桌面应用** | Electron | ^28.x |
| **语言** | TypeScript | ^5.x |
| **样式** | Tailwind CSS | ^3.x |
| **UI 组件** | Radix UI | latest |
| **图标** | Lucide React | latest |
| **动画** | Framer Motion | ^11.x |
| **HTTP 客户端** | Axios + React Query | ^1.x / ^5.x |
| **状态管理** | Zustand | ^4.x |
| **表单** | React Hook Form + Zod | ^7.x / ^3.x |
| **路由** | React Router DOM | ^6.x |
| **表格** | TanStack Table | ^8.x |
| **日期** | date-fns | ^3.x |
| **文件上传** | react-dropzone | ^14.x |
| **图表** | Recharts | ^2.10.0 |
| **流程图** | @xyflow/react | ^12.0.0 |
| **Markdown** | React Markdown | ^10.1.0 |
| **Toast** | Sonner | ^1.x |

## 2. 项目结构

```
personal-info-frontend/
├── CLAUDE.md                    # 本文件
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts               # Vite 配置 (React)
├── electron/                    # Electron 主进程
│   ├── main.ts
│   ├── preload.ts
│   └── electron-env.d.ts
├── src/
│   ├── main.tsx                 # React 入口
│   ├── App.tsx                  # 根组件
│   ├── index.css                # Tailwind 入口
│   │
│   ├── api/                     # API 客户端层
│   │   ├── client.ts            # Axios 实例配置
│   │   ├── members.ts           # 家庭成员 API
│   │   ├── documents.ts         # 证件 API
│   │   ├── addresses.ts         # 地址 API
│   │   ├── contacts.ts          # 联系方式 API
│   │   ├── bank-accounts.ts     # 银行账户 API
│   │   ├── medical.ts           # 医疗信息 API
│   │   ├── templates.ts         # 表单模板 API
│   │   └── form-filling.ts      # 表单填充 API
│   │
│   ├── hooks/                   # 自定义 Hooks
│   │   ├── use-members.ts       # 家庭成员 CRUD hooks
│   │   ├── use-documents.ts     # 证件管理 hooks
│   │   ├── use-addresses.ts
│   │   ├── use-form-filling.ts
│   │   └── use-auth.ts          # 认证状态
│   │
│   ├── stores/                  # Zustand 状态
│   │   ├── auth-store.ts        # 认证状态
│   │   ├── member-store.ts      # 当前选中成员
│   │   └── ui-store.ts          # UI 状态 (侧边栏、主题等)
│   │
│   ├── components/              # UI 组件
│   │   ├── ui/                  # 基础 UI 组件 (shadcn/ui 风格)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   ├── layout/              # 布局组件
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── main-layout.tsx
│   │   ├── members/             # 家庭成员相关
│   │   │   ├── member-list.tsx
│   │   │   ├── member-card.tsx
│   │   │   ├── member-form.tsx
│   │   │   └── member-avatar.tsx
│   │   ├── documents/           # 证件管理
│   │   │   ├── document-list.tsx
│   │   │   ├── document-form.tsx
│   │   │   └── document-card.tsx
│   │   ├── addresses/           # 地址管理
│   │   ├── bank-accounts/       # 银行账户
│   │   ├── medical/             # 医疗信息
│   │   ├── financial/           # 财务组件
│   │   │   ├── currency-stats.tsx     # 货币统计 (收支/趋势图)
│   │   │   └── financial-trends.tsx   # 金融数据趋势 (汇率/金价)
│   │   └── form-filling/        # 表单填充
│   │       ├── template-selector.tsx
│   │       ├── field-mapper.tsx
│   │       └── preview-modal.tsx
│   │
│   ├── pages/                   # 页面组件
│   │   ├── dashboard.tsx        # 仪表盘
│   │   ├── members/
│   │   │   ├── index.tsx        # 成员列表
│   │   │   └── [id].tsx         # 成员详情
│   │   ├── documents.tsx        # 证件管理
│   │   ├── addresses.tsx        # 地址管理
│   │   ├── bank-accounts.tsx    # 银行账户
│   │   ├── medical.tsx          # 医疗记录
│   │   ├── form-filling.tsx     # 表单填充
│   │   └── settings.tsx         # 设置
│   │
│   ├── lib/                     # 工具函数
│   │   ├── utils.ts             # 通用工具 (cn, formatDate 等)
│   │   ├── constants.ts         # 常量定义
│   │   └── validators.ts        # Zod schemas
│   │
│   └── types/                   # TypeScript 类型
│       ├── api.ts               # API 响应类型
│       ├── member.ts            # 成员相关类型
│       ├── document.ts          # 证件类型
│       └── index.ts             # 类型导出
│
└── tests/                       # 测试文件
    ├── setup.ts
    └── components/
```

## 3. 后端 API 对接

### 3.1 API 基础配置

后端服务地址（开发环境通过 Tailscale 访问）：

```typescript
// src/api/client.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL 
  || 'http://personal-info.tail2984bd.ts.net';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Service-ID': 'personal-info-frontend',  // 必需：权限控制
  },
});

// 请求拦截器
apiClient.interceptors.request.use((config) => {
  // 可在此添加 token 等
  return config;
});

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 统一错误处理
    if (error.response?.status === 403) {
      // 权限不足
    }
    return Promise.reject(error);
  }
);
```

### 3.2 API 端点清单

| 模块 | 端点 | 方法 | 说明 |
|------|------|------|------|
| **家庭成员** | `/api/v1/persons` | GET | 列出所有成员 |
| | `/api/v1/persons` | POST | 创建成员 |
| | `/api/v1/persons/{id}` | GET | 获取详情 |
| | `/api/v1/persons/{id}` | PUT | 更新成员 |
| | `/api/v1/persons/{id}` | DELETE | 删除成员 |
| **证件** | `/api/v1/persons/{id}/documents` | GET/POST | 证件列表/创建 |
| | `/api/v1/persons/{id}/documents/{doc_id}` | GET/PUT/DELETE | 证件 CRUD |
| **地址** | `/api/v1/persons/{id}/addresses` | GET/POST | 地址管理 |
| **联系方式** | `/api/v1/persons/{id}/contacts` | GET/POST | 联系方式 |
| **银行账户** | `/api/v1/persons/{id}/bank-accounts` | GET/POST | 银行账户 |
| **医疗信息** | `/api/v1/persons/{id}/medical` | GET/POST | 医疗记录 |
| **表单模板** | `/api/v1/templates` | GET | 模板列表 |
| | `/api/v1/templates/{id}/fill` | POST | 填充表单 |
| **审计日志** | `/api/v1/audit/logs` | GET | 审计日志 |
| **健康检查** | `/health` | GET | 服务状态 |

### 3.3 React Query Hooks 示例

```typescript
// src/hooks/use-members.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { Member, CreateMemberInput } from '@/types/member';

export const memberKeys = {
  all: ['members'] as const,
  lists: () => [...memberKeys.all, 'list'] as const,
  detail: (id: string) => [...memberKeys.all, 'detail', id] as const,
};

export function useMembers() {
  return useQuery({
    queryKey: memberKeys.lists(),
    queryFn: async () => {
      const { data } = await apiClient.get<Member[]>('/api/v1/persons');
      return data;
    },
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: memberKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiClient.get<Member>(`/api/v1/persons/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateMemberInput) => {
      const { data } = await apiClient.post<Member>('/api/v1/persons', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<CreateMemberInput>) => {
      const { data } = await apiClient.put<Member>(`/api/v1/persons/${id}`, input);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/v1/persons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
    },
  });
}
```

## 4. 类型定义

### 4.1 核心类型

```typescript
// src/types/member.ts
export interface Member {
  id: string;
  name: string;
  name_pinyin?: string;
  relation: 'self' | 'spouse' | 'child' | 'parent' | 'other';
  gender: 'male' | 'female';
  birth_date?: string;  // ISO date
  nationality?: string;
  ethnicity?: string;
  avatar_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMemberInput {
  name: string;
  name_pinyin?: string;
  relation: Member['relation'];
  gender: Member['gender'];
  birth_date?: string;
  nationality?: string;
  ethnicity?: string;
  notes?: string;
}

// src/types/document.ts
export type DocumentType = 
  | 'id_card'           // 身份证
  | 'passport'          // 护照
  | 'birth_certificate' // 出生证明
  | 'household_register'// 户口本
  | 'marriage_cert'     // 结婚证
  | 'driver_license'    // 驾驶证
  | 'other';

export interface Document {
  id: string;
  person_id: string;
  type: DocumentType;
  number: string;         // 证件号码 (加密存储)
  issue_date?: string;
  expiry_date?: string;
  issuing_authority?: string;
  attachments?: string[]; // 附件 URL
  created_at: string;
  updated_at: string;
}

// src/types/address.ts
export interface Address {
  id: string;
  person_id: string;
  type: 'residence' | 'household' | 'work' | 'mailing' | 'other';
  country: string;
  province?: string;
  city?: string;
  district?: string;
  street?: string;
  postal_code?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

// src/types/bank-account.ts
export interface BankAccount {
  id: string;
  person_id: string;
  bank_name: string;
  account_number: string;  // 加密存储
  account_holder: string;
  branch?: string;
  swift_code?: string;
  is_primary: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

## 5. 组件规范

### 5.1 基础组件 (shadcn/ui 风格)

使用 Radix UI 原语 + Tailwind CSS 构建，遵循 shadcn/ui 设计模式：

```typescript
// src/components/ui/button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

### 5.2 业务组件示例

```typescript
// src/components/members/member-card.tsx
import { motion } from 'framer-motion';
import { User, Calendar, FileText, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Member } from '@/types/member';
import { formatDate } from '@/lib/utils';

interface MemberCardProps {
  member: Member;
  onEdit?: (member: Member) => void;
  onDelete?: (id: string) => void;
  onClick?: (member: Member) => void;
}

export function MemberCard({ member, onEdit, onDelete, onClick }: MemberCardProps) {
  const relationLabels: Record<Member['relation'], string> = {
    self: '本人',
    spouse: '配偶',
    child: '子女',
    parent: '父母',
    other: '其他',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="rounded-lg border bg-card p-4 shadow-sm cursor-pointer"
      onClick={() => onClick?.(member)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt={member.name}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <h3 className="font-semibold">{member.name}</h3>
            <p className="text-sm text-muted-foreground">
              {relationLabels[member.relation]}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit?.(member)}>
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete?.(member.id)}
            >
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {member.birth_date && (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(member.birth_date)}</span>
        </div>
      )}
    </motion.div>
  );
}
```

### 5.3 表单组件示例

```typescript
// src/components/members/member-form.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const memberSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  name_pinyin: z.string().optional(),
  relation: z.enum(['self', 'spouse', 'child', 'parent', 'other']),
  gender: z.enum(['male', 'female']),
  birth_date: z.string().optional(),
  nationality: z.string().optional(),
  ethnicity: z.string().optional(),
  notes: z.string().optional(),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberFormProps {
  defaultValues?: Partial<MemberFormData>;
  onSubmit: (data: MemberFormData) => void;
  isLoading?: boolean;
}

export function MemberForm({ defaultValues, onSubmit, isLoading }: MemberFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      relation: 'self',
      gender: 'male',
      nationality: '中国',
      ethnicity: '汉族',
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">姓名 *</Label>
          <Input id="name" {...register('name')} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name_pinyin">拼音</Label>
          <Input id="name_pinyin" {...register('name_pinyin')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>关系 *</Label>
          <Select
            value={watch('relation')}
            onValueChange={(value) => setValue('relation', value as MemberFormData['relation'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="self">本人</SelectItem>
              <SelectItem value="spouse">配偶</SelectItem>
              <SelectItem value="child">子女</SelectItem>
              <SelectItem value="parent">父母</SelectItem>
              <SelectItem value="other">其他</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>性别 *</Label>
          <Select
            value={watch('gender')}
            onValueChange={(value) => setValue('gender', value as MemberFormData['gender'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">男</SelectItem>
              <SelectItem value="female">女</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="birth_date">出生日期</Label>
        <Input id="birth_date" type="date" {...register('birth_date')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nationality">国籍</Label>
          <Input id="nationality" {...register('nationality')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ethnicity">民族</Label>
          <Input id="ethnicity" {...register('ethnicity')} />
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? '保存中...' : '保存'}
      </Button>
    </form>
  );
}
```

## 6. 状态管理

### 6.1 Zustand Store

```typescript
// src/stores/auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  serviceId: string;
  isAuthenticated: boolean;
  setServiceId: (id: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      serviceId: 'personal-info-frontend',
      isAuthenticated: true,  // 内网默认已认证
      setServiceId: (serviceId) => set({ serviceId }),
      logout: () => set({ isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

// src/stores/member-store.ts
import { create } from 'zustand';
import type { Member } from '@/types/member';

interface MemberState {
  selectedMember: Member | null;
  setSelectedMember: (member: Member | null) => void;
}

export const useMemberStore = create<MemberState>((set) => ({
  selectedMember: null,
  setSelectedMember: (member) => set({ selectedMember: member }),
}));
```

## 7. 路由配置

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { MainLayout } from '@/components/layout/main-layout';
import Dashboard from '@/pages/dashboard';
import MemberList from '@/pages/members';
import MemberDetail from '@/pages/members/[id]';
import Documents from '@/pages/documents';
import Addresses from '@/pages/addresses';
import BankAccounts from '@/pages/bank-accounts';
import Medical from '@/pages/medical';
import FormFilling from '@/pages/form-filling';
import Settings from '@/pages/settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 分钟
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/members" element={<MemberList />} />
            <Route path="/members/:id" element={<MemberDetail />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/addresses" element={<Addresses />} />
            <Route path="/bank-accounts" element={<BankAccounts />} />
            <Route path="/medical" element={<Medical />} />
            <Route path="/form-filling" element={<FormFilling />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}

export default App;
```

## 8. Electron 配置

### 8.1 主进程

```typescript
// electron/main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import Store from 'electron-store';

const store = new Store();

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hiddenInset',  // macOS
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle('store:get', (_, key) => store.get(key));
ipcMain.handle('store:set', (_, key, value) => store.set(key, value));
```

### 8.2 Preload 脚本

```typescript
// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('store:set', key, value),
  },
});
```

## 9. 工具函数

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, formatStr = 'yyyy-MM-dd') {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: zhCN });
}

export function formatDateTime(date: string | Date) {
  return formatDate(date, 'yyyy-MM-dd HH:mm');
}

export function maskIdNumber(idNumber: string): string {
  if (idNumber.length <= 8) return idNumber;
  return idNumber.slice(0, 4) + '****' + idNumber.slice(-4);
}

export function maskBankAccount(account: string): string {
  if (account.length <= 8) return account;
  return '**** **** **** ' + account.slice(-4);
}
```

## 10. 环境变量

```bash
# .env.development
VITE_API_URL=http://personal-info.tail2984bd.ts.net
VITE_SERVICE_ID=personal-info-frontend

# .env.production
VITE_API_URL=http://personal-info-service.personal.svc.cluster.local:8000
VITE_SERVICE_ID=personal-info-frontend
```

## 11. 开发规范

### 11.1 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件文件 | kebab-case | `member-card.tsx` |
| 组件名 | PascalCase | `MemberCard` |
| Hook 文件 | kebab-case, `use-` 前缀 | `use-members.ts` |
| Hook 名 | camelCase, `use` 前缀 | `useMembers` |
| 类型文件 | kebab-case | `member.ts` |
| 类型/接口 | PascalCase | `Member`, `CreateMemberInput` |

### 11.2 导入顺序

```typescript
// 1. React
import { useState, useEffect } from 'react';

// 2. 第三方库
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

// 3. 内部模块 - 绝对路径
import { Button } from '@/components/ui/button';
import { useMembers } from '@/hooks/use-members';
import type { Member } from '@/types/member';

// 4. 样式 (如有)
import './styles.css';
```

### 11.3 注释规范

```typescript
/**
 * 家庭成员卡片组件
 * 
 * @param member - 成员数据
 * @param onEdit - 编辑回调
 * @param onDelete - 删除回调
 */
export function MemberCard({ member, onEdit, onDelete }: MemberCardProps) {
  // ...
}
```

## 12. 安全注意事项

1. **敏感数据展示**: 默认脱敏展示（如身份证号、银行卡号），需用户确认后才显示完整
2. **请求头**: 所有 API 请求必须携带 `X-Service-ID` 头
3. **本地存储**: 使用 Electron Store 加密存储敏感配置
4. **内网访问**: 仅通过 Tailscale 内网访问后端服务

## 13. 快速启动

```bash
# 安装依赖
npm install

# 开发模式 (Web)
npm run dev

# 开发模式 (Electron)
npm run electron:dev

# 构建
npm run build

# 构建 Electron 应用
npm run electron:build
```

---

## 变更记录

| 日期 | 变更 | 作者 |
|------|------|------|
| 2026-02-07 | 文档中心按服务层级分组重构，财务趋势图增加实时数据合并 | Claude |
| 2026-01-20 | 初始版本 - 完整前端开发规范 | Claude |
