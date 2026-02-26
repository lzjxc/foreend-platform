import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { knowledgeApi } from '@/api/knowledge';
import type {
  ReviewAtom,
  ReviewStats,
  ReviewCard,
  ReviewFeedback,
  SelfRating,
} from '@/types/knowledge';

export const reviewKeys = {
  all: ['review'] as const,
  queue: (domain?: string) => [...reviewKeys.all, 'queue', domain] as const,
  stats: (domain?: string) => [...reviewKeys.all, 'stats', domain] as const,
};

export function useReviewQueue(domain?: string) {
  return useQuery({
    queryKey: reviewKeys.queue(domain),
    queryFn: (): Promise<ReviewAtom[]> => knowledgeApi.getReviewQueue(domain),
  });
}

export function useReviewStats(domain?: string) {
  return useQuery({
    queryKey: reviewKeys.stats(domain),
    queryFn: (): Promise<ReviewStats> => knowledgeApi.getReviewStats(domain),
  });
}

export function useGenerateCard() {
  return useMutation({
    mutationFn: (atomId: string): Promise<ReviewCard> =>
      knowledgeApi.generateReviewCard(atomId),
  });
}

export function useSubmitAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      answer,
      selfRating,
    }: {
      sessionId: string;
      answer: string;
      selfRating: SelfRating;
    }): Promise<ReviewFeedback> =>
      knowledgeApi.submitReviewAnswer({
        session_id: sessionId,
        answer,
        self_rating: selfRating,
      }),
    onSuccess: () => {
      // Invalidate queue and stats after answer submission
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
    },
  });
}
