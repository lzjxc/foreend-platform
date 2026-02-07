import { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Eye,
  ChevronRight,
  Globe,
  Wrench,
  Smartphone,
  Gamepad2,
  Home,
  HelpCircle,
  ChevronsUpDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useDocuments, useDocumentHtml } from '@/hooks/use-doc-service';
import type { DocType, Document } from '@/types/doc-service';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// ==================== Constants ====================

type ServiceLayer = 'global' | 'shared' | 'apps' | 'personal' | 'game' | 'other';

const SERVICE_LAYER_MAP: Record<string, ServiceLayer> = {
  'config-service': 'shared',
  'data-fetcher': 'shared',
  'file-gateway': 'shared',
  'llm-gateway': 'shared',
  'pdf-service': 'shared',
  'efficiency-evaluator': 'shared',
  'finance-service': 'shared',
  'ai-weekly': 'apps',
  'bill-parser': 'apps',
  'homework': 'apps',
  'wordbook': 'apps',
  'starling': 'apps',
  'personal-info': 'personal',
  'foreend-platform': 'personal',
  'game-weekly': 'game',
};

const LAYER_ORDER: ServiceLayer[] = ['global', 'shared', 'apps', 'game', 'personal', 'other'];

const LAYER_CONFIG: Record<ServiceLayer, { label: string; icon: typeof Globe; color: string; badgeColor: string }> = {
  global: { label: '全局/通用', icon: Globe, color: 'text-gray-700', badgeColor: 'bg-gray-100 text-gray-700' },
  shared: { label: '共享服务 / 中间件', icon: Wrench, color: 'text-green-700', badgeColor: 'bg-green-100 text-green-700' },
  apps: { label: '业务应用', icon: Smartphone, color: 'text-blue-700', badgeColor: 'bg-blue-100 text-blue-700' },
  game: { label: '游戏项目', icon: Gamepad2, color: 'text-pink-700', badgeColor: 'bg-pink-100 text-pink-700' },
  personal: { label: '个人服务', icon: Home, color: 'text-orange-700', badgeColor: 'bg-orange-100 text-orange-700' },
  other: { label: '其他', icon: HelpCircle, color: 'text-gray-500', badgeColor: 'bg-gray-100 text-gray-600' },
};

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

// ==================== Helpers ====================

function getServiceLayer(serviceId?: string): ServiceLayer {
  if (!serviceId) return 'global';
  return SERVICE_LAYER_MAP[serviceId] ?? 'other';
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '未知';
  try {
    return formatDistanceToNow(new Date(dateStr), { locale: zhCN, addSuffix: true });
  } catch {
    return '未知';
  }
}

function getLatestTimestamp(docs: Document[]): string | undefined {
  let latest: string | undefined;
  for (const doc of docs) {
    const ts = doc.updated_at || doc.created_at;
    if (ts && (!latest || ts > latest)) {
      latest = ts;
    }
  }
  return latest;
}

type GroupedDocs = Record<ServiceLayer, Record<string, Document[]>>;

function groupDocsByLayer(docs: Document[]): GroupedDocs {
  const result: GroupedDocs = {
    global: {},
    shared: {},
    apps: {},
    game: {},
    personal: {},
    other: {},
  };

  for (const doc of docs) {
    const layer = getServiceLayer(doc.service_id);
    const key = doc.service_id || '_global';
    if (!result[layer][key]) {
      result[layer][key] = [];
    }
    result[layer][key].push(doc);
  }

  return result;
}

// ==================== Components ====================

function ServiceCard({
  serviceId,
  docs,
  onDocClick,
}: {
  serviceId: string;
  docs: Document[];
  onDocClick: (doc: Document) => void;
}) {
  const isGlobal = serviceId === '_global';
  const latestTs = getLatestTimestamp(docs);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-sm">
            {isGlobal ? '通用文档' : serviceId}
          </h4>
          <Badge variant="outline" className="text-xs">
            {docs.length} 篇
          </Badge>
        </div>

        <div className="space-y-1.5">
          {docs.map((doc) => (
            <button
              key={doc.id}
              className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-sm group"
              onClick={() => onDocClick(doc)}
            >
              <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate group-hover:text-foreground">
                {doc.title}
              </span>
              <Badge className={cn('text-[10px] px-1.5 py-0 shrink-0', DOC_TYPE_COLORS[doc.doc_type])}>
                {DOC_TYPE_LABELS[doc.doc_type]}
              </Badge>
              <Eye className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          ))}
        </div>

        <div className="mt-3 pt-2 border-t text-xs text-muted-foreground">
          更新: {formatRelativeTime(latestTs)}
        </div>
      </CardContent>
    </Card>
  );
}

