import { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { knowledgeApi } from '@/api/knowledge';
import { uploadToFileGateway } from '@/api/file-gateway';
import { knowledgeKeys } from '@/hooks/use-knowledge';
import type { TechDocJobStatus } from '@/types/knowledge';

export type TechDocImportState =
  | 'idle'
  | 'uploading'
  | 'submitting'
  | 'polling'
  | 'done'
  | 'error';

interface UseTechDocImportReturn {
  submit: (file: File) => Promise<void>;
  jobStatus: TechDocJobStatus | null;
  state: TechDocImportState;
  error: string | null;
  reset: () => void;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useTechDocImport(): UseTechDocImportReturn {
  const queryClient = useQueryClient();
  const [state, setState] = useState<TechDocImportState>('idle');
  const [jobStatus, setJobStatus] = useState<TechDocJobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const mutation = useMutation({
    mutationFn: async (file: File): Promise<TechDocJobStatus> => {
      abortRef.current = false;

      // 1. Upload ZIP to file-gateway (MinIO)
      setState('uploading');
      const fgResp = await uploadToFileGateway(file, 'knowledge', 'tech-docs/');

      // 2. Submit file_uri to knowledge-hub backend
      setState('submitting');
      const { job_id } = await knowledgeApi.submitTechDoc(fgResp.file_uri);

      // 2. Poll until completed or failed
      setState('polling');
      for (let i = 0; i < 180; i++) {
        if (abortRef.current) throw new Error('已取消');
        await sleep(2000);
        const status = await knowledgeApi.getTechDocJobStatus(job_id);
        setJobStatus(status);

        if (status.status === 'completed') {
          return status;
        }
        if (status.status === 'failed') {
          throw new Error(status.error || '技术文档导入失败');
        }
      }
      throw new Error('导入超时，请稍后重试');
    },
    onSuccess: () => {
      setState('done');
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.atoms() });
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.ontology() });
    },
    onError: (err: Error) => {
      setState('error');
      setError(err.message);
    },
  });

  const submit = useCallback(
    async (file: File) => {
      setError(null);
      setJobStatus(null);
      await mutation.mutateAsync(file);
    },
    [mutation]
  );

  const reset = useCallback(() => {
    abortRef.current = true;
    setState('idle');
    setJobStatus(null);
    setError(null);
  }, []);

  return { submit, jobStatus, state, error, reset };
}
