import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RotateCcw, Map } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { usePlanReviewQueue } from '@/hooks/use-plans';
import { PageTabs } from '@/components/ui/page-tabs';
import { ReviewQueue } from '@/components/knowledge/review/review-queue';
import { ReviewSession, getPlanProgress } from '@/components/knowledge/review/review-session';
import { ReviewSummary, type ReviewResult } from '@/components/knowledge/review/review-summary';
import type { ReviewAtom } from '@/types/knowledge';

const reviewTabs = [
  { path: '/knowledge/review', label: '知识复习', icon: RotateCcw, end: true },
  { path: '/knowledge/review/plans', label: '学习计划', icon: Map },
];

type PageView = 'queue' | 'reviewing' | 'summary';

export default function KnowledgeReviewPage() {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('planId') || undefined;

  const [view, setView] = useState<PageView>('queue');
  const [reviewAtoms, setReviewAtoms] = useState<ReviewAtom[]>([]);
  const [results, setResults] = useState<ReviewResult[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | undefined>(planId);
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const prevCollapsed = useRef(sidebarCollapsed);
  const autoStarted = useRef(false);

  // Fetch plan-specific review queue when planId is provided
  const { data: planQueue, isLoading: planQueueLoading } = usePlanReviewQueue(planId || '');

  // Auto-start plan review when navigating from plan detail
  useEffect(() => {
    if (planId && planQueue && planQueue.length > 0 && !autoStarted.current && !planQueueLoading) {
      autoStarted.current = true;
      // Filter out already-answered atoms from localStorage
      const completed = getPlanProgress(planId);
      const remaining = planQueue.filter((a) => !completed.includes(a.atom_id));
      if (remaining.length > 0) {
        setActivePlanId(planId);
        setReviewAtoms(remaining);
        setResults([]);
        prevCollapsed.current = sidebarCollapsed;
        setSidebarCollapsed(true);
        setView('reviewing');
      }
      // If all atoms already answered, stay on queue page
    }
  }, [planId, planQueue, planQueueLoading, sidebarCollapsed, setSidebarCollapsed]);

  // Collapse sidebar on entering review, restore on exit
  const enterFocusMode = useCallback(() => {
    prevCollapsed.current = sidebarCollapsed;
    setSidebarCollapsed(true);
  }, [sidebarCollapsed, setSidebarCollapsed]);

  const exitFocusMode = useCallback(() => {
    setSidebarCollapsed(prevCollapsed.current);
  }, [setSidebarCollapsed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (view === 'reviewing') {
        setSidebarCollapsed(prevCollapsed.current);
      }
    };
  }, [view, setSidebarCollapsed]);

  // Start review with a list of atoms
  const handleStartReview = useCallback(
    (atoms: ReviewAtom[], forPlanId?: string) => {
      setActivePlanId(forPlanId);
      setReviewAtoms(atoms);
      setResults([]);
      enterFocusMode();
      setView('reviewing');
    },
    [enterFocusMode]
  );

  // Start review with a single atom
  const handleStartSingle = useCallback(
    (atom: ReviewAtom) => {
      handleStartReview([atom]);
    },
    [handleStartReview]
  );

  // Finish review session
  const handleFinish = useCallback(
    (sessionResults: ReviewResult[]) => {
      setResults(sessionResults);
      exitFocusMode();
      setView('summary');
    },
    [exitFocusMode]
  );

  // Exit review early
  const handleExit = useCallback(() => {
    exitFocusMode();
    setView('queue');
  }, [exitFocusMode]);

  // Retry wrong answers
  const handleRetryWrong = useCallback(() => {
    const wrongAtoms = results
      .filter((r) => !r.isCorrect)
      .map((r) => r.atom);
    if (wrongAtoms.length > 0) {
      handleStartReview(wrongAtoms, activePlanId);
    }
  }, [results, handleStartReview, activePlanId]);

  // Back to queue
  const handleBackToQueue = useCallback(() => {
    setView('queue');
  }, []);

  switch (view) {
    case 'queue':
      return (
        <>
          <PageTabs tabs={reviewTabs} />
          <ReviewQueue
            onStartReview={handleStartReview}
            onStartSingle={handleStartSingle}
          />
        </>
      );

    case 'reviewing':
      return (
        <ReviewSession
          atoms={reviewAtoms}
          planId={activePlanId}
          onFinish={handleFinish}
          onExit={handleExit}
        />
      );

    case 'summary':
      return (
        <ReviewSummary
          results={results}
          onRetryWrong={handleRetryWrong}
          onBackToQueue={handleBackToQueue}
        />
      );
  }
}
