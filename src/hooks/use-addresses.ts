import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { Address, AddressCreate, AddressUpdate } from '@/types';

// Query key factory for addresses
export const addressKeys = {
  all: ['addresses'] as const,
  lists: () => [...addressKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...addressKeys.lists(), filters] as const,
  byPerson: (personId: string) => [...addressKeys.lists(), { personId }] as const,
  details: () => [...addressKeys.all, 'detail'] as const,
  detail: (id: string) => [...addressKeys.details(), id] as const,
};

// API functions
const addressesApi = {
  getAll: async (): Promise<Address[]> => {
    const response = await apiClient.get('/api/v1/addresses');
    return response.data;
  },

  getByPerson: async (personId: string): Promise<Address[]> => {
    const response = await apiClient.get(`/api/v1/persons/${personId}/addresses`);
    return response.data;
  },

  getById: async (id: string): Promise<Address> => {
    const response = await apiClient.get(`/api/v1/addresses/${id}`);
    return response.data;
  },

  create: async (data: AddressCreate): Promise<Address> => {
    const response = await apiClient.post('/api/v1/addresses', data);
    return response.data;
  },

  update: async ({ id, data }: { id: string; data: AddressUpdate }): Promise<Address> => {
    const response = await apiClient.patch(`/api/v1/addresses/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/addresses/${id}`);
  },
};

// Hooks
export function useAddresses() {
  return useQuery({
    queryKey: addressKeys.lists(),
    queryFn: addressesApi.getAll,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePersonAddresses(personId: string) {
  return useQuery({
    queryKey: addressKeys.byPerson(personId),
    queryFn: () => addressesApi.getByPerson(personId),
    staleTime: 5 * 60 * 1000,
    enabled: !!personId,
  });
}

export function useAddress(id: string) {
  return useQuery({
    queryKey: addressKeys.detail(id),
    queryFn: () => addressesApi.getById(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addressesApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: addressKeys.lists() });
      queryClient.invalidateQueries({ queryKey: addressKeys.byPerson(data.person_id) });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addressesApi.update,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: addressKeys.lists() });
      queryClient.invalidateQueries({ queryKey: addressKeys.byPerson(data.person_id) });
      queryClient.setQueryData(addressKeys.detail(data.id), data);
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addressesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: addressKeys.lists() });
    },
  });
}
