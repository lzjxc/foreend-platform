import { useState } from 'react';
import { Plus, Gem, ChevronDown, ChevronUp, X } from 'lucide-react';
import { toast } from 'sonner';
import { useModifiers, useCreateModifier, useUpdateModifier, useDeleteModifier } from '@/hooks/use-game-design';
import { MODIFIER_TYPE_LABELS } from '@/types/game-design';
import type { SkillModifier, SkillModifierCreate, SkillModifierUpdate, ModifierType } from '@/types/game-design';

export default function GameDevModifiersPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SkillModifier | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isLoading } = useModifiers();
  const createMod = useCreateModifier();
  const updateMod = useUpdateModifier();
  const deleteMod = useDeleteModifier();

  const modifiers = data?.items || [];

  const handleCreate = async (input: SkillModifierCreate) => {
    try {
      await createMod.mutateAsync(input);
      toast.success('修饰器创建成功');
      setFormOpen(false);
    } catch {
      toast.error('创建失败');
    }
  };

  const handleUpdate = async (input: SkillModifierUpdate & { id: number }) => {
    try {
      await updateMod.mutateAsync(input);
      toast.success('修饰器更新成功');
      setEditing(null);
      setFormOpen(false);
    } catch {
      toast.error('更新失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMod.mutateAsync(id);
      toast.success('修饰器已删除');
    } catch {
      toast.error('删除失败');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">修饰器</h2>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          新建
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border bg-muted/30" />
          ))}
        </div>
      ) : modifiers.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Gem className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">还没有修饰器</p>
        </div>
      ) : (
        <div className="space-y-3">
          {modifiers.map((mod) => (
            <div key={mod.id} className="rounded-xl border bg-card overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                onClick={() => setExpandedId(expandedId === mod.id ? null : mod.id)}
              >
                <div className="flex items-center gap-3">
                  <Gem className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold text-sm">{mod.name}</h3>
                    <p className="text-xs font-mono text-muted-foreground">{mod.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                    {MODIFIER_TYPE_LABELS[mod.modifier_type]}
                  </span>
                  {mod.max_stacks > 1 && <span className="text-[11px] text-muted-foreground">x{mod.max_stacks}</span>}
                  {expandedId === mod.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>

              {expandedId === mod.id && (
                <div className="border-t px-4 py-3 space-y-3">
                  <p className="text-sm text-muted-foreground">{mod.description}</p>

                  {Object.keys(mod.effects).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">效果</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(mod.effects).map(([k, v]) => (
                          <span key={k} className="rounded-md border bg-background px-2 py-1 text-xs font-mono">
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {mod.compatibility_tags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="text-[11px] text-muted-foreground">兼容:</span>
                      {mod.compatibility_tags.map((t) => (
                        <span key={t} className="text-[11px] text-green-500">#{t}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button onClick={() => { setEditing(mod); setFormOpen(true); }} className="rounded-md border px-3 py-1.5 text-xs hover:bg-accent">编辑</button>
                    <button onClick={() => handleDelete(mod.id)} className="rounded-md border px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10">删除</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <ModifierFormDialog
          modifier={editing}
          onClose={() => { setFormOpen(false); setEditing(null); }}
          onSubmit={editing ? (d) => handleUpdate({ id: editing.id, ...d } as SkillModifierUpdate & { id: number }) : handleCreate}
          isLoading={createMod.isPending || updateMod.isPending}
        />
      )}
    </div>
  );
}

function ModifierFormDialog({
  modifier,
  onClose,
  onSubmit,
  isLoading,
}: {
  modifier: SkillModifier | null;
  onClose: () => void;
  onSubmit: (data: SkillModifierCreate) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState(modifier?.name || '');
  const [code, setCode] = useState(modifier?.code || '');
  const [description, setDescription] = useState(modifier?.description || '');
  const [modifierType, setModifierType] = useState<ModifierType>(modifier?.modifier_type || 'gem');
  const [compatTags, setCompatTags] = useState(modifier?.compatibility_tags.join(', ') || '');
  const [effectsStr, setEffectsStr] = useState(modifier ? JSON.stringify(modifier.effects, null, 2) : '{}');
  const [maxStacks, setMaxStacks] = useState(modifier?.max_stacks || 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let effects: Record<string, unknown> = {};
    try { effects = JSON.parse(effectsStr); } catch { /* keep empty */ }
    onSubmit({
      name,
      code,
      description,
      modifier_type: modifierType,
      compatibility_tags: compatTags ? compatTags.split(',').map((s) => s.trim()).filter(Boolean) : [],
      effects,
      max_stacks: maxStacks,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-xl border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        <h2 className="text-lg font-semibold mb-4">{modifier ? '编辑修饰器' : '新建修饰器'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">名称 *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">代码 *</label>
              <input value={code} onChange={(e) => setCode(e.target.value)} required className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">类型 *</label>
              <select value={modifierType} onChange={(e) => setModifierType(e.target.value as ModifierType)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                {Object.entries(MODIFIER_TYPE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">最大叠加</label>
              <input type="number" value={maxStacks} onChange={(e) => setMaxStacks(Number(e.target.value))} min={1} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">描述 *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={2} className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">兼容标签（逗号分隔）</label>
            <input value={compatTags} onChange={(e) => setCompatTags(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="ice, frost" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">效果 (JSON)</label>
            <textarea value={effectsStr} onChange={(e) => setEffectsStr(e.target.value)} rows={3} className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-accent">取消</button>
            <button type="submit" disabled={isLoading} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {isLoading ? '保存中...' : modifier ? '更新' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
