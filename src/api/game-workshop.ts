import { gameWorkshopClient } from './client';
import type {
  Project,
  ProjectDetail,
  ProjectCreate,
  ProjectUpdate,
  DesignEntry,
  DesignNote,
  NoteCreate,
  AnalyzeRequest,
  AIConfig,
} from '@/types/game-workshop';

// Projects
export async function getProjects() {
  const { data } = await gameWorkshopClient.get<Project[]>('/api/projects');
  return data;
}

export async function getProject(id: string) {
  const { data } = await gameWorkshopClient.get<ProjectDetail>(`/api/projects/${id}`);
  return data;
}

export async function createProject(input: ProjectCreate) {
  const { data } = await gameWorkshopClient.post<Project>('/api/projects', input);
  return data;
}

export async function updateProject(id: string, input: ProjectUpdate) {
  const { data } = await gameWorkshopClient.patch<Project>(`/api/projects/${id}`, input);
  return data;
}

export async function deleteProject(id: string) {
  const { data } = await gameWorkshopClient.delete(`/api/projects/${id}`);
  return data;
}

// Entries (analyze)
export async function analyze(projectId: string, input: AnalyzeRequest) {
  const { data } = await gameWorkshopClient.post<DesignEntry>(`/api/projects/${projectId}/analyze`, input);
  return data;
}

export async function getEntries(projectId: string) {
  const { data } = await gameWorkshopClient.get<DesignEntry[]>(`/api/projects/${projectId}/entries`);
  return data;
}

export async function deleteEntry(projectId: string, entryId: string) {
  const { data } = await gameWorkshopClient.delete(`/api/projects/${projectId}/entries/${entryId}`);
  return data;
}

// Notes
export async function getNotes(projectId: string) {
  const { data } = await gameWorkshopClient.get<DesignNote[]>(`/api/projects/${projectId}/notes`);
  return data;
}

export async function addNote(projectId: string, input: NoteCreate) {
  const { data } = await gameWorkshopClient.post<DesignNote>(`/api/projects/${projectId}/notes`, input);
  return data;
}

export async function deleteNote(projectId: string, noteId: string) {
  const { data } = await gameWorkshopClient.delete(`/api/projects/${projectId}/notes/${noteId}`);
  return data;
}

// AI Configs
export async function getAIConfigs() {
  const { data } = await gameWorkshopClient.get<AIConfig[]>('/api/ai-configs');
  return data;
}

export async function createAIConfig(input: Partial<AIConfig>) {
  const { data } = await gameWorkshopClient.post<AIConfig>('/api/ai-configs', input);
  return data;
}

export async function updateAIConfig(id: string, input: Partial<AIConfig>) {
  const { data } = await gameWorkshopClient.put<AIConfig>(`/api/ai-configs/${id}`, input);
  return data;
}
