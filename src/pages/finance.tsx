/**
 * Finance Dashboard Page
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  RefreshCw,
  CreditCard,
  Store,
  PieChart,
  BarChart3,
  Target,
  AlertTriangle,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Pencil,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  useAccounts,
  useStatsSummary,
  useStatsByCategory,
  useStatsByCounterparty,
  useStatsDaily,
  useTransactions,
  useBudgets,
  useBudgetAlerts,
  useCreateBudget,
  useDeleteBudget,
  useMerchants,
  useAnalyzeTransaction,
  useCategories,
  useAllEstimatedBalances,
  useUpdateAccountBalance,
} from '@/hooks/use-finance';
import { useStarlingBalance } from '@/hooks/use-starling';
import {
  formatCurrency,
  getPlatformInfo,
  getAccountDisplayName,
  CURRENCIES,
  type Transaction,
  type CategoryStats,
  type DailyStats,
  type Budget,
  type BudgetAlert,
  type MerchantListItem,
  type BudgetCreate,
  type Account,
  type EstimatedBalance,
} from '@/types/finance';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useInfiniteQuery } from '@tanstack/react-query';
import { financeClient } from '@/api/client';
import type { FinancePaginatedResponse } from '@/types/finance';
import { zhCN } from 'date-fns/locale';

// Date range presets
const DATE_PRESETS = [
  { value: '7d', label: '最近 7 天' },
  { value: '30d', label: '最近 30 天' },
  { value: 'this_month', label: '本月' },
  { value: 'last_month', label: '上月' },
  { value: '90d', label: '最近 90 天' },
] as const;

function getDateRange(preset: string): { from: string; to: string } {
  const today = new Date();
  const formatDate = (d: Date) => format(d, 'yyyy-MM-dd');

  switch (preset) {
    case '7d':
      return { from: formatDate(subDays(today, 6)), to: formatDate(today) };
    case '30d':
      return { from: formatDate(subDays(today, 29)), to: formatDate(today) };
    case 'this_month':
      return { from: formatDate(startOfMonth(today)), to: formatDate(today) };
    case 'last_month': {
      const lastMonth = subMonths(today, 1);
      return {
        from: formatDate(startOfMonth(lastMonth)),
        to: formatDate(endOfMonth(lastMonth)),
      };
    }
    case '90d':
      return { from: formatDate(subDays(today, 89)), to: formatDate(today) };
    default:
      return { from: formatDate(subDays(today, 29)), to: formatDate(today) };
  }
}

// Summary Card Component
function SummaryCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  color,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-full bg-muted`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
        {trend && trend !== 'neutral' && (
          <div className="flex items-center mt-2 text-xs">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
              vs 上期
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Account Balance Card Component
function AccountBalanceCard({
  account,
  estimatedBalance,
  onEditBalance,
  isUpdating,
}: {
  account: Account;
  estimatedBalance?: EstimatedBalance;
  onEditBalance: (accountId: number, currentBalance: string | null) => void;
  isUpdating: boolean;
}) {
  const platform = getPlatformInfo(account.platform);
  const hasBalance = estimatedBalance?.balance !== null && estimatedBalance?.balance !== undefined;

  return (
    <div className="p-4 rounded-lg bg-muted/50 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{platform.icon}</span>
          <div>
            <p className="font-medium text-sm">{getAccountDisplayName(account)}</p>
            <p className="text-xs text-muted-foreground">
              {account.currency} · {account.is_active ? '活跃' : '已停用'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEditBalance(account.id, account.balance)}
          disabled={isUpdating}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>

      {hasBalance ? (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">记录余额</span>
            <span className="font-medium">
              {formatCurrency(estimatedBalance!.balance!, account.currency)}
              {estimatedBalance?.balance_updated_at && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({format(new Date(estimatedBalance.balance_updated_at), 'MM/dd')})
                </span>
              )}
            </span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>之后收入</span>
            <span className="text-green-600">+{formatCurrency(estimatedBalance!.income_after, account.currency)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>之后支出</span>
            <span className="text-red-600">-{formatCurrency(estimatedBalance!.expense_after, account.currency)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-dashed">
            <span className="font-medium">预估余额</span>
            <span className="font-bold">
              {estimatedBalance?.estimated_balance !== null
                ? formatCurrency(estimatedBalance!.estimated_balance!, account.currency)
                : '-'}
            </span>
          </div>
          {/* Show overflow info for Alipay/WeChat */}
          {estimatedBalance?.overflow_to_cmb && parseFloat(estimatedBalance.overflow_to_cmb) > 0 && (
            <p className="text-xs text-orange-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              超支 {formatCurrency(estimatedBalance.overflow_to_cmb, account.currency)} 已从招商银行扣除
            </p>
          )}
          {/* Show deducted info for CMB */}
          {estimatedBalance?.deducted_from_linked && parseFloat(estimatedBalance.deducted_from_linked) > 0 && (
            <p className="text-xs text-orange-600">
              (含关联账户超支扣款: {formatCurrency(estimatedBalance.deducted_from_linked, account.currency)})
            </p>
          )}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          <p>暂无余额记录</p>
          <p className="text-xs mt-1">点击编辑按钮设置余额</p>
        </div>
      )}

      {account.last_synced_at && (
        <p className="text-xs text-muted-foreground">
          同步于 {format(new Date(account.last_synced_at), 'MM/dd HH:mm')}
        </p>
      )}
    </div>
  );
}

