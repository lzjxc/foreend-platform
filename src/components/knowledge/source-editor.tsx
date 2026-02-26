import { useState } from 'react';
import { useSourceEnums } from '@/hooks/use-knowledge';
import { useKnowledgeStore } from '@/stores/knowledge-store';

const LEVELS = [
  { key: 'lv1' as const, label: '分类' },
  { key: 'lv2' as const, label: '平台' },
  { key: 'lv3' as const, label: '作者' },
] as const;

export function SourceEditor() {
  const { selectedSource, setSourceLevel } = useKnowledgeStore();
  const { data: enums } = useSourceEnums();
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [showCustom, setShowCustom] = useState<Record<string, boolean>>({});

  const handleSelect = (level: 'lv1' | 'lv2' | 'lv3', value: string) => {
    if (selectedSource[level] === value) {
      setSourceLevel(level, null);
    } else {
      setSourceLevel(level, value);
    }
  };

  const handleCustomSubmit = (level: 'lv1' | 'lv2' | 'lv3') => {
    const value = customInputs[level]?.trim();
    if (value) {
      setSourceLevel(level, value);
      setCustomInputs((prev) => ({ ...prev, [level]: '' }));
      setShowCustom((prev) => ({ ...prev, [level]: false }));
    }
  };

  return (
    <div className="space-y-3">
      {LEVELS.map(({ key, label }) => {
        const options = enums?.[key] || [];
        const selected = selectedSource[key];

        return (
          <div key={key} className="flex items-start gap-3">
            <span className="mt-1.5 w-[45px] shrink-0 font-mono text-[10px] text-muted-foreground">
              {key} {label}
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {options.map((opt) => {
                const isSelected = selected === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleSelect(key, opt)}
                    className={`rounded border px-2 py-1 text-[11px] transition-all ${
                      isSelected
                        ? 'border-blue-300 bg-blue-50 font-semibold text-blue-700'
                        : 'border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
              {showCustom[key] ? (
                <input
                  autoFocus
                  value={customInputs[key] || ''}
                  onChange={(e) => setCustomInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit(key)}
                  onBlur={() => setShowCustom((prev) => ({ ...prev, [key]: false }))}
                  placeholder="输入..."
                  className="w-20 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] text-amber-700 outline-none"
                />
              ) : (
                <button
                  onClick={() => setShowCustom((prev) => ({ ...prev, [key]: true }))}
                  className="rounded border border-dashed border-border px-2 py-1 text-[11px] text-muted-foreground hover:border-muted-foreground/50"
                >
                  + 自定义
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* lv4: free text input */}
      <div className="flex items-center gap-3">
        <span className="w-[45px] shrink-0 font-mono text-[10px] text-muted-foreground">
          lv4 出处
        </span>
        <input
          value={selectedSource.lv4 || ''}
          onChange={(e) => setSourceLevel('lv4', e.target.value || null)}
          placeholder="文章/书名/章节（可选）"
          className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
        />
      </div>
    </div>
  );
}
