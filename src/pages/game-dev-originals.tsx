import { useState } from 'react';
import { Plus, Swords, ChevronDown, ChevronUp, X } from 'lucide-react';
import { toast } from 'sonner';
import { useOriginalSkills, useCreateOriginalSkill, useUpdateOriginalSkill, useDeleteOriginalSkill } from '@/hooks/use-game-design';
import { SKILL_TYPE_TAG_LABELS, ATOM_CATEGORY_LABELS } from '@/types/game-design';
import type { OriginalSkill, OriginalSkillCreate, OriginalSkillUpdate, SkillTypeTag } from '@/types/game-design';

export default function GameDevOriginalsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<OriginalSkill | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data, isLoading } = useOriginalSkills();
  const createSkill = useCreateOriginalSkill();
  const updateSkill = useUpdateOriginalSkill();
  const deleteSkill = useDeleteOriginalSkill();

  const skills = data?.items || [];

  const handleCreate = async (input: OriginalSkillCreate) => {
    try {
      await createSkill.mutateAsync(input);
      toast.success('参考技能创建成功');
      setFormOpen(false);
    } catch {
      toast.error('创建失败');
    }
  };

  const handleUpdate = async (input: OriginalSkillUpdate & { id: number }) => {
    try {
      await updateSkill.mutateAsync(input);
      toast.success('参考技能更新成功');
      setEditing(null);
      setFormOpen(false);
    } catch {
      toast.error('更新失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSkill.mutateAsync(id);
      toast.success('参考技能已删除');
    } catch {
      toast.error('删除失败');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">参考技能</h2>
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
      ) : skills.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Swords className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">还没有参考技能</p>
        </div>
      ) : (
        <div className="space-y-3">
          {skills.map((skill) => (
            <div key={skill.id} className="rounded-xl border bg-card overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                onClick={() => setExpandedId(expandedId === skill.id ? null : skill.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Swords className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm">{skill.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {skill.source_game}
                      {skill.character_class && ` · ${skill.character_class}`}
                      {skill.character_name && ` · ${skill.character_name}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                    {SKILL_TYPE_TAG_LABELS[skill.skill_type_tag]}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{skill.atoms.length} 原子</span>
                  {expandedId === skill.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>

              {expandedId === skill.id && (
                <div className="border-t px-4 py-3 space-y-3">
                  <p className="text-sm text-muted-foreground">{skill.description}</p>

                  {skill.atoms.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">包含原子</p>
                      <div className="flex flex-wrap gap-1.5">
                        {skill.atoms.map((a) => (
                          <span key={a.atom_id} className="rounded-md border bg-background px-2 py-1 text-xs">
                            {a.name} <span className="text-muted-foreground">({ATOM_CATEGORY_LABELS[a.category]})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {skill.tags.length > 0 && (
                    <div className="flex gap-1.5">
                      {skill.tags.map((t) => (
                        <span key={t} className="text-[11px] text-muted-foreground">#{t}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { setEditing(skill); setFormOpen(true); }}
                      className="rounded-md border px-3 py-1.5 text-xs transition-colors hover:bg-accent"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(skill.id)}
                      className="rounded-md border px-3 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/10"
                    >
                      删除
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      {formOpen && (
        <OriginalSkillFormDialog
          skill={editing}
          onClose={() => { setFormOpen(false); setEditing(null); }}
          onSubmit={editing
            ? (data) => handleUpdate({ id: editing.id, ...data } as OriginalSkillUpdate & { id: number })
            : handleCreate
          }
          isLoading={createSkill.isPending || updateSkill.isPending}
        />
      )}
    </div>
  );
}

function OriginalSkillFormDialog({
  skill,
  onClose,
  onSubmit,
  isLoading,
}: {
  skill: OriginalSkill | null;
  onClose: () => void;
  onSubmit: (data: OriginalSkillCreate) => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState(skill?.name || '');
  const [sourceGame, setSourceGame] = useState(skill?.source_game || '');
  const [characterName, setCharacterName] = useState(skill?.character_name || '');
  const [characterClass, setCharacterClass] = useState(skill?.character_class || '');
  const [description, setDescription] = useState(skill?.description || '');
  const [skillTypeTag, setSkillTypeTag] = useState<SkillTypeTag>(skill?.skill_type_tag || 'active');
  const [tags, setTags] = useState(skill?.tags.join(', ') || '');
  const [designerNotes, setDesignerNotes] = useState(skill?.designer_notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      source_game: sourceGame,
      character_name: characterName || undefined,
      character_class: characterClass || undefined,
      description,
      skill_type_tag: skillTypeTag,
      tags: tags ? tags.split(',').map((s) => s.trim()).filter(Boolean) : [],
      designer_notes: designerNotes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="relative w-full max-w-lg rounded-xl border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-lg font-semibold mb-4">{skill ? '编辑参考技能' : '新建参考技能'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">技能名称 *</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">来源游戏 *</label>
              <input value={sourceGame} onChange={(e) => setSourceGame(e.target.value)} required className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">角色名</label>
              <input value={characterName} onChange={(e) => setCharacterName(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">职业</label>
              <input value={characterClass} onChange={(e) => setCharacterClass(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">类型 *</label>
              <select value={skillTypeTag} onChange={(e) => setSkillTypeTag(e.target.value as SkillTypeTag)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                {Object.entries(SKILL_TYPE_TAG_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">描述 *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">标签（逗号分隔）</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">设计备注</label>
            <textarea value={designerNotes} onChange={(e) => setDesignerNotes(e.target.value)} rows={2} className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-accent">取消</button>
            <button type="submit" disabled={isLoading} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {isLoading ? '保存中...' : skill ? '更新' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
