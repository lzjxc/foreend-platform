import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { BankAccount, BankAccountCreate, BankAccountUpdate } from '@/types';

// Query key factory for bank accounts
export const bankAccountKeys = {
  all: ['bank-accounts'] as const,
  lists: () => [...bankAccountKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...bankAccountKeys.lists(), filters] as const,
  byPerson: (personId: string) => [...bankAccountKeys.lists(), { personId }] as const,
  details: () => [...bankAccountKeys.all, 'detail'] as const,
  detail: (id: string) => [...bankAccountKeys.details(), id] as const,
};

// API functions
const bankAccountsApi = {
  getAll: async (): Promise<BankAccount[]> => {
    const response = await apiClient.get('/api/v1/bank-accounts');
    return response.data;
  },

  getByPerson: async (personId: string): Promise<BankAccount[]> => {
    const response = await apiClient.get(`/api/v1/persons/${personId}/bank-accounts`);
    return response.data;
  },

  getById: async (id: string): Promise<BankAccount> => {
    const response = await apiClient.get(`/api/v1/bank-accounts/${id}`);
    return response.data;
  },

  create: async (data: BankAccountCreate): Promise<BankAccount> => {
    const response = await apiClient.post('/api/v1/bank-accounts', data);
    return response.data;
  },

  update: async ({ id, data }: { id: string; data: BankAccountUpdate }): Promise<BankAccount> => {
    const response = await apiClient.patch(`/api/v1/bank-accounts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/bank-accounts/${id}`);
  },
};

// Hooks
export function useBankAccounts() {
  return useQuery({
    queryKey: bankAccountKeys.lists(),
    queryFn: bankAccountsApi.getAll,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePersonBankAccounts(personId: string) {
  return useQuery({
    queryKey: bankAccountKeys.byPerson(personId),
    queryFn: () => bankAccountsApi.getByPerson(personId),
    staleTime: 5 * 60 * 1000,
    enabled: !!personId,
  });
}

export function useBankAccount(id: string) {
  return useQuery({
    queryKey: bankAccountKeys.detail(id),
    queryFn: () => bankAccountsApi.getById(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bankAccountsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.byPerson(data.person_id) });
    },
  });
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bankAccountsApi.update,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.byPerson(data.person_id) });
      queryClient.setQueryData(bankAccountKeys.detail(data.id), data);
    },
  });
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bankAccountsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bankAccountKeys.lists() });
    },
  });
}
