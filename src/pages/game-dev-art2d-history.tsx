import { useState } from 'react';
import { Copy, Check, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { useHistory, useDeleteHistory } from '@/hooks/use-design-image';
import {
  CONTENT_TYPE_LABELS,
  ART_STYLE_LABELS,
  TARGET_TOOL_LABELS,
} from '@/types/design-image';
import type { ContentType, ArtStyle, TargetTool, HistoryItem } from '@/types/design-image';

// ---- helpers ----

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(label ? `${label} 已复制` : '已复制');
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={(e) => { e.stopPropagation(); copy(); }}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? '已复制' : '复制'}
    </button>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncate(s: string, len: number) {
  return s.length > len ? s.slice(0, len) + '...' : s;
}

// ---- card ----

function HistoryCard({ item }: { item: HistoryItem }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteMutation = useDeleteHistory();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    deleteMutation.mutate(item.id, {
      onSuccess: () => toast.success('已删除'),
      onError: () => toast.error('删除失败'),
    });
  };

  const ctLabel = CONTENT_TYPE_LABELS[item.content_type as ContentType] || item.content_type;
  const asLabel = ART_STYLE_LABELS[item.art_style as ArtStyle] || item.art_style;
  const ttLabel = TARGET_TOOL_LABELS[item.target_tool as TargetTool] || item.target_tool;

  return (
    <div
      className="rounded-lg border bg-card transition-colors hover:border-muted-foreground/30 cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {ctLabel}
          </span>
          <span className="text-xs text-muted-foreground">{asLabel}</span>
          <span className="text-xs text-muted-foreground">{ttLabel}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">{formatDate(item.created_at)}</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </div>

      {/* Preview (collapsed) */}
      {!expanded && (
        <div className="px-4 pb-3">
          <p className="text-sm text-muted-foreground font-mono">
            {truncate(item.prompt, 120)}
          </p>
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <div className="border-t px-4 py-3 space-y-3">
          {/* Prompt */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Prompt</span>
              <CopyButton text={item.prompt} label="Prompt" />
            </div>
            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono bg-muted/50 rounded p-2">
              {item.prompt}
            </pre>
          </div>

          {/* Negative Prompt */}
          {item.negative_prompt && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Negative Prompt</span>
                <CopyButton text={item.negative_prompt} label="Negative Prompt" />
              </div>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono bg-muted/50 rounded p-2 text-orange-400/80">
                {item.negative_prompt}
              </pre>
            </div>
          )}

          {/* Full Prompt */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary">完整 Prompt</span>
              <CopyButton text={item.full_prompt} label="完整 Prompt" />
            </div>
            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono bg-primary/5 border border-primary/20 rounded p-2">
              {item.full_prompt}
            </pre>
          </div>

          {/* Meta + actions */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Tokens: {item.tokens_used}</span>
              {item.project_name && <span>| {item.project_name}</span>}
            </div>
            <Button
              variant={confirmDelete ? 'destructive' : 'ghost'}
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  {confirmDelete ? '确认删除?' : '删除'}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- main page ----

export default function GameDevArt2DHistory() {
  const [page, setPage] = useState(1);
  const [filterContentType, setFilterContentType] = useState<string>('');
  const [filterArtStyle, setFilterArtStyle] = useState<string>('');
  const [filterTargetTool, setFilterTargetTool] = useState<string>('');

  const { data, isLoading } = useHistory({
    page,
    limit: 20,
    ...(filterContentType ? { content_type: filterContentType } : {}),
    ...(filterArtStyle ? { art_style: filterArtStyle } : {}),
    ...(filterTargetTool ? { target_tool: filterTargetTool } : {}),
  });

  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterContentType} onValueChange={(v) => { setFilterContentType(v === '__all__' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[140px] h-8 text-sm">
            <SelectValue placeholder="内容类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部类型</SelectItem>
            {Object.entries(CONTENT_TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterArtStyle} onValueChange={(v) => { setFilterArtStyle(v === '__all__' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[140px] h-8 text-sm">
            <SelectValue placeholder="画风" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部画风</SelectItem>
            {Object.entries(ART_STYLE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterTargetTool} onValueChange={(v) => { setFilterTargetTool(v === '__all__' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[140px] h-8 text-sm">
            <SelectValue placeholder="目标工具" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">全部工具</SelectItem>
            {Object.entries(TARGET_TOOL_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {data && (
          <span className="text-xs text-muted-foreground ml-auto">
            共 {data.total} 条记录
          </span>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* List */}
      {data && data.items.length > 0 && (
        <div className="space-y-2">
          {data.items.map((item) => (
            <HistoryCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {data && data.items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <p className="text-sm">暂无生成记录</p>
          <p className="text-xs mt-1 opacity-60">在生成器中创建 Prompt 后会自动保存</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </Button>
        </div>
      )}
    </div>
  );
}
