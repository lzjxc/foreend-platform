import { useLocation } from 'react-router-dom';
import { Bell, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/ui-store';

const pageTitles: Record<string, string> = {
  '/dashboard': '仪表盘',
  '/system': '系统资源看板',
  '/members': '家庭成员',
  '/documents': '证件管理',
  '/addresses': '地址管理',
  '/bank-accounts': '银行账户',
  '/medical': '医疗信息',
  '/files': '文件管理',
  '/form-filling': '表单填充',
  '/settings': '设置',
};

export function Header() {
  const location = useLocation();
  const { theme, setTheme } = useUIStore();

  const basePath = '/' + location.pathname.split('/')[1];
  const pageTitle = pageTitles[basePath] || '个人信息管理';

  const toggleTheme = () => {
    if (theme === 'dark') {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    } else {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <h1 className="text-xl font-semibold">{pageTitle}</h1>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
