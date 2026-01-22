import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Sun, Moon } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';

export default function Settings() {
  const { theme, setTheme } = useUIStore();

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">主题</p>
              <p className="text-sm text-muted-foreground">
                切换亮色/暗色主题
              </p>
            </div>
            <Button variant="outline" onClick={toggleTheme}>
              {theme === 'dark' ? (
                <>
                  <Sun className="mr-2 h-4 w-4" />
                  亮色模式
                </>
              ) : (
                <>
                  <Moon className="mr-2 h-4 w-4" />
                  暗色模式
                </>
              )}
            </Button>
          </div>

          <div className="border-t pt-4">
            <p className="font-medium">API 配置</p>
            <p className="text-sm text-muted-foreground">
              当前后端地址: {import.meta.env.VITE_API_URL || '未配置'}
            </p>
          </div>

          <div className="border-t pt-4">
            <p className="font-medium">版本信息</p>
            <p className="text-sm text-muted-foreground">
              Personal Info Frontend v0.1.0
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
