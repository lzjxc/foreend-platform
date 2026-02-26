import { knowledgeClient } from '@/api/client';
import type {
  KnowledgeAtom,
  CaptureRequest,
  CaptureResponse,
  AtomsPage,
  AtomUpdateData,
  OntologyTree,
  SourceEnums,
  ConfirmRequest,
  OntologyGaps,
  JobSubmitResponse,
  JobStatusResponse,
  AtomConnectionsResponse,
  GraphData,
  GraphLevel,
  HierarchyGraphData,
  McpSource,
  McpResource,
  TechDocJobStatus,
  ReviewAtom,
  ReviewStats,
  ReviewCard,
  ReviewAnswerRequest,
  ReviewFeedback,
  LearningPlan,
  PlanDraft,
  PlanCreateRequest,
  ReviewAtom as ReviewAtomType,
} from '@/types/knowledge';

// Map backend plan format to frontend LearningPlan type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRawPlan(raw: any): LearningPlan {
  // Map atoms if present (detail endpoint includes them)
  const atoms = (raw.atoms || []).map((a: any) => ({
    atom_id: a.atom_id || a.id,
    title: a.atom_title || a.title || '',
    domain: a.atom_domain || a.domain || '',
    domain_label: a.atom_domain_label || a.domain_label || null,
    summary: a.summary || '',
    order_index: a.order_index ?? 0,
    status: mapAtomReviewStatus(a.atom_review_status || a.status),
    correct_streak: a.correct_streak ?? 0,
  }));

  return {
    id: raw.id,
    title: raw.title,
    goal: raw.goal || '',
    domain: raw.domain,
    status: raw.status,
    atoms,
    total_atoms: raw.total_atoms ?? 0,
    mastered_count: raw.completed_atoms ?? raw.mastered_count ?? 0,
    progress_pct: raw.progress_pct ?? 0,
    created_at: raw.created_at,
    updated_at: raw.updated_at || raw.completed_at || raw.created_at,
  };
}

function mapAtomReviewStatus(status: string): 'new' | 'learning' | 'mastered' {
  if (status === 'mastered' || status === 'completed') return 'mastered';
  if (status === 'learning') return 'learning';
  return 'new'; // 'new', 'pending', or anything else
}

// Knowledge Hub API functions

