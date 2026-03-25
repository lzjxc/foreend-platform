import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lifeAppClient, msgGwClient } from '@/api/client';
import type {
  Property,
  PropertyCreate,
  PropertyUpdate,
  Tenancy,
  TenancyCreate,
  TenancyUpdate,
  UtilityCreate,
  UtilityUpdate,
  BillCreate,
  BillUpdate,
  HousingDocument,
  EmailLink,
  EmailSyncResult,
  InitFromEmailResult,
  PaginatedResponse,
} from '@/types/housing';

// --- Query Keys ---

export const housingKeys = {
  all: ['housing'] as const,
  properties: () => [...housingKeys.all, 'properties'] as const,
  propertyList: (filters?: Record<string, unknown>) =>
    [...housingKeys.properties(), 'list', filters] as const,
  propertyDetail: (id: string) =>
    [...housingKeys.properties(), 'detail', id] as const,
  tenancies: () => [...housingKeys.all, 'tenancies'] as const,
  tenancyDetail: (id: string) =>
    [...housingKeys.tenancies(), 'detail', id] as const,
};

// --- Property Queries ---

export function useProperties(
  page = 1,
  pageSize = 10,
  search?: string,
  city?: string
) {
  const filters = { page, pageSize, search, city };
  return useQuery({
    queryKey: housingKeys.propertyList(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('page_size', String(pageSize));
      if (search) params.set('search', search);
      if (city) params.set('city', city);
      const { data } = await lifeAppClient.get<PaginatedResponse<Property>>(
        `/api/v1/housing/properties?${params}`
      );
      return data;
    },
    staleTime: 60_000,
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: housingKeys.propertyDetail(id),
    queryFn: async () => {
      const { data } = await lifeAppClient.get<Property>(
        `/api/v1/housing/properties/${id}`
      );
      return data;
    },
    enabled: !!id,
  });
}

// --- Property Mutations ---

export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: PropertyCreate) => {
      const { data } = await lifeAppClient.post<Property>(
        '/api/v1/housing/properties',
        input
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: housingKeys.properties() });
    },
  });
}

export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & PropertyUpdate) => {
      const { data } = await lifeAppClient.patch<Property>(
        `/api/v1/housing/properties/${id}`,
        input
      );
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: housingKeys.propertyDetail(variables.id) });
      qc.invalidateQueries({ queryKey: housingKeys.properties() });
    },
  });
}

