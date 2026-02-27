import { Outlet } from 'react-router-dom';
import { Hammer, Atom, Swords, Gem, Scale } from 'lucide-react';
import { PageTabs } from '@/components/ui/page-tabs';

const tabs = [
  { path: '/game-dev/skills/workbench', label: '工作台', icon: Hammer },
  { path: '/game-dev/skills/atoms', label: '原子库', icon: Atom },
  { path: '/game-dev/skills/originals', label: '参考技能', icon: Swords },
  { path: '/game-dev/skills/modifiers', label: '修饰器', icon: Gem },
  { path: '/game-dev/skills/rules', label: '规则', icon: Scale },
];

export default function GameDevLayout() {
  return (
    <div>
      <PageTabs tabs={tabs} />
      <Outlet />
    </div>
  );
}
