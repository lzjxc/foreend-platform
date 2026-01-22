import { useState } from 'react';
import { RotateCcw, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTodayReview, useStartReview, useGradeWord } from '@/hooks/use-wordbook';
import { RATING_LABELS, type ReviewRating } from '@/types/wordbook';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ReviewSessionProps {
  userId?: string;
}

export function ReviewSession({ userId = 'default' }: ReviewSessionProps) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentCard, setCurrentCard] = useState<{ word_id: string; card: string } | null>(null);

  const { data: todayReview, isLoading: isTodayLoading, refetch: refetchToday } = useTodayReview(userId);
  const startReviewMutation = useStartReview();
  const gradeMutation = useGradeWord();

  const handleStartReview = async () => {
    setIsReviewing(true);
    setShowAnswer(false);
    try {
      const result = await startReviewMutation.mutateAsync({ user_id: userId });
      setCurrentCard({ word_id: result.word_id, card: result.card });
    } catch (error) {
      setIsReviewing(false);
    }
  };

  const handleGrade = async (rating: ReviewRating) => {
    if (!currentCard) return;

    try {
      await gradeMutation.mutateAsync({
        user_id: userId,
        word_id: currentCard.word_id,
        rating,
      });

      // Get next card
      setShowAnswer(false);
      try {
        const result = await startReviewMutation.mutateAsync({ user_id: userId });
        setCurrentCard({ word_id: result.word_id, card: result.card });
      } catch {
        // No more cards to review
        setIsReviewing(false);
        setCurrentCard(null);
        refetchToday();
      }
    } catch (error) {
      console.error('Grade error:', error);
    }
  };

  const handleEndReview = () => {
    setIsReviewing(false);
    setCurrentCard(null);
    setShowAnswer(false);
    refetchToday();
  };

  if (isTodayLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Not in review mode - show start screen
  if (!isReviewing) {
    const dueCount = todayReview?.due_count ?? 0;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            今日复习
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <div className="text-4xl font-bold text-primary mb-2">{dueCount}</div>
            <div className="text-muted-foreground">个单词待复习</div>
          </div>

          {dueCount > 0 ? (
            <Button
              onClick={handleStartReview}
              disabled={startReviewMutation.isPending}
              className="w-full"
              size="lg"
            >
              {startReviewMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              开始复习
            </Button>
          ) : (
            <div className="text-center text-green-600 font-medium">
              🎉 今日复习已完成！
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // In review mode
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="h-5 w-5" />
          复习中
        </CardTitle>
        <Button variant="outline" size="sm" onClick={handleEndReview}>
          结束复习
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentCard ? (
          <>
            {/* Card content */}
            <div
              className={`prose prose-sm dark:prose-invert max-w-none p-4 bg-muted/50 rounded-lg min-h-[200px] ${
                !showAnswer ? 'blur-sm select-none' : ''
              }`}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {currentCard.card}
              </ReactMarkdown>
            </div>

            {/* Show answer button or rating buttons */}
            {!showAnswer ? (
              <Button
                onClick={() => setShowAnswer(true)}
                className="w-full"
                size="lg"
              >
                显示答案
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-center text-muted-foreground">
                  你对这个单词的掌握程度？
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {([1, 2, 3, 4] as ReviewRating[]).map((rating) => (
                    <Button
                      key={rating}
                      variant={rating <= 2 ? 'outline' : 'default'}
                      onClick={() => handleGrade(rating)}
                      disabled={gradeMutation.isPending}
                      className={`flex-col h-auto py-3 ${
                        rating === 1
                          ? 'border-red-300 hover:bg-red-50 dark:hover:bg-red-950'
                          : rating === 2
                          ? 'border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950'
                          : rating === 3
                          ? 'bg-blue-500 hover:bg-blue-600'
                          : 'bg-green-500 hover:bg-green-600'
                      }`}
                    >
                      <span className="text-lg font-bold">{rating}</span>
                      <span className="text-xs">{RATING_LABELS[rating]}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