function LayerSection({
  layer,
  serviceGroups,
  isExpanded,
  onToggle,
  onDocClick,
}: {
  layer: ServiceLayer;
  serviceGroups: Record<string, Document[]>;
  isExpanded: boolean;
  onToggle: () => void;
  onDocClick: (doc: Document) => void;
}) {
  const config = LAYER_CONFIG[layer];
  const Icon = config.icon;
  const serviceCount = Object.keys(serviceGroups).length;
  const docCount = Object.values(serviceGroups).reduce((sum, docs) => sum + docs.length, 0);

  // Sort services alphabetically (but _global always first)
  const sortedServiceIds = Object.keys(serviceGroups).sort((a, b) => {
    if (a === '_global') return -1;
    if (b === '_global') return 1;
    return a.localeCompare(b);
  });

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center gap-3 py-2 px-1 hover:bg-accent/50 rounded-lg transition-colors">
          <ChevronRight
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              isExpanded && 'rotate-90'
            )}
          />
          <Icon className={cn('h-5 w-5', config.color)} />
          <span className="font-semibold text-base">{config.label}</span>
          <Badge className={cn('text-xs', config.badgeColor)}>
            {docCount} 篇
            {layer !== 'global' && serviceCount > 0 && ` · ${serviceCount} 个服务`}
          </Badge>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3 ml-8">
          {sortedServiceIds.map((serviceId) => (
            <ServiceCard
              key={serviceId}
              serviceId={serviceId}
              docs={serviceGroups[serviceId]}
              onDocClick={onDocClick}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ==================== Page ====================

export default function DocsPage() {
  const [search, setSearch] = useState('');
  const [docType, setDocType] = useState<DocType | 'all'>('all');
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [expandedLayers, setExpandedLayers] = useState<Set<ServiceLayer>>(
    () => new Set(LAYER_ORDER)
  );

  const { data: docsData, isLoading } = useDocuments({
    doc_type: docType === 'all' ? undefined : docType,
    search: search || undefined,
    limit: 100,
  });

  const { data: htmlContent, isLoading: isLoadingHtml } = useDocumentHtml(
    selectedDoc?.id ?? null
  );

  const documents = useMemo(() => docsData?.data ?? [], [docsData]);
  const grouped = useMemo(() => groupDocsByLayer(documents), [documents]);

  // Filter out empty layers
  const visibleLayers = useMemo(
    () => LAYER_ORDER.filter((layer) => Object.keys(grouped[layer]).length > 0),
    [grouped]
  );

  const allExpanded = visibleLayers.every((l) => expandedLayers.has(l));

  const toggleLayer = (layer: ServiceLayer) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) {
        next.delete(layer);
      } else {
        next.add(layer);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedLayers(new Set());
    } else {
      setExpandedLayers(new Set(LAYER_ORDER));
    }
  };

  const totalDocs = documents.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">文档中心</h1>
        <p className="text-muted-foreground">
          查阅和管理系统文档、API 文档、开发规范等
          {totalDocs > 0 && (
            <span className="ml-2 text-foreground font-medium">({totalDocs} 篇)</span>
          )}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
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

            <Button variant="outline" size="sm" onClick={toggleAll}>
              <ChevronsUpDown className="h-4 w-4 mr-1" />
              {allExpanded ? '折叠全部' : '展开全部'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grouped Document List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">加载中...</div>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mb-2 opacity-50" />
          <p>暂无文档</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleLayers.map((layer) => (
            <LayerSection
              key={layer}
              layer={layer}
              serviceGroups={grouped[layer]}
              isExpanded={expandedLayers.has(layer)}
              onToggle={() => toggleLayer(layer)}
              onDocClick={setSelectedDoc}
            />
          ))}
        </div>
      )}

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
            {selectedDoc && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {selectedDoc.service_id && (
                  <span>服务: {selectedDoc.service_id}</span>
                )}
                <span>版本: {selectedDoc.version}</span>
                <span>更新: {formatRelativeTime(selectedDoc.updated_at || selectedDoc.created_at)}</span>
              </div>
            )}
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
