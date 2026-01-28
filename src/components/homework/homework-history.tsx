import { useState } from 'react';
import { FileText, ExternalLink, Calendar, Camera, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRecentHomework, useHomeworkSubmissions } from '@/hooks/use-homework';
import { HomeworkUpload } from './homework-upload';
import type { HomeworkType, HomeworkRecord } from '@/types/homework';

const HOMEWORK_TYPE_LABELS: Record<HomeworkType, string> = {
  combined: '综合',
  chinese: '语文',
  math: '数学',
  english: '英语',
};

const HOMEWORK_TYPE_COLORS: Record<HomeworkType, string> = {
  combined: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  chinese: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  math: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  english: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

// Submission status badge component
function SubmissionBadge({ homeworkId }: { homeworkId: number }) {
  const { data: submissions } = useHomeworkSubmissions(homeworkId);

  if (!submissions || submissions.length === 0) return null;

  // Get the latest submission
  const latestSubmission = submissions[0];

  if (latestSubmission.status === 'graded') {
    const total = latestSubmission.total_correct + latestSubmission.total_wrong;
    const accuracy = total > 0
      ? Math.round((latestSubmission.total_correct / total) * 100)
      : 0;
    return (
      <div className="flex items-center gap-1 text-xs">
        <CheckCircle className="h-3 w-3 text-green-500" />
        <span className="text-green-600 dark:text-green-400">{accuracy}%</span>
      </div>
    );
  }

  if (latestSubmission.status === 'failed') {
    return (
      <div className="flex items-center gap-1 text-xs">
        <XCircle className="h-3 w-3 text-red-500" />
        <span className="text-red-600 dark:text-red-400">失败</span>
      </div>
    );
  }

  return (
    <span className="text-xs text-muted-foreground">批改中...</span>
  );
}

export function HomeworkHistory() {
  const { data: records, isLoading } = useRecentHomework();
  const [uploadHomework, setUploadHomework] = useState<HomeworkRecord | null>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 构建 PDF URL - use nginx proxy in production
  const getPdfUrl = (pdfPath: string) => {
    if (pdfPath.startsWith('http')) return pdfPath;
    // Use proxy path that goes through nginx → MinIO
    return `/minio-s3/homework/${pdfPath}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          历史记录
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-5 w-12" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        ) : records && records.length > 0 ? (
          <div className="divide-y">
            {records.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {formatDate(record.homework_date)}
                  </span>
                  <Badge
                    variant="secondary"
                    className={HOMEWORK_TYPE_COLORS[record.homework_type]}
                  >
                    {HOMEWORK_TYPE_LABELS[record.homework_type]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(record.generated_at)}
                  </span>
                  <SubmissionBadge homeworkId={record.id} />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUploadHomework(record)}
                    className="flex items-center gap-1"
                  >
                    <Camera className="h-3 w-3" />
                    批改
                  </Button>
                  {record.pdf_path && (
                    <a
                      href={getPdfUrl(record.pdf_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      下载
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>暂无作业记录</p>
            <p className="text-sm mt-1">生成的作业会显示在这里</p>
          </div>
        )}
      </CardContent>

      {/* Upload Dialog */}
      {uploadHomework && (
        <HomeworkUpload
          homework={uploadHomework}
          open={!!uploadHomework}
          onOpenChange={(open) => !open && setUploadHomework(null)}
        />
      )}
    </Card>
  );
}
