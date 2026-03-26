import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { WebCredential, WebCredentialCreate, WebCredentialUpdate } from '@/types/credential';

// Query key factory
export const credentialKeys = {
  all: ['credentials'] as const,
  lists: () => [...credentialKeys.all, 'list'] as const,
  byPerson: (personId: string) => [...credentialKeys.lists(), { personId }] as const,
  search: (q: string) => [...credentialKeys.all, 'search', q] as const,
};

// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// API functions
const credentialsApi = {
  getByPerson: async (personId: string): Promise<WebCredential[]> => {
    const response = await apiClient.get<ApiResponse<WebCredential[]>>(
      `/api/v1/persons/${personId}/credentials`
    );
    return response.data.data || [];
  },

  create: async (personId: string, data: WebCredentialCreate): Promise<WebCredential> => {
    const response = await apiClient.post<ApiResponse<WebCredential>>(
      `/api/v1/persons/${personId}/credentials`,
      data
    );
    return response.data.data;
  },

  update: async ({ personId, credentialId, data }: {
    personId: string;
    credentialId: string;
    data: WebCredentialUpdate;
  }): Promise<WebCredential> => {
    const response = await apiClient.put<ApiResponse<WebCredential>>(
      `/api/v1/persons/${personId}/credentials/${credentialId}`,
      data
    );
    return response.data.data;
  },

  delete: async ({ personId, credentialId }: {
    personId: string;
    credentialId: string;
  }): Promise<void> => {
    await apiClient.delete(`/api/v1/persons/${personId}/credentials/${credentialId}`);
  },

  search: async (q: string, personName?: string): Promise<WebCredential[]> => {
    const params: Record<string, string> = { q };
    if (personName) params.person_name = personName;
    const response = await apiClient.get<ApiResponse<WebCredential[]>>(
      '/api/v1/credentials/search',
      { params }
    );
    return response.data.data || [];
  },
};

// Hooks
export function usePersonCredentials(personId: string) {
  return useQuery({
    queryKey: credentialKeys.byPerson(personId),
    queryFn: () => credentialsApi.getByPerson(personId),
    staleTime: 5 * 60 * 1000,
    enabled: !!personId,
  });
}

export function useCreateCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ personId, data }: { personId: string; data: WebCredentialCreate }) =>
      credentialsApi.create(personId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: credentialKeys.byPerson(data.person_id) });
    },
  });
}

export function useUpdateCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: credentialsApi.update,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: credentialKeys.byPerson(data.person_id) });
    },
  });
}

export function useDeleteCredential() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: credentialsApi.delete,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: credentialKeys.byPerson(variables.personId) });
    },
  });
}

export function useSearchCredentials(q: string, personName?: string) {
  return useQuery({
    queryKey: credentialKeys.search(q),
    queryFn: () => credentialsApi.search(q, personName),
    staleTime: 30 * 1000,
    enabled: q.length >= 2,
  });
}
