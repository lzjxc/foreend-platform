import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { MedicalInfo, MedicalInfoCreate, MedicalInfoUpdate } from '@/types';

// Query key factory for medical info
export const medicalKeys = {
  all: ['medical'] as const,
  lists: () => [...medicalKeys.all, 'list'] as const,
  byPerson: (personId: string) => [...medicalKeys.all, 'person', personId] as const,
  details: () => [...medicalKeys.all, 'detail'] as const,
  detail: (id: string) => [...medicalKeys.details(), id] as const,
};

// API functions
const medicalApi = {
  getAll: async (): Promise<MedicalInfo[]> => {
    const response = await apiClient.get('/api/v1/medical');
    return response.data;
  },

  getByPerson: async (personId: string): Promise<MedicalInfo | null> => {
    const response = await apiClient.get(`/api/v1/persons/${personId}/medical`);
    return response.data;
  },

  getById: async (id: string): Promise<MedicalInfo> => {
    const response = await apiClient.get(`/api/v1/medical/${id}`);
    return response.data;
  },

  create: async (data: MedicalInfoCreate): Promise<MedicalInfo> => {
    const response = await apiClient.post('/api/v1/medical', data);
    return response.data;
  },

  update: async ({ id, data }: { id: string; data: MedicalInfoUpdate }): Promise<MedicalInfo> => {
    const response = await apiClient.patch(`/api/v1/medical/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/medical/${id}`);
  },
};

// Hooks
export function useMedicalInfoList() {
  return useQuery({
    queryKey: medicalKeys.lists(),
    queryFn: medicalApi.getAll,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePersonMedicalInfo(personId: string) {
  return useQuery({
    queryKey: medicalKeys.byPerson(personId),
    queryFn: () => medicalApi.getByPerson(personId),
    staleTime: 5 * 60 * 1000,
    enabled: !!personId,
  });
}

export function useMedicalInfo(id: string) {
  return useQuery({
    queryKey: medicalKeys.detail(id),
    queryFn: () => medicalApi.getById(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
}

export function useCreateMedicalInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: medicalApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: medicalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: medicalKeys.byPerson(data.person_id) });
    },
  });
}

export function useUpdateMedicalInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: medicalApi.update,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: medicalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: medicalKeys.byPerson(data.person_id) });
      queryClient.setQueryData(medicalKeys.detail(data.id), data);
    },
  });
}

export function useDeleteMedicalInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: medicalApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicalKeys.lists() });
    },
  });
}
