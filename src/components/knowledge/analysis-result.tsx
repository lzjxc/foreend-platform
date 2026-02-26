import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSourceEnums } from '@/hooks/use-knowledge';
import type { PreviewAtomResult } from '@/types/knowledge';

// --- Color maps ---
const CONTENT_TYPE_MAP: Record<string, { label: string; color: string }> = {
  quote: { label: '引用', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  article: { label: '文章', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  conversation: { label: '对话', color: 'bg-green-100 text-green-700 border-green-200' },
  insight: { label: '洞察', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  reference: { label: '参考', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
};

const KNOWLEDGE_LEVEL_MAP: Record<string, { dots: string; label: string }> = {
  surface: { dots: '●', label: '浅层' },
  working: { dots: '●●', label: '应用' },
  deep: { dots: '●●●', label: '深入' },
};

const RELATION_TYPE_MAP: Record<string, { label: string; color: string }> = {
  shared_topic: { label: '共享主题', color: 'bg-blue-100 text-blue-700' },
  shared_concept: { label: '共享概念', color: 'bg-purple-100 text-purple-700' },
  same_domain: { label: '同领域', color: 'bg-green-100 text-green-700' },
  cross_domain: { label: '跨领域', color: 'bg-amber-100 text-amber-700' },
  same_chapter: { label: '同章节', color: 'bg-indigo-100 text-indigo-700' },
};

const DOMAIN_COLORS: Record<string, string> = {
  game_design: 'border-red-300 text-red-600 bg-red-50',
  psychology: 'border-blue-300 text-blue-600 bg-blue-50',
  philosophy: 'border-purple-300 text-purple-600 bg-purple-50',
  systems_thinking: 'border-green-300 text-green-600 bg-green-50',
  business: 'border-amber-300 text-amber-600 bg-amber-50',
  self_improvement: 'border-emerald-300 text-emerald-600 bg-emerald-50',
  technology: 'border-cyan-300 text-cyan-600 bg-cyan-50',
  educational_psychology: 'border-blue-300 text-blue-600 bg-blue-50',
};

function getDomainStyle(domain: string) {
  return DOMAIN_COLORS[domain] || 'border-blue-300 text-blue-600 bg-blue-50';
}

// --- Default source options ---
const DEFAULT_LV1 = ['书籍', '自媒体', '学术论文', 'AI对话', '网站', '播客', '视频', '课程', '新闻'];
const DEFAULT_LV2 = ['Medium', '博客园', 'CSDN', '微信读书', 'Kindle', '纸质书', 'Claude', 'ChatGPT', 'DeepSeek', '知乎', 'Twitter/X', 'YouTube', 'Bilibili', '豆瓣', '即刻', '小红书', 'arxiv', 'GitHub'];

// --- Props ---
interface AnalysisResultProps {
  preview: PreviewAtomResult;
  allAtoms?: PreviewAtomResult[];
  onConfirm: (sourceOverride: Record<string, string>) => void;
  onCancel: () => void;
  isConfirming: boolean;
}

type ResultTab = 'analysis' | 'connections' | 'ontology' | 'persistence';

export function AnalysisResult({
  preview,
  allAtoms,
  onConfirm,
  onCancel,
  isConfirming,
}: AnalysisResultProps) {
  const [tab, setTab] = useState<ResultTab>('analysis');
  const { data: enums } = useSourceEnums();
  const [selectedAtomIndex, setSelectedAtomIndex] = useState(0);

  const isChapter = allAtoms && allAtoms.length > 1;
  const activePreview = isChapter ? allAtoms[selectedAtomIndex] : preview;

  // Local source state (editable, initialized from first atom's source)
  const [sourceLv1, setSourceLv1] = useState(preview.source_hierarchy?.lv1 || '');
  const [sourceLv2, setSourceLv2] = useState(preview.source_hierarchy?.lv2 || '');
  const [sourceLv3, setSourceLv3] = useState(preview.source_hierarchy?.lv3 || '');
  const [sourceLv4, setSourceLv4] = useState(preview.source_hierarchy?.lv4 || '');
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [showCustom, setShowCustom] = useState<Record<string, boolean>>({});

  const ct = CONTENT_TYPE_MAP[activePreview.content_type] || CONTENT_TYPE_MAP.article;
  const kl = KNOWLEDGE_LEVEL_MAP[activePreview.knowledge_level] || KNOWLEDGE_LEVEL_MAP.surface;
  const newNodeCount = activePreview.ontology_updates?.length || 0;
  const suggestedCount = activePreview.suggested_subtopics?.length || 0;
  const totalAtomCount = isChapter ? allAtoms.length : 1;

  const handleConfirm = () => {
    const override: Record<string, string> = {};
    if (sourceLv1) override.lv1 = sourceLv1;
    if (sourceLv2) override.lv2 = sourceLv2;
    if (sourceLv3) override.lv3 = sourceLv3;
    if (sourceLv4) override.lv4 = sourceLv4;
    onConfirm(override);
  };

  const tabs: { id: ResultTab; label: string }[] = [
    { id: 'analysis', label: 'AI 分析' },
    { id: 'connections', label: '知识关联' },
    { id: 'ontology', label: '图谱变更' },
    { id: 'persistence', label: '持久化' },
  ];

  // Merge default + existing enums for source tags
  const lv1Options = mergeUnique(DEFAULT_LV1, enums?.lv1 || []);
  const lv2Options = mergeUnique(DEFAULT_LV2, enums?.lv2 || []);
  const lv3Options = enums?.lv3 || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border bg-card"
    >
      {/* Chapter summary header */}
      {isChapter && (
        <div className="rounded-t-xl border-b bg-blue-50 px-5 py-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-blue-700">
              章节分析完成 · 提取了 {allAtoms.length} 个知识原子
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {allAtoms.map((a, i) => (
              <button
                key={i}
                onClick={() => setSelectedAtomIndex(i)}
                className={`rounded-md border px-3 py-1.5 text-[12px] transition-all ${
                  i === selectedAtomIndex
                    ? 'border-blue-300 bg-white font-semibold text-blue-700 shadow-sm'
                    : 'border-transparent bg-blue-100/50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                {i + 1}. {a.title.length > 16 ? a.title.slice(0, 16) + '…' : a.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header: title + badges */}
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-3">
          {isChapter && (
            <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-600">
              {selectedAtomIndex + 1}/{allAtoms.length}
            </span>
          )}
          <h3 className="text-base font-bold text-foreground">{activePreview.title}</h3>
          <span className={`rounded-md border px-2 py-0.5 text-[11px] font-medium ${ct.color}`}>
            {ct.label}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-amber-500">
          <span>{kl.dots}</span>
          <span className="text-muted-foreground">{kl.label}</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="mt-3 flex gap-0 border-b px-5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-[13px] transition-colors ${
              tab === t.id
                ? 'border-b-2 border-blue-500 font-semibold text-foreground'
                : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5">
        {tab === 'analysis' && (
          <div className="space-y-5">
            {/* Domain */}
            <div>
              <Label>领域</Label>
              <div className="mt-1">
                <span className={`inline-block rounded-md border px-3 py-1 text-[13px] font-semibold ${getDomainStyle(activePreview.domain)}`}>
                  {activePreview.domain_label || activePreview.domain}
                </span>
              </div>
            </div>

            {/* Topics */}
            {activePreview.topic_labels?.length > 0 && (
              <div>
                <Label>主题</Label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {activePreview.topic_labels.map((t, i) => (
                    <span key={i} className="rounded-md border border-border px-3 py-1 text-[13px] text-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Concepts */}
            {activePreview.concepts?.length > 0 && (
              <div>
                <Label>提取概念</Label>
                <div className="mt-1 space-y-2">
                  {activePreview.concepts.map((c) => (
                    <div key={c.name} className="rounded-lg border bg-muted/40 px-4 py-3">
                      <span className="font-semibold text-[13px] text-foreground">{c.name}</span>
                      <span className="ml-2 text-[12px] text-muted-foreground">{c.def}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Source (editable) */}
            <div>
              <Label>来源（AI推断·可修改）</Label>
              <div className="mt-2 space-y-3">
                {/* lv1 */}
                <SourceRow
                  label="lv1 分类"
                  options={lv1Options}
                  selected={sourceLv1}
                  onSelect={setSourceLv1}
                  customInputs={customInputs}
                  showCustom={showCustom}
                  setCustomInputs={setCustomInputs}
                  setShowCustom={setShowCustom}
                  levelKey="lv1"
                />
                {/* lv2 */}
                <SourceRow
                  label="lv2 平台"
                  options={lv2Options}
                  selected={sourceLv2}
                  onSelect={setSourceLv2}
                  customInputs={customInputs}
                  showCustom={showCustom}
                  setCustomInputs={setCustomInputs}
                  setShowCustom={setShowCustom}
                  levelKey="lv2"
                />
                {/* lv3 */}
                <SourceRow
                  label="lv3 作者"
                  options={lv3Options}
                  selected={sourceLv3}
                  onSelect={setSourceLv3}
                  customInputs={customInputs}
                  showCustom={showCustom}
                  setCustomInputs={setCustomInputs}
                  setShowCustom={setShowCustom}
                  levelKey="lv3"
                  selectedColor="border-amber-300 bg-amber-50 text-amber-700"
                />
                {/* lv4 */}
                <div className="flex items-center gap-3">
                  <span className="w-[60px] shrink-0 text-[11px] text-muted-foreground">lv4 出处</span>
                  <input
                    value={sourceLv4}
                    onChange={(e) => setSourceLv4(e.target.value)}
                    placeholder="文章/书名/章节"
                    className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            <div>
              <Label>摘要</Label>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                {activePreview.summary}
              </p>
            </div>
          </div>
        )}

        {tab === 'connections' && (
          <div>
            {(activePreview.potential_connections?.length || 0) > 0 ? (
              <div className="space-y-3">
                <p className="text-[13px] text-muted-foreground">
                  AI 发现了与已有知识的 {activePreview.potential_connections.length} 条关联
                </p>
                {activePreview.potential_connections.map((conn, i) => (
                  <div key={i} className="rounded-lg border bg-muted/30 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-foreground">{conn.target_title}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${RELATION_TYPE_MAP[conn.relation_type]?.color || 'bg-muted text-muted-foreground'}`}>
                          {RELATION_TYPE_MAP[conn.relation_type]?.label || conn.relation_type}
                        </span>
                      </div>
                      <span className="text-[12px] font-semibold text-blue-600">
                        {Math.round(conn.confidence * 100)}%
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-muted-foreground line-clamp-2">
                      {conn.target_summary}
                    </p>
                    <p className="mt-1 text-[11px] italic text-muted-foreground">
                      {conn.reason}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-[13px] text-muted-foreground">
                暂未发现与已有知识的关联
              </div>
            )}
          </div>
        )}

        {tab === 'ontology' && (
          <div className="space-y-4">
            {/* Branch info card */}
            {activePreview.ontology_updates?.length > 0 && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
                <span className="mr-1">✦</span>
                知识树将新增分支：
                {activePreview.ontology_updates.map((u) => u.label).join(' > ')}
              </div>
            )}

            {/* Suggested subtopics */}
            {activePreview.suggested_subtopics?.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground">新增子节点</span>
                <div className="mt-2 space-y-2">
                  {activePreview.suggested_subtopics.map((sub) => (
                    <div key={sub.name} className="flex items-start gap-3 rounded-lg border bg-muted/30 px-4 py-3">
                      <span className="mt-0.5 text-muted-foreground">○</span>
                      <div className="flex-1">
                        <span className="text-[13px] font-medium text-foreground">{sub.name}</span>
                        <span className="ml-3 text-[12px] italic text-muted-foreground">{sub.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!activePreview.ontology_updates?.length && !activePreview.suggested_subtopics?.length && (
              <div className="py-8 text-center text-[13px] text-muted-foreground">
                无图谱变更
              </div>
            )}
          </div>
        )}

        {tab === 'persistence' && (
          <div className="space-y-4">
            <p className="text-[13px] text-muted-foreground">
              确认保存后，以下数据将写入数据库
            </p>

            <CodeCard title="knowledge_atoms" subtitle={`${totalAtomCount} 条知识原子`}>
              {`id, raw_content, summary, domain, topics(JSON),\nconcepts(JSON), knowledge_level, source_ref,\ncontent_type, created_at, embedding(vector)`}
            </CodeCard>

            <CodeCard title="knowledge_connections" subtitle="关联记录">
              {`source_atom_id → target_atom_id,\nrelation_type, reason`}
            </CodeCard>

            <CodeCard title="knowledge_ontology" subtitle="知识树扩展">
              {`路径：${activePreview.domain_label || activePreview.domain} > ${activePreview.topic_labels?.[0] || ''}\n子节点更新`}
            </CodeCard>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="border-t px-5 py-4">
        <div className="mb-3 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-[13px] text-emerald-700">
          <span className="mr-1">✦</span>
          将点亮 {newNodeCount} 个新节点 + 推荐 {suggestedCount} 个待探索方向
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="flex-1 rounded-lg bg-green-600 py-3 text-center text-[14px] font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {isConfirming ? '保存中...' : isChapter ? `确认保存 ${allAtoms.length} 个原子到知识库` : '确认保存到知识库'}
          </button>
          <button
            onClick={onCancel}
            disabled={isConfirming}
            className="rounded-lg border border-border px-6 py-3 text-[13px] text-muted-foreground transition-colors hover:bg-muted"
          >
            取消
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// --- Helper components ---

function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</span>;
}

function CodeCard({ title, subtitle, children }: { title: string; subtitle: string; children: string }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-4">
      <div className="mb-2">
        <span className="font-mono text-[13px] font-bold text-foreground">{title}</span>
        <span className="ml-2 text-[11px] text-muted-foreground">— {subtitle}</span>
      </div>
      <pre className="font-mono text-[12px] leading-relaxed text-muted-foreground whitespace-pre-wrap">{children}</pre>
    </div>
  );
}

interface SourceRowProps {
  label: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  customInputs: Record<string, string>;
  showCustom: Record<string, boolean>;
  setCustomInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setShowCustom: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  levelKey: string;
  selectedColor?: string;
}

function SourceRow({
  label,
  options,
  selected,
  onSelect,
  customInputs,
  showCustom,
  setCustomInputs,
  setShowCustom,
  levelKey,
  selectedColor = 'border-blue-300 bg-blue-50 text-blue-700',
}: SourceRowProps) {
  const handleCustomSubmit = () => {
    const val = customInputs[levelKey]?.trim();
    if (val) {
      onSelect(val);
      setCustomInputs((p) => ({ ...p, [levelKey]: '' }));
      setShowCustom((p) => ({ ...p, [levelKey]: false }));
    }
  };

  return (
    <div className="flex items-start gap-3">
      <span className="mt-1.5 w-[60px] shrink-0 text-[11px] text-muted-foreground">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {options.map((opt) => {
          const isSel = selected === opt;
          return (
            <button
              key={opt}
              onClick={() => onSelect(isSel ? '' : opt)}
              className={`rounded border px-2 py-1 text-[11px] transition-all ${
                isSel
                  ? `font-semibold ${selectedColor}`
                  : 'border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground'
              }`}
            >
              {opt}
            </button>
          );
        })}
        {showCustom[levelKey] ? (
          <input
            autoFocus
            value={customInputs[levelKey] || ''}
            onChange={(e) => setCustomInputs((p) => ({ ...p, [levelKey]: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
            onBlur={() => setShowCustom((p) => ({ ...p, [levelKey]: false }))}
            placeholder="输入..."
            className="w-20 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] text-amber-700 outline-none"
          />
        ) : (
          <button
            onClick={() => setShowCustom((p) => ({ ...p, [levelKey]: true }))}
            className="rounded border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground hover:border-muted-foreground/50"
          >
            + 自定义
          </button>
        )}
      </div>
    </div>
  );
}

function mergeUnique(defaults: string[], existing: string[]): string[] {
  const set = new Set([...defaults, ...existing]);
  return Array.from(set);
}
