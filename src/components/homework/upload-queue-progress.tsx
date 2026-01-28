import { CheckCircle, XCircle, Loader2, Clock, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UploadQueueItem, ProcessingItem, SubmissionStatus } from '@/types/homework';

interface UploadQueueProgressProps {
  uploadQueue: UploadQueueItem[];
  processingQueue: ProcessingItem[];
}

const UPLOAD_STATUS_CONFIG = {
  queued: {
    icon: Clock,
    color: 'text-muted-foreground',
    label: '等待中',
  },
  uploading: {
    icon: Upload,
    color: 'text-blue-500',
    label: '上传中',
    animate: true,
  },
  uploaded: {
    icon: CheckCircle,
    color: 'text-green-500',
    label: '已上传',
  },
  failed: {
    icon: XCircle,
    color: 'text-destructive',
    label: '失败',
  },
} as const;

const PROCESSING_STATUS_CONFIG: Record<
  SubmissionStatus,
  { icon: typeof Loader2; color: string; label: string; animate?: boolean }
> = {
  pending: {
    icon: Clock,
    color: 'text-yellow-500',
    label: '等待处理',
  },
  processing: {
    icon: Loader2,
    color: 'text-blue-500',
    label: '处理中',
    animate: true,
  },
  graded: {
    icon: CheckCircle,
    color: 'text-green-500',
    label: '已完成',
  },
  failed: {
    icon: XCircle,
    color: 'text-destructive',
    label: '处理失败',
  },
};

const HOMEWORK_TYPE_LABELS = {
  math: '数学',
  english: '英语',
  chinese: '语文',
} as const;

export function UploadQueueProgress({
  uploadQueue,
  processingQueue,
}: UploadQueueProgressProps) {
  const hasItems = uploadQueue.length > 0 || processingQueue.length > 0;

  if (!hasItems) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* 上传队列 */}
      {uploadQueue.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Upload className="h-4 w-4" />
            上传队列 ({uploadQueue.length})
          </h4>
          <div className="space-y-1">
            {uploadQueue.map((item) => {
              const config = UPLOAD_STATUS_CONFIG[item.status];
              const Icon = config.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm"
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      config.color,
                      'animate' in config && config.animate && 'animate-pulse'
                    )}
                  />
                  <span className="truncate flex-1" title={item.file.name}>
                    {item.file.name}
                  </span>
                  <span
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded',
                      item.homeworkType === 'math' && 'bg-blue-100 text-blue-800',
                      item.homeworkType === 'english' && 'bg-green-100 text-green-800',
                      item.homeworkType === 'chinese' && 'bg-orange-100 text-orange-800'
                    )}
                  >
                    {HOMEWORK_TYPE_LABELS[item.homeworkType]}
                  </span>
                  {item.error && (
                    <span className="text-xs text-destructive" title={item.error}>
                      {item.error.slice(0, 20)}...
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 处理队列 */}
      {processingQueue.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            处理队列 ({processingQueue.length})
          </h4>
          <div className="space-y-1">
            {processingQueue.map((item) => {
              const config = PROCESSING_STATUS_CONFIG[item.status];
              const Icon = config.icon;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm"
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      config.color,
                      config.animate && 'animate-spin'
                    )}
                  />
                  <span className="truncate flex-1" title={item.originalFileName}>
                    {item.originalFileName}
                  </span>
                  <span
                    className={cn(
                      'text-xs px-1.5 py-0.5 rounded',
                      item.homeworkType === 'math' && 'bg-blue-100 text-blue-800',
                      item.homeworkType === 'english' && 'bg-green-100 text-green-800',
                      item.homeworkType === 'chinese' && 'bg-orange-100 text-orange-800'
                    )}
                  >
                    {HOMEWORK_TYPE_LABELS[item.homeworkType]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
