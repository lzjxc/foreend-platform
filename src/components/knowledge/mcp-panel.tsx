import { useState } from 'react';
import {
  useMcpSources,
  useAddMcpSource,
  useDeleteMcpSource,
  useMcpResources,
  useImportMcpResources,
} from '@/hooks/use-knowledge';
import type { McpSource } from '@/types/knowledge';

type PanelState = 'list' | 'add' | 'browse';

export function McpPanel() {
  const [panelState, setPanelState] = useState<PanelState>('list');
  const [selectedSource, setSelectedSource] = useState<McpSource | null>(null);
  const [selectedUris, setSelectedUris] = useState<Set<string>>(new Set());

  // Form state
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');

  const { data: sources, isLoading: sourcesLoading } = useMcpSources();
  const addSource = useAddMcpSource();
  const deleteSource = useDeleteMcpSource();
  const {
    data: resources,
    isLoading: resourcesLoading,
    isError: resourcesError,
    error: resourcesErrorObj,
  } = useMcpResources(selectedSource?.id || '');
  const importResources = useImportMcpResources();

  const handleAddSource = async () => {
    if (!formName.trim() || !formUrl.trim()) return;
    try {
      await addSource.mutateAsync({
        name: formName.trim(),
        transport: 'sse',
        url: formUrl.trim(),
      });
      setFormName('');
      setFormUrl('');
      setPanelState('list');
    } catch {
      // error shown inline
    }
  };

  const handleDeleteSource = async (id: string) => {
    try {
      await deleteSource.mutateAsync(id);
      if (selectedSource?.id === id) {
        setSelectedSource(null);
        setPanelState('list');
      }
    } catch {
      // error shown inline
    }
  };

  const handleBrowse = (source: McpSource) => {
    setSelectedSource(source);
    setSelectedUris(new Set());
    setPanelState('browse');
  };

  const toggleUri = (uri: string) => {
    setSelectedUris((prev) => {
      const next = new Set(prev);
      if (next.has(uri)) next.delete(uri);
      else next.add(uri);
      return next;
    });
  };

  const handleImport = async () => {
    if (!selectedSource || selectedUris.size === 0) return;
    try {
      await importResources.mutateAsync({
        sourceId: selectedSource.id,
        uris: Array.from(selectedUris),
      });
      setSelectedUris(new Set());
    } catch {
      // error shown inline
    }
  };

  // -- Add source form --
  if (panelState === 'add') {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">添加 MCP 源</h3>
          <button
            onClick={() => setPanelState('list')}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            返回
          </button>
        </div>

        <div className="space-y-3">
          <input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="名称（如 Obsidian Vault）"
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
          />
          <input
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
            placeholder="SSE 端点 URL（如 http://localhost:3001/sse）"
            className="w-full rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setPanelState('list')}
              className="rounded-md border border-border px-4 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-muted"
            >
              取消
            </button>
            <button
              onClick={handleAddSource}
              disabled={!formName.trim() || !formUrl.trim() || addSource.isPending}
              className={`rounded-md px-4 py-2 text-[13px] font-semibold transition-all ${
                formName.trim() && formUrl.trim() && !addSource.isPending
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'cursor-not-allowed bg-muted text-muted-foreground'
              }`}
            >
              {addSource.isPending ? '添加中...' : '添加'}
            </button>
          </div>
          {addSource.isError && (
            <p className="text-xs text-red-500">
              添加失败: {addSource.error?.message || '未知错误'}
            </p>
          )}
        </div>
      </div>
    );
  }

  // -- Browse resources --
  if (panelState === 'browse' && selectedSource) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            {selectedSource.name}
            <span className="ml-2 text-xs font-normal text-muted-foreground">资源列表</span>
          </h3>
          <button
            onClick={() => { setSelectedSource(null); setPanelState('list'); }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            返回
          </button>
        </div>

        {resourcesLoading && (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            连接中...
          </div>
        )}

        {resourcesError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
            连接失败: {resourcesErrorObj?.message || '无法连接到 MCP 服务器'}
          </div>
        )}

        {resources && resources.length === 0 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            该服务器没有可用资源
          </div>
        )}

        {resources && resources.length > 0 && (
          <>
            <div className="max-h-[320px] space-y-1 overflow-y-auto">
              {resources.map((r) => (
                <label
                  key={r.uri}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedUris.has(r.uri)}
                    onChange={() => toggleUri(r.uri)}
                    className="h-4 w-4 rounded border-border accent-green-600"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-foreground">{r.name}</div>
                    <div className="truncate text-[11px] text-muted-foreground">{r.uri}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-xs text-muted-foreground">
                已选 {selectedUris.size} / {resources.length} 个资源
              </span>
              <button
                onClick={handleImport}
                disabled={selectedUris.size === 0 || importResources.isPending}
                className={`rounded-md px-5 py-2 text-[13px] font-semibold transition-all ${
                  selectedUris.size > 0 && !importResources.isPending
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'cursor-not-allowed bg-muted text-muted-foreground'
                }`}
              >
                {importResources.isPending ? '导入中...' : `导入 (${selectedUris.size})`}
              </button>
            </div>

            {importResources.isSuccess && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-700">
                导入完成
              </div>
            )}
            {importResources.isError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
                导入失败: {importResources.error?.message || '未知错误'}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // -- Source list (default) --
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">MCP 数据源</h3>
        <button
          onClick={() => setPanelState('add')}
          className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700"
        >
          + 添加源
        </button>
      </div>

      {sourcesLoading && (
        <div className="py-6 text-center text-sm text-muted-foreground">加载中...</div>
      )}

      {sources && sources.length === 0 && (
        <div className="rounded-xl border border-dashed border-input py-8 text-center">
          <p className="text-sm text-muted-foreground">尚未配置 MCP 数据源</p>
          <p className="mt-1 text-xs text-muted-foreground">
            添加 MCP 服务器以从外部知识库导入资源
          </p>
        </div>
      )}

      {sources && sources.length > 0 && (
        <div className="space-y-2">
          {sources.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground">{s.name}</div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase">
                    {s.transport}
                  </span>
                  {s.url && <span className="truncate">{s.url}</span>}
                  {s.last_connected_at && (
                    <span>
                      · 上次连接{' '}
                      {new Date(s.last_connected_at).toLocaleDateString('zh-CN')}
                    </span>
                  )}
                </div>
              </div>
              <div className="ml-3 flex items-center gap-2">
                <button
                  onClick={() => handleBrowse(s)}
                  className="rounded-md border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
                >
                  浏览
                </button>
                <button
                  onClick={() => handleDeleteSource(s.id)}
                  disabled={deleteSource.isPending}
                  className="rounded-md border border-border px-3 py-1.5 text-xs text-red-500 transition-colors hover:bg-red-50"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteSource.isError && (
        <p className="text-xs text-red-500">
          删除失败: {deleteSource.error?.message || '未知错误'}
        </p>
      )}
    </div>
  );
}
