import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, ExternalLink, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAIReport } from '@/hooks/use-ai-reports';
import type { AIReport } from '@/types/ai-report';
import { cn } from '@/lib/utils';

interface ReportDetailDialogProps {
  report: AIReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDetailDialog({ report, open, onOpenChange }: ReportDetailDialogProps) {
  // Fetch full report details if we only have summary
  const { data: fullReport, isLoading } = useAIReport(report?.id || '');
  const displayReport = fullReport || report;

  if (!report) return null;

  const isDaily = report.type === 'daily';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getPeriodText = () => {
    if (!displayReport) return '';
    if (isDaily) {
      return formatDate(displayReport.period_start);
    }
    return `${formatDate(displayReport.period_start)} ~ ${formatDate(displayReport.period_end)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-xl">
                {displayReport?.title || `AI ${isDaily ? '日报' : '周报'}`}
              </DialogTitle>
              <Badge variant={isDaily ? 'default' : 'secondary'}>
                {isDaily ? '日报' : '周报'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Calendar className="h-4 w-4" />
            <span>{getPeriodText()}</span>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 pr-4">
          {isLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-6 w-1/2 mt-4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <article className="prose prose-sm max-w-none py-4 dark:prose-invert">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom link rendering to open in new tab
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      {children}
                      <ExternalLink className="h-3 w-3 inline" />
                    </a>
                  ),
                  // Style headers
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold border-b pb-2 mb-4">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold mt-6 mb-3">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-medium mt-4 mb-2">{children}</h3>
                  ),
                  // Style lists
                  ul: ({ children }) => (
                    <ul className="list-disc pl-6 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-6 space-y-1">{children}</ol>
                  ),
                  // Style blockquotes
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-300 pl-4 italic text-muted-foreground">
                      {children}
                    </blockquote>
                  ),
                  // Style code blocks
                  code: ({ className, children }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                        {children}
                      </code>
                    ) : (
                      <code className={cn('block bg-muted p-4 rounded-lg overflow-x-auto', className)}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {displayReport?.content || ''}
              </ReactMarkdown>
            </article>
          )}
        </ScrollArea>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <div>
              {displayReport?.pdf_url && (
                <Button variant="outline" asChild>
                  <a
                    href={displayReport.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    下载 PDF
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
