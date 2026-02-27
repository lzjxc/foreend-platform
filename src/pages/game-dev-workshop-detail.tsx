import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Map,
  Scale,
  Package,
  FileText,
  Send,
  Bookmark,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronRight,
  StickyNote,
  History,
  Settings,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  useProject,
  useAnalyze,
  useEntries,
  useNotes,
  useAddNote,
  useDeleteNote,
  useDeleteEntry,
  useAIConfigs,
} from '@/hooks/use-game-workshop';
import { PHASES, PHASE_MAP } from '@/types/game-workshop';
import type { PhaseId, DesignEntry, AISection, SectionType } from '@/types/game-workshop';

const PHASE_ICONS: Record<string, React.ElementType> = {
  Search, RefreshCw, Map, Scale, Package, FileText,
};

const SECTION_STYLES: Record<SectionType, { border: string; bg: string; icon: string }> = {
  info: { border: 'border-blue-500/30', bg: 'bg-blue-500/5', icon: 'text-blue-500' },
  system: { border: 'border-violet-500/30', bg: 'bg-violet-500/5', icon: 'text-violet-500' },
  reference: { border: 'border-amber-500/30', bg: 'bg-amber-500/5', icon: 'text-amber-500' },
  warning: { border: 'border-red-500/30', bg: 'bg-red-500/5', icon: 'text-red-500' },
  formula: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', icon: 'text-emerald-500' },
};

