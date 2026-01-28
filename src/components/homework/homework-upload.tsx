import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, CheckCircle, XCircle, Loader2, Camera } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubmitHomework, useSubmissionStatus } from '@/hooks/use-homework';
import type { HomeworkRecord, SubmissionStatus } from '@/types/homework';

interface HomeworkUploadProps {
  homework: HomeworkRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: '等待处理',
  processing: '批改中',
  graded: '批改完成',
  failed: '批改失败',
};

const STATUS_COLORS: Record<SubmissionStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  graded: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function HomeworkUpload({ homework, open, onOpenChange }: HomeworkUploadProps) {
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const submitHomework = useSubmitHomework();
  const { data: submissionResult } = useSubmissionStatus(submissionId);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      // Create preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      try {
        const result = await submitHomework.mutateAsync({
          homeworkId: homework.id,
          file,
        });
        setSubmissionId(result.id);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    },
    [homework.id, submitHomework]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxFiles: 1,
    disabled: submitHomework.isPending || (submissionResult?.status === 'processing'),
  });

  const handleClose = () => {
    setSubmissionId(null);
    setPreviewUrl(null);
    onOpenChange(false);
  };

  const handleRetry = () => {
    setSubmissionId(null);
    setPreviewUrl(null);
  };

  const isUploading = submitHomework.isPending;
  const isProcessing = submissionResult?.status === 'pending' || submissionResult?.status === 'processing';
  const isGraded = submissionResult?.status === 'graded';
  const isFailed = submissionResult?.status === 'failed';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            上传批改
          </DialogTitle>
          <DialogDescription>
            拍照上传已完成的作业，系统将自动识别批改结果
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dropzone */}
          {!submissionId && (
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors
                ${isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
                }
                ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input {...getInputProps()} />
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">上传中...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {isDragActive ? '放开以上传' : '拖放图片或点击选择'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    支持 PNG, JPG, JPEG, WebP
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Preview & Status */}
          {previewUrl && submissionId && (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative rounded-lg overflow-hidden bg-muted">
                <img
                  src={previewUrl}
                  alt="上传预览"
                  className="w-full max-h-48 object-contain"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-white">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="text-sm">正在批改...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              {submissionResult && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">批改状态</span>
                  <Badge className={STATUS_COLORS[submissionResult.status]}>
                    {STATUS_LABELS[submissionResult.status]}
                  </Badge>
                </div>
              )}

              {/* Grade Results */}
              {isGraded && submissionResult && (
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">批改结果</span>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">已完成</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {submissionResult.total_correct}
                      </div>
                      <div className="text-xs text-muted-foreground">正确</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {submissionResult.total_wrong}
                      </div>
                      <div className="text-xs text-muted-foreground">错误</div>
                    </div>
                  </div>

                  {submissionResult.total_correct + submissionResult.total_wrong > 0 && (
                    <div className="text-center">
                      <span className="text-sm text-muted-foreground">正确率: </span>
                      <span className="text-lg font-semibold">
                        {Math.round(
                          (submissionResult.total_correct /
                            (submissionResult.total_correct + submissionResult.total_wrong)) *
                            100
                        )}%
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Failed State */}
              {isFailed && submissionResult && (
                <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 p-4">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">批改失败</span>
                  </div>
                  {submissionResult.error_message && (
                    <p className="mt-2 text-sm text-red-600/80 dark:text-red-400/80">
                      {submissionResult.error_message}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="mt-3"
                  >
                    重新上传
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {isGraded && (
              <Button onClick={handleClose}>完成</Button>
            )}
            {!submissionId && !isUploading && (
              <Button variant="outline" onClick={handleClose}>
                取消
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
