import type { KnowledgeAtom } from '@/types/knowledge';

interface AtomCardProps {
  atom: KnowledgeAtom;
  onClick?: () => void;
}

export function AtomCard({ atom, onClick }: AtomCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border bg-card p-4 text-left transition-all hover:border-blue-200 hover:shadow-sm"
    >
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span className="text-sm font-semibold text-foreground">
            {atom.title}
          </span>
        </div>
        {atom.knowledge_level && (
          <span className="rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {atom.knowledge_level}
          </span>
        )}
      </div>

      {/* Summary */}
      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
        {atom.summary}
      </p>

      {/* Concepts */}
      {atom.concepts?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {atom.concepts.slice(0, 5).map((c) => (
            <span
              key={c.name}
              className="rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[11px] text-blue-700"
            >
              {c.name}
            </span>
          ))}
        </div>
      )}

      {/* Source breadcrumb */}
      <div className="mt-3 text-[11px] text-muted-foreground">
        {[
          atom.domain_label || atom.domain,
          atom.source_lv1,
          atom.source_lv2,
          atom.source_lv3,
        ]
          .filter(Boolean)
          .join(' > ')}
      </div>
    </button>
  );
}
