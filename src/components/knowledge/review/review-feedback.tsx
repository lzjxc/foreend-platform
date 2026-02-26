import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ReviewFeedback as ReviewFeedbackType, SelfRating } from '@/types/knowledge';

interface ReviewFeedbackProps {
  feedback: ReviewFeedbackType;
  onRate: (rating: SelfRating) => void;
}

const RATINGS: { value: SelfRating; emoji: string; label: string }[] = [
  { value: 'easy', emoji: '\uD83D\uDE0A', label: '容易' },
  { value: 'ok', emoji: '\uD83D\uDE10', label: '还行' },
  { value: 'hard', emoji: '\uD83D\uDE13', label: '较难' },
];

export function ReviewFeedback({ feedback, onRate }: ReviewFeedbackProps) {
  const [selected, setSelected] = useState<SelfRating | null>(null);

  const handleRate = (rating: SelfRating) => {
    if (selected) return;
    setSelected(rating);
    setTimeout(() => onRate(rating), 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      {/* Feedback card */}
      <div
        className={`rounded-xl border p-6 ${
          feedback.is_correct
            ? 'border-green-200 bg-green-50/50'
            : 'border-red-200 bg-red-50/50'
        }`}
      >
        <div className="flex items-center gap-2 text-base font-semibold">
          {feedback.is_correct ? (
            <span className="text-green-700">&#10003; 回答基本正确</span>
          ) : (
            <span className="text-red-700">&#10007; 回答有误</span>
          )}
        </div>

        <div className="mt-4 text-sm leading-relaxed text-foreground">
          <span className="font-medium text-muted-foreground">AI 反馈：</span>
          <p className="mt-1">{feedback.feedback}</p>
        </div>

        {!feedback.is_correct && feedback.correct_answer && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-sm">
            <span className="font-medium text-blue-700">参考答案：</span>
            <p className="mt-1 text-blue-900">{feedback.correct_answer}</p>
          </div>
        )}
      </div>

      {/* Self rating */}
      <div className="text-center">
        <p className="mb-3 text-sm text-muted-foreground">你觉得这道题：</p>
        <div className="flex items-center justify-center gap-4">
          {RATINGS.map((r) => (
            <button
              key={r.value}
              onClick={() => handleRate(r.value)}
              disabled={selected !== null}
              className={`flex flex-col items-center gap-1 rounded-xl border px-6 py-3 transition-all ${
                selected === r.value
                  ? 'border-primary bg-primary/10 scale-105'
                  : selected !== null
                    ? 'opacity-40 cursor-not-allowed'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-accent'
              }`}
            >
              <span className="text-2xl">{r.emoji}</span>
              <span className="text-[12px] font-medium">{r.label}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
