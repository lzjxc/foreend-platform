import { useState } from 'react';
import { BookOpen, FileText, Calculator, Languages, Camera, CheckCircle, XCircle, RefreshCw, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useSubmissionStatus,
  useRecentSubmissions,
} from '@/hooks/use-homework';
import { BatchGradingPanel } from '@/components/homework/batch-grading-panel';
import type { SubmissionStatus, HomeworkSubmission } from '@/types/homework';

const tabs = [
  { path: '/homework', label: '生成作业', icon: FileText },
  { path: '/homework/grading', label: '上传批改', icon: Camera },
  { path: '/homework/chinese', label: '语文字库', icon: BookOpen },
  { path: '/homework/math', label: '数学题库', icon: Calculator },
  { path: '/homework/english', label: '英语词库', icon: Languages },
];

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: '等待处理',
  processing: '评分中',
  graded: '批改完成',
  failed: '批改失败',
};

const STATUS_COLORS: Record<SubmissionStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  graded: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

// Submission history item component
function SubmissionItem({ submission }: { submission: HomeworkSubmission }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const total = submission.total_correct + submission.total_wrong;
  const accuracy = total > 0 ? (submission.total_correct / total) * 100 : 0;
  const { data: details } = useSubmissionStatus(isExpanded ? submission.id : null);
  const canExpand = submission.status === 'graded';

  return (
    <div className="rounded-lg bg-muted/50 overflow-hidden">
      <div
        className={cn(
          'flex items-center justify-between p-3',
          canExpand && 'cursor-pointer hover:bg-muted/80 transition-colors'
        )}
        onClick={() => canExpand && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Badge className={STATUS_COLORS[submission.status]}>
            {STATUS_LABELS[submission.status]}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {new Date(submission.submitted_at).toLocaleString('zh-CN')}
          </span>
        </div>
        {submission.status === 'graded' && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-600">{submission.total_correct}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-600">{submission.total_wrong}</span>
            </div>
            <Badge variant="outline">{accuracy.toFixed(0)}%</Badge>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        )}
        {submission.status === 'failed' && submission.error_message && (
          <span className="text-sm text-red-500 truncate max-w-[200px]">{submission.error_message}</span>
        )}
      </div>

      {isExpanded && details && (
        <div className="border-t p-3 space-y-3">
          {details.results && details.results.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">每题详情</div>
              <div className="grid grid-cols-10 gap-1">
                {details.results.map((result, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'flex items-center justify-center p-1.5 rounded text-xs font-medium',
                      result.correct
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    )}
                    title={result.correct ? '正确' : '错误'}
                  >
                    {result.problem_index || idx + 1}
                  </div>
                ))}
              </div>
            </div>
          )}

          {submission.image_path && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                作业图片
              </div>
              <div className="rounded-lg overflow-hidden border">
                <img
                  src={`/minio-s3/images/${submission.image_path}`}
                  alt="作业"
                  className="w-full object-contain max-h-64"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function GradingPage() {
  const location = useLocation();
  const { data: submissions, refetch: refetchSubmissions } = useRecentSubmissions();

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">作业批改</h1>
        <p className="text-muted-foreground">上传作业照片，AI自动识别批改标记（勾/叉）</p>
      </div>

      {/* Tabs 导航 */}
      <div className="border-b">
        <nav className="flex space-x-4" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* 主内容区域 */}
      <div className="space-y-6">
        {/* 批量上传和待核查 */}
        <BatchGradingPanel />

        {/* 批改历史 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              批改历史（已确认）
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refetchSubmissions()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {!submissions || submissions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>暂无批改记录</p>
                <p className="text-sm mt-1">确认提交后会显示在这里</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {submissions.map((submission) => (
                  <SubmissionItem key={submission.id} submission={submission} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
