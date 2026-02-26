// Knowledge Hub types

// Capture mode
export type CaptureMode = 'excerpt' | 'chapter' | 'book' | 'mcp' | 'tech_doc';

// Concept within an atom
export interface ConceptItem {
  name: string;
  def: string;
}

// Knowledge atom - core entity (from GET /atoms, /atoms/:id, /search)
export interface KnowledgeAtom {
  id: string;
  title: string;
  summary: string;
  raw_content: string;
  domain: string;
  domain_label: string | null;
  topics: string[];
  topic_labels: string[];
  concepts: ConceptItem[];
  content_type: string;
  knowledge_level: string;
  capture_mode: string;
  source_lv1: string | null;
  source_lv2: string | null;
  source_lv3: string | null;
  source_lv4: string | null;
  source_ref: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Connection between atoms
export interface KnowledgeConnection {
  id: string;
  source_atom_id: string;
  target_atom_id: string;
  relation_type: string;
  relation_label: string;
  reason: string;
  confidence: number;
  created_at: string;
}

// Potential connection discovered during preview (not yet persisted)
export interface PotentialConnection {
  target_atom_id: string;
  target_title: string;
  target_domain: string;
  target_domain_label: string | null;
  target_summary: string;
  relation_type: string;
  reason: string;
  confidence: number;
}

// Related atom brief for connection display
export interface RelatedAtomBrief {
  id: string;
  title: string;
  domain: string;
  domain_label: string | null;
  summary: string;
}

// Connection with related atom details
export interface ConnectionWithAtom {
  connection: KnowledgeConnection;
  related_atom: RelatedAtomBrief;
}

// Response for atom connections endpoint
export interface AtomConnectionsResponse {
  atom_id: string;
  connections: ConnectionWithAtom[];
  total: number;
}

// Graph visualization types
export interface GraphNode {
  id: string;
  title: string;
  domain: string;
  domain_label: string | null;
  topic_labels: string[];
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relation_type: string;
  confidence: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Hierarchy graph (3-level drill-down)
export type GraphLevel = 'domains' | 'topics' | 'atoms';

export interface HierarchyNode {
  id: string;
  label: string;
  type: 'domain' | 'topic' | 'atom';
  atom_count?: number;
  topic_count?: number;
  title?: string;
  domain?: string;
  domain_label?: string | null;
  topic_labels?: string[];
}

export interface HierarchyEdge {
  id: string;
  source: string;
  target: string;
  weight?: number;
  relation_type: string;
  confidence?: number;
}

export interface HierarchyGraphData {
  level: GraphLevel;
  parent_domain?: { path: string; label: string };
  parent_topic?: { path: string; label: string };
  nodes: HierarchyNode[];
  edges: HierarchyEdge[];
}

// Ontology tree nodes
export interface OntologyDomain {
  path: string;
  label: string;
  total_atoms: number;
  topics: OntologyTopic[];
}

export interface OntologyTopic {
  path: string;
  label: string;
  atom_count: number;
  subtopics: OntologySubtopic[];
}

export interface OntologySubtopic {
  path: string;
  label: string;
  atom_count: number;
  is_ai_suggested: boolean;
}

export interface OntologyTree {
  domains: OntologyDomain[];
}

// Source enums for capture form
export interface SourceEnums {
  lv1: string[];
  lv2: string[];
  lv3: string[];
}

// Capture request
export interface CaptureRequest {
  text: string;
  source?: string;
  mode: CaptureMode;
  source_override?: {
    lv1?: string;
    lv2?: string;
    lv3?: string;
    lv4?: string;
  };
}

// Single atom result from capture (flat structure from backend)
export interface CaptureAtomResult {
  id: string;
  title: string;
  domain: string;
  domain_label: string | null;
  summary: string;
  topics: string[];
  topic_labels: string[];
  concepts: ConceptItem[];
  source_hierarchy: Record<string, string | null>;
  content_type: string;
  knowledge_level: string;
  ontology_updates: { action: string; path: string; label: string; depth: number }[];
}

// Capture response
export interface CaptureResponse {
  job_id: string | null;
  atoms: CaptureAtomResult[];
}

// Search result
export interface SearchResult {
  atom: KnowledgeAtom;
  score: number;
  match_type: string;
}

// Paginated atoms response (matches backend AtomListResponse)
export interface AtomsPage {
  atoms: KnowledgeAtom[];
  total: number;
  page: number;
  page_size: number;
}

// Atom update payload
export interface AtomUpdateData {
  title?: string;
  summary?: string;
  domain?: string;
  topics?: string[];
  concepts?: ConceptItem[];
  source_lv1?: string;
  source_lv2?: string;
  source_lv3?: string;
  source_lv4?: string;
}

// Processing step for UI feedback
export type ProcessingStepStatus = 'pending' | 'active' | 'done';

export interface ProcessingStep {
  key: string;
  label: string;
  status: ProcessingStepStatus;
}

// --- Preview / Confirm (2-step capture) ---

export interface SuggestedSubtopic {
  name: string;
  description: string;
  for_topic: string;
}

export interface OntologyUpdate {
  action: string;
  path: string;
  label: string;
  depth: number;
}

export interface PreviewAtomResult {
  title: string;
  domain: string;
  domain_label: string | null;
  summary: string;
  topics: string[];
  topic_labels: string[];
  concepts: ConceptItem[];
  source_hierarchy: Record<string, string | null>;
  content_type: string;
  knowledge_level: string;
  ontology_updates: OntologyUpdate[];
  suggested_subtopics: SuggestedSubtopic[];
  potential_connections: PotentialConnection[];
}

export interface PreviewResponse {
  atoms: PreviewAtomResult[];
}

export interface ConfirmRequest {
  text: string;
  mode: string;
  atom?: PreviewAtomResult;
  atoms?: PreviewAtomResult[];
  source_override?: {
    lv1?: string;
    lv2?: string;
    lv3?: string;
    lv4?: string;
  };
  notes?: string;
}

// --- Async Job (polling) ---

export interface JobSubmitResponse {
  job_id: string;
  status: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: string; // pending | processing | completed | failed
  result: PreviewResponse | null;
  error: string | null;
}

// --- Knowledge Gaps ---

export interface GapItem {
  topic_label: string;
  subtopic_label: string;
  path: string;
}

export interface GapDomain {
  domain: string;
  domain_label: string;
  uncovered_count: number;
  uncovered: GapItem[];
}

export interface OntologyGaps {
  total_nodes: number;
  covered_nodes: number;
  coverage_pct: number;
  domains: GapDomain[];
}

// --- MCP (Model Context Protocol) ---

export interface McpSource {
  id: string;
  name: string;
  transport: 'sse' | 'stdio';
  url: string | null;
  command: string | null;
  enabled: boolean;
  last_connected_at: string | null;
  created_at: string;
}

export interface McpResource {
  uri: string;
  name: string;
}

// --- Tech Doc Import ---

export interface TechDocMeta {
  technology: string;
  version?: string;
  source_hierarchy: {
    lv1: string;
    lv2: string;
    lv3: string;
    lv4?: string;
  };
}

export interface TechDocJobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_files?: number;
  processed_files?: number;
  atoms_created?: number;
  current_file?: string;
  error?: string;
}

// --- Knowledge Review ---

export type ReviewStatus = 'new' | 'learning' | 'mastered';

export interface ReviewAtom {
  atom_id: string;
  title: string;
  domain: string;
  domain_label: string | null;
  status: ReviewStatus;
  correct_streak: number;
  last_reviewed_at: string | null;
}

export interface ReviewStats {
  total: number;
  new_count: number;
  learning_count: number;
  mastered_count: number;
  domains: { domain: string; domain_label: string; count: number }[];
}

export interface ReviewCard {
  session_id: string;
  atom_id: string;
  atom_title: string;
  question: string;
  question_type: string;
  hint?: string;
}

export type SelfRating = 'easy' | 'ok' | 'hard';

export interface ReviewAnswerRequest {
  session_id: string;
  answer: string;
  self_rating: SelfRating;
}

export interface ReviewFeedback {
  is_correct: boolean;
  feedback: string;
  correct_answer?: string;
  updated_status: ReviewStatus;
}

// --- Learning Plans ---

export interface PlanAtomItem {
  atom_id: string;
  title: string;
  domain: string;
  domain_label: string | null;
  summary: string;
  order_index: number;
  status: 'new' | 'learning' | 'mastered';
  correct_streak: number;
}

export interface LearningPlan {
  id: string;
  title: string;
  goal: string;
  domain?: string;
  status: 'active' | 'completed' | 'archived';
  atoms: PlanAtomItem[];
  total_atoms: number;
  mastered_count: number;
  progress_pct: number;
  created_at: string;
  updated_at: string;
}

export interface PlanDraft {
  title: string;
  atoms: { atom_id: string; title: string; summary: string; domain: string }[];
  missing_topics?: string[];
}

export interface PlanCreateRequest {
  title: string;
  goal: string;
  domain: string;
  atom_ids: string[];
}
