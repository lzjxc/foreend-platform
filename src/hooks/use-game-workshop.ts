import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/api/game-workshop';
import type { ProjectCreate, ProjectUpdate, AnalyzeRequest, NoteCreate } from '@/types/game-workshop';

export const workshopKeys = {
  all: ['game-workshop'] as const,
  projects: () => [...workshopKeys.all, 'projects'] as const,
  projectList: () => [...workshopKeys.projects(), 'list'] as const,
  projectDetail: (id: string) => [...workshopKeys.projects(), 'detail', id] as const,
  entries: (projectId: string) => [...workshopKeys.all, 'entries', projectId] as const,
  notes: (projectId: string) => [...workshopKeys.all, 'notes', projectId] as const,
  aiConfigs: () => [...workshopKeys.all, 'ai-configs'] as const,
};

// Projects
export function useProjects() {
  return useQuery({
    queryKey: workshopKeys.projectList(),
    queryFn: api.getProjects,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: workshopKeys.projectDetail(id),
    queryFn: () => api.getProject(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectCreate) => api.createProject(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workshopKeys.projects() });
    },
  });
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectUpdate) => api.updateProject(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workshopKeys.projectDetail(id) });
      qc.invalidateQueries({ queryKey: workshopKeys.projectList() });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workshopKeys.projects() });
    },
  });
}

// Entries (analyze)
export function useEntries(projectId: string) {
  return useQuery({
    queryKey: workshopKeys.entries(projectId),
    queryFn: () => api.getEntries(projectId),
    enabled: !!projectId,
  });
}

export function useAnalyze(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AnalyzeRequest) => api.analyze(projectId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workshopKeys.entries(projectId) });
      qc.invalidateQueries({ queryKey: workshopKeys.projectDetail(projectId) });
    },
  });
}

export function useDeleteEntry(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => api.deleteEntry(projectId, entryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workshopKeys.entries(projectId) });
    },
  });
}

// Notes
export function useNotes(projectId: string) {
  return useQuery({
    queryKey: workshopKeys.notes(projectId),
    queryFn: () => api.getNotes(projectId),
    enabled: !!projectId,
  });
}

export function useAddNote(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: NoteCreate) => api.addNote(projectId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workshopKeys.notes(projectId) });
      qc.invalidateQueries({ queryKey: workshopKeys.projectDetail(projectId) });
    },
  });
}

export function useDeleteNote(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => api.deleteNote(projectId, noteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workshopKeys.notes(projectId) });
    },
  });
}

// AI Configs
export function useAIConfigs() {
  return useQuery({
    queryKey: workshopKeys.aiConfigs(),
    queryFn: api.getAIConfigs,
  });
}
