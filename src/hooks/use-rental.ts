import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lifeAppClient } from '@/api/client';
import type {
  RentalSearchInput,
  RentalSearchResult,
  PropertySummary,
  Property,
  PaginatedResponse,
} from '@/types/life-app';

export const rentalKeys = {
  all: ['rental'] as const,
  searches: () => [...rentalKeys.all, 'searches'] as const,
  search: (id: string) => [...rentalKeys.all, 'search', id] as const,
  properties: () => [...rentalKeys.all, 'properties'] as const,
  property: (id: string) => [...rentalKeys.all, 'property', id] as const,
};

export function useRentalProperties(page = 1, pageSize = 20, sortBy = 'price_pcm', order = 'asc') {
  return useQuery({
    queryKey: [...rentalKeys.properties(), page, pageSize, sortBy, order],
    queryFn: async () => {
      const { data } = await lifeAppClient.get<PaginatedResponse<PropertySummary>>(
        `/api/v1/rental/properties?page=${page}&page_size=${pageSize}&sort_by=${sortBy}&order=${order}`
      );
      return data;
    },
    staleTime: 60_000,
  });
}

export function useRentalProperty(propertyId: string) {
  return useQuery({
    queryKey: rentalKeys.property(propertyId),
    queryFn: async () => {
      const { data } = await lifeAppClient.get<Property>(
        `/api/v1/rental/properties/${propertyId}`
      );
      return data;
    },
    enabled: !!propertyId,
  });
}

export function useCreateRentalSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RentalSearchInput) => {
      const { data } = await lifeAppClient.post<{ id: string; status: string }>(
        '/api/v1/rental/search',
        input
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rentalKeys.properties() });
    },
  });
}

export function useRentalSearchResult(searchId: string | null) {
  return useQuery({
    queryKey: rentalKeys.search(searchId || ''),
    queryFn: async () => {
      const { data } = await lifeAppClient.get<RentalSearchResult>(
        `/api/v1/rental/search/${searchId}`
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
