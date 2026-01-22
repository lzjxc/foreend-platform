import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Newspaper, Calendar, FileText, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAIReport } from '@/hooks/use-ai-reports';
import type { AIReport } from '@/types/ai-report';

interface ReportCardProps {
  report: AIReport;
}

export function ReportCard({ report }: ReportCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isDaily = report.type === 'daily';

  // Always fetch full content for preview
  const { data: fullReport, isLoading: isLoadingContent } = useAIReport(report.id);

  // Format date display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get period display text
  const getPeriodText = () => {
    if (isDaily) {
      return formatDate(report.period_start);
    }
    return `${formatDate(report.period_start)} ~ ${formatDate(report.period_end)}`;
  };

  // Get preview content (first ~10 lines)
  const getPreviewContent = () => {
    const content = fullReport?.content || report.content;
    if (!content) {
      return null;
    }
    // Get first 10 non-empty lines (excluding main title)
    const lines = content
      .split('\n')
      .filter((line) => line.trim()) // Remove empty lines
      .filter((line) => !line.startsWith('# ')) // Remove h1 headers
      .slice(0, 10);
    return lines.join('\n');
  };

  const displayContent = fullReport?.content || report.content;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'p-2 rounded-lg',
                isDaily ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
              )}
            >
              <Newspaper className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold line-clamp-1">
                {report.title || `AI ${isDaily ? '日报' : '周报'} - ${getPeriodText()}`}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{getPeriodText()}</span>
                <span className="text-muted-foreground/50">·</span>
                <span>{formatTime(report.created_at)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {report.pdf_url && (
              <a
                href={report.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
              >
                <FileText className="h-4 w-4" />
                PDF
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <Badge variant={isDaily ? 'default' : 'secondary'}>
              {isDaily ? '日报' : '周报'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Preview when collapsed */}
        {!expanded && (
          <div className="mb-4">
            {isLoadingContent ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : getPreviewContent() ? (
              <article className="prose prose-sm max-w-none dark:prose-invert prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1 prose-ul:my-1 prose-li:my-0 text-muted-foreground">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ children }) => <span className="text-blue-600">{children}</span>,
                    h2: ({ children }) => (
                      <h2 className="text-sm font-semibold mt-2 mb-1">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm font-medium mt-1 mb-0.5">{children}</h3>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-4 space-y-0.5 text-sm">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-4 space-y-0.5 text-sm">{children}</ol>
                    ),
                    p: ({ children }) => <p className="text-sm my-1">{children}</p>,
                  }}
                >
                  {getPreviewContent()!}
                </ReactMarkdown>
              </article>
            ) : (
              <p className="text-sm text-muted-foreground">加载中...</p>
            )}
          </div>
        )}

        {/* Full content when expanded */}
        {expanded && (
          <div className="mb-4">
            {isLoadingContent ? (
              <div className="space-y-3 py-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-5 w-1/2 mt-4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : displayContent ? (
              <article className="prose prose-sm max-w-none dark:prose-invert prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-li:my-0">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
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
                    h1: ({ children }) => (
                      <h1 className="text-xl font-bold border-b pb-2 mb-3">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-semibold mt-4 mb-2">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base font-medium mt-3 mb-1">{children}</h3>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-5 space-y-1">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-5 space-y-1">{children}</ol>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-300 pl-4 italic text-muted-foreground my-2">
                        {children}
                      </blockquote>
                    ),
                    code: ({ className, children }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                          {children}
                        </code>
                      ) : (
                        <code className={cn('block bg-muted p-3 rounded-lg overflow-x-auto text-sm', className)}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {displayContent}
                </ReactMarkdown>
              </article>
            ) : (
              <p className="text-muted-foreground">内容加载失败</p>
            )}
          </div>
        )}

        {/* Expand/Collapse button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              收起
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              展开阅读
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
