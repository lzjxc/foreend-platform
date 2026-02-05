/**
 * Currency Transaction Stats Component
 * Displays income, expense, net income, and transaction count by currency
 * with date range and account filters, plus monthly trend chart
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
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
  CreditCard,
  RefreshCw,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAccounts, useStatsSummary, useStatsDaily } from '@/hooks/use-finance';
import { formatCurrency, CURRENCIES, getPlatformInfo, getAccountDisplayName } from '@/types/finance';
import { format, startOfMonth, endOfMonth, subMonths, subDays, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// Date range presets
const DATE_PRESETS = [
  { value: 'this_month', label: '本月' },
  { value: '7d', label: '最近 7 天' },
  { value: '30d', label: '最近 30 天' },
  { value: 'last_month', label: '上月' },
  { value: '90d', label: '最近 90 天' },
  { value: 'all', label: '全部' },
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
    case 'all':
      // 从2年前开始，覆盖所有可能的历史数据
      return { from: formatDate(subMonths(today, 24)), to: formatDate(today) };
    default:
      return { from: formatDate(startOfMonth(today)), to: formatDate(today) };
  }
}


interface CurrencyStatsProps {
  showHeader?: boolean;
  defaultPreset?: string;
}

// Monthly trend data type
interface MonthlyData {
  month: string;
  monthLabel: string;
  income: number;
  expense: number;
}

// Custom tooltip for the chart
function ChartTooltip({ active, payload, label, currency }: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string; stroke?: string }>;
  label?: string;
  currency: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-2 text-xs">
        <p className="font-medium mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.stroke || entry.color }}>
            {entry.dataKey === 'income' ? '收入' : '支出'}: {formatCurrency(entry.value, currency)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// Monthly trend chart component
function MonthlyTrendChart({
  currency,
  accountId,
  dateRange,
}: {
  currency: string;
  accountId?: number;
  dateRange: { from: string; to: string };
}) {
  const { data: dailyStats, isLoading } = useStatsDaily({
    from: dateRange.from,
    to: dateRange.to,
    account_id: accountId,
  });

  // Aggregate daily data into monthly data
  const monthlyData = useMemo(() => {
    if (!dailyStats || dailyStats.length === 0) return [];

    const monthMap = new Map<string, { income: number; expense: number }>();

    dailyStats.forEach((day) => {
      const date = parseISO(day.date);
      const monthKey = format(date, 'yyyy-MM');

      const existing = monthMap.get(monthKey) || { income: 0, expense: 0 };
      monthMap.set(monthKey, {
        income: existing.income + parseFloat(day.income),
        expense: existing.expense + parseFloat(day.expense),
      });
    });

    // Convert to array and sort by month
    const result: MonthlyData[] = Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        monthLabel: format(parseISO(month + '-01'), 'M月', { locale: zhCN }),
        income: data.income,
        expense: data.expense,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return result;
  }, [dailyStats]);

  const currencyInfo = CURRENCIES.find(c => c.value === currency);
  const currencySymbol = currencyInfo?.symbol || currency;

  if (isLoading) {
    return (
      <div className="mt-3">
        <Skeleton className="h-[120px] w-full" />
      </div>
    );
  }

  if (monthlyData.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">月度收支趋势</span>
      </div>
      <div className="h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`incomeGradient-${currency}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id={`expenseGradient-${currency}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
            <XAxis
              dataKey="monthLabel"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${currencySymbol}${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
              width={45}
            />
            <Tooltip content={<ChartTooltip currency={currency} />} />
            <Legend
              formatter={(value) => (value === 'income' ? '收入' : '支出')}
              wrapperStyle={{ fontSize: 10 }}
              iconSize={8}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#22c55e"
              strokeWidth={2}
              fill={`url(#incomeGradient-${currency})`}
              dot={{ r: 3, fill: '#22c55e' }}
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="#ef4444"
              strokeWidth={2}
              fill={`url(#expenseGradient-${currency})`}
              dot={{ r: 3, fill: '#ef4444' }}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
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
      {/* Monthly trend chart */}
      <MonthlyTrendChart
        currency={currency}
        accountId={accounts.length === 1 ? accounts[0].id : undefined}
        dateRange={dateRange}
      />
    </div>
  );
}

export function CurrencyStats({ showHeader = true, defaultPreset = 'this_month' }: CurrencyStatsProps) {
  const [datePreset, setDatePreset] = useState(defaultPreset);
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>();

  const { data: accounts, isLoading: accountsLoading, refetch } = useAccounts();

  const dateRange = useMemo(() => getDateRange(datePreset), [datePreset]);

  // Get unique currencies from accounts (filtered by selected account if any)
  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];
    if (selectedAccountId) {
      return accounts.filter(a => a.id === selectedAccountId);
    }
    return accounts;
  }, [accounts, selectedAccountId]);

  const currencies = useMemo(() => {
    const currencySet = new Set(filteredAccounts.map(a => a.currency));
    return Array.from(currencySet);
  }, [filteredAccounts]);

  const handleRefresh = () => {
    refetch();
  };

  if (accountsLoading) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-48" />
          </div>
        )}
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

  if (!accounts || accounts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              财务统计
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {dateRange.from} ~ {dateRange.to}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Account Filter */}
            <Select
              value={selectedAccountId?.toString() || 'all'}
              onValueChange={(v) => setSelectedAccountId(v === 'all' ? undefined : parseInt(v))}
            >
              <SelectTrigger className="w-[140px]">
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

            {/* Date Range */}
            <Select value={datePreset} onValueChange={setDatePreset}>
              <SelectTrigger className="w-[120px]">
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

            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
          </div>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        💡 不同币种分开显示，避免直接求和
      </div>

      <div className="space-y-6">
        {currencies.map(currency => (
          <CurrencySummaryRow
            key={currency}
            currency={currency}
            accounts={filteredAccounts.filter(a => a.currency === currency)}
            dateRange={dateRange}
          />
        ))}
      </div>
    </div>
  );
}