export const knowledgeApi = {
  // Capture text into knowledge atoms
  captureText: async (
    text: string,
    source?: string,
    mode: CaptureRequest['mode'] = 'excerpt',
    sourceOverride?: CaptureRequest['source_override']
  ): Promise<CaptureResponse> => {
    const payload: CaptureRequest = { text, mode };
    if (source) payload.source = source;
    if (sourceOverride) payload.source_override = sourceOverride;
    const { data } = await knowledgeClient.post<CaptureResponse>(
      '/api/v1/capture',
      payload
    );
    return data;
  },

  // Get paginated atoms list
  getAtoms: async (
    page: number = 1,
    filters?: { domain?: string; source_lv1?: string; source_lv2?: string; source_lv3?: string }
  ): Promise<AtomsPage> => {
    const params: Record<string, unknown> = { page };
    if (filters?.domain) params.domain = filters.domain;
    if (filters?.source_lv1) params.source_lv1 = filters.source_lv1;
    if (filters?.source_lv2) params.source_lv2 = filters.source_lv2;
    if (filters?.source_lv3) params.source_lv3 = filters.source_lv3;
    const { data } = await knowledgeClient.get<AtomsPage>('/api/v1/atoms', {
      params,
    });
    return data;
  },

  // Get single atom by ID
  getAtom: async (id: string): Promise<KnowledgeAtom> => {
    const { data } = await knowledgeClient.get<KnowledgeAtom>(
      `/api/v1/atoms/${id}`
    );
    return data;
  },

  // Update an atom
  updateAtom: async (
    id: string,
    updateData: AtomUpdateData
  ): Promise<KnowledgeAtom> => {
    const { data } = await knowledgeClient.put<KnowledgeAtom>(
      `/api/v1/atoms/${id}`,
      updateData
    );
    return data;
  },

  // Delete an atom
  deleteAtom: async (id: string): Promise<void> => {
    await knowledgeClient.delete(`/api/v1/atoms/${id}`);
  },

  // Search atoms
  searchAtoms: async (
    query: string,
    limit: number = 20
  ): Promise<{ results: { atom: KnowledgeAtom; score: number; match_type: string }[]; total: number }> => {
    const { data } = await knowledgeClient.get<{
      results: { atom: KnowledgeAtom; score: number; match_type: string }[];
      total: number;
    }>('/api/v1/search', { params: { q: query, limit } });
    return data;
  },

  // Get ontology tree
  getOntology: async (): Promise<OntologyTree> => {
    const { data } = await knowledgeClient.get<OntologyTree>(
      '/api/v1/ontology'
    );
    return data;
  },

  // Get source enum values
  getSourceEnums: async (): Promise<SourceEnums> => {
    const { data } = await knowledgeClient.get<SourceEnums>(
      '/api/v1/sources/enums'
    );
    return data;
  },

  // Create a new source enum value
  createSourceEnum: async (
    level: string,
    value: string
  ): Promise<{ level: string; value: string }> => {
    const { data } = await knowledgeClient.post<{
      level: string;
      value: string;
    }>('/api/v1/sources/enums', { level, value });
    return data;
  },

  // Submit preview job (async, returns job_id)
  submitPreview: async (
    text: string,
    mode: CaptureRequest['mode'] = 'excerpt',
    source?: string
  ): Promise<JobSubmitResponse> => {
    const payload: CaptureRequest = { text, mode };
    if (source) payload.source = source;
    const { data } = await knowledgeClient.post<JobSubmitResponse>(
      '/api/v1/capture/preview',
      payload
    );
    return data;
  },

  // Poll job status
  getJobStatus: async (jobId: string): Promise<JobStatusResponse> => {
    const { data } = await knowledgeClient.get<JobStatusResponse>(
      `/api/v1/capture/jobs/${jobId}`
    );
    return data;
  },

  // Confirm capture (2-step: step 2)
  confirmCapture: async (request: ConfirmRequest): Promise<CaptureResponse> => {
    const { data } = await knowledgeClient.post<CaptureResponse>(
      '/api/v1/capture/confirm',
      request
    );
    return data;
  },

  // Get ontology gaps
  getOntologyGaps: async (): Promise<OntologyGaps> => {
    const { data } = await knowledgeClient.get<OntologyGaps>(
      '/api/v1/ontology/gaps'
    );
    return data;
  },

  // Get connections for an atom
  getAtomConnections: async (atomId: string): Promise<AtomConnectionsResponse> => {
    const { data } = await knowledgeClient.get<AtomConnectionsResponse>(
      `/api/v1/atoms/${atomId}/connections`
    );
    return data;
  },

  // Get graph data for visualization
  getGraphData: async (domain?: string): Promise<GraphData> => {
    const params: Record<string, unknown> = {};
    if (domain) params.domain = domain;
    const { data } = await knowledgeClient.get<GraphData>(
      '/api/v1/connections/graph',
      { params }
    );
    return data;
  },

  // Get hierarchical graph data (3-level drill-down)
  getHierarchyGraph: async (
    level: GraphLevel,
    domain?: string,
    topic?: string,
    limit?: number,
  ): Promise<HierarchyGraphData> => {
    const params: Record<string, unknown> = { level };
    if (domain) params.domain = domain;
    if (topic) params.topic = topic;
    if (limit) params.limit = limit;
    const { data } = await knowledgeClient.get<HierarchyGraphData>(
      '/api/v1/connections/graph/hierarchy',
      { params },
    );
    return data;
  },

  // Submit file_uri for book/chapter mode capture (file already uploaded to file-gateway)
  submitFileCapture: async (fileUri: string, source?: string, mode: string = 'book'): Promise<JobSubmitResponse> => {
    const payload: Record<string, string> = { file_uri: fileUri, mode };
    if (source) payload.source = source;
    const { data } = await knowledgeClient.post<JobSubmitResponse>(
      '/api/v1/capture/upload',
      payload,
    );
    return data;
  },

  // --- Tech Doc Import ---

  // Submit file_uri for tech doc import (file already uploaded to file-gateway)
  submitTechDoc: async (fileUri: string): Promise<JobSubmitResponse> => {
    const { data } = await knowledgeClient.post<JobSubmitResponse>(
      '/api/v1/capture/tech-doc',
      { file_uri: fileUri },
    );
    return data;
  },

  // Poll tech doc job status (richer progress info)
  getTechDocJobStatus: async (jobId: string): Promise<TechDocJobStatus> => {
    const { data } = await knowledgeClient.get<TechDocJobStatus>(
      `/api/v1/capture/jobs/${jobId}`
    );
    return data;
  },

  // --- MCP API ---

  // List configured MCP sources
  getMcpSources: async (): Promise<McpSource[]> => {
    const { data } = await knowledgeClient.get<McpSource[]>('/api/v1/mcp/sources');
    return data;
  },

  // Add a new MCP source
  addMcpSource: async (source: { name: string; transport: string; url?: string; command?: string; args?: Record<string, unknown> }): Promise<McpSource> => {
    const { data } = await knowledgeClient.post<McpSource>('/api/v1/mcp/sources', source);
    return data;
  },

  // Delete an MCP source
  deleteMcpSource: async (id: string): Promise<void> => {
    await knowledgeClient.delete(`/api/v1/mcp/sources/${id}`);
  },

  // List resources from an MCP source
  getMcpResources: async (sourceId: string): Promise<McpResource[]> => {
    const { data } = await knowledgeClient.get<McpResource[]>(`/api/v1/mcp/sources/${sourceId}/resources`);
    return data;
  },

  // Import resources from MCP source
  importMcpResources: async (sourceId: string, uris: string[]): Promise<{ imported: number }> => {
    const { data } = await knowledgeClient.post<{ imported: number }>(`/api/v1/mcp/sources/${sourceId}/import`, { uris });
    return data;
  },

  // --- Review API ---

  getReviewQueue: async (domain?: string, limit: number = 20): Promise<ReviewAtom[]> => {
    const params: Record<string, unknown> = { limit };
    if (domain) params.domain = domain;
    const { data } = await knowledgeClient.get<{ atoms: Array<{ id: string; title: string; domain: string; domain_label: string | null; review_status: string; last_reviewed_at: string | null; review_count: number; correct_streak: number }> }>('/api/v1/review/queue', { params });
    // Map backend fields to frontend ReviewAtom type
    return (data.atoms || []).map((a) => ({
      atom_id: a.id,
      title: a.title,
      domain: a.domain,
      domain_label: a.domain_label,
      status: a.review_status as ReviewAtom['status'],
      correct_streak: a.correct_streak,
      last_reviewed_at: a.last_reviewed_at,
    }));
  },

  getReviewStats: async (domain?: string): Promise<ReviewStats> => {
    const params: Record<string, unknown> = {};
    if (domain) params.domain = domain;
    const { data } = await knowledgeClient.get<{ by_status: { new: number; learning: number; mastered: number }; recent_sessions: number; accuracy_rate: number }>('/api/v1/review/stats', { params });
    // Map backend format to frontend ReviewStats type
    const byStatus = data.by_status || { new: 0, learning: 0, mastered: 0 };
    return {
      total: byStatus.new + byStatus.learning + byStatus.mastered,
      new_count: byStatus.new,
      learning_count: byStatus.learning,
      mastered_count: byStatus.mastered,
      domains: [], // Backend doesn't provide domain breakdown in stats; domain filtering is handled by query param
    };
  },

  generateReviewCard: async (atomId: string): Promise<ReviewCard> => {
    const { data } = await knowledgeClient.post<ReviewCard>('/api/v1/review/card', { atom_id: atomId });
    return data;
  },

  submitReviewAnswer: async (request: ReviewAnswerRequest): Promise<ReviewFeedback> => {
    const { data } = await knowledgeClient.post<ReviewFeedback>('/api/v1/review/answer', request);
    return data;
  },

  // --- Learning Plans API ---

  getPlans: async (status?: string): Promise<LearningPlan[]> => {
    const params: Record<string, unknown> = {};
    if (status) params.status = status;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await knowledgeClient.get<any>('/api/v1/plans', { params });
    const rawPlans = Array.isArray(data) ? data : data.plans || [];
    return rawPlans.map(mapRawPlan);
  },

  generatePlanDraft: async (goal: string, domain?: string, maxItems?: number): Promise<PlanDraft> => {
    const payload: Record<string, unknown> = { goal };
    if (domain) payload.domain = domain;
    if (maxItems) payload.max_items = maxItems;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await knowledgeClient.post<any>('/api/v1/plans/draft', payload);
    // Map backend field names to frontend PlanDraft type
    return {
      title: data.suggested_title || data.title || '',
      atoms: (data.selected_atoms || data.atoms || []).map((a: any) => ({
        atom_id: a.atom_id,
        title: a.atom_title || a.title || '',
        summary: a.atom_summary || a.summary || '',
        domain: a.domain || domain || '',
      })),
      missing_topics: data.missing_topics,
    };
  },

  createPlan: async (request: PlanCreateRequest): Promise<LearningPlan> => {
    // Backend expects { title, goal, domain, atoms: [{atom_id, order_index}] }
    const payload = {
      title: request.title,
      goal: request.goal,
      domain: request.domain,
      atoms: request.atom_ids.map((id, idx) => ({ atom_id: id, order_index: idx })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await knowledgeClient.post<any>('/api/v1/plans', payload);
    return mapRawPlan(data);
  },

  getPlan: async (id: string): Promise<LearningPlan> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await knowledgeClient.get<any>(`/api/v1/plans/${id}`);
    return mapRawPlan(data);
  },

  updatePlan: async (id: string, updates: Partial<PlanCreateRequest>): Promise<LearningPlan> => {
    const { data } = await knowledgeClient.put<LearningPlan>(`/api/v1/plans/${id}`, updates);
    return data;
  },

  archivePlan: async (id: string): Promise<LearningPlan> => {
    const { data } = await knowledgeClient.patch<LearningPlan>(`/api/v1/plans/${id}/archive`);
    return data;
  },

  deletePlan: async (id: string): Promise<void> => {
    await knowledgeClient.delete(`/api/v1/plans/${id}`);
  },

  getPlanReviewQueue: async (planId: string): Promise<ReviewAtomType[]> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await knowledgeClient.get<any>(`/api/v1/plans/${planId}/review-queue`);
    // Backend returns { plan_id, plan_title, atoms: [...] }
    const rawAtoms = Array.isArray(data) ? data : data.atoms || [];
    return rawAtoms.map((a: any) => ({
      atom_id: a.atom_id,
      title: a.atom_title || a.title || '',
      domain: a.atom_domain || a.domain || '',
      domain_label: a.domain_label || null,
      status: mapAtomReviewStatus(a.review_status || a.status || 'new'),
      correct_streak: a.correct_streak ?? 0,
      last_reviewed_at: a.last_reviewed_at || null,
    }));
  },
};
