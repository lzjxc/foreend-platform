import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  X,
  Star,
  Eye,
  EyeOff,
  CreditCard,
} from 'lucide-react';
import {
  usePersonBankAccounts,
  useCreateBankAccount,
  useUpdateBankAccount,
  useDeleteBankAccount,
} from '@/hooks/use-bank-accounts';
import type { BankAccount, BankAccountCreate, BankAccountUpdate } from '@/types';
import {
  BANK_ACCOUNT_TYPE_OPTIONS,
  CHINA_BANKS,
  maskBankNumber,
  formatBankNumber,
} from '@/types/bank-account';
import { toast } from 'sonner';

// Bank account type label mapping
const accountTypeLabels: Record<string, string> = Object.fromEntries(
  BANK_ACCOUNT_TYPE_OPTIONS.map((opt) => [opt.value, opt.label])
);

// Bank account form component
interface BankAccountFormProps {
  account?: BankAccount;
  personId: string;
  onSubmit: (data: BankAccountCreate) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function BankAccountForm({ account, personId, onSubmit, onCancel, isLoading }: BankAccountFormProps) {
  const [formData, setFormData] = useState({
    bank_name: account?.bank_name || '',
    account_type: account?.account_type || 'savings',
    account_number: account?.account_number || '',
    card_number: account?.card_number || '',
    branch_name: account?.branch_name || '',
    swift_code: account?.swift_code || '',
    is_primary: account?.is_primary || false,
    notes: account?.notes || '',
  });

  useEffect(() => {
    if (account) {
      setFormData({
        bank_name: account.bank_name || '',
        account_type: account.account_type || 'savings',
        account_number: account.account_number || '',
        card_number: account.card_number || '',
        branch_name: account.branch_name || '',
        swift_code: account.swift_code || '',
        is_primary: account.is_primary || false,
        notes: account.notes || '',
      });
    }
  }, [account]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      person_id: personId,
      bank_name: formData.bank_name,
      account_type: formData.account_type as BankAccountCreate['account_type'],
      account_number: formData.account_number,
      card_number: formData.card_number || undefined,
      branch_name: formData.branch_name || undefined,
      swift_code: formData.swift_code || undefined,
      is_primary: formData.is_primary,
      notes: formData.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">银行名称 *</label>
          <select
            value={formData.bank_name}
            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          >
            <option value="">请选择银行</option>
            {CHINA_BANKS.map((bank) => (
              <option key={bank} value={bank}>
                {bank}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">账户类型 *</label>
          <select
            value={formData.account_type}
            onChange={(e) => setFormData({ ...formData, account_type: e.target.value as BankAccountCreate['account_type'] })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          >
            {BANK_ACCOUNT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">账号 *</label>
          <input
            type="text"
            value={formData.account_number}
            onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            required
            placeholder="请输入银行账号"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">卡号</label>
          <input
            type="text"
            value={formData.card_number}
            onChange={(e) => setFormData({ ...formData, card_number: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            placeholder="请输入银行卡号（可选）"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">开户支行</label>
          <input
            type="text"
            value={formData.branch_name}
            onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="请输入开户支行名称"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">SWIFT代码</label>
          <input
            type="text"
            value={formData.swift_code}
            onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono uppercase"
            placeholder="国际汇款用（可选）"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium">备注</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]"
            placeholder="可选备注信息（如用途等）"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_primary}
              onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
              className="rounded border-input"
            />
            <span className="text-sm font-medium">设为主要账户</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          取消
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '保存中...' : account ? '更新' : '添加'}
        </Button>
      </div>
    </form>
  );
}

// Bank account card component with sensitive data masking
interface BankAccountCardProps {
  account: BankAccount;
  onEdit: () => void;
  onDelete: () => void;
}

function BankAccountCard({ account, onEdit, onDelete }: BankAccountCardProps) {
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [showCardNumber, setShowCardNumber] = useState(false);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{account.bank_name}</span>
              <Badge variant="outline" className="text-xs">
                {accountTypeLabels[account.account_type] || account.account_type}
              </Badge>
              {account.is_primary && (
                <Badge variant="default" className="text-xs gap-1">
                  <Star className="h-3 w-3" />
                  主要
                </Badge>
              )}
            </div>

            {/* Account Number - masked by default */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">账号:</span>
              <span className="font-mono text-sm">
                {showAccountNumber
                  ? formatBankNumber(account.account_number)
                  : maskBankNumber(account.account_number)}
              </span>
              <button
                type="button"
                onClick={() => setShowAccountNumber(!showAccountNumber)}
                className="text-muted-foreground hover:text-foreground"
              >
                {showAccountNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Card Number - masked by default */}
            {account.card_number && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">卡号:</span>
                <span className="font-mono text-sm">
                  {showCardNumber
                    ? formatBankNumber(account.card_number)
                    : maskBankNumber(account.card_number)}
                </span>
                <button
                  type="button"
                  onClick={() => setShowCardNumber(!showCardNumber)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {showCardNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}

            {account.branch_name && (
              <p className="text-sm text-muted-foreground">
                支行: {account.branch_name}
              </p>
            )}

            {account.swift_code && (
              <p className="text-sm text-muted-foreground font-mono">
                SWIFT: {account.swift_code}
              </p>
            )}

            {account.notes && (
              <p className="text-sm text-muted-foreground mt-2">
                备注: {account.notes}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main BankAccountsTab component
interface BankAccountsTabProps {
  personId: string;
}

export default function BankAccountsTab({ personId }: BankAccountsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  const { data: accounts, isLoading, refetch } = usePersonBankAccounts(personId);
  const createAccount = useCreateBankAccount();
  const updateAccount = useUpdateBankAccount();
  const deleteAccount = useDeleteBankAccount();

  // Handle create account
  const handleCreate = async (data: BankAccountCreate) => {
    try {
      await createAccount.mutateAsync(data);
      toast.success('银行账户添加成功');
      setShowForm(false);
      refetch();
    } catch (error) {
      toast.error('添加失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // Handle update account
  const handleUpdate = async (data: BankAccountCreate) => {
    if (!editingAccount) return;
    try {
      const updateData: BankAccountUpdate = {
        bank_name: data.bank_name,
        account_type: data.account_type,
        account_number: data.account_number,
        card_number: data.card_number,
        branch_name: data.branch_name,
        swift_code: data.swift_code,
        is_primary: data.is_primary,
        notes: data.notes,
      };
      await updateAccount.mutateAsync({
        id: editingAccount.id,
        data: updateData,
      });
      toast.success('银行账户更新成功');
      setEditingAccount(null);
      refetch();
    } catch (error) {
      toast.error('更新失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // Handle delete account
  const handleDelete = async (accountId: string) => {
    if (!confirm('确定要删除这个银行账户吗？此操作无法撤销。')) return;
    try {
      await deleteAccount.mutateAsync(accountId);
      toast.success('银行账户已删除');
      refetch();
    } catch (error) {
      toast.error('删除失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // Close form
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAccount(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">银行账户</h3>
          <Badge variant="secondary">{accounts?.length || 0}</Badge>
        </div>
        {!showForm && !editingAccount && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-1 h-4 w-4" />
            添加账户
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showForm || editingAccount) && (
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-medium">
                {editingAccount ? '编辑银行账户' : '添加银行账户'}
              </h4>
              <Button variant="ghost" size="icon" onClick={handleCloseForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <BankAccountForm
              account={editingAccount || undefined}
              personId={personId}
              onSubmit={editingAccount ? handleUpdate : handleCreate}
              onCancel={handleCloseForm}
              isLoading={createAccount.isPending || updateAccount.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Accounts List */}
      {accounts && accounts.length > 0 ? (
        <div className="space-y-3">
          {accounts.map((acc) => (
            <BankAccountCard
              key={acc.id}
              account={acc}
              onEdit={() => setEditingAccount(acc)}
              onDelete={() => handleDelete(acc.id)}
            />
          ))}
        </div>
      ) : (
        !showForm && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">暂无银行账户记录</p>
              <p className="text-sm text-muted-foreground mt-1">
                点击上方"添加账户"按钮添加
              </p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
