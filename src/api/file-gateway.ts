import { fileClient } from '@/api/client';

export interface FileUploadResponse {
  platform: string;
  bucket: string;
  key: string;
  url: string;
  size: number;
  content_type: string;
  content_hash: string;
  is_duplicate: boolean;
  file_uri: string;
}

/**
 * Upload a file to MinIO via file-gateway.
 * Returns the file_uri that can be passed to knowledge-hub backend.
 */
export async function uploadToFileGateway(
  file: File,
  bucket: string,
  path: string,
): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('platform', 'minio');
  formData.append('bucket', bucket);
  formData.append('path', path);
  formData.append('deduplicate', 'true');

  const { data } = await fileClient.post<FileUploadResponse>(
    '/api/v1/files/upload',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000, // 5min for large files
    },
  );
  return data;
}
