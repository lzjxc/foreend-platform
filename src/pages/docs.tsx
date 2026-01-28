import { useState, useMemo } from 'react';
import { FileText, Search, Filter, Eye, Calendar, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDocuments, useDocumentHtml } from '@/hooks/use-doc-service';
import type { DocType, DocCategory, Document } from '@/types/doc-service';

const DOC_TYPE_LABELS: Record<DocType, string> = {
  claude_md: 'Claude MD',
  api_doc: 'API 文档',
  system_doc: '系统文档',
  tutorial: '教程',
  other: '其他',
};

const DOC_TYPE_COLORS: Record<DocType, string> = {
  claude_md: 'bg-purple-100 text-purple-800',
  api_doc: 'bg-blue-100 text-blue-800',
  system_doc: 'bg-green-100 text-green-800',
  tutorial: 'bg-orange-100 text-orange-800',
  other: 'bg-gray-100 text-gray-800',
};

const CATEGORY_LABELS: Record<DocCategory, string> = {
  development: '开发',
  deployment: '部署',
  operations: '运维',
  architecture: '架构',
  general: '通用',
};

export default function DocsPage() {
  const [search, setSearch] = useState('');
  const [docType, setDocType] = useState<DocType | 'all'>('all');
  const [category, setCategory] = useState<DocCategory | 'all'>('all');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const { data: docsData, isLoading } = useDocuments({
    doc_type: docType === 'all' ? undefined : docType,
    category: category === 'all' ? undefined : category,
    search: search || undefined,
    limit: 100,
  });

  const { data: htmlContent, isLoading: isLoadingHtml } = useDocumentHtml(
    selectedDoc?.id ?? null
  );

  const documents = useMemo(() => docsData?.data ?? [], [docsData]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">文档中心</h1>
        <p className="text-muted-foreground">查阅和管理系统文档、API 文档、开发规范等</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索文档..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={docType} onValueChange={(v) => setDocType(v as DocType | 'all')}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="文档类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {Object.entries(DOC_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={(v) => setCategory(v as DocCategory | 'all')}>
              <SelectTrigger className="w-[150px]">
                <Tag className="h-4 w-4 mr-2" />
                <SelectValue placeholder="分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Document List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            文档列表
            {docsData && (
              <Badge variant="secondary" className="ml-2">
                {docsData.total} 篇
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">加载中...</div>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mb-2 opacity-50" />
              <p>暂无文档</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">标题</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>服务</TableHead>
                  <TableHead>版本</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead className="w-[80px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell>
                      <Badge className={DOC_TYPE_COLORS[doc.doc_type]}>
                        {DOC_TYPE_LABELS[doc.doc_type]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{CATEGORY_LABELS[doc.category]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {doc.service_id || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{doc.version}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(doc.updated_at || doc.created_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Document Viewer Dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDoc?.title}
              {selectedDoc && (
                <Badge className={DOC_TYPE_COLORS[selectedDoc.doc_type]}>
                  {DOC_TYPE_LABELS[selectedDoc.doc_type]}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {isLoadingHtml ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">加载内容中...</div>
              </div>
            ) : htmlContent ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none p-4"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            ) : selectedDoc?.content ? (
              <pre className="whitespace-pre-wrap p-4 text-sm bg-muted rounded-lg">
                {selectedDoc.content}
              </pre>
            ) : (
              <div className="text-muted-foreground text-center py-8">
                暂无内容
              </div>
            )}
          </div>
          {selectedDoc?.tags && selectedDoc.tags.length > 0 && (
            <div className="border-t pt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">标签:</span>
              {selectedDoc.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
