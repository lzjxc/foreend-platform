import { useState } from 'react';
import { Plus, Scale, X } from 'lucide-react';
import { toast } from 'sonner';
import { useRules, useCreateRule, useUpdateRule, useDeleteRule, useAtoms } from '@/hooks/use-game-design';
import { RULE_TYPE_LABELS, ATOM_CATEGORY_LABELS } from '@/types/game-design';
import type { Rule, RuleCreate, RuleUpdate, RuleType } from '@/types/game-design';

const RULE_TYPE_COLORS: Record<RuleType, string> = {
  compatible: 'text-green-500 bg-green-500/10',
  requires: 'text-blue-500 bg-blue-500/10',
  enhances: 'text-amber-500 bg-amber-500/10',
  mutually_exclusive: 'text-red-500 bg-red-500/10',
};

export default function GameDevRulesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Rule | null>(null);

  const { data, isLoading } = useRules();
  const { data: atomsData } = useAtoms();
  const createRule = useCreateRule();
  const updateRule = useUpdateRule();
  const deleteRule = useDeleteRule();

  const rules = data?.items || [];
  const atoms = atomsData?.items || [];

  const handleCreate = async (input: RuleCreate) => {
    try {
      await createRule.mutateAsync(input);
      toast.success('规则创建成功');
      setFormOpen(false);
    } catch {
      toast.error('创建失败');
    }
  };

  const handleUpdate = async (input: RuleUpdate & { id: number }) => {
    try {
      await updateRule.mutateAsync(input);
      toast.success('规则更新成功');
      setEditing(null);
      setFormOpen(false);
    } catch {
      toast.error('更新失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteRule.mutateAsync(id);
      toast.success('规则已删除');
    } catch {
      toast.error('删除失败');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">规则</h2>
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
            <div key={i} className="h-20 animate-pulse rounded-xl border bg-muted/30" />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Scale className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">还没有规则</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="group rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="rounded-md border bg-background px-2 py-1 text-xs font-medium">
                      {rule.atom_a.name}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${RULE_TYPE_COLORS[rule.rule_type]}`}>
                      {RULE_TYPE_LABELS[rule.rule_type]}
                    </span>
                    <span className="rounded-md border bg-background px-2 py-1 text-xs font-medium">
                      {rule.atom_b.name}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditing(rule); setFormOpen(true); }} className="rounded-md border px-2 py-1 text-xs hover:bg-accent">编辑</button>
                  <button onClick={() => handleDelete(rule.id)} className="rounded-md border px-2 py-1 text-xs text-destructive hover:bg-destructive/10">删除</button>
                </div>
              </div>
              {rule.description && (
                <p className="mt-2 text-xs text-muted-foreground">{rule.description}</p>
              )}
              <div className="mt-2 flex gap-3 text-[11px] text-muted-foreground">
                <span>{ATOM_CATEGORY_LABELS[rule.atom_a.category]} → {ATOM_CATEGORY_LABELS[rule.atom_b.category]}</span>
                {rule.priority > 0 && <span>优先级: {rule.priority}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <RuleFormDialog
          rule={editing}
          atoms={atoms}
          onClose={() => { setFormOpen(false); setEditing(null); }}
          onSubmit={editing
            ? (d) => handleUpdate({ id: editing.id, rule_type: d.rule_type, description: d.description, priority: d.priority })
            : (d) => handleCreate({ atom_a_id: d.atom_a_id!, atom_b_id: d.atom_b_id!, rule_type: d.rule_type, description: d.description, priority: d.priority })
          }
          isLoading={createRule.isPending || updateRule.isPending}
        />
      )}
    </div>
  );
}

function RuleFormDialog({
  rule,
  atoms,
  onClose,
  onSubmit,
  isLoading,
}: {
  rule: Rule | null;
  atoms: { id: number; name: string; code: string; category: string }[];
  onClose: () => void;
  onSubmit: (data: { atom_a_id?: number; atom_b_id?: number; rule_type: RuleType; description?: string; priority: number }) => void;
  isLoading: boolean;
}) {
  const [atomAId, setAtomAId] = useState(rule?.atom_a_id || 0);
  const [atomBId, setAtomBId] = useState(rule?.atom_b_id || 0);
  const [ruleType, setRuleType] = useState<RuleType>(rule?.rule_type || 'compatible');
  const [description, setDescription] = useState(rule?.description || '');
  const [priority, setPriority] = useState(rule?.priority || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rule) {
      onSubmit({ rule_type: ruleType, description: description || undefined, priority });
    } else {
      onSubmit({ atom_a_id: atomAId, atom_b_id: atomBId, rule_type: ruleType, description: description || undefined, priority });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-xl border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        <h2 className="text-lg font-semibold mb-4">{rule ? '编辑规则' : '新建规则'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {!rule && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">原子 A *</label>
                <select value={atomAId} onChange={(e) => setAtomAId(Number(e.target.value))} required className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                  <option value={0}>选择原子...</option>
                  {atoms.map((a) => (<option key={a.id} value={a.id}>{a.name} ({a.code})</option>))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">原子 B *</label>
                <select value={atomBId} onChange={(e) => setAtomBId(Number(e.target.value))} required className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                  <option value={0}>选择原子...</option>
                  {atoms.map((a) => (<option key={a.id} value={a.id}>{a.name} ({a.code})</option>))}
                </select>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">规则类型 *</label>
              <select value={ruleType} onChange={(e) => setRuleType(e.target.value as RuleType)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                {Object.entries(RULE_TYPE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">优先级</label>
              <input type="number" value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">描述</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-accent">取消</button>
            <button type="submit" disabled={isLoading || (!rule && (!atomAId || !atomBId))} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {isLoading ? '保存中...' : rule ? '更新' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
