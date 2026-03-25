import { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateUtility, useUpdateUtility } from '@/hooks/use-housing';
import type { Utility, UtilityType, UtilityCreate } from '@/types/housing';
import { UTILITY_TYPE_LABELS, UTILITY_TYPE_ICONS } from '@/types/housing';

interface UtilitySectionProps {
  tenancyId: string;
  utilities: Utility[];
}

const UTILITY_TYPES: UtilityType[] = ['electricity', 'gas', 'water', 'internet', 'council_tax', 'other'];

function UtilityForm({
  tenancyId,
  utility,
  onClose,
}: {
  tenancyId: string;
  utility?: Utility;
  onClose: () => void;
}) {
  const [type, setType] = useState<UtilityType>(utility?.type ?? 'electricity');
  const [provider, setProvider] = useState(utility?.provider ?? '');
  const [accountNumber, setAccountNumber] = useState(utility?.account_number ?? '');
  const [monthlyCost, setMonthlyCost] = useState(utility?.monthly_cost?.toString() ?? '');
  const [keywords, setKeywords] = useState(utility?.email_keywords?.join(', ') ?? '');

  const createUtility = useCreateUtility();
  const updateUtility = useUpdateUtility();
  const isPending = createUtility.isPending || updateUtility.isPending;

  const handleSubmit = () => {
    if (!provider.trim()) { toast.error('Provider is required'); return; }
    const emailKeywords = keywords.split(',').map((k) => k.trim()).filter(Boolean);
    const input: UtilityCreate = {
      type,
      provider: provider.trim(),
      account_number: accountNumber || undefined,
      monthly_cost: monthlyCost ? parseFloat(monthlyCost) : undefined,
      email_keywords: emailKeywords.length > 0 ? emailKeywords : undefined,
    };

    if (utility) {
      updateUtility.mutate({ id: utility.id, tenancyId, ...input }, {
        onSuccess: () => { toast.success('已更新'); onClose(); },
        onError: () => toast.error('更新失败'),
      });
    } else {
      createUtility.mutate({ tenancyId, ...input }, {
        onSuccess: () => { toast.success('已添加'); onClose(); },
        onError: () => toast.error('添加失败'),
      });
    }
  };

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as UtilityType)}
          >
            {UTILITY_TYPES.map((t) => (
              <option key={t} value={t}>{UTILITY_TYPE_ICONS[t]} {UTILITY_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Provider *</Label>
          <Input value={provider} onChange={(e) => setProvider(e.target.value)} placeholder="EDF Energy" className="h-8 text-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Account Number</Label>
          <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Monthly Cost (£)</Label>
          <Input type="number" value={monthlyCost} onChange={(e) => setMonthlyCost(e.target.value)} className="h-8 text-sm" step="0.01" min="0" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Email Keywords</Label>
        <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="Comma-separated" className="h-8 text-sm" />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}><X className="h-3.5 w-3.5" /></Button>
        <Button size="sm" onClick={handleSubmit} disabled={isPending}>
          <Check className="mr-1 h-3.5 w-3.5" />
          {utility ? '更新' : '添加'}
        </Button>
      </div>
    </div>
  );
}

export function UtilitySection({ tenancyId, utilities }: UtilitySectionProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">⚡ 水电账户 ({utilities.length})</h3>
        <Button variant="outline" size="sm" onClick={() => { setAddOpen(true); setEditId(null); }}>
          <Plus className="mr-1 h-3.5 w-3.5" />
          添加
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {utilities.map((u) => (
          <div key={u.id}>
            <div
              className="rounded-lg border bg-card p-3 cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => setEditId(editId === u.id ? null : u.id)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">
                  {UTILITY_TYPE_ICONS[u.type]} {UTILITY_TYPE_LABELS[u.type]}
                </span>
                {u.monthly_cost && (
                  <span className="text-sm font-semibold">£{u.monthly_cost}/月</span>
                )}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {u.provider}
                {u.account_number && ` · Acc: ${u.account_number}`}
              </div>
            </div>
            {editId === u.id && (
              <div className="mt-2">
                <UtilityForm tenancyId={tenancyId} utility={u} onClose={() => setEditId(null)} />
              </div>
            )}
          </div>
        ))}
      </div>

      {addOpen && (
        <div className="mt-3">
          <UtilityForm tenancyId={tenancyId} onClose={() => setAddOpen(false)} />
        </div>
      )}
    </div>
  );
}
