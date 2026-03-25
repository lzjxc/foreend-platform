import { useState, useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { isBefore, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCreateBill, useUpdateBill } from '@/hooks/use-housing';
import type { Utility, Bill, UtilityType } from '@/types/housing';
import { UTILITY_TYPE_ICONS, UTILITY_TYPE_LABELS } from '@/types/housing';
import { formatDate } from '@/lib/utils';

interface BillSectionProps {
  tenancyId: string;
  utilities: Utility[];
}

interface FlatBill extends Bill {
  utilityType: UtilityType;
  utilityProvider: string;
}

function getBillStatus(bill: Bill): { label: string; className: string } {
  if (bill.paid) return { label: '已付', className: 'bg-green-100 text-green-700' };
  if (bill.due_date && isBefore(parseISO(bill.due_date), new Date())) {
    return { label: '逾期', className: 'bg-red-100 text-red-700' };
  }
  return { label: '待付', className: 'bg-orange-100 text-orange-700' };
}

function BillEditRow({
  bill,
  tenancyId,
  onClose,
}: {
  bill: FlatBill;
  tenancyId: string;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(bill.amount.toString());
  const [dueDate, setDueDate] = useState(bill.due_date ?? '');
  const [paid, setPaid] = useState(bill.paid);
  const [paidDate, setPaidDate] = useState(bill.paid_date ?? '');
  const updateBill = useUpdateBill();

  const handleSave = () => {
    updateBill.mutate(
      {
        id: bill.id,
        tenancyId,
        amount: parseFloat(amount),
        due_date: dueDate || undefined,
        paid,
        paid_date: paidDate || undefined,
      },
      {
        onSuccess: () => { toast.success('已更新'); onClose(); },
        onError: () => toast.error('更新失败'),
      }
    );
  };

  return (
    <tr className="bg-muted/30">
      <td colSpan={5} className="p-3">
        <div className="grid grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Amount</label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-8 text-sm" step="0.01" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Due Date</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Paid</label>
            <label className="flex items-center gap-2 h-8">
              <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm">{paid ? 'Yes' : 'No'}</span>
            </label>
          </div>
          {paid && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Paid Date</label>
              <Input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} className="h-8 text-sm" />
            </div>
          )}
        </div>
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}><X className="h-3.5 w-3.5" /></Button>
          <Button size="sm" onClick={handleSave} disabled={updateBill.isPending}>
            <Check className="mr-1 h-3.5 w-3.5" /> 保存
          </Button>
        </div>
      </td>
    </tr>
  );
}

export function BillSection({ tenancyId, utilities }: BillSectionProps) {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editId, setEditId] = useState<string | null>(null);
  const [addUtilityId, setAddUtilityId] = useState<string | null>(null);
  const [newAmount, setNewAmount] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const createBill = useCreateBill();

  const flatBills = useMemo<FlatBill[]>(() => {
    return utilities
      .flatMap((u) =>
        u.bills.map((b) => ({
          ...b,
          utilityType: u.type,
          utilityProvider: u.provider,
        }))
      )
      .sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return b.due_date.localeCompare(a.due_date);
      });
  }, [utilities]);

  const filtered = flatBills.filter((b) => {
    if (typeFilter !== 'all' && b.utilityType !== typeFilter) return false;
    if (statusFilter === 'paid' && !b.paid) return false;
    if (statusFilter === 'unpaid' && b.paid) return false;
    if (statusFilter === 'overdue' && (b.paid || !b.due_date || !isBefore(parseISO(b.due_date), new Date()))) return false;
    return true;
  });

  const handleAddBill = () => {
    if (!addUtilityId || !newAmount) return;
    createBill.mutate(
      { utilityId: addUtilityId, tenancyId, amount: parseFloat(newAmount), due_date: newDueDate || undefined },
      {
        onSuccess: () => { toast.success('账单已添加'); setAddUtilityId(null); setNewAmount(''); setNewDueDate(''); },
        onError: () => toast.error('添加失败'),
      }
    );
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">💷 账单 ({flatBills.length})</h3>
        <div className="flex gap-2">
          <select
            className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">全部类型</option>
            {utilities.map((u) => (
              <option key={u.id} value={u.type}>{UTILITY_TYPE_ICONS[u.type]} {UTILITY_TYPE_LABELS[u.type]}</option>
            ))}
          </select>
          <select
            className="rounded-md border border-input bg-background px-2 py-1 text-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">全部状态</option>
            <option value="paid">已付</option>
            <option value="unpaid">待付</option>
            <option value="overdue">逾期</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">类型</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">金额</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">账期</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">到期日</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">状态</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((bill) => {
              const status = getBillStatus(bill);
              return (
                <>
                  <tr
                    key={bill.id}
                    className="cursor-pointer border-t hover:bg-muted/30"
                    onClick={() => setEditId(editId === bill.id ? null : bill.id)}
                  >
                    <td className="px-3 py-2">{UTILITY_TYPE_ICONS[bill.utilityType]} {UTILITY_TYPE_LABELS[bill.utilityType]}</td>
                    <td className="px-3 py-2 font-medium">£{bill.amount.toFixed(2)}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {bill.period_start && bill.period_end
                        ? `${formatDate(bill.period_start, 'MMM yyyy')}`
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {bill.due_date ? formatDate(bill.due_date) : '—'}
                    </td>
                    <td className="px-3 py-2">
                      <Badge className={status.className}>{status.label}</Badge>
                    </td>
                  </tr>
                  {editId === bill.id && (
                    <BillEditRow key={`edit-${bill.id}`} bill={bill} tenancyId={tenancyId} onClose={() => setEditId(null)} />
                  )}
                </>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">无账单</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add bill */}
      <div className="mt-3 flex items-end gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">添加账单到</label>
          <select
            className="rounded-md border border-input bg-background px-2 py-1.5 text-xs"
            value={addUtilityId ?? ''}
            onChange={(e) => setAddUtilityId(e.target.value || null)}
          >
            <option value="">选择水电类型</option>
            {utilities.map((u) => (
              <option key={u.id} value={u.id}>{UTILITY_TYPE_ICONS[u.type]} {u.provider}</option>
            ))}
          </select>
        </div>
        <Input
          type="number"
          placeholder="金额"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          className="h-8 w-24 text-sm"
          step="0.01"
          min="0"
        />
        <Input
          type="date"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
          className="h-8 w-36 text-sm"
        />
        <Button size="sm" onClick={handleAddBill} disabled={!addUtilityId || !newAmount || createBill.isPending}>
          添加
        </Button>
      </div>
    </div>
  );
}
