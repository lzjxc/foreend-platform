import { motion } from 'framer-motion';
import type { ReviewAtom } from '@/types/knowledge';

export interface ReviewResult {
  atom: ReviewAtom;
  isCorrect: boolean;
  newStatus: 'new' | 'learning' | 'mastered';
  previousStatus: 'new' | 'learning' | 'mastered';
}

interface ReviewSummaryProps {
  results: ReviewResult[];
  onRetryWrong: () => void;
  onBackToQueue: () => void;
}

export function ReviewSummary({ results, onRetryWrong, onBackToQueue }: ReviewSummaryProps) {
  const total = results.length;
  const correct = results.filter((r) => r.isCorrect).length;
  const wrong = total - correct;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const newlyMastered = results.filter(
    (r) => r.newStatus === 'mastered' && r.previousStatus !== 'mastered'
  );
  const needsWork = results.filter((r) => !r.isCorrect);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-lg space-y-6"
    >
      <div className="rounded-xl border bg-card p-6 text-center">
        <div className="text-3xl">&#127881;</div>
        <h2 className="mt-2 text-lg font-semibold text-foreground">本次复习完成</h2>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          <div>
            <div className="text-xl font-bold text-foreground">{total}</div>
            <div className="text-[11px] text-muted-foreground">复习</div>
          </div>
          <div>
            <div className="text-xl font-bold text-green-600">{correct}</div>
            <div className="text-[11px] text-muted-foreground">答对</div>
          </div>
          <div>
            <div className="text-xl font-bold text-red-600">{wrong}</div>
            <div className="text-[11px] text-muted-foreground">答错</div>
          </div>
          <div>
            <div className="text-xl font-bold text-primary">{accuracy}%</div>
            <div className="text-[11px] text-muted-foreground">正确率</div>
          </div>
        </div>
      </div>

      {/* Newly mastered */}
      {newlyMastered.length > 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50/50 p-4">
          <h3 className="text-sm font-semibold text-green-800">新晋掌握</h3>
          <div className="mt-2 space-y-1">
            {newlyMastered.map((r) => (
              <div key={r.atom.atom_id} className="flex items-center gap-2 text-[13px] text-green-700">
                <span>&#10003;</span>
                <span>{r.atom.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Needs work */}
      {needsWork.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
          <h3 className="text-sm font-semibold text-red-800">需要加强</h3>
          <div className="mt-2 space-y-1">
            {needsWork.map((r) => (
              <div key={r.atom.atom_id} className="flex items-center gap-2 text-[13px] text-red-700">
                <span>&#10007;</span>
                <span>{r.atom.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-center gap-3">
        {needsWork.length > 0 && (
          <button
            onClick={onRetryWrong}
            className="rounded-md border border-border bg-background px-4 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-accent"
          >
            再练一遍错题
          </button>
        )}
        <button
          onClick={onBackToQueue}
          className="rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          返回复习列表
        </button>
      </div>
    </motion.div>
  );
}
