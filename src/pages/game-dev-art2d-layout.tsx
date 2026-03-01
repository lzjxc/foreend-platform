import { Outlet } from 'react-router-dom';
import { Wand2, History } from 'lucide-react';
import { PageTabs } from '@/components/ui/page-tabs';

const tabs = [
  { path: '/game-dev/art-2d/generator', label: '生成器', icon: Wand2 },
  { path: '/game-dev/art-2d/history', label: '历史记录', icon: History },
];

export default function GameDevArt2DLayout() {
  return (
    <div>
      <PageTabs tabs={tabs} />
      <Outlet />
    </div>
  );
}
