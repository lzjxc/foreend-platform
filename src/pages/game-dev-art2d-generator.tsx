import { useState, useRef, useCallback, useEffect } from 'react';
import { Wand2, Copy, Check, Loader2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { usePresets, useGeneratePrompt } from '@/hooks/use-design-image';
import { buildStreamUrl } from '@/api/design-image';
import type {
  GameGenre,
  ContentType,
  ArtStyle,
  TargetTool,
  GenerateRequest,
  GenerateResponse,
} from '@/types/design-image';
import {
  GAME_GENRE_LABELS,
  CONTENT_TYPE_LABELS,
  ART_STYLE_LABELS,
  TARGET_TOOL_LABELS,
} from '@/types/design-image';

// ---- helpers ----

function labelEntries<T extends string>(labels: Record<T, string>) {
  return Object.entries(labels) as [T, string][];
}

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
      onClick={copy}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? '已复制' : '复制'}
    </button>
  );
}

// ---- dynamic params per content_type ----

interface DynamicParamsProps {
  contentType: ContentType;
  params: Record<string, unknown>;
  onChange: (p: Record<string, unknown>) => void;
}

function DynamicParams({ contentType, params, onChange }: DynamicParamsProps) {
  const set = (key: string, value: unknown) => onChange({ ...params, [key]: value });

  const inputCls = 'w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm';
  const textareaCls = 'w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm';

  switch (contentType) {
    case 'monster':
    case 'character':
      return (
        <div className="space-y-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">名称</label>
            <input
              className={inputCls}
              value={(params.name as string) || ''}
              onChange={(e) => set('name', e.target.value)}
              placeholder={contentType === 'monster' ? '怪物名称' : '角色名称'}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">描述</label>
            <textarea
              className={textareaCls}
              rows={3}
              value={(params.description as string) || ''}
              onChange={(e) => set('description', e.target.value)}
              placeholder="外观、特征、氛围描述..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">关键词</label>
            <textarea
              className={textareaCls}
              rows={2}
              value={(params.keywords as string) || ''}
              onChange={(e) => set('keywords', e.target.value)}
              placeholder="以逗号分隔的关键词..."
            />
          </div>
        </div>
      );
    case 'scene':
      return (
        <div className="space-y-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">场景名称</label>
            <input
              className={inputCls}
              value={(params.scene_name as string) || ''}
              onChange={(e) => set('scene_name', e.target.value)}
              placeholder="如：暗夜森林、火山洞穴"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">描述</label>
            <textarea
              className={textareaCls}
              rows={3}
              value={(params.description as string) || ''}
              onChange={(e) => set('description', e.target.value)}
              placeholder="场景的视觉描述..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">氛围</label>
            <input
              className={inputCls}
              value={(params.mood as string) || ''}
              onChange={(e) => set('mood', e.target.value)}
              placeholder="如：阴森、宁静、壮阔"
            />
          </div>
        </div>
      );
    case 'item':
      return (
        <div className="space-y-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">道具名称</label>
            <input
              className={inputCls}
              value={(params.item_name as string) || ''}
              onChange={(e) => set('item_name', e.target.value)}
              placeholder="如：烈焰之剑、治愈药水"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">描述</label>
            <textarea
              className={textareaCls}
              rows={3}
              value={(params.description as string) || ''}
              onChange={(e) => set('description', e.target.value)}
              placeholder="道具外观和特征描述..."
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">稀有度</label>
            <Select
              value={(params.rarity as string) || ''}
              onValueChange={(v) => set('rarity', v)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="选择稀有度" />
              </SelectTrigger>
              <SelectContent>
                {['common', 'uncommon', 'rare', 'epic', 'legendary'].map((r) => (
                  <SelectItem key={r} value={r}>
                    {{ common: '普通', uncommon: '优秀', rare: '稀有', epic: '史诗', legendary: '传说' }[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    default:
      return (
        <div>
          <label className="text-xs font-medium text-muted-foreground">描述</label>
          <textarea
            className={textareaCls}
            rows={3}
            value={(params.description as string) || ''}
            onChange={(e) => set('description', e.target.value)}
            placeholder="描述你想要生成的内容..."
          />
        </div>
      );
  }
}

// ---- main page ----

export default function GameDevArt2DGenerator() {
  // form state
  const [gameGenre, setGameGenre] = useState<GameGenre>('rpg');
  const [projectName, setProjectName] = useState('');
  const [subGenre, setSubGenre] = useState('');
  const [platform, setPlatform] = useState('');
  const [artDirectionNotes, setArtDirectionNotes] = useState('');
  const [contentType, setContentType] = useState<ContentType>('monster');
  const [artStyle, setArtStyle] = useState<ArtStyle>('pixel64');
  const [targetTool, setTargetTool] = useState<TargetTool>('midjourney');
  const [params, setParams] = useState<Record<string, unknown>>({});
  const [projectOpen, setProjectOpen] = useState(false);

  // output state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // hooks
  const { data: presets } = usePresets();
  const generateMutation = useGeneratePrompt();

  // reset params when content_type changes
  useEffect(() => {
    setParams({});
  }, [contentType]);

  // auto-scroll output area
  useEffect(() => {
    if (isStreaming && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [streamedText, isStreaming]);

  const buildRequest = useCallback((): GenerateRequest => {
    return {
      project_context: {
        game_genre: gameGenre,
        ...(projectName ? { project_name: projectName } : {}),
        ...(subGenre ? { sub_genre: subGenre } : {}),
        ...(platform ? { platform } : {}),
        ...(artDirectionNotes ? { art_direction_notes: artDirectionNotes } : {}),
      },
      content_type: contentType,
      art_style: artStyle,
      target_tool: targetTool,
      params,
    };
  }, [gameGenre, projectName, subGenre, platform, artDirectionNotes, contentType, artStyle, targetTool, params]);

  const handleGenerate = useCallback(() => {
    // clean up previous
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    const req = buildRequest();
    setIsStreaming(true);
    setStreamedText('');
    setResult(null);

    const url = buildStreamUrl(req);
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'delta') {
          setStreamedText((prev) => prev + data.text);
        } else if (data.type === 'done') {
          setResult(data);
          setIsStreaming(false);
          es.close();
          esRef.current = null;
        } else if (data.type === 'error') {
          toast.error(data.message || '生成失败');
          setIsStreaming(false);
          es.close();
          esRef.current = null;
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      // fallback to non-streaming
      if (isStreaming) {
        setIsStreaming(false);
        generateMutation
          .mutateAsync(req)
          .then((r) => setResult(r))
          .catch(() => toast.error('生成失败'));
      }
    };
  }, [buildRequest, generateMutation, isStreaming]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (esRef.current) {
        esRef.current.close();
      }
    };
  }, []);

  const loadPreset = (preset: typeof presets extends (infer T)[] | undefined ? T : never) => {
    if (!preset) return;
    setGameGenre(preset.project_context.game_genre);
    setProjectName(preset.project_context.project_name || '');
    setSubGenre(preset.project_context.sub_genre || '');
    setPlatform(preset.project_context.platform || '');
    setArtDirectionNotes(preset.project_context.art_direction_notes || '');
    setContentType(preset.content_type);
    setArtStyle(preset.art_style);
    setParams(preset.params);
    toast.success(`已加载预设: ${preset.name}`);
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-180px)]">
      {/* ---- LEFT PANEL: Form ---- */}
      <div className="w-[320px] flex-shrink-0 overflow-y-auto space-y-4 pr-2">
        {/* Presets */}
        {presets && presets.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">快速预设</label>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => loadPreset(p)}
                  className="rounded-md bg-muted px-2.5 py-1 text-xs hover:bg-muted/80 transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Project Context (collapsible) */}
        <div className="rounded-lg border bg-card">
          <button
            onClick={() => setProjectOpen(!projectOpen)}
            className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium"
          >
            项目信息
            {projectOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {projectOpen && (
            <div className="space-y-2 px-3 pb-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">游戏类型 *</label>
                <Select value={gameGenre} onValueChange={(v) => setGameGenre(v as GameGenre)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {labelEntries(GAME_GENRE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">项目名称</label>
                <input
                  className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="可选"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">子类型</label>
                <input
                  className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
                  value={subGenre}
                  onChange={(e) => setSubGenre(e.target.value)}
                  placeholder="可选"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">平台</label>
                <input
                  className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  placeholder="如：Mobile, PC, Console"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">美术方向备注</label>
                <textarea
                  className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm"
                  rows={2}
                  value={artDirectionNotes}
                  onChange={(e) => setArtDirectionNotes(e.target.value)}
                  placeholder="整体美术风格说明..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Content Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">内容类型</label>
          <div className="grid grid-cols-3 gap-1.5">
            {labelEntries(CONTENT_TYPE_LABELS).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setContentType(k)}
                className={`rounded-md px-2 py-1.5 text-xs transition-colors ${
                  contentType === k
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Art Style */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">画风</label>
          <div className="grid grid-cols-2 gap-1.5">
            {labelEntries(ART_STYLE_LABELS).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setArtStyle(k)}
                className={`rounded-md px-2 py-1.5 text-xs transition-colors ${
                  artStyle === k
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Target Tool */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">目标工具</label>
          <Select value={targetTool} onValueChange={(v) => setTargetTool(v as TargetTool)}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {labelEntries(TARGET_TOOL_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Dynamic Params */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            {CONTENT_TYPE_LABELS[contentType]}参数
          </label>
          <DynamicParams contentType={contentType} params={params} onChange={setParams} />
        </div>
      </div>

      {/* ---- RIGHT PANEL: Output ---- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Generate button */}
        <div className="mb-4">
          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={isStreaming || generateMutation.isPending}
            className="w-full"
          >
            {isStreaming || generateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                生成 Prompt
              </>
            )}
          </Button>
        </div>

        {/* Streaming / Result area */}
        <div ref={outputRef} className="flex-1 overflow-y-auto space-y-4">
          {/* Streaming text */}
          {isStreaming && (
            <div className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Sparkles className="h-4 w-4 animate-pulse" />
                正在生成...
              </div>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                {streamedText}
                <span className="animate-pulse">|</span>
              </pre>
            </div>
          )}

          {/* Final result */}
          {result && !isStreaming && (
            <div className="space-y-3">
              {/* Prompt */}
              <div className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Prompt</span>
                  <CopyButton text={result.prompt} label="Prompt" />
                </div>
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                  {result.prompt}
                </pre>
              </div>

              {/* Negative Prompt */}
              {result.negative_prompt && (
                <div className="rounded-lg border bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Negative Prompt</span>
                    <CopyButton text={result.negative_prompt} label="Negative Prompt" />
                  </div>
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono text-orange-400/80">
                    {result.negative_prompt}
                  </pre>
                </div>
              )}

              {/* Tool Suffix */}
              {result.tool_suffix && (
                <div className="rounded-lg border bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">工具后缀</span>
                    <CopyButton text={result.tool_suffix} label="工具后缀" />
                  </div>
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono text-blue-400/80">
                    {result.tool_suffix}
                  </pre>
                </div>
              )}

              {/* Full Prompt */}
              <div className="rounded-lg border-2 border-primary/30 bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary">
                    完整 Prompt (可直接使用)
                  </span>
                  <CopyButton text={result.full_prompt} label="完整 Prompt" />
                </div>
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                  {result.full_prompt}
                </pre>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Tokens: {result.metadata.tokens_used}</span>
                <span>|</span>
                <span>{result.metadata.content_type} / {result.metadata.art_style}</span>
                <span>|</span>
                <span>{result.metadata.target_tool}</span>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!isStreaming && !result && !generateMutation.isPending && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Wand2 className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm">设置参数后点击「生成 Prompt」</p>
              <p className="text-xs mt-1 opacity-60">
                支持 SSE 流式输出，实时查看生成过程
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
