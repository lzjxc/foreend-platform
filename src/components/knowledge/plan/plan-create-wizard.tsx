import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useGenerateDraft, useSavePlan } from '@/hooks/use-plans';
import { PlanGoalInput } from './plan-goal-input';
import { PlanDraftReview } from './plan-draft-review';
import type { PlanDraft } from '@/types/knowledge';

type WizardStep = 'goal' | 'draft' | 'done';

interface PlanCreateWizardProps {
  onClose: () => void;
}

export function PlanCreateWizard({ onClose }: PlanCreateWizardProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>('goal');
  const [draft, setDraft] = useState<PlanDraft | null>(null);
  const [goal, setGoal] = useState('');
  const [domain, setDomain] = useState('');
  const [createdPlanId, setCreatedPlanId] = useState<string | null>(null);

  const generateDraft = useGenerateDraft();
  const savePlan = useSavePlan();

  // Step 1: generate draft
  const handleGoalSubmit = useCallback(
    async (goalText: string, selectedDomain?: string, maxItems?: number) => {
      try {
        setGoal(goalText);
        if (selectedDomain) setDomain(selectedDomain);
        const result = await generateDraft.mutateAsync({ goal: goalText, domain: selectedDomain, maxItems });
        setDraft(result);
        setStep('draft');
      } catch (err) {
        const msg = err instanceof Error ? err.message : '生成失败';
        const isLlm = msg.includes('500') || msg.includes('LLM') || msg.includes('llm-gateway');
        toast.error(isLlm ? 'AI 服务暂时不可用，请稍后重试' : `生成计划失败: ${msg}`);
      }
    },
    [generateDraft]
  );

  // Step 2: confirm and save
  const handleConfirm = useCallback(
    async (title: string, atomIds: string[]) => {
      try {
        const plan = await savePlan.mutateAsync({
          title,
          goal,
          domain,
          atom_ids: atomIds,
        });
        setCreatedPlanId(plan.id);
        setStep('done');
      } catch (err) {
        const msg = err instanceof Error ? err.message : '保存失败';
        toast.error(`创建计划失败: ${msg}`);
      }
    },
    [goal, domain, savePlan]
  );

  return (
    <div className="mx-auto max-w-2xl">
      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2 text-[12px] text-muted-foreground">
        <StepDot active={step === 'goal'} done={step === 'draft' || step === 'done'} label="1. 目标" />
        <div className="h-px flex-1 bg-border" />
        <StepDot active={step === 'draft'} done={step === 'done'} label="2. 审查" />
        <div className="h-px flex-1 bg-border" />
        <StepDot active={step === 'done'} done={false} label="3. 完成" />
      </div>

      <AnimatePresence mode="wait">
        {step === 'goal' && (
          <motion.div
            key="goal"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <PlanGoalInput
              onSubmit={handleGoalSubmit}
              isLoading={generateDraft.isPending}
            />
          </motion.div>
        )}

        {step === 'draft' && draft && (
          <motion.div
            key="draft"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <PlanDraftReview
              draft={draft}
              onConfirm={handleConfirm}
              onBack={() => setStep('goal')}
              isLoading={savePlan.isPending}
            />
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="rounded-xl border bg-card p-8">
              <div className="text-3xl">&#127881;</div>
              <h3 className="mt-3 text-lg font-semibold text-foreground">
                学习计划创建成功！
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {draft?.atoms.length || 0} 个知识点已加入计划
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => {
                    if (createdPlanId) {
                      navigate(`/knowledge/review/plans/${createdPlanId}`);
                    }
                  }}
                  className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  查看计划
                </button>
                <button
                  onClick={onClose}
                  className="rounded-md border border-border px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent"
                >
                  稍后再说
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <span
      className={`font-medium ${
        active
          ? 'text-primary'
          : done
            ? 'text-green-600'
            : 'text-muted-foreground'
      }`}
    >
      {label}
    </span>
  );
}
