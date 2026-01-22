import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fileClient } from '@/api/client';
import type { Bucket, FileItem, FileUploadResponse, DuplicateCheckResponse } from '@/api/types';

// Query key factory for files
export const fileKeys = {
  all: ['files'] as const,
  buckets: () => [...fileKeys.all, 'buckets'] as const,
  lists: () => [...fileKeys.all, 'list'] as const,
  list: (bucket: string) => [...fileKeys.lists(), bucket] as const,
};

// API functions
const filesApi = {
  getBuckets: async (): Promise<{ buckets: Bucket[] }> => {
    const response = await fileClient.get('/api/v1/buckets');
    return response.data;
  },

  getFiles: async (bucket: string): Promise<{ files: FileItem[] }> => {
    const response = await fileClient.get(`/api/v1/files/${bucket}`);
    return response.data;
  },

  uploadFile: async ({
    bucket,
    file,
    onProgress,
  }: {
    bucket: string;
    file: File;
    onProgress?: (progress: number) => void;
  }): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);

    const response = await fileClient.post('/api/v1/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  checkDuplicate: async (bucket: string, sha256: string): Promise<DuplicateCheckResponse> => {
    const response = await fileClient.get('/api/v1/files/check-duplicate', {
      params: { bucket, sha256 },
    });
    return response.data;
  },

  deleteFile: async ({ bucket, key }: { bucket: string; key: string }): Promise<void> => {
    await fileClient.delete(`/api/v1/files/${bucket}/${encodeURIComponent(key)}`);
  },
};

// Hooks
export function useBuckets() {
  return useQuery({
    queryKey: fileKeys.buckets(),
    queryFn: filesApi.getBuckets,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFiles(bucket: string) {
  return useQuery({
    queryKey: fileKeys.list(bucket),
    queryFn: () => filesApi.getFiles(bucket),
    staleTime: 1 * 60 * 1000, // 1 minute for files
    enabled: !!bucket,
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: filesApi.uploadFile,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: fileKeys.list(variables.bucket) });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: filesApi.deleteFile,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: fileKeys.list(variables.bucket) });
    },
  });
}

export function useCheckDuplicate() {
  return useMutation({
    mutationFn: ({ bucket, sha256 }: { bucket: string; sha256: string }) =>
      filesApi.checkDuplicate(bucket, sha256),
  });
}

// Helper function to calculate SHA-256 of a file (for duplicate check)
export async function calculateFileSha256(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
