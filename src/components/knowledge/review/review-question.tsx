import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { knowledgeApi } from '@/api/knowledge';
import type { ReviewCard } from '@/types/knowledge';

interface ReviewQuestionProps {
  card: ReviewCard;
  onSubmit: (answer: string) => void;
  isSubmitting: boolean;
}

export function ReviewQuestion({ card, onSubmit, isSubmitting }: ReviewQuestionProps) {
  const [answer, setAnswer] = useState('');
  const [docOpen, setDocOpen] = useState(false);
  const [docContent, setDocContent] = useState<string | null>(null);
  const [docLoading, setDocLoading] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
    }
  };

  const handleToggleDoc = async () => {
    if (docOpen) {
      setDocOpen(false);
      return;
    }
    setDocOpen(true);
    if (docContent !== null) return; // already loaded
    setDocLoading(true);
    try {
      const atom = await knowledgeApi.getAtom(card.atom_id);
      setDocContent(atom.raw_content || atom.summary || '暂无详细文档');
    } catch {
      setDocContent('加载文档失败');
    } finally {
      setDocLoading(false);
    }
  };

  const canSubmit = answer.trim().length > 0 && !isSubmitting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      {/* Question */}
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-lg leading-relaxed text-foreground">{card.question}</p>
        {card.hint && (
          <p className="mt-3 text-[13px] text-muted-foreground">
            <span className="mr-1">&#128161;</span> {card.hint}
          </p>
        )}

        {/* View Documentation toggle */}
        <button
          onClick={handleToggleDoc}
          className="mt-4 flex items-center gap-1.5 text-[13px] text-primary/80 transition-colors hover:text-primary"
        >
          <FileText className="h-3.5 w-3.5" />
          查看文档
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${docOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {docOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 max-h-[400px] overflow-y-auto rounded-lg border bg-muted/30 p-4">
                {docLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    加载中...
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-pre:bg-muted prose-pre:text-foreground prose-code:text-primary prose-table:text-sm">
                    <ReactMarkdown>{docContent || ''}</ReactMarkdown>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Answer input */}
      <div className="relative">
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你的回答..."
          rows={5}
          disabled={isSubmitting}
          className="w-full resize-none rounded-xl border border-input bg-transparent p-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring disabled:opacity-50"
          style={{ minHeight: 120 }}
        />
        <span className="absolute bottom-3 right-3 text-[11px] text-muted-foreground">
          {answer.length} 字
        </span>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          onClick={() => canSubmit && onSubmit(answer.trim())}
          disabled={!canSubmit}
          className={`rounded-md px-6 py-2.5 text-sm font-semibold transition-all ${
            canSubmit
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'cursor-not-allowed bg-muted text-muted-foreground'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              提交中...
            </span>
          ) : (
            '提交回答'
          )}
        </button>
      </div>
    </motion.div>
  );
}
