import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ATOM_CATEGORY_LABELS, ATOM_ROLE_LABELS } from '@/types/game-design';
import type { SkillAtom } from '@/types/game-design';

const CATEGORY_COLORS: Record<string, string> = {
  damage_mode: 'border-red-500/30 bg-red-500/5',
  target_mode: 'border-blue-500/30 bg-blue-500/5',
  element_attribute: 'border-cyan-500/30 bg-cyan-500/5',
  control_effect: 'border-purple-500/30 bg-purple-500/5',
  buff_debuff: 'border-green-500/30 bg-green-500/5',
  cast_mode: 'border-orange-500/30 bg-orange-500/5',
  trigger_condition: 'border-yellow-500/30 bg-yellow-500/5',
  resource_cost: 'border-amber-500/30 bg-amber-500/5',
  field_effect: 'border-emerald-500/30 bg-emerald-500/5',
  mark_system: 'border-pink-500/30 bg-pink-500/5',
  value_template: 'border-slate-500/30 bg-slate-500/5',
};

interface AtomCardProps {
  atom: SkillAtom;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
  compact?: boolean;
}

export function AtomCard({ atom, onEdit, onDelete, onClick, compact }: AtomCardProps) {
  const colorClass = CATEGORY_COLORS[atom.category] || 'border-border bg-card';

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-accent/50',
          colorClass
        )}
      >
        <div className="font-medium truncate">{atom.name}</div>
        <div className="text-[11px] text-muted-foreground truncate">{atom.code}</div>
      </button>
    );
  }

  return (
    <div
      className={cn(
        'group relative rounded-xl border p-4 transition-colors',
        colorClass,
        onClick && 'cursor-pointer hover:shadow-sm'
      )}
      onClick={onClick}
    >
      {(onEdit || onDelete) && (
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button
              className="rounded-md p-1 hover:bg-accent"
              onClick={(e) => { e.stopPropagation(); }}
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10">
              <div className="rounded-lg border bg-popover py-1 shadow-md min-w-[100px]">
                {onEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-accent"
                  >
                    编辑
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-accent"
                  >
                    删除
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div>
          <h3 className="font-semibold text-sm">{atom.name}</h3>
          <p className="text-[11px] font-mono text-muted-foreground">{atom.code}</p>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">{atom.description}</p>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium">
            {ATOM_CATEGORY_LABELS[atom.category]}
          </span>
          <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] text-muted-foreground">
            {ATOM_ROLE_LABELS[atom.atom_role]}
          </span>
        </div>

        {atom.narrative_keywords.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {atom.narrative_keywords.slice(0, 3).map((kw) => (
              <span key={kw} className="text-[10px] text-muted-foreground">#{kw}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
