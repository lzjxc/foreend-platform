import { motion } from 'framer-motion';
import { useKnowledgeStore } from '@/stores/knowledge-store';

export function ProcessingSteps() {
  const { processingSteps } = useKnowledgeStore();

  if (!processingSteps.length) return null;

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="space-y-0">
        {processingSteps.map((step, index) => (
          <motion.div
            key={step.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.15 }}
            className="flex items-center gap-3 py-2"
          >
            {/* Indicator */}
            <div className="flex h-5 w-5 items-center justify-center">
              {step.status === 'done' && (
                <span className="text-xs text-green-500">✓</span>
              )}
              {step.status === 'active' && (
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-xs text-blue-500"
                >
                  →
                </motion.span>
              )}
              {step.status === 'pending' && (
                <span className="text-xs text-muted-foreground/30">○</span>
              )}
            </div>

            {/* Label */}
            <span
              className={`flex-1 text-[13px] ${
                step.status === 'done'
                  ? 'text-green-600'
                  : step.status === 'active'
                    ? 'text-foreground'
                    : 'text-muted-foreground'
              }`}
            >
              {step.label}
            </span>

            {/* Status text */}
            <span
              className={`text-xs ${
                step.status === 'done'
                  ? 'text-green-500'
                  : step.status === 'active'
                    ? 'text-blue-500'
                    : 'text-muted-foreground/30'
              }`}
            >
              {step.status === 'done' ? '完成' : step.status === 'active' ? '进行中' : '等待'}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
