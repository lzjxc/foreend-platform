import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { docClient } from '@/api/client';
import type {
  Document,
  DocumentCreate,
  DocumentUpdate,
  DocumentListParams,
  DocumentVersion,
  TimelineEvent,
  TimelineParams,
  TimelineSummary,
  ArgoApp,
  ArgoAppConfig,
  ArgoEnvVarUpdate,
  ArgoGitStatus,
  ArgoAppsByLayer,
  SearchResult,
  SearchParams,
  PaginatedResponse,
} from '@/types/doc-service';

// ==================== Query Keys ====================

export const docKeys = {
  all: ['docs'] as const,
  lists: () => [...docKeys.all, 'list'] as const,
  list: (params: DocumentListParams) => [...docKeys.lists(), params] as const,
  details: () => [...docKeys.all, 'detail'] as const,
  detail: (id: number) => [...docKeys.details(), id] as const,
  html: (id: number) => [...docKeys.all, 'html', id] as const,
  versions: (id: number) => [...docKeys.all, 'versions', id] as const,
};

export const timelineKeys = {
  all: ['timeline'] as const,
  lists: () => [...timelineKeys.all, 'list'] as const,
  list: (params: TimelineParams) => [...timelineKeys.lists(), params] as const,
  summary: (days?: number) => [...timelineKeys.all, 'summary', days] as const,
};

export const argoKeys = {
  all: ['argo'] as const,
  apps: () => [...argoKeys.all, 'apps'] as const,
  appsByLayer: () => [...argoKeys.all, 'apps-by-layer'] as const,
  config: (layer: string, name: string) => [...argoKeys.all, 'config', layer, name] as const,
  gitStatus: () => [...argoKeys.all, 'git-status'] as const,
};

export const searchKeys = {
  all: ['search'] as const,
  results: (params: SearchParams) => [...searchKeys.all, params] as const,
};

// ==================== Document Hooks ====================

export function useDocuments(params: DocumentListParams = {}) {
  return useQuery({
    queryKey: docKeys.list(params),
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.doc_type) queryParams.append('doc_type', params.doc_type);
      if (params.category) queryParams.append('category', params.category);
      if (params.service_id) queryParams.append('service_id', params.service_id);
      if (params.search) queryParams.append('search', params.search);
      if (params.skip !== undefined) queryParams.append('skip', String(params.skip));
      if (params.limit !== undefined) queryParams.append('limit', String(params.limit));

      const { data } = await docClient.get<PaginatedResponse<Document>>(
        `/api/v1/docs?${queryParams.toString()}`
      );
      return data;
    },
  });
}

export function useDocument(id: number | null) {
  return useQuery({
    queryKey: docKeys.detail(id!),
    queryFn: async () => {
      const { data } = await docClient.get<Document>(`/api/v1/docs/${id}`);
      return data;
    },
    enabled: id !== null && id > 0,
  });
}

export function useDocumentHtml(id: number | null) {
  return useQuery({
    queryKey: docKeys.html(id!),
    queryFn: async () => {
      const { data } = await docClient.get<string>(`/api/v1/docs/${id}/html`);
      return data;
    },
    enabled: id !== null && id > 0,
  });
}

export function useDocumentVersions(id: number | null) {
  return useQuery({
    queryKey: docKeys.versions(id!),
    queryFn: async () => {
      const { data } = await docClient.get<DocumentVersion[]>(`/api/v1/docs/${id}/versions`);
      return data;
    },
    enabled: id !== null && id > 0,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DocumentCreate) => {
      const { data } = await docClient.post<Document>('/api/v1/docs', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: docKeys.lists() });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: { id: number } & DocumentUpdate) => {
      const { data } = await docClient.put<Document>(`/api/v1/docs/${id}`, input);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: docKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: docKeys.lists() });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await docClient.delete(`/api/v1/docs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: docKeys.lists() });
    },
  });
}

// ==================== Timeline Hooks ====================

export function useTimeline(params: TimelineParams = {}) {
  return useQuery({
    queryKey: timelineKeys.list(params),
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params.event_type) queryParams.append('event_type', params.event_type);
      if (params.service_id) queryParams.append('service_id', params.service_id);
      if (params.repo) queryParams.append('repo', params.repo);
      if (params.days !== undefined) queryParams.append('days', String(params.days));
      if (params.skip !== undefined) queryParams.append('skip', String(params.skip));
      if (params.limit !== undefined) queryParams.append('limit', String(params.limit));

      const { data } = await docClient.get<PaginatedResponse<TimelineEvent>>(
        `/api/v1/timeline?${queryParams.toString()}`
      );
      return data.data;  // Extract array from paginated response
    },
  });
}

export function useTimelineSummary(days: number = 7) {
  return useQuery({
    queryKey: timelineKeys.summary(days),
    queryFn: async () => {
      const { data } = await docClient.get<TimelineSummary>(
        `/api/v1/timeline/summary?days=${days}`
      );
      return data;
    },
  });
}

// ==================== ArgoCD Hooks ====================

export function useArgoApps() {
  return useQuery({
    queryKey: argoKeys.apps(),
    queryFn: async () => {
      const { data } = await docClient.get<{ apps: ArgoApp[]; total: number }>('/api/v1/argo-config/apps');
      return data.apps;
    },
  });
}

export function useArgoAppsByLayer() {
  return useQuery({
    queryKey: argoKeys.appsByLayer(),
    queryFn: async () => {
      const { data } = await docClient.get<{ apps: ArgoApp[]; total: number }>('/api/v1/argo-config/apps');
      // Group apps by layer
      const byLayer: ArgoAppsByLayer = {};
      for (const app of data.apps) {
        if (!byLayer[app.layer]) {
          byLayer[app.layer] = [];
        }
        byLayer[app.layer].push(app);
      }
      return byLayer;
    },
  });
}

export function useArgoAppConfig(layer: string | null, name: string | null) {
  return useQuery({
    queryKey: argoKeys.config(layer!, name!),
    queryFn: async () => {
      const { data } = await docClient.get<ArgoAppConfig>(
        `/api/v1/argo-config/apps/${layer}/${name}`
      );
      return data;
    },
    enabled: !!layer && !!name,
  });
}

export function useArgoGitStatus() {
  return useQuery({
    queryKey: argoKeys.gitStatus(),
    queryFn: async () => {
      const { data } = await docClient.get<ArgoGitStatus>('/api/v1/argo-config/git/status');
      return data;
    },
  });
}

export function useUpdateArgoEnvVar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      layer,
      name,
      ...update
    }: { layer: string; name: string } & ArgoEnvVarUpdate) => {
      const { data } = await docClient.put<ArgoAppConfig>(
        `/api/v1/argo-config/apps/${layer}/${name}/env`,
        update
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: argoKeys.config(variables.layer, variables.name) });
      queryClient.invalidateQueries({ queryKey: argoKeys.gitStatus() });
    },
  });
}

export function useArgoGitPush() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message?: string) => {
      const { data } = await docClient.post('/api/v1/argo-config/git/push', {
        message,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: argoKeys.gitStatus() });
    },
  });
}

// ==================== Search Hooks ====================

export function useSearch(params: SearchParams) {
  return useQuery({
    queryKey: searchKeys.results(params),
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append('query', params.query);
      if (params.types) {
        params.types.forEach((t) => queryParams.append('types', t));
      }
      if (params.limit !== undefined) queryParams.append('limit', String(params.limit));

      const { data } = await docClient.get<SearchResult[]>(
        `/api/v1/search?${queryParams.toString()}`
      );
      return data;
    },
    enabled: params.query.length > 0,
  });
}
