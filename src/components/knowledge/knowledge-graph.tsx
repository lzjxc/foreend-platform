import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ChevronRight } from 'lucide-react';
import { useHierarchyGraph } from '@/hooks/use-knowledge';
import type { GraphLevel, HierarchyNode, HierarchyEdge } from '@/types/knowledge';

// Domain color palette
const DOMAIN_COLORS: Record<string, { bg: string; border: string; text: string; minimap: string; hex: string }> = {
  game_design: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', minimap: '#fca5a5', hex: '#fecaca' },
  psychology: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', minimap: '#93c5fd', hex: '#bfdbfe' },
  philosophy: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-700', minimap: '#c4b5fd', hex: '#ddd6fe' },
  systems_thinking: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-700', minimap: '#86efac', hex: '#bbf7d0' },
  business: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', minimap: '#fcd34d', hex: '#fde68a' },
  self_improvement: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', minimap: '#6ee7b7', hex: '#a7f3d0' },
  technology: { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-700', minimap: '#67e8f9', hex: '#a5f3fc' },
  educational_psychology: { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-700', minimap: '#a5b4fc', hex: '#c7d2fe' },
  unreal: { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-700', minimap: '#67e8f9', hex: '#a5f3fc' },
};

const DEFAULT_DOMAIN_COLOR = { bg: 'bg-slate-50', border: 'border-slate-300', text: 'text-slate-700', minimap: '#cbd5e1', hex: '#e2e8f0' };

function getDomainColor(domain: string) {
  return DOMAIN_COLORS[domain] || DEFAULT_DOMAIN_COLOR;
}

// Edge color by relation type
const EDGE_COLORS: Record<string, string> = {
  shared_topic: '#3b82f6',
  shared_concept: '#8b5cf6',
  same_domain: '#22c55e',
  cross_domain: '#f59e0b',
  same_chapter: '#6366f1',
  same_module: '#f97316',
};

// ── View state ──

interface ViewState {
  level: GraphLevel;
  domain?: string;
  domainLabel?: string;
  topic?: string;
  topicLabel?: string;
}

// ── Custom node: Domain ──

interface DomainNodeData extends Record<string, unknown> {
  label: string;
  domain: string;
  atom_count: number;
  topic_count: number;
}

function DomainNode({ data }: { data: DomainNodeData }) {
  const colors = getDomainColor(data.domain);
  return (
    <div className={`rounded-xl border-2 ${colors.border} ${colors.bg} px-5 py-4 min-w-[180px] shadow-md cursor-pointer select-none`}>
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0 !w-0 !h-0" />
      <div className={`text-[15px] font-bold ${colors.text} text-center`}>{data.label}</div>
      <div className="mt-2 flex items-center justify-center gap-3 text-[11px] text-muted-foreground">
        <span>{data.atom_count.toLocaleString()} 原子</span>
        <span>{data.topic_count} 主题</span>
      </div>
      <div className="mt-2 text-center text-[10px] text-muted-foreground/60">双击进入</div>
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0 !w-0 !h-0" />
    </div>
  );
}

// ── Custom node: Topic ──

interface TopicNodeData extends Record<string, unknown> {
  label: string;
  domain: string;
  atom_count: number;
}

function TopicNode({ data }: { data: TopicNodeData }) {
  const colors = getDomainColor(data.domain);
  return (
    <div className={`rounded-lg border-2 ${colors.border} ${colors.bg} px-4 py-3 min-w-[160px] shadow-sm cursor-pointer select-none`}>
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground !w-2 !h-2" />
      <div className={`text-[13px] font-semibold ${colors.text} text-center`}>{data.label}</div>
      <div className="mt-1 text-center text-[11px] text-muted-foreground">
        {data.atom_count.toLocaleString()} 原子
      </div>
      <div className="mt-1 text-center text-[10px] text-muted-foreground/60">双击进入</div>
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground !w-2 !h-2" />
    </div>
  );
}

// ── Custom node: Atom ──

interface AtomNodeData extends Record<string, unknown> {
  title: string;
  domain: string;
  domain_label: string | null;
  topic_labels: string[];
}

function AtomNode({ data }: { data: AtomNodeData }) {
  const colors = getDomainColor(data.domain);
  return (
    <div className={`rounded-lg border-2 ${colors.border} ${colors.bg} px-3 py-2 min-w-[120px] max-w-[200px] shadow-sm`}>
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground !w-2 !h-2" />
      <div className={`text-[12px] font-semibold ${colors.text} truncate`}>{data.title}</div>
      <div className="text-[10px] text-muted-foreground truncate mt-0.5">
        {data.domain_label || data.domain}
      </div>
      {data.topic_labels?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {data.topic_labels.slice(0, 2).map((t, i) => (
            <span key={i} className="rounded bg-background/80 px-1 py-0.5 text-[9px] text-muted-foreground border">
              {t}
            </span>
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { domain: DomainNode, topic: TopicNode, atom: AtomNode };

// ── Layout functions ──

function circularLayout(items: HierarchyNode[], domain?: string): Node[] {
  if (items.length === 0) return [];
  if (items.length === 1) {
    const n = items[0];
    return [{
      id: n.id,
      type: n.type,
      position: { x: 300, y: 200 },
      data: buildNodeData(n, domain),
    }];
  }

  const cx = 400;
  const cy = 300;
  const radius = Math.max(150, items.length * 40);

  return items.map((n, i) => {
    const angle = (2 * Math.PI * i) / items.length - Math.PI / 2;
    return {
      id: n.id,
      type: n.type,
      position: {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      },
      data: buildNodeData(n, domain),
    };
  });
}

function gridLayout(items: HierarchyNode[], domain?: string): Node[] {
  if (items.length === 0) return [];
  const cols = Math.ceil(Math.sqrt(items.length));
  return items.map((n, i) => ({
    id: n.id,
    type: n.type,
    position: {
      x: (i % cols) * 230,
      y: Math.floor(i / cols) * 130,
    },
    data: buildNodeData(n, domain),
  }));
}

function buildNodeData(n: HierarchyNode, domain?: string): Record<string, unknown> {
  if (n.type === 'domain') {
    return {
      label: n.label,
      domain: n.id,
      atom_count: n.atom_count || 0,
      topic_count: n.topic_count || 0,
    };
  }
  if (n.type === 'topic') {
    return {
      label: n.label,
      domain: domain || n.id.split('.')[0],
      atom_count: n.atom_count || 0,
    };
  }
  // atom
  return {
    title: n.title || n.label,
    domain: n.domain || domain || '',
    domain_label: n.domain_label || null,
    topic_labels: n.topic_labels || [],
  };
}

function buildEdges(items: HierarchyEdge[]): Edge[] {
  return items.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'default',
    style: {
      stroke: EDGE_COLORS[e.relation_type] || '#94a3b8',
      strokeWidth: e.weight ? Math.min(Math.max(1, e.weight), 5) : Math.max(1, (e.confidence || 0.5) * 3),
    },
    markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
    animated: (e.confidence ?? 0) >= 0.7 || (e.weight ?? 0) >= 3,
    label: e.weight ? `${e.weight}` : undefined,
    labelStyle: { fontSize: 10, fill: '#94a3b8' },
  }));
}

// ── Legend by level ──

function getLegendItems(level: GraphLevel): { color: string; label: string }[] {
  if (level === 'domains') {
    return [{ color: 'bg-amber-500', label: '跨领域' }];
  }
  if (level === 'topics') {
    return [
      { color: 'bg-blue-500', label: '共享主题' },
      { color: 'bg-purple-500', label: '共享概念' },
    ];
  }
  // atoms
  return [
    { color: 'bg-blue-500', label: '共享主题' },
    { color: 'bg-purple-500', label: '共享概念' },
    { color: 'bg-green-500', label: '同领域' },
    { color: 'bg-orange-500', label: '同模块' },
    { color: 'bg-indigo-500', label: '同章节' },
  ];
}

// ── Main component ──

export function KnowledgeGraph() {
  const [view, setView] = useState<ViewState>({ level: 'domains' });
  const { data: graphData, isLoading } = useHierarchyGraph(
    view.level,
    view.domain,
    view.topic,
  );

  const layoutFn = view.level === 'atoms' ? gridLayout : circularLayout;
  const initialNodes = useMemo(
    () => layoutFn(graphData?.nodes || [], view.domain),
    [graphData, view.domain, view.level],
  );
  const initialEdges = useMemo(
    () => buildEdges(graphData?.edges || []),
    [graphData],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Double-click to drill down
  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (view.level === 'domains') {
        const d = node.data as DomainNodeData;
        setView({ level: 'topics', domain: node.id, domainLabel: d.label });
      } else if (view.level === 'topics') {
        const d = node.data as TopicNodeData;
        setView({
          level: 'atoms',
          domain: view.domain,
          domainLabel: view.domainLabel,
          topic: node.id,
          topicLabel: d.label,
        });
      }
    },
    [view],
  );

  // Minimap color
  const nodeColor = useCallback((node: Node) => {
    if (node.type === 'domain') {
      return getDomainColor((node.data as DomainNodeData).domain).minimap;
    }
    if (node.type === 'topic') {
      return getDomainColor((node.data as TopicNodeData).domain).minimap;
    }
    return getDomainColor((node.data as AtomNodeData).domain).minimap;
  }, []);

  const totalNodes = graphData?.nodes?.length || 0;
  const totalEdges = graphData?.edges?.length || 0;
  const legendItems = getLegendItems(view.level);

  const levelLabels: Record<GraphLevel, string> = {
    domains: '域级总览',
    topics: '主题级',
    atoms: '原子级',
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {/* Header + Breadcrumb */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">知识关系图</h2>
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-[13px] mt-0.5">
            <button
              onClick={() => setView({ level: 'domains' })}
              className={`hover:underline ${view.level === 'domains' ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
            >
              全部领域
            </button>
            {view.domain && (
              <>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <button
                  onClick={() => setView({ level: 'topics', domain: view.domain, domainLabel: view.domainLabel })}
                  className={`hover:underline ${view.level === 'topics' ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
                >
                  {view.domainLabel || view.domain}
                </button>
              </>
            )}
            {view.topic && (
              <>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="font-semibold text-foreground">
                  {view.topicLabel || view.topic}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="text-[13px] text-muted-foreground">
          {levelLabels[view.level]} · {totalNodes} 节点 · {totalEdges} 关联
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[11px]">
        <span className="text-muted-foreground">关联类型:</span>
        {legendItems.map((item) => (
          <span key={item.label} className="flex items-center gap-1">
            <span className={`inline-block h-2 w-4 rounded ${item.color}`} /> {item.label}
          </span>
        ))}
      </div>

      {/* Graph */}
      {isLoading ? (
        <div className="flex h-[500px] items-center justify-center rounded-xl border bg-card">
          <span className="text-[13px] text-muted-foreground">加载中...</span>
        </div>
      ) : totalNodes === 0 ? (
        <div className="flex h-[500px] flex-col items-center justify-center rounded-xl border bg-card">
          <span className="text-[28px] opacity-40">&#128568;</span>
          <span className="mt-3 text-[15px] font-semibold text-foreground">暂无图谱数据</span>
          <span className="mt-1 text-[13px] text-muted-foreground">
            {view.level === 'domains'
              ? '捕获更多知识原子后，领域关系会在这里展示'
              : '该层级暂无数据，请返回上一级'}
          </span>
          {view.level !== 'domains' && (
            <button
              onClick={() => {
                if (view.level === 'atoms') {
                  setView({ level: 'topics', domain: view.domain, domainLabel: view.domainLabel });
                } else {
                  setView({ level: 'domains' });
                }
              }}
              className="mt-3 rounded-md border px-3 py-1.5 text-[13px] hover:bg-accent"
            >
              返回上一级
            </button>
          )}
        </div>
      ) : (
        <div className="h-[500px] rounded-xl border bg-card overflow-hidden">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDoubleClick={onNodeDoubleClick}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
          >
            <Background gap={20} size={1} />
            <Controls showInteractive={false} />
            <MiniMap nodeColor={nodeColor} zoomable pannable />
          </ReactFlow>
        </div>
      )}
    </div>
  );
}
