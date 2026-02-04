import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Activity,
  Monitor,
  BookOpen,
  BookMarked,
  Users,
  Upload,
  FileInput,
  Settings,
  ChevronLeft,
  Brain,
  Database,
  Wallet,
  Gauge,
  FileText,
  History,
  Settings2,
} from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { path: '/dashboard', icon: Home, label: '仪表盘' },
  { path: '/system', icon: Activity, label: '系统看板' },
  { path: '/machines', icon: Monitor, label: '远程设备' },
  // { path: '/services', icon: Server, label: '服务目录' },  // 已合并到系统看板
  { path: '/docs', icon: FileText, label: '文档中心' },
  { path: '/timeline', icon: History, label: '变更时间线' },
  { path: '/argo-config', icon: Settings2, label: 'K8s配置' },
  { path: '/efficiency', icon: Gauge, label: '效能评估' },
  { path: '/data-sources', icon: Database, label: '数据源' },
  { path: '/finance', icon: Wallet, label: '财务统计' },
  { path: '/homework', icon: BookOpen, label: '作业助手' },
  { path: '/wordbook', icon: BookMarked, label: '单词本' },
  { path: '/members', icon: Users, label: '家庭成员' },
  { path: '/files', icon: Upload, label: '文件管理' },
  { path: '/form-filling', icon: FileInput, label: '表单填充' },
  { path: '/settings', icon: Settings, label: '设置' },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 256 }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-card"
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">个人AI外脑</span>
          </div>
        )}
        {sidebarCollapsed && <Brain className="mx-auto h-6 w-6 text-primary" />}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(sidebarCollapsed && 'absolute -right-3 top-5 h-6 w-6 rounded-full border bg-card')}
        >
          <ChevronLeft
            className={cn(
              'h-4 w-4 transition-transform',
              sidebarCollapsed && 'rotate-180'
            )}
          />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                sidebarCollapsed && 'justify-center px-2'
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!sidebarCollapsed && (
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground">
            Personal Info Frontend v0.1.0
          </p>
        </div>
      )}
    </motion.aside>
  );
}
