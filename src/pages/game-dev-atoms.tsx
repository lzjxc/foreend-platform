import { useState, useMemo } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAtoms, useAtomCategories, useCreateAtom, useUpdateAtom, useDeleteAtom } from '@/hooks/use-game-design';
import type { SkillAtom, SkillAtomCreate, SkillAtomUpdate } from '@/types/game-design';
import { AtomCard } from '@/components/game-design/atom-card';
import { AtomFormDialog } from '@/components/game-design/atom-form';

export default function GameDevAtomsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingAtom, setEditingAtom] = useState<SkillAtom | null>(null);

  const { data: atomsData, isLoading } = useAtoms(selectedCategory || undefined);
  const { data: categoriesData } = useAtomCategories();
  const createAtom = useCreateAtom();
  const updateAtom = useUpdateAtom();
  const deleteAtom = useDeleteAtom();

  const atoms = atomsData?.items || [];
  const categories = categoriesData?.categories || [];

  const filtered = useMemo(() => {
    if (!search) return atoms;
    const q = search.toLowerCase();
    return atoms.filter(
      (a) => a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
    );
  }, [atoms, search]);

  const handleCreate = async (input: SkillAtomCreate) => {
    try {
      await createAtom.mutateAsync(input);
      toast.success('原子创建成功');
      setFormOpen(false);
    } catch {
      toast.error('创建失败');
    }
  };

  const handleUpdate = async (input: SkillAtomUpdate & { id: number }) => {
    try {
      await updateAtom.mutateAsync(input);
      toast.success('原子更新成功');
      setEditingAtom(null);
      setFormOpen(false);
    } catch {
      toast.error('更新失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAtom.mutateAsync(id);
      toast.success('原子已删除');
    } catch {
      toast.error('删除失败');
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="">全部类别</option>
          {categories.map((c) => (
            <option key={c.category} value={c.category}>
              {c.display_name}
            </option>
          ))}
        </select>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索原子..."
            className="w-full rounded-lg border bg-background pl-9 pr-8 py-2 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex-1" />

        <button
          onClick={() => { setEditingAtom(null); setFormOpen(true); }}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          新建原子
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl border bg-muted/30" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {search ? '没有匹配的原子' : '还没有原子，点击右上角创建'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((atom) => (
            <AtomCard
              key={atom.id}
              atom={atom}
              onEdit={() => { setEditingAtom(atom); setFormOpen(true); }}
              onDelete={() => handleDelete(atom.id)}
            />
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <AtomFormDialog
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingAtom(null); }}
        atom={editingAtom}
        categories={categories}
        onSubmit={editingAtom
          ? (data) => handleUpdate({ id: editingAtom.id, ...data } as SkillAtomUpdate & { id: number })
          : handleCreate
        }
        isLoading={createAtom.isPending || updateAtom.isPending}
      />
    </div>
  );
}
