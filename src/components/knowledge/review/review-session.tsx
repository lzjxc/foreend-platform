import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGenerateCard, useSubmitAnswer } from '@/hooks/use-review';
import { ReviewQuestion } from './review-question';
import type { ReviewResult } from './review-summary';
import type { ReviewAtom, ReviewCard, ReviewFeedback as ReviewFeedbackType } from '@/types/knowledge';

type SessionStep = 'loading' | 'question' | 'answered';

// localStorage helpers for plan progress
const PROGRESS_KEY_PREFIX = 'review-progress-';

export function getPlanProgress(planId: string): string[] {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY_PREFIX + planId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearPlanProgress(planId: string) {
  localStorage.removeItem(PROGRESS_KEY_PREFIX + planId);
}

function savePlanProgress(planId: string, atomId: string) {
  const existing = getPlanProgress(planId);
  if (!existing.includes(atomId)) {
    existing.push(atomId);
    localStorage.setItem(PROGRESS_KEY_PREFIX + planId, JSON.stringify(existing));
  }
}

interface ReviewSessionProps {
  atoms: ReviewAtom[];
  planId?: string;
  onFinish: (results: ReviewResult[]) => void;
  onExit: () => void;
}

export function ReviewSession({ atoms, planId, onFinish, onExit }: ReviewSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState<SessionStep>('loading');
  const [currentCard, setCurrentCard] = useState<ReviewCard | null>(null);
  const [currentFeedback, setCurrentFeedback] = useState<ReviewFeedbackType | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [results, setResults] = useState<ReviewResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const generateCard = useGenerateCard();
  const submitAnswer = useSubmitAnswer();

  const currentAtom = atoms[currentIndex];
  const total = atoms.length;

  // Generate card for current atom
  const loadCard = useCallback(
    async (atom: ReviewAtom) => {
      setStep('loading');
      setCurrentCard(null);
      setCurrentFeedback(null);
      setCurrentAnswer('');
      setError(null);

      try {
        const card = await generateCard.mutateAsync(atom.atom_id);
        setCurrentCard(card);
        setStep('question');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'AI 出题失败');
        setStep('question'); // Show error in question area
      }
    },
    [generateCard]
  );

  // Initial load
  useState(() => {
    if (currentAtom) loadCard(currentAtom);
  });

  // Submit answer immediately (with default rating 'ok')
  const handleAnswerSubmit = useCallback(
    async (answer: string) => {
      if (!currentCard || !currentAtom) return;
      setCurrentAnswer(answer);

      try {
        const feedback = await submitAnswer.mutateAsync({
          sessionId: currentCard.session_id,
          answer,
          selfRating: 'ok',
        });

        setCurrentFeedback(feedback);

        // Save progress per plan
        if (planId) {
          savePlanProgress(planId, currentAtom.atom_id);
        }

        // Record result
        const result: ReviewResult = {
          atom: currentAtom,
          isCorrect: feedback.is_correct,
          newStatus: feedback.updated_status,
          previousStatus: currentAtom.status,
        };
        setResults((prev) => [...prev, result]);

        if (feedback.is_correct) {
          setStreak((s) => s + 1);
        } else {
          setStreak(0);
        }

        setStep('answered');
      } catch (e) {
        setError(e instanceof Error ? e.message : '提交失败');
      }
    },
    [currentCard, currentAtom, submitAnswer, planId]
  );

  // Next question
  const handleNext = useCallback(() => {
    const nextIdx = currentIndex + 1;
    if (nextIdx >= total) {
      // All atoms done — clear plan progress
      if (planId) clearPlanProgress(planId);
      onFinish(results);
      return;
    }
    setCurrentIndex(nextIdx);
    loadCard(atoms[nextIdx]);
  }, [currentIndex, total, atoms, results, onFinish, loadCard, planId]);

  // End early
  const handleEndSession = useCallback(() => {
    // Don't clear plan progress — user can resume next time
    onFinish(results);
  }, [results, onFinish]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-6 py-3">
        <button
          onClick={onExit}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          &#8592; 退出复习
        </button>
        <span className="text-sm font-medium text-foreground">
          {currentAtom?.title}
        </span>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {total}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-start justify-center px-6 py-8">
        <AnimatePresence mode="wait">
          {/* Loading */}
          {step === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto max-w-2xl space-y-4 pt-12"
            >
              <div className="h-32 animate-pulse rounded-xl border bg-muted/30" />
              <div className="h-28 animate-pulse rounded-xl border bg-muted/30" />
              {generateCard.isPending && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 3 }}
                  className="text-center text-sm text-muted-foreground"
                >
                  AI 正在思考...
                </motion.p>
              )}
            </motion.div>
          )}

          {/* Error */}
          {error && step === 'question' && !currentCard && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mx-auto max-w-2xl text-center"
            >
              <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                <p className="text-sm text-red-600">{error}</p>
                <button
                  onClick={() => currentAtom && loadCard(currentAtom)}
                  className="mt-3 rounded-md bg-red-600 px-4 py-2 text-[13px] font-medium text-white hover:bg-red-700"
                >
                  重试
                </button>
              </div>
            </motion.div>
          )}

          {/* Question */}
          {step === 'question' && currentCard && (
            <ReviewQuestion
              key={`q-${currentCard.session_id}`}
              card={currentCard}
              onSubmit={handleAnswerSubmit}
              isSubmitting={submitAnswer.isPending}
            />
          )}

          {/* Answered — show question + user answer + correct answer */}
          {step === 'answered' && currentCard && (
            <ReviewQuestion
              key={`a-${currentCard.session_id}`}
              card={currentCard}
              onSubmit={() => {}}
              isSubmitting={false}
              answeredMode
              userAnswer={currentAnswer}
              correctAnswer={currentFeedback?.correct_answer}
              isCorrect={currentFeedback?.is_correct}
              onNext={handleNext}
              isLastQuestion={currentIndex + 1 >= total}
              onEndSession={handleEndSession}
              streak={streak}
              remainingCount={total - currentIndex - 1}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
