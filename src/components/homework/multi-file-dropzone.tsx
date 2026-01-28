import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiFileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  isUploading?: boolean;
  maxFiles?: number;
}

export function MultiFileDropzone({
  onFilesSelected,
  disabled = false,
  isUploading = false,
  maxFiles = 20,
}: MultiFileDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      // 限制文件数量并直接上传
      const newFiles = acceptedFiles.slice(0, maxFiles);
      onFilesSelected(newFiles);
    },
    [maxFiles, onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
    },
    disabled: disabled || isUploading,
    multiple: true,
    maxFiles,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary/50',
        (disabled || isUploading) && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        {isUploading ? (
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        ) : (
          <Upload className="h-12 w-12 text-muted-foreground" />
        )}
        <div>
          {isDragActive ? (
            <p className="text-primary font-medium text-lg">放开以上传文件...</p>
          ) : isUploading ? (
            <p className="text-muted-foreground">正在上传和识别中...</p>
          ) : (
            <>
              <p className="font-medium text-lg">拖拽或点击上传作业照片</p>
              <p className="text-sm text-muted-foreground mt-2">
                支持 JPG、PNG、PDF 格式，最多 {maxFiles} 个文件
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                系统将自动识别作业类型（通过 QR 码）
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