// Edit Balance Dialog Component
function EditBalanceDialog({
  open,
  onOpenChange,
  accountId,
  accountName,
  currentBalance,
  currency,
  onSave,
  isSaving,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId: number;
  accountName: string;
  currentBalance: string | null;
  currency: string;
  onSave: (accountId: number, balance: string) => void;
  isSaving: boolean;
}) {
  const [balance, setBalance] = useState(currentBalance || '');

  const handleSave = () => {
    if (balance) {
      onSave(accountId, balance);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>编辑余额 - {accountName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">当前余额 ({currency})</label>
            <Input
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="输入当前余额"
            />
            <p className="text-xs text-muted-foreground">
              请输入银行/支付 APP 中显示的当前余额
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={!balance || isSaving}
            className="w-full"
          >
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Daily Trend Chart (Simple bar visualization)
function DailyTrendChart({ data, currency }: { data: DailyStats[]; currency: string }) {
  const maxValue = Math.max(
    ...data.map((d) => Math.max(parseFloat(d.income), parseFloat(d.expense)))
  );

  return (
    <div className="space-y-2">
      {data.map((day) => {
        const income = parseFloat(day.income);
        const expense = parseFloat(day.expense);
        const incomeWidth = maxValue > 0 ? (income / maxValue) * 100 : 0;
        const expenseWidth = maxValue > 0 ? (expense / maxValue) * 100 : 0;

        return (
          <div key={day.date} className="flex items-center gap-2 text-sm">
            <span className="w-16 text-muted-foreground shrink-0">
              {format(new Date(day.date), 'MM/dd', { locale: zhCN })}
            </span>
            <div className="flex-1 space-y-1">
              {income > 0 && (
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 bg-green-500/80 rounded"
                    style={{ width: `${incomeWidth}%`, minWidth: income > 0 ? '4px' : '0' }}
                  />
                  <span className="text-xs text-green-600">
                    +{formatCurrency(income, currency)}
                  </span>
                </div>
              )}
              {expense > 0 && (
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 bg-red-500/80 rounded"
                    style={{ width: `${expenseWidth}%`, minWidth: expense > 0 ? '4px' : '0' }}
                  />
                  <span className="text-xs text-red-600">
                    -{formatCurrency(expense, currency)}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Category Stats Component
function CategoryBreakdown({
  data,
  currency,
  direction,
}: {
  data: CategoryStats[];
  currency: string;
  direction: 'IN' | 'OUT';
}) {
  const total = data.reduce((sum, c) => sum + parseFloat(c.total), 0);
  const sortedData = [...data].sort((a, b) => parseFloat(b.total) - parseFloat(a.total));

  return (
    <div className="space-y-3">
      {sortedData.slice(0, 8).map((category, index) => {
        const amount = parseFloat(category.total);
        const percentage = total > 0 ? (amount / total) * 100 : 0;
        const colors = [
          'bg-blue-500',
          'bg-green-500',
          'bg-yellow-500',
          'bg-purple-500',
          'bg-pink-500',
          'bg-orange-500',
          'bg-cyan-500',
          'bg-indigo-500',
        ];

        return (
          <div key={category.category_id || 'uncategorized'} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span>{category.category_icon || '📦'}</span>
                <span>{category.category_name || '未分类'}</span>
              </span>
              <span className="font-medium">
                {direction === 'OUT' ? '-' : '+'}
                {formatCurrency(amount, currency)}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${colors[index % colors.length]} rounded-full transition-all`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{category.count} 笔</span>
              <span>{percentage.toFixed(1)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Multi-account Category Stats Component - displays category stats per account
function MultiAccountCategoryBreakdown({
  accounts,
  dateRange,
  direction,
}: {
  accounts: { id: number; currency: string; name: string | null; platform: string }[];
  dateRange: { from: string; to: string };
  direction: 'IN' | 'OUT';
}) {
  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground mb-2">
        💡 按账户分开显示支出分类
      </div>
      {accounts.map(account => (
        <AccountCategorySection
          key={account.id}
          account={account}
          dateRange={dateRange}
          direction={direction}
        />
      ))}
    </div>
  );
}

// Category section for a single account
function AccountCategorySection({
  account,
  dateRange,
  direction,
}: {
  account: { id: number; currency: string; name: string | null; platform: string };
  dateRange: { from: string; to: string };
  direction: 'IN' | 'OUT';
}) {
  const { data: categoryStats, isLoading } = useStatsByCategory({
    from: dateRange.from,
    to: dateRange.to,
    direction: direction,
    account_id: account.id,
  });

  const platform = getPlatformInfo(account.platform);
  const accountName = getAccountDisplayName(account);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <span>{platform.icon}</span>
          <span>{accountName}</span>
          <Badge variant="outline">{account.currency}</Badge>
        </h4>
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!categoryStats || categoryStats.length === 0) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <span>{platform.icon}</span>
          <span>{accountName}</span>
          <Badge variant="outline">{account.currency}</Badge>
        </h4>
        <p className="text-xs text-muted-foreground py-2">暂无数据</p>
      </div>
    );
  }

  // Calculate total for this account
  const total = categoryStats.reduce((sum, c) => sum + parseFloat(c.total), 0);
  const totalCount = categoryStats.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <span>{platform.icon}</span>
        <span>{accountName}</span>
        <Badge variant="outline">{account.currency}</Badge>
      </h4>
      <CategoryBreakdown
        data={categoryStats}
        currency={account.currency}
        direction={direction}
      />
      {/* Account Total */}
      <div className="flex items-center justify-between pt-2 mt-2 border-t border-dashed">
        <span className="text-sm font-medium">合计</span>
        <div className="text-right">
          <span className="text-sm font-semibold text-red-600">
            -{formatCurrency(total, account.currency)}
          </span>
          <span className="text-xs text-muted-foreground ml-2">
            ({totalCount} 笔)
          </span>
        </div>
      </div>
    </div>
  );
}

// Recent Transactions Component
function RecentTransactions({
  transactions,
}: {
  transactions: Transaction[];
}) {
  return (
    <div className="space-y-3">
      {transactions.slice(0, 10).map((tx) => (
        <div
          key={tx.id}
          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${
                tx.direction === 'IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}
            >
              {tx.direction === 'IN' ? (
                <ArrowDownRight className="h-4 w-4" />
              ) : (
                <ArrowUpRight className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="font-medium text-sm">
                {tx.counterparty_name || tx.description || '未知交易'}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(tx.transaction_at), 'MM/dd HH:mm', { locale: zhCN })}
              </p>
            </div>
          </div>
          <span
            className={`font-semibold ${
              tx.direction === 'IN' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {tx.direction === 'IN' ? '+' : '-'}
            {formatCurrency(tx.amount, tx.currency)}
          </span>
        </div>
      ))}
    </div>
  );
}

// Budget Progress Component
function BudgetProgress({ budget, onDelete, isDeleting }: {
  budget: Budget;
  onDelete?: (id: number, accountId: number) => void;
  isDeleting?: boolean;
}) {
  const spent = parseFloat(budget.current_spent);
  const total = parseFloat(budget.amount);
  const percentage = total > 0 ? (spent / total) * 100 : 0;
  const isOverBudget = percentage > 100;
  const isWarning = percentage >= 80 && percentage < 100;

  return (
    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">
            {budget.category_name || '总预算'}
          </span>
          <Badge variant="outline" className="text-xs">
            {budget.period === 'monthly' ? '月度' : '周度'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${
            isOverBudget ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-muted-foreground'
          }`}>
            {formatCurrency(spent, budget.currency)} / {formatCurrency(total, budget.currency)}
          </span>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(budget.id, budget.account_id)}
              disabled={isDeleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isOverBudget ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {budget.period_start} ~ {budget.period_end}
        </span>
        <span>{percentage.toFixed(1)}% 已使用</span>
      </div>
    </div>
  );
}

// Budget Alerts Component
function BudgetAlertsCard({ alerts }: { alerts: BudgetAlert[] }) {
  if (alerts.length === 0) return null;

  const getAlertColor = (type: BudgetAlert['alert_type']) => {
    switch (type) {
      case 'over_budget':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'critical':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertIcon = (type: BudgetAlert['alert_type']) => {
    switch (type) {
      case 'over_budget':
        return '🚨';
      case 'critical':
        return '⚠️';
      case 'warning':
        return '💡';
      default:
        return '📊';
    }
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-yellow-800">
          <AlertTriangle className="h-5 w-5" />
          预算预警 ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map((alert, index) => (
          <div
            key={`${alert.budget_id}-${index}`}
            className={`p-3 rounded-lg border ${getAlertColor(alert.alert_type)}`}
          >
            <div className="flex items-start gap-2">
              <span>{getAlertIcon(alert.alert_type)}</span>
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {alert.category_name || '总预算'}
                </p>
                <p className="text-xs mt-1">{alert.message}</p>
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span>
                    已花费: {formatCurrency(parseFloat(alert.spent), 'GBP')} / {formatCurrency(parseFloat(alert.amount), 'GBP')}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {alert.percentage_used.toFixed(0)}%
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Create Budget Dialog Component
function CreateBudgetDialog({
  accounts,
  categories,
  onSubmit,
  isLoading,
}: {
  accounts: { id: number; name: string | null; platform: string; currency: string }[];
  categories: { id: number; name: string }[];
  onSubmit: (data: BudgetCreate) => void;
  isLoading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'monthly' | 'weekly'>('monthly');

  const handleSubmit = () => {
    if (!accountId || !amount) return;
    onSubmit({
      account_id: parseInt(accountId),
      amount: amount,
      period: period,
      category_id: categoryId === 'all' ? null : parseInt(categoryId),
    });
    setOpen(false);
    setAmount('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          新建预算
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建预算</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">账户</label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="选择账户" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id.toString()}>
                    {getPlatformInfo(acc.platform).icon} {getAccountDisplayName(acc)} ({acc.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">分类 (可选)</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="全部分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类 (总预算)</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">预算金额</label>
            <Input
              type="number"
              placeholder="输入金额"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">周期</label>
            <Select value={period} onValueChange={(v) => setPeriod(v as 'monthly' | 'weekly')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">月度</SelectItem>
                <SelectItem value="weekly">周度</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSubmit} disabled={!accountId || !amount || isLoading} className="w-full">
            {isLoading ? '创建中...' : '创建预算'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Merchant List Component
function MerchantList({ merchants, currency }: { merchants: MerchantListItem[]; currency: string }) {
  const getTierBadge = (tier: MerchantListItem['tier']) => {
    switch (tier) {
      case 'gold':
        return <Badge className="bg-yellow-500">🥇 金牌</Badge>;
      case 'silver':
        return <Badge className="bg-gray-400">🥈 银牌</Badge>;
      case 'bronze':
        return <Badge className="bg-orange-600">🥉 铜牌</Badge>;
      default:
        return <Badge variant="outline">普通</Badge>;
    }
  };

  return (
    <div className="space-y-2">
      {merchants.map((merchant) => (
        <div
          key={merchant.id}
          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            <Store className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{merchant.name}</span>
                {getTierBadge(merchant.tier)}
              </div>
              <p className="text-xs text-muted-foreground">
                {merchant.category_name || '未分类'} · {merchant.total_transactions} 笔交易
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium text-sm">
              {formatCurrency(parseFloat(merchant.total_amount), currency)}
            </p>
            {merchant.score && (
              <p className="text-xs text-muted-foreground">
                评分: {parseFloat(merchant.score).toFixed(1)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Transaction with Analysis Button Component
function TransactionWithAnalysis({
  transaction,
  onAnalyze,
  isAnalyzing,
}: {
  transaction: Transaction;
  onAnalyze: (id: number) => void;
  isAnalyzing: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-full ${
            transaction.direction === 'IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}
        >
          {transaction.direction === 'IN' ? (
            <ArrowDownRight className="h-4 w-4" />
          ) : (
            <ArrowUpRight className="h-4 w-4" />
          )}
        </div>
        <div>
          <p className="font-medium text-sm">
            {transaction.counterparty_name || transaction.description || '未知交易'}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(transaction.transaction_at), 'MM/dd HH:mm', { locale: zhCN })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`font-semibold ${
            transaction.direction === 'IN' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {transaction.direction === 'IN' ? '+' : '-'}
          {formatCurrency(transaction.amount, transaction.currency)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onAnalyze(transaction.id)}
          disabled={isAnalyzing}
          title="AI 分析"
        >
          <Sparkles className={`h-4 w-4 ${isAnalyzing ? 'animate-pulse text-yellow-500' : ''}`} />
        </Button>
      </div>
    </div>
  );
}

// Infinite Scroll Transactions Component
function AllTransactionsList({
  accountId,
  dateRange,
  accounts,
}: {
  accountId?: number;
  dateRange: { from: string; to: string };
  accounts?: Account[];
}) {
  const PAGE_SIZE = 30;
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAccountId, setFilterAccountId] = useState<string>('all');

  // Use filterAccountId if set, otherwise use prop accountId
  const effectiveAccountId = filterAccountId !== 'all' ? Number(filterAccountId) : accountId;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['all-transactions', effectiveAccountId, dateRange, searchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams();
      if (effectiveAccountId) params.append('account_id', String(effectiveAccountId));
      params.append('from', dateRange.from);
      params.append('to', dateRange.to);
      params.append('limit', String(PAGE_SIZE));
      params.append('offset', String(pageParam));
      if (searchQuery) params.append('counterparty', searchQuery);
      const { data } = await financeClient.get<FinancePaginatedResponse<Transaction>>(
        `/api/v1/transactions?${params.toString()}`
      );
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce((sum, page) => sum + page.data.length, 0);
      if (totalLoaded < lastPage.pagination.total) {
        return totalLoaded;
      }
      return undefined;
    },
    initialPageParam: 0,
  });

  const allTransactions = data?.pages.flatMap(page => page.data) || [];
  const total = data?.pages[0]?.pagination.total || 0;

  // Create a map for quick account lookup
  const accountMap = useMemo(() => {
    const map = new Map<number, Account>();
    accounts?.forEach(acc => map.set(acc.id, acc));
    return map;
  }, [accounts]);

  const getAccountInfo = (accountId: number) => {
    const account = accountMap.get(accountId);
    if (!account) return { name: '未知账户', icon: '💳' };
    const platform = getPlatformInfo(account.platform);
    return { name: getAccountDisplayName(account), icon: platform.icon };
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Load more when scrolled to 80% of the list
    if (scrollHeight - scrollTop <= clientHeight * 1.2 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5" />
            全部交易记录
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              已加载 {allTransactions.length} / {total} 笔
            </Badge>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索商户/描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {accounts && accounts.length > 1 && (
            <Select value={filterAccountId} onValueChange={setFilterAccountId}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="选择账户" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部账户</SelectItem>
                {accounts.map((acc) => {
                  const platform = getPlatformInfo(acc.platform);
                  return (
                    <SelectItem key={acc.id} value={String(acc.id)}>
                      {platform.icon} {getAccountDisplayName(acc)}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : allTransactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {searchQuery ? `未找到包含 "${searchQuery}" 的交易` : '暂无交易记录'}
          </p>
        ) : (
          <div
            className="space-y-2 max-h-[600px] overflow-y-auto pr-2"
            onScroll={handleScroll}
          >
            {allTransactions.map((tx) => {
              const accountInfo = getAccountInfo(tx.account_id);
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        tx.direction === 'IN' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {tx.direction === 'IN' ? (
                        <ArrowDownRight className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{accountInfo.icon}</span>
                        <span className="text-xs text-muted-foreground">{accountInfo.name}</span>
                      </div>
                      <p className="font-medium text-sm">
                        {tx.counterparty_name || tx.description || '未知交易'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.transaction_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-semibold ${
                        tx.direction === 'IN' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {tx.direction === 'IN' ? '+' : '-'}
                      {formatCurrency(tx.amount, tx.currency)}
                    </span>
                    <p className="text-xs text-muted-foreground">{tx.currency}</p>
                  </div>
                </div>
              );
            })}
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!hasNextPage && allTransactions.length > 0 && (
              <p className="text-center text-xs text-muted-foreground py-4">
                已加载全部 {total} 笔交易
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Multi-currency Summary Card Component
function MultiCurrencySummaryCards({
  accounts,
  dateRange,
  isLoading,
}: {
  accounts: { id: number; currency: string }[];
  dateRange: { from: string; to: string };
  isLoading: boolean;
}) {
  // Get unique currencies from accounts
  const currencies = useMemo(() => {
    const currencySet = new Set(accounts.map(a => a.currency));
    return Array.from(currencySet);
  }, [accounts]);

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground mb-2">
        💡 不同币种分开显示，避免直接求和
      </div>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {currencies.map(currency => (
            <CurrencySummaryRow
              key={currency}
              currency={currency}
              accounts={accounts.filter(a => a.currency === currency)}
              dateRange={dateRange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Summary row for a single currency
function CurrencySummaryRow({
  currency,
  accounts,
  dateRange,
}: {
  currency: string;
  accounts: { id: number }[];
  dateRange: { from: string; to: string };
}) {
  // Fetch summary for this currency (using first account as filter since they all have same currency)
  const { data: summary, isLoading } = useStatsSummary({
    from: dateRange.from,
    to: dateRange.to,
    currency: currency,
    account_id: accounts.length === 1 ? accounts[0].id : undefined,
  });

  const currencyInfo = CURRENCIES.find(c => c.value === currency);
  const currencyLabel = currencyInfo ? `${currencyInfo.symbol} ${currencyInfo.label}` : currency;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">{currencyLabel}</h4>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-6 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Badge variant="outline">{currencyLabel}</Badge>
        <span className="text-xs">({accounts.length} 个账户)</span>
      </h4>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">收入</p>
                <p className="text-lg font-bold text-green-600">
                  +{formatCurrency(summary.total_income, currency)}
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">支出</p>
                <p className="text-lg font-bold text-red-600">
                  -{formatCurrency(summary.total_expense, currency)}
                </p>
              </div>
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">净收入</p>
                <p className={`text-lg font-bold ${parseFloat(summary.net) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.net, currency)}
                </p>
              </div>
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">交易数</p>
                <p className="text-lg font-bold text-blue-600">
                  {summary.transaction_count}
                </p>
              </div>
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Starling Bank Card Component
function StarlingCard() {
  const { data, isLoading, isError } = useStarlingBalance();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-teal-500 flex items-center justify-center">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <CardTitle className="text-base">Starling Bank</CardTitle>
          {data && (
            <Badge variant="outline" className="ml-auto text-xs">
              {data.balance.currency}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <>
            <div className="flex gap-4">
              <Skeleton className="h-12 w-36" />
              <Skeleton className="h-12 w-36" />
            </div>
            <Skeleton className="h-24 w-full" />
          </>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">暂时无法获取 Starling 账户数据</p>
        ) : data ? (
          <>
            {/* Balance */}
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-xs text-muted-foreground mb-1">已清算余额</p>
                <p className="text-2xl font-bold text-teal-600">
                  {data.balance.currency} {data.balance.cleared.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">有效余额</p>
                <p className="text-2xl font-bold">
                  {data.balance.currency} {data.balance.effective.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Recent Transactions */}
            {data.transactions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">最近交易</p>
                <div className="space-y-2">
                  {data.transactions.map((tx, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`shrink-0 p-1 rounded-full ${tx.direction === 'IN' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {tx.direction === 'IN' ? (
                            <ArrowDownRight className="h-3 w-3 text-green-600" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3 text-red-600" />
                          )}
                        </div>
                        <span className="truncate text-muted-foreground">{tx.counterparty_name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{tx.date}</span>
                      </div>
                      <span className={`shrink-0 font-medium ml-3 ${tx.direction === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.direction === 'IN' ? '+' : '-'}{tx.currency} {tx.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

// Main Finance Page
export default function FinancePage() {
  const [datePreset, setDatePreset] = useState('30d');
  const [selectedCurrency, setSelectedCurrency] = useState('GBP');
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>();
  const [activeTab, setActiveTab] = useState('overview');
  const [merchantSearch, setMerchantSearch] = useState('');
  const [analyzingTxId, setAnalyzingTxId] = useState<number | null>(null);
  // Balance edit state
  const [editBalanceOpen, setEditBalanceOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<{
    id: number;
    name: string;
    currency: string;
    balance: string | null;
  } | null>(null);

  const dateRange = useMemo(() => getDateRange(datePreset), [datePreset]);

  // Data queries
  const { data: accounts } = useAccounts();
  const { data: estimatedBalances, isLoading: balancesLoading } = useAllEstimatedBalances();
  const updateBalanceMutation = useUpdateAccountBalance();

  // When account is selected, auto-select its currency
  const selectedAccount = useMemo(() => {
    if (!selectedAccountId || !accounts) return null;
    return accounts.find(a => a.id === selectedAccountId);
  }, [selectedAccountId, accounts]);

  // Auto-update currency when account changes
  useMemo(() => {
    if (selectedAccount) {
      setSelectedCurrency(selectedAccount.currency);
    }
  }, [selectedAccount]);
  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useStatsSummary({
    from: dateRange.from,
    to: dateRange.to,
    currency: selectedCurrency,
    account_id: selectedAccountId,
  });
  const { data: categoryStats, isLoading: categoryLoading } = useStatsByCategory({
    from: dateRange.from,
    to: dateRange.to,
    direction: 'OUT',
    account_id: selectedAccountId,
  });
  const { data: counterpartyStats, isLoading: counterpartyLoading } = useStatsByCounterparty({
    from: dateRange.from,
    to: dateRange.to,
    direction: 'OUT',
    limit: 10,
    account_id: selectedAccountId,
  });
  const { data: dailyStats, isLoading: dailyLoading } = useStatsDaily({
    from: dateRange.from,
    to: dateRange.to,
    account_id: selectedAccountId,
  });
  const { data: transactionsData, isLoading: transactionsLoading } = useTransactions({
    from: dateRange.from,
    to: dateRange.to,
    account_id: selectedAccountId,
    limit: 20,
  });

  // Budget and Merchant queries
  const { data: budgets, isLoading: budgetsLoading } = useBudgets({
    account_id: selectedAccountId || (accounts?.[0]?.id ?? 0),
    active_only: true,
  });
  const { data: budgetAlerts } = useBudgetAlerts(selectedAccountId || (accounts?.[0]?.id ?? 0));
  const { data: categories } = useCategories();
  const { data: merchants, isLoading: merchantsLoading } = useMerchants({
    search: merchantSearch || undefined,
    order_by: 'total_amount',
    limit: 20,
  });

  // Mutations
  const createBudgetMutation = useCreateBudget();
  const deleteBudgetMutation = useDeleteBudget();
  const analyzeTransactionMutation = useAnalyzeTransaction();

  const isLoading =
    summaryLoading || categoryLoading || counterpartyLoading || dailyLoading || transactionsLoading;

  const handleRefresh = () => {
    refetchSummary();
  };

  const handleCreateBudget = (data: BudgetCreate) => {
    createBudgetMutation.mutate(data);
  };

  const handleDeleteBudget = (budgetId: number, accountId: number) => {
    deleteBudgetMutation.mutate({ id: budgetId, accountId });
  };

  const handleAnalyzeTransaction = async (txId: number) => {
    setAnalyzingTxId(txId);
    try {
      const result = await analyzeTransactionMutation.mutateAsync(txId);
      // Show analysis result
      alert(`分析结果:\n商户: ${result.merchant_normalized || '未识别'}\n建议分类: ${result.suggested_category_id ? '已识别' : '未识别'}\n消费类型: ${result.spending_type || '未知'}\n${result.is_unusual ? '⚠️ 异常交易: ' + result.unusual_reason : ''}`);
    } catch {
      console.error('Analysis failed');
    } finally {
      setAnalyzingTxId(null);
    }
  };

  const handleEditBalance = (accountId: number, currentBalance: string | null) => {
    const account = accounts?.find(a => a.id === accountId);
    if (account) {
      setEditingAccount({
        id: accountId,
        name: getAccountDisplayName(account),
        currency: account.currency,
        balance: currentBalance,
      });
      setEditBalanceOpen(true);
    }
  };

  const handleSaveBalance = (accountId: number, balance: string) => {
    updateBalanceMutation.mutate(
      { accountId, balance },
      {
        onSuccess: () => {
          setEditBalanceOpen(false);
          setEditingAccount(null);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">财务统计</h2>
          <p className="text-sm text-muted-foreground">
            {dateRange.from} ~ {dateRange.to}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Account Filter */}
          <Select
            value={selectedAccountId?.toString() || 'all'}
            onValueChange={(v) => setSelectedAccountId(v === 'all' ? undefined : parseInt(v))}
          >
            <SelectTrigger className="w-[160px]">
              <CreditCard className="h-4 w-4 mr-2" />
              <SelectValue placeholder="全部账户" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部账户</SelectItem>
              {accounts?.map((acc) => (
                <SelectItem key={acc.id} value={acc.id.toString()}>
                  {getPlatformInfo(acc.platform).icon} {getAccountDisplayName(acc)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Currency Filter - only show when a specific account is selected */}
          {selectedAccountId && (
            <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.symbol} {c.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Date Range */}
          <Select value={datePreset} onValueChange={setDatePreset}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {!selectedAccountId && accounts && accounts.length > 0 ? (
        /* Multi-currency display when "全部账户" is selected */
        <MultiCurrencySummaryCards
          accounts={accounts}
          dateRange={dateRange}
          isLoading={summaryLoading}
        />
      ) : (
        /* Single currency display when a specific account is selected */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {summaryLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-28" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : summary ? (
            <>
              <SummaryCard
                title="总收入"
                value={formatCurrency(summary.total_income, selectedCurrency)}
                icon={TrendingUp}
                color="text-green-600"
              />
              <SummaryCard
                title="总支出"
                value={formatCurrency(summary.total_expense, selectedCurrency)}
                icon={TrendingDown}
                color="text-red-600"
              />
              <SummaryCard
                title="净收入"
                value={formatCurrency(summary.net, selectedCurrency)}
                icon={Wallet}
                color={parseFloat(summary.net) >= 0 ? 'text-green-600' : 'text-red-600'}
              />
              <SummaryCard
                title="交易笔数"
                value={summary.transaction_count.toString()}
                icon={CreditCard}
                subtitle={`${summary.period.start} ~ ${summary.period.end}`}
                color="text-blue-600"
              />
            </>
          ) : (
            <Card className="col-span-4">
              <CardContent className="p-6 text-center text-muted-foreground">
                暂无统计数据
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Starling Bank Account */}
      <StarlingCard />

      {/* Budget Alerts */}
      {budgetAlerts && budgetAlerts.length > 0 && (
        <BudgetAlertsCard alerts={budgetAlerts} />
      )}

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="all-transactions">全部交易</TabsTrigger>
          <TabsTrigger value="budgets">预算管理</TabsTrigger>
          <TabsTrigger value="merchants">商户目录</TabsTrigger>
          <TabsTrigger value="transactions">交易分析</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Trend */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5" />
              每日收支趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : dailyStats && dailyStats.length > 0 ? (
              <DailyTrendChart data={dailyStats} currency={selectedCurrency} />
            ) : (
              <p className="text-center text-muted-foreground py-8">暂无数据</p>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="h-5 w-5" />
              支出分类
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto">
            {!selectedAccountId && accounts && accounts.length > 0 ? (
              /* Multi-account view: show category stats per account */
              <MultiAccountCategoryBreakdown
                accounts={accounts}
                dateRange={dateRange}
                direction="OUT"
              />
            ) : categoryLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : categoryStats && categoryStats.length > 0 ? (
              <CategoryBreakdown
                data={categoryStats}
                currency={selectedCurrency}
                direction="OUT"
              />
            ) : (
              <p className="text-center text-muted-foreground py-8">暂无数据</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Merchants */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Store className="h-5 w-5" />
              消费商家 TOP 10
            </CardTitle>
          </CardHeader>
          <CardContent>
            {counterpartyLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : counterpartyStats && counterpartyStats.length > 0 ? (
              <div className="space-y-2">
                {counterpartyStats.map((cp, index) => (
                  <div
                    key={cp.counterparty_name || index}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                        {index + 1}
                      </Badge>
                      <span className="text-sm">{cp.counterparty_name || '未知商家'}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {formatCurrency(cp.total, selectedCurrency)}
                      </p>
                      <p className="text-xs text-muted-foreground">{cp.count} 笔</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">暂无数据</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-5 w-5" />
              最近交易
            </CardTitle>
            {transactionsData && (
              <Badge variant="secondary">
                共 {transactionsData.pagination.total} 笔
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : transactionsData && transactionsData.data.length > 0 ? (
              <RecentTransactions
                transactions={transactionsData.data}
              />
            ) : (
              <p className="text-center text-muted-foreground py-8">暂无交易记录</p>
            )}
          </CardContent>
        </Card>
      </div>

          {/* Accounts Overview with Balances */}
          {accounts && accounts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wallet className="h-5 w-5" />
                  关联账户 · 余额管理
                </CardTitle>
              </CardHeader>
              <CardContent>
                {balancesLoading ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-48" />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {accounts.map((account) => (
                      <AccountBalanceCard
                        key={account.id}
                        account={account}
                        estimatedBalance={estimatedBalances?.balances?.[account.id]}
                        onEditBalance={handleEditBalance}
                        isUpdating={updateBalanceMutation.isPending}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Edit Balance Dialog */}
          {editingAccount && (
            <EditBalanceDialog
              open={editBalanceOpen}
              onOpenChange={setEditBalanceOpen}
              accountId={editingAccount.id}
              accountName={editingAccount.name}
              currentBalance={editingAccount.balance}
              currency={editingAccount.currency}
              onSave={handleSaveBalance}
              isSaving={updateBalanceMutation.isPending}
            />
          )}
        </TabsContent>

        {/* All Transactions Tab */}
        <TabsContent value="all-transactions" className="space-y-6 mt-6">
          <AllTransactionsList
            accountId={selectedAccountId}
            dateRange={dateRange}
            accounts={accounts}
          />
        </TabsContent>

        {/* Budgets Tab */}
        <TabsContent value="budgets" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5" />
              预算管理
            </h3>
            {accounts && categories && (
              <CreateBudgetDialog
                accounts={accounts}
                categories={categories}
                onSubmit={handleCreateBudget}
                isLoading={createBudgetMutation.isPending}
              />
            )}
          </div>

          {budgetsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : budgets && budgets.length > 0 ? (
            <div className="space-y-4">
              {budgets.map((budget) => (
                <BudgetProgress
                  key={budget.id}
                  budget={budget}
                  onDelete={handleDeleteBudget}
                  isDeleting={deleteBudgetMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无预算</p>
                <p className="text-sm mt-2">点击"新建预算"开始管理您的支出</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Merchants Tab */}
        <TabsContent value="merchants" className="space-y-6 mt-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Store className="h-5 w-5" />
              商户目录
            </h3>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索商户..."
                value={merchantSearch}
                onChange={(e) => setMerchantSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {merchantsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : merchants && merchants.data && merchants.data.length > 0 ? (
            <MerchantList merchants={merchants.data} currency={selectedCurrency} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>暂无商户数据</p>
                <p className="text-sm mt-2">导入交易记录后将自动识别商户</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Transactions Analysis Tab */}
        <TabsContent value="transactions" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              交易分析
            </h3>
            <Badge variant="secondary">
              点击 ✨ 分析单笔交易
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">最近交易</CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : transactionsData && transactionsData.data.length > 0 ? (
                <div className="space-y-3">
                  {transactionsData.data.slice(0, 20).map((tx) => (
                    <TransactionWithAnalysis
                      key={tx.id}
                      transaction={tx}
                      onAnalyze={handleAnalyzeTransaction}
                      isAnalyzing={analyzingTxId === tx.id}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">暂无交易记录</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