export default function GameDevWorkshopDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: project, isLoading: projectLoading } = useProject(projectId!);
  const { data: entries } = useEntries(projectId!);
  const { data: notes } = useNotes(projectId!);
  const { data: aiConfigs } = useAIConfigs();
  const analyzeMutation = useAnalyze(projectId!);
  const addNoteMutation = useAddNote(projectId!);
  const deleteNoteMutation = useDeleteNote(projectId!);
  const deleteEntryMutation = useDeleteEntry(projectId!);

  const [currentPhase, setCurrentPhase] = useState<PhaseId>('concept');
  const [userInput, setUserInput] = useState('');
  const [latestResult, setLatestResult] = useState<DesignEntry | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<string | undefined>();

  const handleSubmit = async () => {
    if (!userInput.trim() || analyzeMutation.isPending) return;
    const result = await analyzeMutation.mutateAsync({
      phase_id: currentPhase,
      user_input: userInput.trim(),
      ai_config_id: selectedConfig,
    });
    setLatestResult(result);
    setUserInput('');
  };

  const handleSaveNote = () => {
    if (!userInput.trim()) return;
    addNoteMutation.mutate({
      content: userInput.trim(),
      phase_label: PHASE_MAP[currentPhase]?.label || currentPhase,
    });
  };

  const fillSuggestion = (text: string) => {
    setUserInput(text);
    inputRef.current?.focus();
  };

  if (projectLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-muted-foreground">
        <p>项目不存在</p>
        <button onClick={() => navigate('/game-dev/framework')} className="mt-2 text-primary underline">
          返回项目列表
        </button>
      </div>
    );
  }

  const phase = PHASE_MAP[currentPhase];
  const phaseEntries = entries?.filter((e) => e.phase_id === currentPhase) || [];

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/game-dev/framework')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold">{project.name}</h1>
            {project.description && (
              <p className="text-xs text-muted-foreground">{project.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${showSettings ? 'bg-muted' : 'hover:bg-muted/50'}`}
          >
            <Settings className="h-3.5 w-3.5" />
            设置
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && aiConfigs && (
        <div className="rounded-lg border bg-card p-4">
          <h4 className="mb-2 text-sm font-medium">AI 模型设置</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedConfig(undefined)}
              className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${!selectedConfig ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted'}`}
            >
              默认
            </button>
            {aiConfigs.map((cfg) => (
              <button
                key={cfg.id}
                onClick={() => setSelectedConfig(cfg.id)}
                className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${selectedConfig === cfg.id ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted'}`}
              >
                {cfg.name} ({cfg.model_name})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Phase navigation */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border bg-muted/50 p-1">
        {PHASES.map((p) => {
          const isActive = currentPhase === p.id;
          const Icon = PHASE_ICONS[p.icon] || Search;
          const isDone = entries?.some((e) => e.phase_id === p.id);
          return (
            <button
              key={p.id}
              onClick={() => setCurrentPhase(p.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-xs transition-all ${
                isActive
                  ? 'bg-primary font-semibold text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {p.label}
              {isDone && !isActive && <span className="text-emerald-500">&#10003;</span>}
            </button>
          );
        })}
      </div>

      {/* Phase description */}
      {phase && (
        <p className="text-sm text-muted-foreground">{phase.description}</p>
      )}

      {/* Collapsible panels: Notes + History */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowNotes(!showNotes)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${showNotes ? 'bg-muted' : 'hover:bg-muted/50'}`}
        >
          <StickyNote className="h-3.5 w-3.5" />
          笔记 {notes?.length ? `(${notes.length})` : ''}
          {showNotes ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${showHistory ? 'bg-muted' : 'hover:bg-muted/50'}`}
        >
          <History className="h-3.5 w-3.5" />
          历史 {entries?.length ? `(${entries.length})` : ''}
          {showHistory ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
      </div>

      {/* Notes panel */}
      {showNotes && (
        <div className="rounded-lg border bg-card p-4">
          <h4 className="mb-2 text-sm font-medium">设计笔记</h4>
          {!notes?.length ? (
            <p className="text-xs text-muted-foreground">暂无笔记。在输入框中写下内容后点击「存为笔记」。</p>
          ) : (
            <div className="space-y-2">
              {notes.map((n) => (
                <div key={n.id} className="flex items-start justify-between rounded-md border p-3">
                  <div>
                    <span className="mr-2 rounded bg-muted px-1.5 py-0.5 text-[10px]">{n.phase_label}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString('zh-CN')}
                    </span>
                    <p className="mt-1 text-sm">{n.content}</p>
                  </div>
                  <button
                    onClick={() => deleteNoteMutation.mutate(n.id)}
                    className="ml-2 rounded p-1 text-muted-foreground/50 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History panel */}
      {showHistory && (
        <div className="rounded-lg border bg-card p-4">
          <h4 className="mb-2 text-sm font-medium">分析历史</h4>
          {!entries?.length ? (
            <p className="text-xs text-muted-foreground">暂无历史记录。</p>
          ) : (
            <div className="space-y-2">
              {[...(entries || [])].reverse().map((entry) => (
                <HistoryItem
                  key={entry.id}
                  entry={entry}
                  onSelect={() => setLatestResult(entry)}
                  onDelete={() => deleteEntryMutation.mutate(entry.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input area */}
      <div className="rounded-lg border bg-card p-4">
        <textarea
          ref={inputRef}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder={currentPhase === 'concept'
            ? '描述你的游戏创意，例如：一款融合 roguelike 和卡牌构筑的战棋游戏...'
            : '输入你的补充或修改意见...'
          }
          rows={4}
          disabled={analyzeMutation.isPending}
          className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
        />
        <div className="mt-2 flex items-center justify-between">
          <button
            onClick={handleSaveNote}
            disabled={!userInput.trim()}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted disabled:opacity-30"
          >
            <Bookmark className="h-3.5 w-3.5" />
            存为笔记
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Ctrl+Enter 提交</span>
            <button
              onClick={handleSubmit}
              disabled={!userInput.trim() || analyzeMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  提交分析
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Result display */}
      {latestResult && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-transparent p-4">
            <h3 className="text-sm font-semibold">
              {PHASE_MAP[latestResult.phase_id as PhaseId]?.label || latestResult.phase_label}
            </h3>
            <p className="mt-1 text-sm">{latestResult.ai_result?.summary || latestResult.ai_summary}</p>
          </div>

          {/* Sections */}
          {latestResult.ai_result?.sections?.map((section, idx) => (
            <SectionCard key={idx} section={section} />
          ))}

          {/* Suggestions */}
          {latestResult.ai_result?.suggestions?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">建议探索方向</h4>
              <div className="flex flex-wrap gap-2">
                {latestResult.ai_result.suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => fillSuggestion(s)}
                    className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {latestResult.ai_result?.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {latestResult.ai_result.tags.map((tag, i) => (
                <span key={i} className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!latestResult && !phaseEntries.length && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {currentPhase === 'concept'
              ? '输入你的游戏创意，让 AI 帮你分析和规划'
              : '输入你的想法或修改意见'}
          </p>
          {currentPhase === 'concept' && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {['roguelike + 卡牌构筑', '开放世界 RPG', '塔防 + 自走棋'].map((s) => (
                <button
                  key={s}
                  onClick={() => fillSuggestion(s)}
                  className="rounded-full border px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Sub-components ---

function SectionCard({ section }: { section: AISection }) {
  const style = SECTION_STYLES[section.type] || SECTION_STYLES.info;
  return (
    <div className={`rounded-lg border ${style.border} ${style.bg} p-4`}>
      <h4 className={`mb-2 text-sm font-semibold ${style.icon}`}>{section.title}</h4>
      <div className="prose prose-sm max-w-none text-sm dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.content}</ReactMarkdown>
      </div>
    </div>
  );
}

function HistoryItem({
  entry,
  onSelect,
  onDelete,
}: {
  entry: DesignEntry;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-md border">
      <button
        onClick={() => { setExpanded(!expanded); onSelect(); }}
        className="flex w-full items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{entry.phase_label}</span>
          <span className="line-clamp-1 text-xs">{entry.user_input}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {new Date(entry.created_at).toLocaleString('zh-CN')}
          </span>
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </div>
      </button>
      {expanded && (
        <div className="border-t p-3">
          <p className="mb-2 text-xs text-muted-foreground">{entry.ai_summary}</p>
          {entry.ai_result?.sections?.map((s, i) => (
            <SectionCard key={i} section={s} />
          ))}
          <div className="mt-2 flex justify-end">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
              删除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
