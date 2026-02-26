import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface PageTab {
  path: string;
  label: string;
  icon?: LucideIcon;
  end?: boolean; // NavLink end prop for exact matching
}

interface PageTabsProps {
  tabs: PageTab[];
}

export function PageTabs({ tabs }: PageTabsProps) {
  return (
    <div className="flex gap-1 border-b mb-6">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.end}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
            )
          }
        >
          {tab.icon && <tab.icon className="h-4 w-4" />}
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
