/**
 * Starling Bank Adapter Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { starlingClient } from '@/api/client';

export interface StarlingBalance {
  cleared: number;
  effective: number;
  currency: string;
}

export interface StarlingTransaction {
  date: string;
  direction: 'IN' | 'OUT';
  amount: number;
  currency: string;
  counterparty_name: string;
}

export interface StarlinSummary {
  balance: StarlingBalance;
  transactions: StarlingTransaction[];
  account_uid: string;
}

export const starlingKeys = {
  all: ['starling'] as const,
  summary: () => [...starlingKeys.all, 'summary'] as const,
};

export function useStarlingBalance() {
  return useQuery({
    queryKey: starlingKeys.summary(),
    queryFn: async () => {
      const { data } = await starlingClient.get<StarlinSummary>('/api/v1/summary');
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
