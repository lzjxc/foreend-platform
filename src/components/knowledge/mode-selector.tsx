import { useKnowledgeStore } from '@/stores/knowledge-store';
import type { CaptureMode } from '@/types/knowledge';

const MODES: {
  id: CaptureMode;
  icon: string;
  label: string;
  tag: string;
  tagColor: string;
  description: string;
  disabled?: boolean;
}[] = [
  {
    id: 'excerpt',
    icon: '✦',
    label: '随读随摘',
    tag: '推荐',
    tagColor: 'text-green-600 bg-green-50 border-green-200',
    description: '一段话、一个观点、一条笔记',
  },
  {
    id: 'chapter',
    icon: '◈',
    label: '章节投喂',
    tag: '自动拆解',
    tagColor: 'text-blue-600 bg-blue-50 border-blue-200',
    description: '整章笔记，自动拆为多个原子',
  },
  {
    id: 'book',
    icon: '◉',
    label: '整书导入',
    tag: '骨架级',
    tagColor: 'text-purple-600 bg-purple-50 border-purple-200',
    description: '全书 PDF，提取核心知识骨架',
  },
  {
    id: 'mcp',
    icon: '⬡',
    label: 'MCP 源',
    tag: '远程',
    tagColor: 'text-amber-600 bg-amber-50 border-amber-200',
    description: 'GitBook / Notion 等远程知识源',
  },
  {
    id: 'tech_doc',
    icon: '📦',
    label: '技术文档',
    tag: '批量',
    tagColor: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    description: '上传 ZIP 包（含 meta.json + .md）',
  },
];

export function ModeSelector() {
  const { captureMode, setCaptureMode } = useKnowledgeStore();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {MODES.map((mode) => {
        const isActive = captureMode === mode.id;
        return (
          <button
            key={mode.id}
            disabled={mode.disabled}
            onClick={() => setCaptureMode(mode.id)}
            className={`relative rounded-lg border p-4 text-left transition-all ${
              isActive
                ? 'border-blue-300 bg-blue-50/50 shadow-sm'
                : 'border-border bg-card hover:border-muted-foreground/30'
            } ${mode.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{mode.icon}</span>
                <span
                  className={`text-sm font-semibold ${
                    isActive ? 'text-blue-700' : 'text-foreground'
                  }`}
                >
                  {mode.label}
                </span>
              </div>
              <span
                className={`rounded px-2 py-0.5 text-[9px] font-medium ${mode.tagColor}`}
              >
                {mode.tag}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {mode.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
