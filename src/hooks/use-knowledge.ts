import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { knowledgeApi } from '@/api/knowledge';
import { uploadToFileGateway } from '@/api/file-gateway';
import type {
  KnowledgeAtom,
  CaptureMode,
  CaptureResponse,
  AtomsPage,
  AtomUpdateData,
  OntologyTree,
  SourceEnums,
  PreviewResponse,
  ConfirmRequest,
  OntologyGaps,
  AtomConnectionsResponse,
  GraphData,
  GraphLevel,
  HierarchyGraphData,
  McpSource,
  McpResource,
} from '@/types/knowledge';

// Query key factory
export const knowledgeKeys = {
  all: ['knowledge'] as const,
  atoms: (page?: number, filters?: { domain?: string; source_lv1?: string; source_lv2?: string; source_lv3?: string }) =>
    [...knowledgeKeys.all, 'atoms', { page, ...filters }] as const,
  atom: (id: string) => [...knowledgeKeys.all, 'atom', id] as const,
  search: (query: string) => [...knowledgeKeys.all, 'search', query] as const,
  ontology: () => [...knowledgeKeys.all, 'ontology'] as const,
  ontologyGaps: () => [...knowledgeKeys.all, 'ontologyGaps'] as const,
  sourceEnums: () => [...knowledgeKeys.all, 'sourceEnums'] as const,
  atomConnections: (id: string) => [...knowledgeKeys.all, 'connections', id] as const,
  graphData: (domain?: string) => [...knowledgeKeys.all, 'graph', { domain }] as const,
  hierarchyGraph: (level: string, domain?: string, topic?: string) =>
    [...knowledgeKeys.all, 'hierarchyGraph', { level, domain, topic }] as const,
};

// Get paginated atoms list
export function useAtoms(
  page: number = 1,
  filters?: { domain?: string; source_lv1?: string; source_lv2?: string; source_lv3?: string },
) {
  return useQuery({
    queryKey: knowledgeKeys.atoms(page, filters),
    queryFn: (): Promise<AtomsPage> => knowledgeApi.getAtoms(page, filters),
  });
}

// Get single atom by ID
export function useAtom(id: string) {
  return useQuery({
    queryKey: knowledgeKeys.atom(id),
    queryFn: (): Promise<KnowledgeAtom> => knowledgeApi.getAtom(id),
    enabled: !!id,
  });
}

// Capture text - mutation
export function useCapture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: {
      text: string;
      source?: string;
      mode?: CaptureMode;
      sourceOverride?: {
        lv1?: string;
        lv2?: string;
        lv3?: string;
        lv4?: string;
      };
    }): Promise<CaptureResponse> => {
      return knowledgeApi.captureText(
        request.text,
        request.source,
        request.mode,
        request.sourceOverride
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...knowledgeKeys.all, 'atoms'],
      });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.ontology() });
    },
  });
}

// Search atoms
export function useSearch(query: string) {
  return useQuery({
    queryKey: knowledgeKeys.search(query),
    queryFn: () => knowledgeApi.searchAtoms(query),
    enabled: query.length >= 2,
  });
}

// Get ontology tree
export function useOntology() {
  return useQuery({
    queryKey: knowledgeKeys.ontology(),
    queryFn: (): Promise<OntologyTree> => knowledgeApi.getOntology(),
    staleTime: 5 * 60 * 1000,
  });
}

// Get source enum values
export function useSourceEnums() {
  return useQuery({
    queryKey: knowledgeKeys.sourceEnums(),
    queryFn: (): Promise<SourceEnums> => knowledgeApi.getSourceEnums(),
    staleTime: 10 * 60 * 1000,
  });
}

// Create a new source enum value - mutation
export function useCreateSourceEnum() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: {
      level: string;
      value: string;
    }): Promise<{ level: string; value: string }> => {
      return knowledgeApi.createSourceEnum(request.level, request.value);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.sourceEnums() });
    },
  });
}

// Update an atom - mutation
export function useUpdateAtom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: {
      id: string;
      data: AtomUpdateData;
    }): Promise<KnowledgeAtom> => {
      return knowledgeApi.updateAtom(request.id, request.data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.atom(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: [...knowledgeKeys.all, 'atoms'],
      });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.ontology() });
    },
  });
}

// Delete an atom - mutation
export function useDeleteAtom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      return knowledgeApi.deleteAtom(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...knowledgeKeys.all, 'atoms'],
      });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.ontology() });
    },
  });
}

