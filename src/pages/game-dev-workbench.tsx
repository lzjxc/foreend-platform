import { useState, useMemo, useCallback } from 'react';
import { Search, X, Save, FileDown, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAtoms,
  useAtomCategories,
  useModifiers,
  useOriginalSkills,
  useSkillInstances,
  useCreateSkillInstance,
  useUpdateSkillInstance,
  useDeleteSkillInstance,
  useAddAtomToInstance,
  useRemoveAtomFromInstance,
  useMountModifier,
  useUnmountModifier,
  useCreateFromOriginal,
  useSkillInstance,
} from '@/hooks/use-game-design';
import { useGameDesignStore } from '@/stores/game-design-store';
import { ATOM_CATEGORY_LABELS, SKILL_TYPE_LABELS, GENERATION_SOURCE_LABELS } from '@/types/game-design';
import type { SkillAtom, SkillType, AtomInInstance, SkillInstance } from '@/types/game-design';
import { AtomCard } from '@/components/game-design/atom-card';
import { cn } from '@/lib/utils';

export default function GameDevWorkbenchPage() {
  const [atomSearch, setAtomSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const [templateDialog, setTemplateDialog] = useState(false);

  const { data: atomsData } = useAtoms();
  const { data: categoriesData } = useAtomCategories();
  const { data: modifiersData } = useModifiers();
  const { data: originalsData } = useOriginalSkills();
  const { data: instancesData } = useSkillInstances();

  const createInstance = useCreateSkillInstance();
  const updateInstance = useUpdateSkillInstance();
  useDeleteSkillInstance();
  const addAtom = useAddAtomToInstance();
  const removeAtom = useRemoveAtomFromInstance();
  const mountMod = useMountModifier();
  const unmountMod = useUnmountModifier();
  const createFromOriginal = useCreateFromOriginal();

  const store = useGameDesignStore();

  const atoms = atomsData?.items || [];
  const categories = categoriesData?.categories || [];
  const modifiers = modifiersData?.items || [];
  const originals = originalsData?.items || [];
  const instances = instancesData?.items || [];

  // Fetch current editing instance details
  const { data: editingInstance } = useSkillInstance(store.editingInstanceId || 0);

  // Group atoms by category
  const atomsByCategory = useMemo(() => {
    const map = new Map<string, SkillAtom[]>();
    const filtered = atomSearch
      ? atoms.filter((a) => a.name.toLowerCase().includes(atomSearch.toLowerCase()) || a.code.toLowerCase().includes(atomSearch.toLowerCase()))
      : atoms;
    for (const a of filtered) {
      const list = map.get(a.category) || [];
      list.push(a);
      map.set(a.category, list);
    }
    return map;
  }, [atoms, atomSearch]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Add atom to draft
  const handleAddAtom = useCallback(async (atom: SkillAtom) => {
    if (store.editingInstanceId) {
      // Server-side add
      try {
        await addAtom.mutateAsync({ instanceId: store.editingInstanceId, atomId: atom.id });
        toast.success(`已添加 ${atom.name}`);
      } catch {
        toast.error('添加失败');
      }
    } else {
      // Local draft
      const exists = store.draftAtoms.some((a) => a.atom_id === atom.id);
      if (exists) { toast.info('该原子已在列表中'); return; }
      store.setDraftAtoms([
        ...store.draftAtoms,
        {
          atom_id: atom.id,
          code: atom.code,
          name: atom.name,
          category: atom.category,
          atom_role: atom.atom_role,
          phase: 'general',
          slot_order: store.draftAtoms.length,
        },
      ]);
    }
  }, [store, addAtom]);

  const handleRemoveAtom = useCallback(async (atomId: number) => {
    if (store.editingInstanceId) {
      try {
        await removeAtom.mutateAsync({ instanceId: store.editingInstanceId, atomId });
      } catch {
        toast.error('移除失败');
      }
    } else {
      store.setDraftAtoms(store.draftAtoms.filter((a) => a.atom_id !== atomId));
    }
  }, [store, removeAtom]);

  // Save instance
  const handleSave = async () => {
    if (!store.draftName.trim()) { toast.error('请输入技能名称'); return; }
    try {
      if (store.editingInstanceId) {
        await updateInstance.mutateAsync({
          id: store.editingInstanceId,
          name: store.draftName,
          description: store.draftDescription,
          skill_type: store.draftSkillType as SkillType,
          numeric_params: store.draftNumericParams,
        });
        toast.success('技能已更新');
      } else {
        await createInstance.mutateAsync({
          name: store.draftName,
          description: store.draftDescription || undefined,
          skill_type: store.draftSkillType as SkillType,
          atoms: store.draftAtoms.map((a) => ({ atom_id: a.atom_id, phase: a.phase, slot_order: a.slot_order })),
          numeric_params: store.draftNumericParams,
        });
        toast.success('技能已创建');
        store.resetDraft();
      }
    } catch {
      toast.error('保存失败');
    }
  };

  // Load existing instance
  const handleLoadInstance = (inst: SkillInstance) => {
    store.loadFromInstance(inst);
    setShowHistory(false);
  };

  // Create from template
  const handleCreateFromTemplate = async (originalId: number, name: string, skillType: string) => {
    try {
      const inst = await createFromOriginal.mutateAsync({ originalId, name, skillType });
      store.loadFromInstance(inst);
      setTemplateDialog(false);
      toast.success('已从模板创建');
    } catch {
      toast.error('创建失败');
    }
  };

  // Mount/unmount modifier
  const handleMountModifier = async (modifierId: number) => {
    if (!store.editingInstanceId) {
      toast.info('请先保存技能，再添加修饰器');
      return;
    }
    try {
      await mountMod.mutateAsync({ instanceId: store.editingInstanceId, modifierId });
      toast.success('修饰器已装备');
    } catch {
      toast.error('装备失败');
    }
  };

  const handleUnmountModifier = async (modifierId: number) => {
    if (!store.editingInstanceId) return;
    try {
      await unmountMod.mutateAsync({ instanceId: store.editingInstanceId, modifierId });
    } catch {
      toast.error('卸载失败');
    }
  };

  // Current atoms (from editing instance or draft)
  const currentAtoms: AtomInInstance[] = store.editingInstanceId && editingInstance
    ? editingInstance.atoms
    : store.draftAtoms;

  const currentModifiers = store.editingInstanceId && editingInstance
    ? editingInstance.modifiers
    : store.draftModifiers;

  return (
    <div className="flex gap-4 h-[calc(100vh-180px)]">
      {/* Left: Atom Selector */}
      <div className="w-[250px] shrink-0 flex flex-col rounded-xl border bg-card overflow-hidden">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={atomSearch}
              onChange={(e) => setAtomSearch(e.target.value)}
              placeholder="搜索原子..."
              className="w-full rounded-md border bg-background pl-8 pr-3 py-1.5 text-xs"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {categories.map((cat) => {
            const catAtoms = atomsByCategory.get(cat.category);
            if (!catAtoms || catAtoms.length === 0) return null;
            const expanded = expandedCategories.has(cat.category);
            return (
              <div key={cat.category}>
                <button
                  onClick={() => toggleCategory(cat.category)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/50"
                >
                  <span>{cat.display_name} ({catAtoms.length})</span>
                  <ChevronDown className={cn('h-3 w-3 transition-transform', expanded && 'rotate-180')} />
                </button>
                {expanded && (
                  <div className="pl-1 space-y-1 mt-1">
                    {catAtoms.map((atom) => (
                      <AtomCard
                        key={atom.id}
                        atom={atom}
                        compact
                        onClick={() => handleAddAtom(atom)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {atoms.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">暂无原子，去原子库创建</p>
          )}
        </div>
      </div>

      {/* Center: Skill Editor */}
      <div className="flex-1 flex flex-col rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center gap-3">
            <input
              value={store.draftName}
              onChange={(e) => store.setDraftName(e.target.value)}
              placeholder="技能名称..."
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm font-medium"
            />
            <select
              value={store.draftSkillType}
              onChange={(e) => store.setDraftSkillType(e.target.value)}
              className="rounded-lg border bg-background px-3 py-2 text-sm"
            >
              {Object.entries(SKILL_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <textarea
            value={store.draftDescription}
            onChange={(e) => store.setDraftDescription(e.target.value)}
            placeholder="技能描述..."
            rows={2}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none"
          />
        </div>

        {/* Atom slots */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">技能槽位</h3>
            <span className="text-xs text-muted-foreground">{currentAtoms.length} 个原子</span>
          </div>

          {currentAtoms.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">从左侧原子库中点击原子添加到此处</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentAtoms.map((atom) => (
                <div
                  key={atom.atom_id}
                  className="flex items-center justify-between rounded-lg border bg-background px-3 py-2.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium">{atom.name}</span>
                    <span className="text-[11px] font-mono text-muted-foreground">{atom.code}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">
                      {ATOM_CATEGORY_LABELS[atom.category]}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveAtom(atom.atom_id)}
                    className="text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border-t p-3 flex items-center gap-2">
          <button
            onClick={() => setTemplateDialog(true)}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors hover:bg-accent"
          >
            <FileDown className="h-3.5 w-3.5" />
            从模板创建
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors hover:bg-accent"
          >
            历史设计
          </button>
          <div className="flex-1" />
          {store.editingInstanceId && (
            <button
              onClick={() => store.resetDraft()}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors hover:bg-accent"
            >
              新建
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={createInstance.isPending || updateInstance.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {store.editingInstanceId ? '更新' : '保存'}
          </button>
        </div>
      </div>

      {/* Right: Properties & Modifiers */}
      <div className="w-[300px] shrink-0 flex flex-col rounded-xl border bg-card overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {/* Numeric params */}
          <div className="p-4 border-b">
            <h3 className="text-xs font-semibold text-muted-foreground mb-2">数值参数</h3>
            {Object.entries(store.editingInstanceId && editingInstance ? editingInstance.numeric_params : store.draftNumericParams).length === 0 ? (
              <p className="text-xs text-muted-foreground">保存后可编辑数值参数</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(store.editingInstanceId && editingInstance ? editingInstance.numeric_params : store.draftNumericParams).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span className="text-xs font-mono">{k}</span>
                    <span className="text-xs">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modifiers */}
          <div className="p-4 border-b">
            <h3 className="text-xs font-semibold text-muted-foreground mb-2">已装备修饰器</h3>
            {currentModifiers.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {store.editingInstanceId ? '点击下方添加修饰器' : '保存后可添加修饰器'}
              </p>
            ) : (
              <div className="space-y-1.5">
                {currentModifiers.map((m) => (
                  <div key={m.modifier_id} className="flex items-center justify-between rounded-md border bg-background px-2.5 py-1.5">
                    <div>
                      <span className="text-xs font-medium">{m.name}</span>
                      <span className="ml-1.5 text-[10px] font-mono text-muted-foreground">{m.code}</span>
                    </div>
                    <button onClick={() => handleUnmountModifier(m.modifier_id)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {store.editingInstanceId && (
              <div className="mt-2 space-y-1">
                {modifiers
                  .filter((m) => !currentModifiers.some((cm) => cm.modifier_id === m.id))
                  .map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleMountModifier(m.id)}
                      className="w-full rounded-md border border-dashed px-2.5 py-1.5 text-left text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                    >
                      + {m.name}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* References */}
          {store.editingInstanceId && editingInstance && editingInstance.references.length > 0 && (
            <div className="p-4 border-b">
              <h3 className="text-xs font-semibold text-muted-foreground mb-2">参考来源</h3>
              <div className="space-y-1.5">
                {editingInstance.references.map((ref) => (
                  <div key={ref.original_skill_id} className="text-xs">
                    <span className="font-medium">{ref.name}</span>
                    <span className="text-muted-foreground"> ({ref.source_game})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instance metadata */}
          {store.editingInstanceId && editingInstance && (
            <div className="p-4">
              <h3 className="text-xs font-semibold text-muted-foreground mb-2">元数据</h3>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID</span>
                  <span>{editingInstance.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">版本</span>
                  <span>v{editingInstance.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">来源</span>
                  <span>{GENERATION_SOURCE_LABELS[editingInstance.generation_source]}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History drawer */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setShowHistory(false)}>
          <div className="w-[400px] h-full bg-card border-l overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold">历史设计</h2>
              <button onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              {instances.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">还没有保存的设计</p>
              ) : (
                instances.map((inst) => (
                  <div
                    key={inst.id}
                    className={cn(
                      'rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/30',
                      store.editingInstanceId === inst.id && 'border-primary bg-primary/5'
                    )}
                    onClick={() => handleLoadInstance(inst)}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">{inst.name}</h3>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{SKILL_TYPE_LABELS[inst.skill_type]}</span>
                    </div>
                    {inst.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{inst.description}</p>}
                    <div className="flex gap-3 mt-2 text-[11px] text-muted-foreground">
                      <span>{inst.atoms.length} 原子</span>
                      <span>{inst.modifiers.length} 修饰器</span>
                      <span>v{inst.version}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template dialog */}
      {templateDialog && (
        <TemplateDialog
          originals={originals}
          onClose={() => setTemplateDialog(false)}
          onCreate={handleCreateFromTemplate}
          isLoading={createFromOriginal.isPending}
        />
      )}
    </div>
  );
}

function TemplateDialog({
  originals,
  onClose,
  onCreate,
  isLoading,
}: {
  originals: { id: number; name: string; source_game: string; skill_type_tag: string; atoms: unknown[] }[];
  onClose: () => void;
  onCreate: (originalId: number, name: string, skillType: string) => void;
  isLoading: boolean;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [skillType, setSkillType] = useState<SkillType>('normal');

  const selected = originals.find((o) => o.id === selectedId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-xl border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        <h2 className="text-lg font-semibold mb-4">从模板创建</h2>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">选择参考技能</label>
            <select
              value={selectedId || ''}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedId(id);
                const o = originals.find((x) => x.id === id);
                if (o) setName(o.name + ' (副本)');
              }}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="">选择模板...</option>
              {originals.map((o) => (
                <option key={o.id} value={o.id}>{o.name} ({o.source_game})</option>
              ))}
            </select>
          </div>

          {selected && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">实例名称</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">技能类型</label>
                <select value={skillType} onChange={(e) => setSkillType(e.target.value as SkillType)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                  {Object.entries(SKILL_TYPE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                </select>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-accent">取消</button>
            <button
              onClick={() => selectedId && name && onCreate(selectedId, name, skillType)}
              disabled={!selectedId || !name || isLoading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? '创建中...' : '创建'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
