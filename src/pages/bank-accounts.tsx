import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  ChevronDown,
  Star,
  Eye,
  EyeOff,
  CreditCard,
} from 'lucide-react';
import { usePersons } from '@/hooks/use-persons';
import {
  usePersonBankAccounts,
  useCreateBankAccount,
  useUpdateBankAccount,
  useDeleteBankAccount,
} from '@/hooks/use-bank-accounts';
import type { BankAccount, BankAccountCreate, BankAccountUpdate, Person } from '@/types';
import {
  BANK_ACCOUNT_TYPE_OPTIONS,
  CHINA_BANKS,
  maskBankNumber,
  formatBankNumber,
} from '@/types/bank-account';

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

  // Update form data when account prop changes (for edit mode)
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

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
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
    <div className="p-4 rounded-lg border bg-card">
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
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Person selector component
interface PersonSelectorProps {
  persons: Person[];
  selectedPersonId: string | null;
  onSelect: (personId: string | null) => void;
}

function PersonSelector({ persons, selectedPersonId, onSelect }: PersonSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedPerson = persons.find((p) => p.id === selectedPersonId);

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between min-w-[200px]"
      >
        <span>{selectedPerson ? selectedPerson.name : '选择家庭成员'}</span>
        <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <div className="py-1">
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
            >
              全部成员
            </button>
            {persons.map((person) => (
              <button
                key={person.id}
                type="button"
                className={`w-full px-3 py-2 text-left text-sm hover:bg-muted ${
                  person.id === selectedPersonId ? 'bg-muted' : ''
                }`}
                onClick={() => {
                  onSelect(person.id);
                  setIsOpen(false);
                }}
              >
                {person.name}
                <span className="ml-2 text-muted-foreground">
                  ({person.relationship === 'self' ? '本人' : person.relationship})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BankAccounts() {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [allAccounts, setAllAccounts] = useState<{ person: Person; accounts: BankAccount[] }[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  // Fetch all persons
  const { data: persons = [], isLoading: isLoadingPersons } = usePersons();

  // Fetch accounts for selected person
  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    refetch: refetchAccounts,
  } = usePersonBankAccounts(selectedPersonId || '');

  // Ensure selectedPersonAccounts is always an array
  const selectedPersonAccounts: BankAccount[] = accountsData || [];

  // Mutations
  const createAccount = useCreateBankAccount();
  const updateAccount = useUpdateBankAccount();
  const deleteAccount = useDeleteBankAccount();

  // Load all accounts for all persons when no specific person is selected
  useEffect(() => {
    const loadAllAccounts = async () => {
      if (selectedPersonId || persons.length === 0) {
        setAllAccounts([]);
        return;
      }

      setIsLoadingAll(true);
      const results: { person: Person; accounts: BankAccount[] }[] = [];

      for (const person of persons) {
        try {
          const response = await fetch(`/api/v1/persons/${person.id}/bank-accounts`, {
            headers: { 'Content-Type': 'application/json' },
          });
          if (response.ok) {
            const data = await response.json();
            const accounts = data.data || data || [];
            if (accounts.length > 0) {
              results.push({ person, accounts });
            }
          }
        } catch {
          // Continue with other persons
        }
      }

      setAllAccounts(results);
      setIsLoadingAll(false);
    };

    loadAllAccounts();
  }, [selectedPersonId, persons]);

  // Handle create account
  const handleCreate = async (data: BankAccountCreate) => {
    try {
      await createAccount.mutateAsync(data);
      setShowForm(false);
      refetchAccounts();
    } catch (error) {
      console.error('Failed to create bank account:', error);
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
      setEditingAccount(null);
      refetchAccounts();
    } catch (error) {
      console.error('Failed to update bank account:', error);
    }
  };

  // Handle delete account
  const handleDelete = async (accountId: string, personId: string) => {
    if (!confirm('确定要删除这个银行账户吗？此操作无法撤销。')) return;

    try {
      await deleteAccount.mutateAsync(accountId);
      if (selectedPersonId) {
        refetchAccounts();
      } else {
        // Reload all accounts
        setAllAccounts((prev) =>
          prev
            .map((item) =>
              item.person.id === personId
                ? { ...item, accounts: item.accounts.filter((a) => a.id !== accountId) }
                : item
            )
            .filter((item) => item.accounts.length > 0)
        );
      }
    } catch (error) {
      console.error('Failed to delete bank account:', error);
    }
  };

  const isLoading = isLoadingPersons || isLoadingAccounts || isLoadingAll;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">银行账户</h2>
          <p className="text-sm text-muted-foreground">管理家庭成员的银行账户信息</p>
        </div>
        <div className="flex items-center gap-2">
          <PersonSelector
            persons={persons}
            selectedPersonId={selectedPersonId}
            onSelect={setSelectedPersonId}
          />
          {selectedPersonId && (
            <Button onClick={() => setShowForm(true)} disabled={showForm}>
              <Plus className="mr-2 h-4 w-4" />
              添加账户
            </Button>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showForm || editingAccount) && selectedPersonId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {editingAccount ? '编辑银行账户' : '添加银行账户'}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowForm(false);
                setEditingAccount(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <BankAccountForm
              account={editingAccount || undefined}
              personId={selectedPersonId}
              onSubmit={editingAccount ? handleUpdate : handleCreate}
              onCancel={() => {
                setShowForm(false);
                setEditingAccount(null);
              }}
              isLoading={createAccount.isPending || updateAccount.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Accounts List */}
      {selectedPersonId ? (
        // Show accounts for selected person
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {persons.find((p) => p.id === selectedPersonId)?.name || '未知'} 的银行账户
              {selectedPersonAccounts.length > 0 && (
                <Badge variant="secondary">{selectedPersonAccounts.length}</Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refetchAccounts()}>
              <RefreshCw className={`h-4 w-4 ${isLoadingAccounts ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingAccounts ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : selectedPersonAccounts.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">暂无银行账户记录</p>
                <Button className="mt-4" onClick={() => setShowForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  添加第一个账户
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedPersonAccounts.map((acc) => (
                  <BankAccountCard
                    key={acc.id}
                    account={acc}
                    onEdit={() => setEditingAccount(acc)}
                    onDelete={() => handleDelete(acc.id, selectedPersonId)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Show all accounts grouped by person
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : allAccounts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">暂无银行账户记录</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    请先选择一个家庭成员来添加银行账户
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            allAccounts.map(({ person, accounts }) => (
              <Card key={person.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-4 w-4" />
                    {person.name}
                    <Badge variant="secondary">{accounts.length}</Badge>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPersonId(person.id)}
                  >
                    查看全部
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {accounts.map((acc) => (
                      <BankAccountCard
                        key={acc.id}
                        account={acc}
                        onEdit={() => {
                          setSelectedPersonId(person.id);
                          setEditingAccount(acc);
                        }}
                        onDelete={() => handleDelete(acc.id, person.id)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
