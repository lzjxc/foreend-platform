import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';

interface PlanAtomRowProps {
  id: string;
  index: number;
  title: string;
  summary: string;
  domain: string;
  onRemove: (id: string) => void;
}

export function PlanAtomRow({ id, index, title, summary, domain, onRemove }: PlanAtomRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 ${
        isDragging ? 'z-50 shadow-lg opacity-90' : ''
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Index */}
      <span className="w-6 text-center text-[12px] font-medium text-muted-foreground">
        {index + 1}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">{title}</span>
          <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {domain}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{summary}</p>
      </div>

      {/* Remove */}
      <button
        onClick={() => onRemove(id)}
        className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
