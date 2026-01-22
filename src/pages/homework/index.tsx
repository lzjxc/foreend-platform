import { BookOpen, FileText, Calculator, Languages } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { HomeworkGenerator } from '@/components/homework/homework-generator';
import { HomeworkHistory } from '@/components/homework/homework-history';

const tabs = [
  { path: '/homework', label: '生成作业', icon: FileText },
  { path: '/homework/chinese', label: '语文字库', icon: BookOpen },
  { path: '/homework/math', label: '数学题库', icon: Calculator },
  { path: '/homework/english', label: '英语词库', icon: Languages },
];

export default function HomeworkPage() {
  const location = useLocation();

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">作业助手</h1>
        <p className="text-muted-foreground">生成和管理每日作业</p>
      </div>

      {/* Tabs 导航 */}
      <div className="border-b">
        <nav className="flex space-x-4" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 主内容区域 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <HomeworkGenerator />
        <HomeworkHistory />
      </div>
    </div>
  );
}
