import { useState } from 'react';
import { Plus, Map, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { usePlans, useArchivePlan, useDeletePlan } from '@/hooks/use-plans';
import { PageTabs } from '@/components/ui/page-tabs';
import { PlanCard } from '@/components/knowledge/plan/plan-card';
import { PlanCreateWizard } from '@/components/knowledge/plan/plan-create-wizard';

const reviewTabs = [
  { path: '/knowledge/review', label: '知识复习', icon: RotateCcw, end: true },
  { path: '/knowledge/review/plans', label: '学习计划', icon: Map },
];

export default function KnowledgePlansPage() {
  const [showWizard, setShowWizard] = useState(false);
  const { data: plans, isLoading } = usePlans();
  const archivePlan = useArchivePlan();
  const deletePlan = useDeletePlan();

  const handleArchive = async (planId: string) => {
    try {
      await archivePlan.mutateAsync(planId);
      toast.success('计划已归档');
    } catch {
      toast.error('归档失败');
    }
  };

  const handleDelete = async (planId: string) => {
    try {
      await deletePlan.mutateAsync(planId);
      toast.success('计划已删除');
    } catch {
      toast.error('删除失败');
    }
  };

  const activePlans = plans?.filter((p) => p.status === 'active') || [];
  const completedPlans = plans?.filter((p) => p.status === 'completed') || [];
  const archivedPlans = plans?.filter((p) => p.status === 'archived') || [];

  if (showWizard) {
    return (
      <>
        <PageTabs tabs={reviewTabs} />
        <div className="mx-auto max-w-3xl py-6">
          <button
            onClick={() => setShowWizard(false)}
            className="mb-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            &#8592; 返回计划列表
          </button>
          <PlanCreateWizard onClose={() => setShowWizard(false)} />
        </div>
      </>
    );
  }

  return (
    <>
    <PageTabs tabs={reviewTabs} />
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">学习计划</h1>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          新建计划
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl border bg-muted/30" />
          ))}
        </div>
      ) : !plans || plans.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Map className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-3 text-sm font-medium text-foreground">还没有学习计划</h3>
          <p className="mt-1 text-[12px] text-muted-foreground">
            创建学习计划，AI 会从知识库中挑选知识点帮你系统学习
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="mt-4 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            创建第一个计划
          </button>
        </div>
      ) : (
        <>
          {/* Active plans */}
          {activePlans.length > 0 && (
            <PlanGroup title="进行中" plans={activePlans} onArchive={handleArchive} onDelete={handleDelete} />
          )}

          {/* Completed plans */}
          {completedPlans.length > 0 && (
            <PlanGroup title="已完成" plans={completedPlans} onArchive={handleArchive} onDelete={handleDelete} />
          )}

          {/* Archived plans */}
          {archivedPlans.length > 0 && (
            <PlanGroup title="已归档" plans={archivedPlans} onDelete={handleDelete} />
          )}
        </>
      )}
    </div>
    </>
  );
}

function PlanGroup({ title, plans, onArchive, onDelete }: { title: string; plans: import('@/types/knowledge').LearningPlan[]; onArchive?: (id: string) => void; onDelete?: (id: string) => void }) {
  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{title}</h2>
      <div className="space-y-3">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onArchive={onArchive} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
