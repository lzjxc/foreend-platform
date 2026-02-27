import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { SkillAtom, SkillAtomCreate, AtomRole, CategoryInfo } from '@/types/game-design';
import { ATOM_ROLE_LABELS } from '@/types/game-design';

interface AtomFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  atom: SkillAtom | null;
  categories: CategoryInfo[];
  onSubmit: (data: SkillAtomCreate) => void;
  isLoading: boolean;
}

export function AtomFormDialog({ open, onOpenChange, atom, categories, onSubmit, isLoading }: AtomFormDialogProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [atomRole, setAtomRole] = useState<AtomRole>('hybrid');
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [paramKeys, setParamKeys] = useState('');

  useEffect(() => {
    if (atom) {
      setName(atom.name);
      setCode(atom.code);
      setCategory(atom.category);
      setAtomRole(atom.atom_role);
      setDescription(atom.description);
      setKeywords(atom.narrative_keywords.join(', '));
      setParamKeys(((atom.metadata as Record<string, unknown>)?.param_keys as string[])?.join(', ') || '');
    } else {
      setName('');
      setCode('');
      setCategory(categories[0]?.category || '');
      setAtomRole('hybrid');
      setDescription('');
      setKeywords('');
      setParamKeys('');
    }
  }, [atom, categories, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: SkillAtomCreate = {
      name,
      code,
      category: category as SkillAtomCreate['category'],
      atom_role: atomRole,
      description,
      narrative_keywords: keywords ? keywords.split(',').map((s) => s.trim()).filter(Boolean) : [],
      metadata: paramKeys ? { param_keys: paramKeys.split(',').map((s) => s.trim()).filter(Boolean) } : {},
    };
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange(false)}>
      <div
        className="relative w-full max-w-lg rounded-xl border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-lg font-semibold mb-4">{atom ? '编辑原子' : '新建原子'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">名称 *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="Single Target Damage"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">代码 *</label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono"
                placeholder="DMG_SINGLE"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">类别 *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.category} value={c.category}>{c.display_name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">角色</label>
              <select
                value={atomRole}
                onChange={(e) => setAtomRole(e.target.value as AtomRole)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                {Object.entries(ATOM_ROLE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">描述 *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none"
              placeholder="描述此原子的功能..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">叙事关键词（逗号分隔）</label>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              placeholder="strike, hit, blast"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">参数键（逗号分隔）</label>
            <input
              value={paramKeys}
              onChange={(e) => setParamKeys(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono"
              placeholder="damage_multiplier, cooldown_sec"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border px-4 py-2 text-sm transition-colors hover:bg-accent"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? '保存中...' : atom ? '更新' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
