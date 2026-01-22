import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { Person, PersonCreate, PersonUpdate } from '@/types';

// Query key factory for persons
export const personKeys = {
  all: ['persons'] as const,
  lists: () => [...personKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...personKeys.lists(), filters] as const,
  details: () => [...personKeys.all, 'detail'] as const,
  detail: (id: string) => [...personKeys.details(), id] as const,
};

// API response wrapper type
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// API functions
const personsApi = {
  getAll: async (): Promise<Person[]> => {
    const response = await apiClient.get<ApiResponse<Person[]>>('/api/v1/persons');
    return response.data.data;
  },

  getById: async (id: string): Promise<Person> => {
    const response = await apiClient.get<ApiResponse<Person>>(`/api/v1/persons/${id}`);
    return response.data.data;
  },

  create: async (data: PersonCreate): Promise<Person> => {
    const response = await apiClient.post<ApiResponse<Person>>('/api/v1/persons', data);
    return response.data.data;
  },

  update: async ({ id, data }: { id: string; data: PersonUpdate }): Promise<Person> => {
    const response = await apiClient.put<ApiResponse<Person>>(`/api/v1/persons/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/persons/${id}`);
  },
};

// Hooks
export function usePersons() {
  return useQuery({
    queryKey: personKeys.lists(),
    queryFn: personsApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePerson(id: string) {
  return useQuery({
    queryKey: personKeys.detail(id),
    queryFn: () => personsApi.getById(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
}

export function useCreatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: personsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personKeys.lists() });
    },
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: personsApi.update,
    onSuccess: (data, variables) => {
      // Invalidate both lists and detail queries
      queryClient.invalidateQueries({ queryKey: personKeys.lists() });
      queryClient.invalidateQueries({ queryKey: personKeys.detail(variables.id) });
      // Also set the data directly to avoid undefined state
      queryClient.setQueryData(personKeys.detail(variables.id), data);
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: personsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personKeys.lists() });
    },
  });
}
