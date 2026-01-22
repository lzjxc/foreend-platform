import { Loader2, Calendar, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useWordCard } from '@/hooks/use-wordbook';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface WordCardDetailProps {
  wordId: string | null;
  userId?: string;
  onClose: () => void;
}

export function WordCardDetail({ wordId, userId = 'default', onClose }: WordCardDetailProps) {
  const { data: wordCard, isLoading } = useWordCard(wordId ?? '', userId);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '从未';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={!!wordId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>单词详情</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : wordCard ? (
          <div className="space-y-4">
            {/* Card content */}
            <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-muted/50 rounded-lg">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {wordCard.card}
              </ReactMarkdown>
            </div>

            {/* Review info */}
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <RotateCcw className="h-4 w-4" />
                <span>复习次数: {wordCard.review_count ?? 0}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>上次复习: {formatDate(wordCard.last_review)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>下次复习: {formatDate(wordCard.next_review)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            未找到单词信息
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
