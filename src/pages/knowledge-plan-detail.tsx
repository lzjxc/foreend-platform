import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Archive, Trash2, Play } from 'lucide-react';
import { usePlan, useArchivePlan, useDeletePlan, usePlanReviewQueue } from '@/hooks/use-plans';
import type { PlanAtomItem } from '@/types/knowledge';

export default function KnowledgePlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { data: plan, isLoading } = usePlan(planId || '');
  const archivePlan = useArchivePlan();
  const deletePlan = useDeletePlan();
  const { data: reviewQueue } = usePlanReviewQueue(planId || '');

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted/30" />
        <div className="h-4 w-96 animate-pulse rounded bg-muted/30" />
        <div className="h-32 animate-pulse rounded-xl border bg-muted/30" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center">
        <p className="text-sm text-muted-foreground">计划未找到</p>
        <button
          onClick={() => navigate('/knowledge/review/plans')}
          className="mt-3 text-sm text-primary hover:underline"
        >
          返回计划列表
        </button>
      </div>
    );
  }

  const progress = plan.total_atoms > 0
    ? Math.round((plan.mastered_count / plan.total_atoms) * 100)
    : 0;

  const handleArchive = async () => {
    if (!window.confirm('确定要归档此计划吗？归档后将移出进行中列表。')) return;
    await archivePlan.mutateAsync(plan.id);
    navigate('/knowledge/review/plans');
  };

  const handleDelete = async () => {
    if (!window.confirm('确定要永久删除此计划吗？此操作不可撤销。')) return;
    await deletePlan.mutateAsync(plan.id);
    navigate('/knowledge/review/plans');
  };

  const handleStartReview = () => {
    navigate(`/knowledge/review?planId=${plan.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/knowledge/review/plans')}
          className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          返回列表
        </button>
        <div className="flex items-center gap-2">
          {plan.status === 'active' && (
            <button
              onClick={handleArchive}
              disabled={archivePlan.isPending}
              className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-accent"
            >
              <Archive className="h-3.5 w-3.5" />
              归档计划
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deletePlan.isPending}
            className="flex items-center gap-1 rounded-md border border-destructive/30 px-3 py-1.5 text-[12px] text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            删除
          </button>
        </div>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">{plan.title}</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              plan.status === 'active'
                ? 'bg-blue-100 text-blue-700'
                : plan.status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
            }`}
          >
            {plan.status === 'active' ? '进行中' : plan.status === 'completed' ? '已完成' : '已归档'}
          </span>
        </div>
        {plan.goal && (
          <p className="mt-2 text-sm text-muted-foreground">{plan.goal}</p>
        )}
      </div>

      {/* Progress */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">学习进度</span>
          <span className="font-semibold text-foreground">{progress}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[12px] text-muted-foreground">
          <span>{plan.mastered_count} / {plan.total_atoms} 已掌握</span>
          <span>
            创建于 {new Date(plan.created_at).toLocaleDateString('zh-CN')}
          </span>
        </div>
      </div>

      {/* Atom list */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">知识点列表</h2>
        <div className="space-y-1.5">
          {plan.atoms
            .slice()
            .sort((a, b) => a.order_index - b.order_index)
            .map((atom, idx) => (
              <AtomStatusRow key={atom.atom_id} atom={atom} index={idx} />
            ))}
        </div>
      </div>

      {/* Start review button */}
      {plan.status === 'active' && (
        <div className="flex justify-center pt-2 pb-4">
          <button
            onClick={handleStartReview}
            className="flex items-center gap-2 rounded-lg bg-primary px-8 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Play className="h-4 w-4" />
            开始学习{reviewQueue && reviewQueue.length > 0 ? ` (${reviewQueue.length} 待复习)` : ''}
          </button>
        </div>
      )}
    </div>
  );
}

function AtomStatusRow({ atom, index }: { atom: PlanAtomItem; index: number }) {
  const statusIcon = atom.status === 'mastered'
    ? '\u2705'
    : atom.status === 'learning'
      ? '\uD83D\uDD35'
      : '\u25CB';

  const statusText = atom.status === 'mastered'
    ? '已掌握'
    : atom.status === 'learning'
      ? `学习中 (${atom.correct_streak})`
      : '未开始';

  const statusColor = atom.status === 'mastered'
    ? 'text-green-600'
    : atom.status === 'learning'
      ? 'text-blue-600'
      : 'text-muted-foreground';

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5">
      <span className="text-base">{statusIcon}</span>
      <span className="w-6 text-center text-[12px] text-muted-foreground">{index + 1}</span>
      <div className="flex-1 min-w-0">
        <span className="truncate text-sm text-foreground">{atom.title}</span>
        {atom.domain_label && (
          <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {atom.domain_label}
          </span>
        )}
      </div>
      <span className={`shrink-0 text-[12px] ${statusColor}`}>{statusText}</span>
    </div>
  );
}
