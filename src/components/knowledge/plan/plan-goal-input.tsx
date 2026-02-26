import { useState } from 'react';
import { useOntology } from '@/hooks/use-knowledge';

interface PlanGoalInputProps {
  onSubmit: (goal: string, domain?: string, maxItems?: number) => void;
  isLoading: boolean;
}

export function PlanGoalInput({ onSubmit, isLoading }: PlanGoalInputProps) {
  const [goal, setGoal] = useState('');
  const [domain, setDomain] = useState<string>('');
  const [maxItems, setMaxItems] = useState<number>(15);

  const { data: ontology } = useOntology();

  const handleSubmit = () => {
    if (!goal.trim()) return;
    onSubmit(goal.trim(), domain || undefined, maxItems);
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">描述你的学习目标</h3>
        <p className="mt-1 text-[12px] text-muted-foreground">
          AI 将根据你的目标，从知识库中挑选相关知识点并生成学习计划。
        </p>
      </div>

      {/* Goal textarea */}
      <div>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="例如：掌握 Kubernetes 核心概念和日常运维操作"
          className="h-28 w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20"
          disabled={isLoading}
        />
      </div>

      {/* Options row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Domain select */}
        <div>
          <label className="mb-1 block text-[12px] font-medium text-muted-foreground">
            限定领域（可选）
          </label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={isLoading}
          >
            <option value="">全部领域</option>
            {ontology?.domains.map((d) => (
              <option key={d.path} value={d.path}>
                {d.label} ({d.total_atoms})
              </option>
            ))}
          </select>
        </div>

        {/* Max items */}
        <div>
          <label className="mb-1 block text-[12px] font-medium text-muted-foreground">
            知识点数量
          </label>
          <select
            value={maxItems}
            onChange={(e) => setMaxItems(Number(e.target.value))}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={isLoading}
          >
            <option value={10}>10 个</option>
            <option value={15}>15 个</option>
            <option value={20}>20 个</option>
            <option value={30}>30 个</option>
          </select>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!goal.trim() || isLoading}
        className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            AI 正在生成计划...
          </span>
        ) : (
          '生成学习计划'
        )}
      </button>
    </div>
  );
}