export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await lifeAppClient.delete(`/api/v1/housing/properties/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: housingKeys.properties() });
    },
  });
}

// --- Tenancy Queries ---

export function useTenancy(id: string) {
  return useQuery({
    queryKey: housingKeys.tenancyDetail(id),
    queryFn: async () => {
      const { data } = await lifeAppClient.get<Tenancy>(
        `/api/v1/housing/tenancies/${id}`
      );
      return data;
    },
    enabled: !!id,
  });
}

// --- Tenancy Mutations ---

export function useCreateTenancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: TenancyCreate) => {
      const { data } = await lifeAppClient.post<Tenancy>(
        '/api/v1/housing/tenancies',
        input
      );
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: housingKeys.propertyDetail(data.property_id) });
      qc.invalidateQueries({ queryKey: housingKeys.properties() });
    },
  });
}

export function useUpdateTenancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & TenancyUpdate) => {
      const { data } = await lifeAppClient.patch<Tenancy>(
        `/api/v1/housing/tenancies/${id}`,
        input
      );
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: housingKeys.tenancyDetail(data.id) });
      qc.invalidateQueries({ queryKey: housingKeys.propertyDetail(data.property_id) });
      qc.invalidateQueries({ queryKey: housingKeys.properties() });
    },
  });
}

export function useDeleteTenancy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, propertyId }: { id: string; propertyId: string }) => {
      await lifeAppClient.delete(`/api/v1/housing/tenancies/${id}`);
      return { propertyId };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: housingKeys.propertyDetail(result.propertyId) });
      qc.invalidateQueries({ queryKey: housingKeys.properties() });
    },
  });
}

// --- Utility Mutations (no individual delete per spec) ---

export function useCreateUtility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tenancyId, ...input }: { tenancyId: string } & UtilityCreate) => {
      const { data } = await lifeAppClient.post(
        `/api/v1/housing/tenancies/${tenancyId}/utilities`,
        input
      );
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: housingKeys.tenancyDetail(variables.tenancyId) });
    },
  });
}

export function useUpdateUtility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      tenancyId,
      ...input
    }: { id: string; tenancyId: string } & UtilityUpdate) => {
      const { data } = await lifeAppClient.patch(
        `/api/v1/housing/utilities/${id}`,
        input
      );
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: housingKeys.tenancyDetail(variables.tenancyId) });
    },
  });
}

// --- Bill Mutations (no individual delete per spec) ---

export function useCreateBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      utilityId,
      tenancyId,
      ...input
    }: { utilityId: string; tenancyId: string } & BillCreate) => {
      const { data } = await lifeAppClient.post(
        `/api/v1/housing/utilities/${utilityId}/bills`,
        input
      );
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: housingKeys.tenancyDetail(variables.tenancyId) });
    },
  });
}

export function useUpdateBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      tenancyId,
      ...input
    }: { id: string; tenancyId: string } & BillUpdate) => {
      const { data } = await lifeAppClient.patch(
        `/api/v1/housing/bills/${id}`,
        input
      );
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: housingKeys.tenancyDetail(variables.tenancyId) });
    },
  });
}

// --- Document Mutations (no individual delete per spec) ---

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tenancyId,
      file,
      type,
      name,
      sourceEmailId,
    }: {
      tenancyId: string;
      file: File;
      type: string;
      name: string;
      sourceEmailId?: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('name', name);
      if (sourceEmailId) formData.append('source_email_id', sourceEmailId);
      const { data } = await lifeAppClient.post<HousingDocument>(
        `/api/v1/housing/tenancies/${tenancyId}/documents`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: housingKeys.tenancyDetail(data.tenancy_id) });
    },
  });
}

export function useDownloadDocument() {
  return useMutation({
    mutationFn: async (documentId: string) => {
      const { data } = await lifeAppClient.get<{ download_url: string }>(
        `/api/v1/housing/documents/${documentId}/download`
      );
      window.open(data.download_url, '_blank');
      return data;
    },
  });
}

// --- Email Link Mutations ---

export function useSyncEmails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tenancyId,
      dateFrom,
      dateTo,
    }: {
      tenancyId: string;
      dateFrom?: string;
      dateTo?: string;
    }) => {
      const body: Record<string, string> = {};
      if (dateFrom) body.date_from = dateFrom;
      if (dateTo) body.date_to = dateTo;
      const { data } = await lifeAppClient.post<EmailSyncResult>(
        `/api/v1/housing/tenancies/${tenancyId}/emails/sync`,
        body
      );
      return data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: housingKeys.tenancyDetail(variables.tenancyId) });
    },
  });
}

export function useBindEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tenancyId,
      emailId,
    }: {
      tenancyId: string;
      emailId: string;
    }) => {
      const { data } = await lifeAppClient.post<EmailLink>(
        `/api/v1/housing/tenancies/${tenancyId}/emails`,
        { email_id: emailId }
      );
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: housingKeys.tenancyDetail(data.tenancy_id) });
    },
  });
}

export function useUnbindEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      linkId,
      tenancyId,
    }: {
      linkId: string;
      tenancyId: string;
    }) => {
      await lifeAppClient.delete(`/api/v1/housing/email-links/${linkId}`);
      return { tenancyId };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: housingKeys.tenancyDetail(result.tenancyId) });
    },
  });
}

// --- Init From Email ---

export function useInitFromEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (emailId: string) => {
      const { data } = await lifeAppClient.post<InitFromEmailResult>(
        '/api/v1/housing/init-from-email',
        { email_id: emailId }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: housingKeys.properties() });
    },
  });
}

// --- Email Search (for init dialog, uses msgGwClient) ---

export function useSearchEmails(search: string, page = 1, size = 20) {
  return useQuery({
    queryKey: ['emails', 'search', search, page, size],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('search', search);
      params.set('page', String(page));
      params.set('size', String(size));
      const { data } = await msgGwClient.get(`/api/v1/emails?${params}`);
      return data;
    },
    enabled: search.length >= 2,
    staleTime: 30_000,
  });
}
