import { motion } from 'framer-motion';
import { useOntology } from '@/hooks/use-knowledge';
import type { OntologyDomain, OntologyTopic, OntologySubtopic } from '@/types/knowledge';

const DOMAIN_COLORS: Record<string, { text: string; dot: string; tagActive: string; tagMuted: string }> = {
  game_design: {
    text: 'text-red-600',
    dot: 'bg-red-500',
    tagActive: 'border-red-200 bg-red-50 text-red-600',
    tagMuted: 'border-border bg-muted/50 text-muted-foreground',
  },
  psychology: {
    text: 'text-blue-600',
    dot: 'bg-blue-500',
    tagActive: 'border-blue-200 bg-blue-50 text-blue-600',
    tagMuted: 'border-border bg-muted/50 text-muted-foreground',
  },
  philosophy: {
    text: 'text-purple-600',
    dot: 'bg-purple-500',
    tagActive: 'border-purple-200 bg-purple-50 text-purple-600',
    tagMuted: 'border-border bg-muted/50 text-muted-foreground',
  },
  systems_thinking: {
    text: 'text-green-600',
    dot: 'bg-green-500',
    tagActive: 'border-green-200 bg-green-50 text-green-600',
    tagMuted: 'border-border bg-muted/50 text-muted-foreground',
  },
  business: {
    text: 'text-amber-600',
    dot: 'bg-amber-500',
    tagActive: 'border-amber-200 bg-amber-50 text-amber-600',
    tagMuted: 'border-border bg-muted/50 text-muted-foreground',
  },
  self_improvement: {
    text: 'text-emerald-600',
    dot: 'bg-emerald-500',
    tagActive: 'border-emerald-200 bg-emerald-50 text-emerald-600',
    tagMuted: 'border-border bg-muted/50 text-muted-foreground',
  },
  technology: {
    text: 'text-cyan-600',
    dot: 'bg-cyan-500',
    tagActive: 'border-cyan-200 bg-cyan-50 text-cyan-600',
    tagMuted: 'border-border bg-muted/50 text-muted-foreground',
  },
  educational_psychology: {
    text: 'text-blue-600',
    dot: 'bg-blue-500',
    tagActive: 'border-blue-200 bg-blue-50 text-blue-600',
    tagMuted: 'border-border bg-muted/50 text-muted-foreground',
  },
};

const DEFAULT_COLORS = {
  text: 'text-blue-600',
  dot: 'bg-blue-500',
  tagActive: 'border-blue-200 bg-blue-50 text-blue-600',
  tagMuted: 'border-border bg-muted/50 text-muted-foreground',
};

function getColors(domain: string) {
  return DOMAIN_COLORS[domain] || DEFAULT_COLORS;
}

export function OntologyTree() {
  const { data, isLoading } = useOntology();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-[13px] text-muted-foreground">加载知识图谱...</span>
      </div>
    );
  }

  if (!data?.domains?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <span className="text-[28px] opacity-40">&#9678;</span>
        <span className="mt-3 text-[15px] font-semibold text-foreground">
          知识图谱为空
        </span>
        <span className="mt-1 text-[13px] text-muted-foreground">
          开始捕获知识后，图谱将自动生成
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-foreground">知识图谱</h2>
        <p className="text-[13px] text-muted-foreground">
          亮色 = 已覆盖 · 暗色 = 待探索
        </p>
      </div>

      {data.domains.map((domain, i) => (
        <DomainCard key={domain.path} domain={domain} index={i} />
      ))}
    </div>
  );
}

function DomainCard({ domain, index }: { domain: OntologyDomain; index: number }) {
  const colors = getColors(domain.path);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-xl border bg-card p-5"
    >
      {/* Domain header */}
      <div className="flex items-center gap-3">
        <div className={`h-3 w-3 rounded-full ${colors.dot}`} />
        <span className={`text-[15px] font-bold ${colors.text}`}>
          {domain.label}
        </span>
      </div>

      {/* Topics */}
      {domain.topics.length > 0 && (
        <div className="mt-4 space-y-4">
          {domain.topics.map((topic) => (
            <TopicRow key={topic.path} topic={topic} domainPath={domain.path} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

function TopicRow({ topic, domainPath }: { topic: OntologyTopic; domainPath: string }) {
  const colors = getColors(domainPath);
  const totalSubs = topic.subtopics?.length || 0;
  const coveredSubs = topic.subtopics?.filter((s) => s.atom_count > 0).length || 0;
  const coveragePct = totalSubs > 0 ? Math.round((coveredSubs / totalSubs) * 100) : 0;
  const atomCount = topic.atom_count || 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-foreground">{topic.label}</span>
        <span className="text-[11px] text-muted-foreground">
          {totalSubs > 0 ? `${coveragePct}% · ` : ''}{atomCount} 条
        </span>
      </div>

      {topic.subtopics?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {topic.subtopics.map((sub) => (
            <SubtopicTag key={sub.path} sub={sub} colors={colors} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubtopicTag({ sub, colors }: { sub: OntologySubtopic; colors: typeof DEFAULT_COLORS }) {
  const hasAtoms = sub.atom_count > 0;

  return (
    <span
      className={`relative rounded border px-2 py-1 text-[11px] ${
        hasAtoms ? colors.tagActive : colors.tagMuted
      }`}
    >
      {sub.label}
      {sub.atom_count > 0 && (
        <sup className={`ml-0.5 text-[8px] font-bold ${hasAtoms ? '' : ''}`}>
          {sub.atom_count}
        </sup>
      )}
    </span>
  );
}
