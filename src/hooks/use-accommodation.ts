import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lifeAppClient } from '@/api/client';
import type {
  AccommodationSearchInput,
  AccommodationSearchResult,
  ListingSummary,
  Listing,
  PaginatedResponse,
} from '@/types/life-app';

export const accommodationKeys = {
  all: ['accommodation'] as const,
  searches: () => [...accommodationKeys.all, 'searches'] as const,
  search: (id: string) => [...accommodationKeys.all, 'search', id] as const,
  listings: () => [...accommodationKeys.all, 'listings'] as const,
  listing: (id: string) => [...accommodationKeys.all, 'listing', id] as const,
  compare: (ids: string[]) => [...accommodationKeys.all, 'compare', ...ids] as const,
};

export function useAccommodationListings(page = 1, pageSize = 20, sortBy = 'total_price', order = 'asc') {
  return useQuery({
    queryKey: [...accommodationKeys.listings(), page, pageSize, sortBy, order],
    queryFn: async () => {
      const { data } = await lifeAppClient.get<PaginatedResponse<ListingSummary>>(
        `/api/v1/accommodation/listings?page=${page}&page_size=${pageSize}&sort_by=${sortBy}&order=${order}`
      );
      return data;
    },
    staleTime: 60_000,
  });
}

export function useAccommodationListing(listingId: string) {
  return useQuery({
    queryKey: accommodationKeys.listing(listingId),
    queryFn: async () => {
      const { data } = await lifeAppClient.get<Listing>(
        `/api/v1/accommodation/listings/${listingId}`
      );
      return data;
    },
    enabled: !!listingId,
  });
}

export function useCreateAccommodationSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AccommodationSearchInput) => {
      const { data } = await lifeAppClient.post<{ id: string; status: string }>(
        '/api/v1/accommodation/search',
        input
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: accommodationKeys.listings() });
    },
  });
}

export function useAccommodationSearchResult(searchId: string | null) {
  return useQuery({
    queryKey: accommodationKeys.search(searchId || ''),
    queryFn: async () => {
      const { data } = await lifeAppClient.get<AccommodationSearchResult>(
        `/api/v1/accommodation/search/${searchId}`
      );
      return data;
    },
    enabled: !!searchId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'completed' || status === 'failed' ? false : 3000;
    },
  });
}

export function useCompareAccommodations(ids: string[]) {
  return useQuery({
    queryKey: accommodationKeys.compare(ids),
    queryFn: async () => {
      const { data } = await lifeAppClient.get<{ listings: Listing[] }>(
        `/api/v1/accommodation/compare?ids=${ids.join(',')}`
      );
      return data.listings;
    },
    enabled: ids.length >= 2,
  });
}

export function useVerifyListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (listingId: string) => {
      const { data } = await lifeAppClient.post<{ id: string; is_valid: boolean | null }>(
        `/api/v1/accommodation/listings/${listingId}/verify`
      );
      return data;
    },
    onSuccess: (_, listingId) => {
      qc.invalidateQueries({ queryKey: accommodationKeys.listing(listingId) });
    },
  });
}
