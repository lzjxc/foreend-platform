import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, Archive, Trash2 } from 'lucide-react';
import type { LearningPlan } from '@/types/knowledge';

interface PlanCardProps {
  plan: LearningPlan;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function PlanCard({ plan, onArchive, onDelete }: PlanCardProps) {
  const navigate = useNavigate();
  const progress = plan.total_atoms > 0
    ? Math.round((plan.mastered_count / plan.total_atoms) * 100)
    : 0;

  const statusLabels: Record<string, string> = {
    active: '进行中',
    completed: '已完成',
    archived: '已归档',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="cursor-pointer rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
      onClick={() => navigate(`/knowledge/review/plans/${plan.id}`)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{plan.title}</h3>
          {plan.domain && (
            <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {plan.domain}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              plan.status === 'active'
                ? 'bg-blue-100 text-blue-700'
                : plan.status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
            }`}
          >
            {statusLabels[plan.status] || plan.status}
          </span>
          {onArchive && plan.status === 'active' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('确定要归档此计划吗？归档后将移出进行中列表。')) {
                  onArchive(plan.id);
                }
              }}
              title="归档计划"
              className="rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
            >
              <Archive className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('确定要永久删除此计划吗？此操作不可撤销。')) {
                  onDelete(plan.id);
                }
              }}
              title="删除计划"
              className="rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[12px] text-muted-foreground">
          <span>{plan.mastered_count} / {plan.total_atoms} 已掌握</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <BookOpen className="h-3 w-3" />
          {plan.total_atoms} 知识点
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {new Date(plan.created_at).toLocaleDateString('zh-CN')}
        </span>
      </div>

      {/* Action button for active plans */}
      {plan.status === 'active' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/knowledge/review/plans/${plan.id}`);
          }}
          className="mt-3 w-full rounded-md bg-primary/10 py-1.5 text-[12px] font-medium text-primary transition-colors hover:bg-primary/20"
        >
          继续学习
        </button>
      )}
    </motion.div>
  );
}