// Preview capture (2-step: step 1) — async polling
export function useCapturePreview() {
  return useMutation({
    mutationFn: async (request: {
      text: string;
      mode?: CaptureMode;
      source?: string;
    }): Promise<PreviewResponse> => {
      // 1. Submit job
      const { job_id } = await knowledgeApi.submitPreview(
        request.text,
        request.mode,
        request.source
      );

      // 2. Poll until completed or failed
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      for (let i = 0; i < 90; i++) {
        await sleep(2000);
        const status = await knowledgeApi.getJobStatus(job_id);
        if (status.status === 'completed' && status.result) {
          return status.result;
        }
        if (status.status === 'failed') {
          throw new Error(status.error || '分析失败');
        }
      }
      throw new Error('分析超时，请稍后重试');
    },
  });
}

// Confirm capture (2-step: step 2)
export function useCaptureConfirm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ConfirmRequest): Promise<CaptureResponse> => {
      return knowledgeApi.confirmCapture(request);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...knowledgeKeys.all, 'atoms'],
      });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.ontology() });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.ontologyGaps() });
    },
  });
}

// Get ontology gaps
export function useOntologyGaps() {
  return useQuery({
    queryKey: knowledgeKeys.ontologyGaps(),
    queryFn: (): Promise<OntologyGaps> => knowledgeApi.getOntologyGaps(),
    staleTime: 5 * 60 * 1000,
  });
}

// Get connections for an atom
export function useAtomConnections(atomId: string) {
  return useQuery({
    queryKey: knowledgeKeys.atomConnections(atomId),
    queryFn: (): Promise<AtomConnectionsResponse> => knowledgeApi.getAtomConnections(atomId),
    enabled: !!atomId,
    staleTime: 2 * 60 * 1000,
  });
}

// Get graph data for visualization
export function useGraphData(domain?: string) {
  return useQuery({
    queryKey: knowledgeKeys.graphData(domain),
    queryFn: (): Promise<GraphData> => knowledgeApi.getGraphData(domain),
    staleTime: 2 * 60 * 1000,
  });
}

// Get hierarchical graph data (3-level drill-down)
export function useHierarchyGraph(level: GraphLevel, domain?: string, topic?: string) {
  return useQuery({
    queryKey: knowledgeKeys.hierarchyGraph(level, domain, topic),
    queryFn: (): Promise<HierarchyGraphData> =>
      knowledgeApi.getHierarchyGraph(level, domain, topic),
    staleTime: 2 * 60 * 1000,
  });
}

// Upload PDF for book/chapter mode capture — two-phase: file-gateway → backend polling
export type UploadCapturePhase = 'idle' | 'uploading' | 'analyzing';

export function useUploadCapture() {
  const [phase, setPhase] = useState<UploadCapturePhase>('idle');

  const mutation = useMutation({
    mutationFn: async (request: {
      file: File;
      source?: string;
      mode?: string;
    }): Promise<PreviewResponse> => {
      const mode = request.mode || 'book';

      // Phase 1: Upload file to file-gateway (MinIO)
      setPhase('uploading');
      const pathPrefix = mode === 'chapter' ? 'chapter-feed/' : 'book-import/';
      const fgResp = await uploadToFileGateway(request.file, 'knowledge', pathPrefix);

      // Phase 2: Submit file_uri to backend → poll
      setPhase('analyzing');
      const { job_id } = await knowledgeApi.submitFileCapture(
        fgResp.file_uri,
        request.source,
        mode
      );

      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      for (let i = 0; i < 120; i++) {
        await sleep(3000);
        const status = await knowledgeApi.getJobStatus(job_id);
        if (status.status === 'completed' && status.result) {
          return status.result;
        }
        if (status.status === 'failed') {
          throw new Error(status.error || 'PDF 分析失败');
        }
      }
      throw new Error('分析超时，请稍后重试');
    },
    onSettled: () => {
      setPhase('idle');
    },
  });

  return { ...mutation, phase };
}

// --- MCP Hooks ---

export function useMcpSources() {
  return useQuery({
    queryKey: [...knowledgeKeys.all, 'mcpSources'],
    queryFn: (): Promise<McpSource[]> => knowledgeApi.getMcpSources(),
    staleTime: 30 * 1000,
  });
}

export function useAddMcpSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (source: { name: string; transport: string; url?: string; command?: string }) => {
      return knowledgeApi.addMcpSource(source);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...knowledgeKeys.all, 'mcpSources'] });
    },
  });
}

export function useDeleteMcpSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return knowledgeApi.deleteMcpSource(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...knowledgeKeys.all, 'mcpSources'] });
    },
  });
}

export function useMcpResources(sourceId: string) {
  return useQuery({
    queryKey: [...knowledgeKeys.all, 'mcpResources', sourceId],
    queryFn: (): Promise<McpResource[]> => knowledgeApi.getMcpResources(sourceId),
    enabled: !!sourceId,
  });
}

export function useImportMcpResources() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: { sourceId: string; uris: string[] }) => {
      return knowledgeApi.importMcpResources(request.sourceId, request.uris);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...knowledgeKeys.all, 'atoms'] });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.ontology() });
    },
  });
}
