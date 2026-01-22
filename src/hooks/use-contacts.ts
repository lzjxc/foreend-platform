import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { Contact, ContactCreate, ContactUpdate } from '@/types';

// Query key factory for contacts
export const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...contactKeys.lists(), filters] as const,
  byPerson: (personId: string) => [...contactKeys.lists(), { personId }] as const,
  details: () => [...contactKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactKeys.details(), id] as const,
};

// Transform backend response to frontend format
function transformContact(data: Record<string, unknown>): Contact {
  return {
    id: data.id as string,
    person_id: data.person_id as string,
    type: data.contact_type as Contact['type'],
    value: (data.contact_value || '') as string,
    label: data.label as string | undefined,
    is_primary: data.is_primary as boolean,
    notes: data.notes as string | undefined,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

// Transform frontend create data to backend format
function transformCreateData(data: ContactCreate): Record<string, unknown> {
  return {
    contact_type: data.type,
    contact_value: data.value,
    label: data.label,
    is_primary: data.is_primary ?? false,
    notes: data.notes,
  };
}

// Transform frontend update data to backend format
function transformUpdateData(data: ContactUpdate): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (data.type !== undefined) result.contact_type = data.type;
  if (data.value !== undefined) result.contact_value = data.value;
  if (data.label !== undefined) result.label = data.label;
  if (data.is_primary !== undefined) result.is_primary = data.is_primary;
  if (data.notes !== undefined) result.notes = data.notes;
  return result;
}

// API functions
const contactsApi = {
  getByPerson: async (personId: string): Promise<Contact[]> => {
    const response = await apiClient.get(`/api/v1/persons/${personId}/contacts`);
    // Backend returns array in data field or directly
    const items = Array.isArray(response.data) ? response.data : (response.data?.data || []);
    return items.map(transformContact);
  },

  create: async (data: ContactCreate): Promise<Contact> => {
    const backendData = transformCreateData(data);
    const response = await apiClient.post(`/api/v1/persons/${data.person_id}/contacts`, backendData);
    // Backend returns { success: true, data: { id, message } }
    return {
      id: response.data?.data?.id || response.data?.id || '',
      person_id: data.person_id,
      type: data.type,
      value: data.value,
      label: data.label,
      is_primary: data.is_primary ?? false,
      notes: data.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  update: async ({ id, personId, data }: { id: string; personId: string; data: ContactUpdate }): Promise<Contact> => {
    const backendData = transformUpdateData(data);
    await apiClient.put(`/api/v1/persons/${personId}/contacts/${id}`, backendData);
    // Return a partial contact for cache update
    return {
      id,
      person_id: personId,
      type: data.type as Contact['type'],
      value: data.value || '',
      label: data.label,
      is_primary: data.is_primary ?? false,
      notes: data.notes,
      created_at: '',
      updated_at: new Date().toISOString(),
    };
  },

  delete: async ({ id, personId }: { id: string; personId: string }): Promise<void> => {
    await apiClient.delete(`/api/v1/persons/${personId}/contacts/${id}`);
  },
};

// Hooks
export function usePersonContacts(personId: string) {
  return useQuery({
    queryKey: contactKeys.byPerson(personId),
    queryFn: () => contactsApi.getByPerson(personId),
    staleTime: 5 * 60 * 1000,
    enabled: !!personId,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contactsApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.byPerson(data.person_id) });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: contactsApi.update,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.byPerson(data.person_id) });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, personId }: { id: string; personId: string }) =>
      contactsApi.delete({ id, personId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.byPerson(variables.personId) });
    },
  });
}
