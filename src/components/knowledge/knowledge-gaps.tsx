import { motion } from 'framer-motion';
import { useOntologyGaps } from '@/hooks/use-knowledge';

const DOMAIN_DOT_COLORS: Record<string, string> = {
  game_design: 'bg-red-500',
  psychology: 'bg-blue-500',
  philosophy: 'bg-purple-500',
  systems_thinking: 'bg-green-500',
  business: 'bg-amber-500',
  self_improvement: 'bg-emerald-500',
  technology: 'bg-cyan-500',
  educational_psychology: 'bg-blue-500',
};

export function KnowledgeGaps() {
  const { data, isLoading } = useOntologyGaps();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-[13px] text-muted-foreground">加载知识缺口分析...</span>
      </div>
    );
  }

  if (!data || data.total_nodes === 0) {
    return (
      <div className="mx-auto max-w-4xl">
        <h2 className="text-lg font-bold text-foreground">知识缺口分析</h2>
        <p className="text-[13px] text-muted-foreground">未点亮的知识节点，发现你的盲区</p>
        <div className="mt-10 flex flex-col items-center justify-center py-16">
          <span className="text-[28px] opacity-40">&#9684;</span>
          <span className="mt-3 text-[15px] font-semibold text-foreground">
            暂无知识节点
          </span>
          <span className="mt-1 text-[13px] text-muted-foreground">
            捕获更多知识后，知识缺口将自动生成
          </span>
        </div>
      </div>
    );
  }

  const { total_nodes, covered_nodes, coverage_pct, domains } = data;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-foreground">知识缺口分析</h2>
        <p className="text-[13px] text-muted-foreground">
          未点亮的知识节点，发现你的盲区
        </p>
      </div>

      {/* Coverage card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border bg-card p-6"
      >
        <div className="text-center">
          <div className="text-[48px] font-bold text-foreground">
            {covered_nodes}/{total_nodes}
          </div>
          <div className="text-[13px] text-muted-foreground">知识节点已点亮</div>
        </div>
        <div className="mt-4">
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${coverage_pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600"
            />
          </div>
          <div className="mt-1 text-center text-[12px] text-muted-foreground">
            {coverage_pct}% 覆盖率
          </div>
        </div>
      </motion.div>

      {/* Domain gap lists */}
      {domains.map((gd, i) => {
        const dotColor = DOMAIN_DOT_COLORS[gd.domain] || 'bg-blue-500';
        return (
          <motion.div
            key={gd.domain}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="rounded-xl border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
                <span className="text-[14px] font-bold text-foreground">
                  {gd.domain_label}
                </span>
              </div>
              <span className="text-[12px] text-muted-foreground">
                {gd.uncovered_count} 个待探索
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {gd.uncovered.map((item) => (
                <div
                  key={item.path}
                  className="flex items-center gap-3 text-[13px]"
                >
                  <span className="text-muted-foreground">○</span>
                  <span className="text-muted-foreground">{item.topic_label}</span>
                  <span className="text-muted-foreground">›</span>
                  <span className="font-semibold text-foreground">{item.subtopic_label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}

      {domains.length === 0 && (
        <div className="rounded-xl border bg-card p-8 text-center">
          <span className="text-[15px] font-semibold text-green-600">
            🎉 所有知识节点已覆盖！
          </span>
        </div>
      )}
    </div>
  );
}
