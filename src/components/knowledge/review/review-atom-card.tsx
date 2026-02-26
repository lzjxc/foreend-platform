import type { ReviewAtom } from '@/types/knowledge';

const STATUS_CONFIG = {
  new: { color: 'border-red-200 bg-red-50/40', dot: 'bg-red-500', label: '未复习' },
  learning: { color: 'border-amber-200 bg-amber-50/40', dot: 'bg-amber-500', label: '复习中' },
  mastered: { color: 'border-green-200 bg-green-50/40', dot: 'bg-green-500', label: '已掌握' },
} as const;

interface ReviewAtomCardProps {
  atom: ReviewAtom;
  onStart: (atom: ReviewAtom) => void;
}

export function ReviewAtomCard({ atom, onStart }: ReviewAtomCardProps) {
  const cfg = STATUS_CONFIG[atom.status];

  const actionLabel =
    atom.status === 'new' ? '开始复习' :
    atom.status === 'learning' ? '继续复习' : '再次复习';

  return (
    <div className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${cfg.color}`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${cfg.dot}`} />
        <div className="min-w-0">
          <h4 className="truncate text-sm font-medium text-foreground">{atom.title}</h4>
          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>{atom.domain_label || atom.domain}</span>
            <span>·</span>
            <span>{cfg.label}</span>
            {atom.status === 'learning' && atom.correct_streak > 0 && (
              <>
                <span>·</span>
                <span>连续答对 {atom.correct_streak} 次</span>
              </>
            )}
            {atom.status === 'mastered' && atom.last_reviewed_at && (
              <>
                <span>·</span>
                <span>{formatRelativeTime(atom.last_reviewed_at)}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={() => onStart(atom)}
        className="shrink-0 rounded-md border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground transition-colors hover:bg-accent"
      >
        {actionLabel}
      </button>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 30) return `${days}天前`;
  return `${Math.floor(days / 30)}月前`;
}
