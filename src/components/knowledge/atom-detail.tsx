import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { KnowledgeAtom } from '@/types/knowledge';

interface AtomDetailProps {
  atom: KnowledgeAtom;
  onClose: () => void;
}

export function AtomDetail({ atom, onClose }: AtomDetailProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="rounded-xl border border-blue-200 bg-card p-5 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-base font-bold text-foreground">
            {atom.title}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X size={16} />
        </button>
      </div>

      {/* Domain & Topics */}
      <div className="mt-4 flex items-center gap-3">
        <span className="text-[13px] font-semibold text-blue-600">
          {atom.domain_label || atom.domain}
        </span>
        {atom.topic_labels?.length > 0 && (
          <>
            <span className="text-muted-foreground/30">·</span>
            <span className="text-[13px] text-muted-foreground">
              {atom.topic_labels.join(' · ')}
            </span>
          </>
        )}
      </div>

      {/* Summary */}
      <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
        {atom.summary}
      </p>

      {/* Concepts */}
      {atom.concepts?.length > 0 && (
        <div className="mt-4">
          <span className="mb-2 block text-[11px] text-muted-foreground">
            概念
          </span>
          <div className="space-y-2">
            {atom.concepts.map((c) => (
              <div key={c.name} className="flex gap-2">
                <span className="shrink-0 rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                  {c.name}
                </span>
                <span className="text-xs text-muted-foreground">{c.def}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw content */}
      {atom.raw_content && (
        <div className="mt-4">
          <span className="mb-2 block text-[11px] text-muted-foreground">
            原文
          </span>
          <div className="max-h-[200px] overflow-auto rounded-lg border bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
            {atom.raw_content}
          </div>
        </div>
      )}

      {/* Source */}
      {atom.source_ref && (
        <div className="mt-4">
          <span className="mb-1 block text-[11px] text-muted-foreground">
            来源
          </span>
          <span className="text-xs text-muted-foreground">
            {atom.source_ref}
          </span>
        </div>
      )}

      {/* Metadata */}
      <div className="mt-4 flex items-center gap-4 border-t pt-3">
        <span className="text-[11px] text-muted-foreground">
          {atom.content_type}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {atom.knowledge_level}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {new Date(atom.created_at).toLocaleDateString('zh-CN')}
        </span>
      </div>
    </motion.div>
  );
}
