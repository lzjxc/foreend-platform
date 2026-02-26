import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AlertTriangle } from 'lucide-react';
import { PlanAtomRow } from './plan-atom-row';
import type { PlanDraft } from '@/types/knowledge';

interface PlanDraftReviewProps {
  draft: PlanDraft;
  onConfirm: (title: string, atomIds: string[]) => void;
  onBack: () => void;
  isLoading: boolean;
}

export function PlanDraftReview({ draft, onConfirm, onBack, isLoading }: PlanDraftReviewProps) {
  const [title, setTitle] = useState(draft.title);
  const [atoms, setAtoms] = useState(draft.atoms);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        setAtoms((items) => {
          const oldIndex = items.findIndex((i) => i.atom_id === active.id);
          const newIndex = items.findIndex((i) => i.atom_id === over.id);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
    },
    []
  );

  const handleRemove = useCallback((atomId: string) => {
    setAtoms((items) => items.filter((i) => i.atom_id !== atomId));
  }, []);

  const handleConfirm = () => {
    if (!title.trim() || atoms.length === 0) return;
    onConfirm(title.trim(), atoms.map((a) => a.atom_id));
  };

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <label className="mb-1 block text-[12px] font-medium text-muted-foreground">
          计划标题
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          disabled={isLoading}
        />
      </div>

      {/* Missing topics warning */}
      {draft.missing_topics && draft.missing_topics.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <p className="text-[12px] font-medium text-amber-800">
              以下主题在知识库中尚未覆盖：
            </p>
            <ul className="mt-1 space-y-0.5">
              {draft.missing_topics.map((topic) => (
                <li key={topic} className="text-[12px] text-amber-700">
                  {topic}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Atom count */}
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-muted-foreground">
          共 {atoms.length} 个知识点（拖拽排序，点击 x 移除）
        </p>
      </div>

      {/* Sortable atom list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={atoms.map((a) => a.atom_id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1.5">
            {atoms.map((atom, idx) => (
              <PlanAtomRow
                key={atom.atom_id}
                id={atom.atom_id}
                index={idx}
                title={atom.title}
                summary={atom.summary}
                domain={atom.domain}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {atoms.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          所有知识点已移除，请返回重新生成
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent"
        >
          返回修改
        </button>
        <button
          onClick={handleConfirm}
          disabled={!title.trim() || atoms.length === 0 || isLoading}
          className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              保存中...
            </span>
          ) : (
            `创建计划 (${atoms.length} 个知识点)`
          )}
        </button>
      </div>
    </div>
  );
}
