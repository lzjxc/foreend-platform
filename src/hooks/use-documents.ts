import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import type { Document, DocumentCreate, DocumentUpdate } from '@/types';

// Query key factory for documents
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...documentKeys.lists(), filters] as const,
  byPerson: (personId: string) => [...documentKeys.lists(), { personId }] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  expiring: (days: number) => [...documentKeys.all, 'expiring', days] as const,
};

// API response wrapper type
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Backend document type (what API returns)
interface BackendDocument {
  id: string;
  person_id: string;
  doc_type: string;
  doc_number: string;
  issue_date?: string;
  expiry_date?: string;
  issuing_authority?: string;
  issuing_country?: string;
  status?: string;
  is_primary?: boolean;
  front_image_path?: string;
  back_image_path?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Map backend document to frontend document
function mapBackendToFrontend(doc: BackendDocument): Document {
  return {
    id: doc.id,
    person_id: doc.person_id,
    type: doc.doc_type as Document['type'],
    number: doc.doc_number,
    issue_date: doc.issue_date,
    expiry_date: doc.expiry_date,
    issuing_authority: doc.issuing_authority,
    notes: doc.notes,
    created_at: doc.created_at,
    updated_at: doc.updated_at,
  };
}

// Map frontend document create to backend format
function mapFrontendToBackend(data: Omit<DocumentCreate, 'person_id'>): Record<string, unknown> {
  return {
    doc_type: data.type,
    doc_number: data.number,
    issue_date: data.issue_date,
    expiry_date: data.expiry_date,
    issuing_authority: data.issuing_authority,
    notes: data.notes,
  };
}

// API functions
const documentsApi = {
  getByPerson: async (personId: string): Promise<Document[]> => {
    const response = await apiClient.get<ApiResponse<BackendDocument[]>>(
      `/api/v1/persons/${personId}/documents`
    );
    const backendDocs = response.data.data || [];
    return backendDocs.map(mapBackendToFrontend);
  },

  create: async (personId: string, data: Omit<DocumentCreate, 'person_id'>): Promise<Document> => {
    const response = await apiClient.post<ApiResponse<BackendDocument>>(
      `/api/v1/persons/${personId}/documents`,
      mapFrontendToBackend(data)
    );
    return mapBackendToFrontend(response.data.data);
  },

  update: async ({ personId, docId, data }: { personId: string; docId: string; data: DocumentUpdate }): Promise<Document> => {
    const response = await apiClient.put<ApiResponse<BackendDocument>>(
      `/api/v1/persons/${personId}/documents/${docId}`,
      mapFrontendToBackend(data as Omit<DocumentCreate, 'person_id'>)
    );
    return mapBackendToFrontend(response.data.data);
  },

  delete: async ({ personId, docId }: { personId: string; docId: string }): Promise<void> => {
    await apiClient.delete(`/api/v1/persons/${personId}/documents/${docId}`);
  },
};

// Hooks
export function usePersonDocuments(personId: string) {
  return useQuery({
    queryKey: documentKeys.byPerson(personId),
    queryFn: () => documentsApi.getByPerson(personId),
    staleTime: 5 * 60 * 1000,
    enabled: !!personId,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ personId, data }: { personId: string; data: Omit<DocumentCreate, 'person_id'> }) =>
      documentsApi.create(personId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.byPerson(data.person_id) });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentsApi.update,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.byPerson(data.person_id) });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.byPerson(variables.personId) });
    },
  });
}
