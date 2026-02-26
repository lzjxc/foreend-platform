import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Trash2 } from 'lucide-react';
import { useSearch, useAtoms, useAtomConnections, useDeleteAtom, useSourceEnums } from '@/hooks/use-knowledge';
import type { KnowledgeAtom } from '@/types/knowledge';

const CONTENT_TYPE_MAP: Record<string, { label: string; color: string }> = {
  quote: { label: '引用', color: 'bg-amber-100 text-amber-700' },
  article: { label: '文章', color: 'bg-blue-100 text-blue-700' },
  conversation: { label: '对话', color: 'bg-green-100 text-green-700' },
  insight: { label: '洞察', color: 'bg-purple-100 text-purple-700' },
  reference: { label: '参考', color: 'bg-cyan-100 text-cyan-700' },
};

const KNOWLEDGE_LEVEL_MAP: Record<string, { dots: string; label: string }> = {
  surface: { dots: '●', label: '浅层' },
  working: { dots: '●●', label: '应用' },
  deep: { dots: '●●●', label: '深入' },
};

export function SearchPanel() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const { data, isLoading } = useSearch(submitted);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Source filters
  const [filterLv1, setFilterLv1] = useState('');
  const [filterLv2, setFilterLv2] = useState('');
  const [filterLv3, setFilterLv3] = useState('');
  const { data: rawEnums } = useSourceEnums();
  // Filter out garbled/corrupted entries (e.g. "??", "????")
  const enums = rawEnums ? {
    lv1: rawEnums.lv1.filter((v) => !/^\?+$/.test(v) && v.length > 0),
    lv2: rawEnums.lv2.filter((v) => !/^\?+$/.test(v) && v.length > 0),
    lv3: rawEnums.lv3.filter((v) => !/^\?+$/.test(v) && v.length > 0),
  } : undefined;

  const filters = {
    ...(filterLv1 ? { source_lv1: filterLv1 } : {}),
    ...(filterLv2 ? { source_lv2: filterLv2 } : {}),
    ...(filterLv3 ? { source_lv3: filterLv3 } : {}),
  };
  const hasFilters = filterLv1 || filterLv2 || filterLv3;

  const { data: atomsData } = useAtoms(1, Object.keys(filters).length > 0 ? filters : undefined);
  const totalAtoms = atomsData?.total || 0;

  const results = data?.results || [];

  const handleSearch = () => {
    if (query.trim().length >= 2) {
      setSubmitted(query.trim());
      setExpandedId(null);
    }
  };

  const clearFilters = () => {
    setFilterLv1('');
    setFilterLv2('');
    setFilterLv3('');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-foreground">知识检索</h2>
        <p className="text-[13px] text-muted-foreground">
          语义搜索 + 概念关联 · {totalAtoms} 条知识原子
        </p>
      </div>

      {/* Search input */}
      <div className="flex items-center gap-2 rounded-xl border bg-card px-4">
        <Search size={16} className="text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="搜索 — 试试 优越追求、modifier、心流..."
          className="flex-1 bg-transparent py-3 text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={handleSearch}
          disabled={query.trim().length < 2}
          className={`rounded-md px-4 py-1.5 text-[13px] transition-all ${
            query.trim().length >= 2
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'cursor-not-allowed bg-muted text-muted-foreground'
          }`}
        >
          搜索
        </button>
      </div>

      {/* Source filters */}
      <div className="flex flex-wrap items-center gap-3 text-[12px]">
        <span className="text-muted-foreground">来源筛选:</span>
        <select
          value={filterLv1}
          onChange={(e) => { setFilterLv1(e.target.value); setFilterLv2(''); setFilterLv3(''); }}
          className="rounded-md border bg-card px-2 py-1.5 text-[12px] text-foreground outline-none"
        >
          <option value="">全部分类</option>
          {(enums?.lv1 || []).map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select
          value={filterLv2}
          onChange={(e) => { setFilterLv2(e.target.value); setFilterLv3(''); }}
          className="rounded-md border bg-card px-2 py-1.5 text-[12px] text-foreground outline-none"
        >
          <option value="">全部平台</option>
          {(enums?.lv2 || []).map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select
          value={filterLv3}
          onChange={(e) => setFilterLv3(e.target.value)}
          className="rounded-md border bg-card px-2 py-1.5 text-[12px] text-foreground outline-none"
        >
          <option value="">全部作者</option>
          {(enums?.lv3 || []).map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-[11px] text-blue-500 hover:text-blue-600"
          >
            清除筛选
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <span className="text-[13px] text-muted-foreground">搜索中...</span>
        </div>
      )}

      {/* Results */}
      {submitted && !isLoading && (
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              找到 {data?.total || 0} 个结果
            </span>
            <button
              onClick={() => { setSubmitted(''); setQuery(''); setExpandedId(null); }}
              className="text-[11px] text-blue-500 hover:text-blue-600"
            >
              返回最近入库
            </button>
          </div>

          <div className="mt-3 space-y-0 divide-y">
            <AnimatePresence>
              {results.map((r, i) => (
                <SearchResultItem
                  key={r.atom.id}
                  atom={r.atom}
                  index={i}
                  isExpanded={expandedId === r.atom.id}
                  onToggle={() => setExpandedId(expandedId === r.atom.id ? null : r.atom.id)}
                  matchType={r.match_type}
                  score={r.score}
                />
              ))}
            </AnimatePresence>
          </div>

          {results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="text-[28px] opacity-40">&#128269;</span>
              <span className="mt-3 text-[15px] font-semibold text-foreground">
                未找到相关知识
              </span>
              <span className="mt-1 text-[13px] text-muted-foreground">
                尝试其他关键词
              </span>
            </div>
          )}
        </div>
      )}

      {/* Default: recent atoms */}
      {!submitted && !isLoading && (
        <div>
          <span className="text-[11px] text-muted-foreground">
            最近入库 · {totalAtoms} 条
          </span>

          {atomsData?.atoms && atomsData.atoms.length > 0 ? (
            <div className="mt-3 space-y-0 divide-y">
              <AnimatePresence>
                {atomsData.atoms.map((atom, i) => (
                  <SearchResultItem
                    key={atom.id}
                    atom={atom}
                    index={i}
                    isExpanded={expandedId === atom.id}
                    onToggle={() => setExpandedId(expandedId === atom.id ? null : atom.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="text-[28px] opacity-40">&#128218;</span>
              <span className="mt-3 text-[15px] font-semibold text-foreground">
                {hasFilters ? '没有匹配的知识原子' : '还没有知识原子'}
              </span>
              <span className="mt-1 text-[13px] text-muted-foreground">
                {hasFilters ? '尝试调整筛选条件' : '去「捕获」页面添加你的第一条知识'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Search result item with expandable detail ---

function SearchResultItem({
  atom,
  index,
  isExpanded,
  onToggle,
  matchType,
}: {
  atom: KnowledgeAtom;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  matchType?: string;
  score?: number;
}) {
  const ct = CONTENT_TYPE_MAP[atom.content_type] || CONTENT_TYPE_MAP.article;
  const kl = KNOWLEDGE_LEVEL_MAP[atom.knowledge_level] || KNOWLEDGE_LEVEL_MAP.surface;
  const date = new Date(atom.created_at).toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
  const deleteMutation = useDeleteAtom();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteMutation.mutate(atom.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`cursor-pointer py-4 transition-all ${
        isExpanded ? 'border-l-2 border-l-blue-500 pl-4 bg-blue-50/30' : 'pl-0'
      }`}
      onClick={onToggle}
    >
      {/* Row 1: Title + badges */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">·</span>
          <span className="text-[14px] font-bold text-foreground">{atom.title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {matchType && MATCH_TYPE_MAP[matchType] && (
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${MATCH_TYPE_MAP[matchType].color}`}>
              {MATCH_TYPE_MAP[matchType].label}
            </span>
          )}
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${ct.color}`}>
            {ct.label}
          </span>
          <span className="text-[11px] text-amber-500">{kl.dots}</span>
          <span className="text-[11px] text-muted-foreground">{kl.label}</span>
        </div>
      </div>

      {/* Row 2: Summary */}
      <p className={`mt-1.5 text-[13px] leading-relaxed text-muted-foreground ${isExpanded ? '' : 'line-clamp-2'}`}>
        {atom.summary}
      </p>

      {/* Row 3: Topic tags */}
      {atom.topic_labels?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {atom.topic_labels.map((t, i) => (
            <span key={i} className="rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Row 4: Date */}
      <div className="mt-2 text-right text-[11px] text-muted-foreground">{date}</div>

      {/* Expanded detail */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Meta info */}
          <div className="flex flex-wrap gap-4 text-[12px]">
            <span>
              <span className="text-muted-foreground">领域 </span>
              <span className="font-semibold text-blue-600">{atom.domain_label || atom.domain}</span>
            </span>
            <span>
              <span className="text-muted-foreground">来源 </span>
              <span className="text-foreground">{atom.source_ref || '—'}</span>
            </span>
            <span>
              <span className="text-muted-foreground">入库时间 </span>
              <span className="font-semibold text-foreground">{date}</span>
            </span>
            <span>
              <span className="text-muted-foreground">类型 </span>
              <span className="text-foreground">{ct.label}</span>
            </span>
          </div>

          {/* AI Summary */}
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground">AI 摘要</span>
            <p className="mt-1 text-[13px] leading-relaxed text-foreground">{atom.summary}</p>
          </div>

          {/* Raw content */}
          {atom.raw_content && (
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground">原始内容</span>
              <div className="mt-1 rounded-lg border bg-muted/50 p-4 text-[13px] leading-relaxed text-muted-foreground">
                {atom.raw_content}
              </div>
            </div>
          )}

          {/* Related knowledge */}
          <AtomConnections atomId={atom.id} />

          {/* Delete */}
          <div className="flex justify-end pt-2 border-t">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-red-500">确认删除？</span>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="rounded-md bg-red-500 px-3 py-1 text-[12px] text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {deleteMutation.isPending ? '删除中...' : '确认'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-md border px-3 py-1 text-[12px] text-muted-foreground hover:bg-muted"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 rounded-md px-3 py-1 text-[12px] text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <Trash2 size={12} />
                删除
              </button>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// --- Atom connections sub-component ---

const RELATION_COLORS: Record<string, string> = {
  shared_topic: 'bg-blue-100 text-blue-700',
  shared_concept: 'bg-purple-100 text-purple-700',
  same_domain: 'bg-green-100 text-green-700',
  cross_domain: 'bg-amber-100 text-amber-700',
  same_chapter: 'bg-indigo-100 text-indigo-700',
};

const RELATION_LABELS: Record<string, string> = {
  shared_topic: '共享主题',
  shared_concept: '共享概念',
  same_domain: '同领域',
  cross_domain: '跨领域',
  same_chapter: '同章节',
};

const MATCH_TYPE_MAP: Record<string, { label: string; color: string }> = {
  title: { label: '标题匹配', color: 'bg-blue-100 text-blue-700' },
  summary: { label: '摘要匹配', color: 'bg-emerald-100 text-emerald-700' },
  topic: { label: '主题匹配', color: 'bg-green-100 text-green-700' },
  concept: { label: '概念匹配', color: 'bg-purple-100 text-purple-700' },
  content: { label: '内容匹配', color: 'bg-slate-100 text-slate-600' },
  vector: { label: '语义匹配', color: 'bg-orange-100 text-orange-700' },
};

function AtomConnections({ atomId }: { atomId: string }) {
  const { data, isLoading } = useAtomConnections(atomId);

  if (isLoading) {
    return (
      <div>
        <span className="text-[11px] font-semibold text-muted-foreground">关联知识 · 加载中...</span>
      </div>
    );
  }

  const connections = data?.connections || [];

  return (
    <div>
      <span className="text-[11px] font-semibold text-muted-foreground">
        关联知识 · {connections.length} 条
      </span>
      {connections.length > 0 ? (
        <div className="mt-2 space-y-2">
          {connections.map((item) => (
            <div key={item.connection.id} className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[13px] font-medium text-foreground truncate">{item.related_atom.title}</span>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${RELATION_COLORS[item.connection.relation_type] || 'bg-muted text-muted-foreground'}`}>
                  {RELATION_LABELS[item.connection.relation_type] || item.connection.relation_type}
                </span>
              </div>
              <span className="shrink-0 ml-2 text-[11px] font-semibold text-blue-600">
                {Math.round(item.connection.confidence * 100)}%
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-[12px] text-muted-foreground">暂无关联</p>
      )}
    </div>
  );
}
