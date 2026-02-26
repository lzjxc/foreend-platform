import { useState, useMemo, useEffect } from 'react';
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
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
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
import { useDocuments, useDocumentHtml, useCollectAll, useCollectStatus } from '@/hooks/use-doc-service';
import type { DocType, Document } from '@/types/doc-service';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// ==================== Constants ====================

type ServiceLayer = 'global' | 'shared' | 'apps' | 'personal' | 'game' | 'other';

const SERVICE_LAYER_MAP: Record<string, ServiceLayer> = {
  'config-service': 'shared',
  'data-fetcher': 'shared',
  'doc-service': 'shared',
  'file-gateway': 'shared',
  'llm-gateway': 'shared',
  'msg-gw': 'shared',
  'pdf-service': 'shared',
  'efficiency-evaluator': 'shared',
  'finance-service': 'shared',
  'knowledge-hub': 'apps',
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
  readme: 'README',
  api_doc: 'API 文档',
  architecture: '架构文档',
  error_log: '错误记录',
  system_doc: '系统文档',
  tutorial: '教程',
  other: '其他',
};

const DOC_TYPE_COLORS: Record<DocType, string> = {
  claude_md: 'bg-purple-100 text-purple-800',
  readme: 'bg-cyan-100 text-cyan-800',
  api_doc: 'bg-blue-100 text-blue-800',
  architecture: 'bg-emerald-100 text-emerald-800',
  error_log: 'bg-red-100 text-red-800',
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

function getDocTimestamp(doc: Document): string | undefined {
  return doc.source_updated_at || doc.updated_at || doc.created_at;
}

function getLatestTimestamp(docs: Document[]): string | undefined {
  let latest: string | undefined;
  for (const doc of docs) {
    const ts = getDocTimestamp(doc);
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
              <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                {formatRelativeTime(getDocTimestamp(doc))}
              </span>
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
  const [collectPolling, setCollectPolling] = useState(false);

  const { data: docsData, isLoading, refetch: refetchDocs } = useDocuments({
    doc_type: docType === 'all' ? undefined : docType,
    search: search || undefined,
    limit: 100,
  });

  const { data: htmlContent, isLoading: isLoadingHtml } = useDocumentHtml(
    selectedDoc?.id ?? null
  );

  const collectAll = useCollectAll();
  const { data: collectStatus } = useCollectStatus(collectPolling);

  // Start polling on trigger, stop when done
  useEffect(() => {
    if (collectPolling && collectStatus && !collectStatus.running) {
      setCollectPolling(false);
      refetchDocs();
    }
  }, [collectPolling, collectStatus, refetchDocs]);

  const handleCollect = () => {
    collectAll.mutate(undefined, {
      onSuccess: () => setCollectPolling(true),
    });
  };

  const isCollecting = collectAll.isPending || (collectPolling && collectStatus?.running);

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">文档中心</h1>
          <p className="text-muted-foreground">
            查阅和管理系统文档、API 文档、开发规范等
            {totalDocs > 0 && (
              <span className="ml-2 text-foreground font-medium">({totalDocs} 篇)</span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCollect}
          disabled={isCollecting}
          className="shrink-0"
        >
          {isCollecting ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1.5" />
          )}
          {isCollecting ? '采集中...' : '采集文档'}
        </Button>
      </div>

      {/* Collection Status Banner */}
      {collectPolling && collectStatus?.running && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 flex items-center gap-3 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600 shrink-0" />
          <div className="flex-1">
            <span className="font-medium text-blue-800">
              {collectStatus.current_step || '采集中'}
            </span>
            <span className="text-blue-600 ml-2">
              ({collectStatus.current_step_num}/{collectStatus.total_steps})
            </span>
            {(collectStatus.documents_created ?? 0) > 0 && (
              <span className="text-blue-600 ml-2">
                已创建 {collectStatus.documents_created} 篇
              </span>
            )}
          </div>
          {collectStatus.progress !== undefined && (
            <div className="w-20 h-1.5 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${collectStatus.progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Collection Complete Banner */}
      {!collectPolling && collectStatus && !collectStatus.running && collectStatus.status === 'completed' && collectAll.isSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-3 text-sm">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <span className="text-green-800">
            采集完成: {collectStatus.documents_created ?? 0} 篇创建,{' '}
            {collectStatus.documents_updated ?? 0} 篇更新,{' '}
            {collectStatus.commits_collected ?? 0} 条 commit
            {collectStatus.duration_seconds ? ` (${collectStatus.duration_seconds}s)` : ''}
          </span>
        </div>
      )}

      {(collectStatus?.errors_count ?? 0) > 0 && collectAll.isSuccess && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3 text-sm">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-amber-800">
            采集过程中出现 {collectStatus?.errors_count} 个错误
          </span>
        </div>
      )}

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
                <span>更新: {formatRelativeTime(getDocTimestamp(selectedDoc))}</span>
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
