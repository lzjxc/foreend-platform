import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReviewQueue, useReviewStats } from '@/hooks/use-review';
import { useActivePlan, usePlanReviewQueue } from '@/hooks/use-plans';
import { ReviewAtomCard } from './review-atom-card';
import type { ReviewAtom, ReviewStatus } from '@/types/knowledge';

interface ReviewQueueProps {
  onStartReview: (atoms: ReviewAtom[], planId?: string) => void;
  onStartSingle: (atom: ReviewAtom) => void;
}

export function ReviewQueue({ onStartReview, onStartSingle }: ReviewQueueProps) {
  const navigate = useNavigate();
  const [selectedDomain, setSelectedDomain] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | null>(null);

  const { data: atoms, isLoading: atomsLoading } = useReviewQueue(selectedDomain);
  const { data: stats, isLoading: statsLoading } = useReviewStats(selectedDomain);
  const { data: activePlan } = useActivePlan();
  const { data: planQueue } = usePlanReviewQueue(activePlan?.id || '');

  const isLoading = atomsLoading || statsLoading;

  // Filter by status
  const filteredAtoms = statusFilter
    ? atoms?.filter((a) => a.status === statusFilter)
    : atoms;

  // Sort: new → learning → mastered
  const sortedAtoms = filteredAtoms?.slice().sort((a, b) => {
    const order: Record<ReviewStatus, number> = { new: 0, learning: 1, mastered: 2 };
    return order[a.status] - order[b.status];
  });

  const handleStartAll = () => {
    if (!sortedAtoms?.length) return;
    // Start with non-mastered atoms first
    const reviewable = sortedAtoms.filter((a) => a.status !== 'mastered');
    onStartReview(reviewable.length > 0 ? reviewable : sortedAtoms);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg border bg-muted/30" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">知识复习</h1>
      </div>

      {/* Active plan banner */}
      {activePlan && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                当前计划：{activePlan.title}
              </p>
              <p className="mt-0.5 text-[12px] text-blue-700">
                {activePlan.mastered_count} / {activePlan.total_atoms} 已掌握
              </p>
            </div>
            <div className="flex items-center gap-2">
              {planQueue && planQueue.length > 0 && (
                <button
                  onClick={() => onStartReview(planQueue, activePlan!.id)}
                  className="rounded-md bg-blue-600 px-4 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-blue-700"
                >
                  继续计划学习 ({planQueue.length})
                </button>
              )}
              <button
                onClick={() => navigate(`/knowledge/review/plans/${activePlan.id}`)}
                className="rounded-md border border-blue-300 px-3 py-1.5 text-[12px] text-blue-700 transition-colors hover:bg-blue-100"
              >
                查看详情
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Domain tabs */}
      {stats && stats.domains.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedDomain(undefined)}
            className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
              !selectedDomain
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            全部
          </button>
          {stats.domains.map((d) => (
            <button
              key={d.domain}
              onClick={() => setSelectedDomain(d.domain)}
              className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                selectedDomain === d.domain
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {d.domain_label || d.domain}
            </button>
          ))}
        </div>
      )}

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <StatsCard
            label="待复习"
            count={stats.new_count}
            color="text-red-600"
            active={statusFilter === 'new'}
            onClick={() => setStatusFilter(statusFilter === 'new' ? null : 'new')}
          />
          <StatsCard
            label="学习中"
            count={stats.learning_count}
            color="text-amber-600"
            active={statusFilter === 'learning'}
            onClick={() => setStatusFilter(statusFilter === 'learning' ? null : 'learning')}
          />
          <StatsCard
            label="已掌握"
            count={stats.mastered_count}
            color="text-green-600"
            active={statusFilter === 'mastered'}
            onClick={() => setStatusFilter(statusFilter === 'mastered' ? null : 'mastered')}
          />
        </div>
      )}

      {/* Atom list */}
      {sortedAtoms && sortedAtoms.length > 0 ? (
        <div className="space-y-2">
          {sortedAtoms.map((atom) => (
            <ReviewAtomCard
              key={atom.atom_id}
              atom={atom}
              onStart={onStartSingle}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          {statusFilter ? '该状态下没有知识原子' : '暂无可复习的知识原子'}
        </div>
      )}

      {/* Start all button */}
      {sortedAtoms && sortedAtoms.length > 0 && (
        <div className="flex justify-center pt-2">
          <button
            onClick={handleStartAll}
            className="rounded-lg bg-primary px-8 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            开始今日复习
          </button>
        </div>
      )}
    </div>
  );
}

function StatsCard({
  label,
  count,
  color,
  active,
  onClick,
}: {
  label: string;
  count: number;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-3 text-center transition-colors ${
        active ? 'border-foreground/30 bg-accent' : 'border-border bg-card hover:bg-accent/50'
      }`}
    >
      <div className={`text-2xl font-bold ${color}`}>{count}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </button>
  );
}
