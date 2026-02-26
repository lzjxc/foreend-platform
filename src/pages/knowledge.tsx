import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Network, Circle, GitBranch } from 'lucide-react';
import { useKnowledgeStore } from '@/stores/knowledge-store';
import { CapturePanel } from '@/components/knowledge/capture-panel';
import { SearchPanel } from '@/components/knowledge/search-panel';
import { OntologyTree } from '@/components/knowledge/ontology-tree';
import { KnowledgeGaps } from '@/components/knowledge/knowledge-gaps';
import { KnowledgeGraph } from '@/components/knowledge/knowledge-graph';

const TABS = [
  { id: 'capture' as const, label: '捕获', icon: Plus },
  { id: 'search' as const, label: '检索', icon: Search },
  { id: 'ontology' as const, label: '知识图谱', icon: Network },
  { id: 'gaps' as const, label: '知识缺口', icon: Circle },
  { id: 'graph' as const, label: '关系图', icon: GitBranch },
];

export default function KnowledgePage() {
  const { activeTab, setActiveTab } = useKnowledgeStore();

  return (
    <div className="h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500">
            <span className="text-sm font-extrabold text-white">K</span>
          </div>
          <span className="text-base font-semibold text-foreground">
            Knowledge Hub
          </span>
          <span className="text-xs text-muted-foreground">prototype v2</span>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-0.5 rounded-lg border bg-muted/50 p-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 rounded-md px-4 py-2 text-sm transition-all ${
                  isActive
                    ? 'bg-background font-semibold text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'capture' && <CapturePanel />}
            {activeTab === 'search' && <SearchPanel />}
            {activeTab === 'ontology' && <OntologyTree />}
            {activeTab === 'gaps' && <KnowledgeGaps />}
            {activeTab === 'graph' && <KnowledgeGraph />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
