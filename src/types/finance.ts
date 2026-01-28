/**
 * Finance Service 类型定义
 */

// ============ Account Types ============

export interface Account {
  id: number;
  platform: string;
  platform_account_id: string;
  currency: string;
  name: string | null;
  is_active: boolean;
  last_synced_at: string | null;
  metadata_: Record<string, unknown>;
  balance: string | null;           // 记录余额
  balance_updated_at: string | null; // 余额更新时间
  created_at: string;
  updated_at: string;
}

export interface AccountBalanceUpdate {
  balance: string;
}

export interface EstimatedBalance {
  account_id: number;
  balance: string | null;
  balance_updated_at: string | null;
  income_after: string;
  expense_after: string;
  estimated_balance: string | null;
  overflow_to_cmb?: string | null;     // 超支转移到招商银行的金额
  deducted_from_linked?: string | null; // 从关联账户扣除的金额
}

export interface AllEstimatedBalances {
  balances: Record<number, EstimatedBalance>;
}

export interface AccountCreate {
  platform: string;
  platform_account_id: string;
  currency: string;
  name?: string | null;
  metadata_?: Record<string, unknown>;
}

export interface AccountUpdate {
  name?: string | null;
  is_active?: boolean | null;
  metadata_?: Record<string, unknown> | null;
}

// ============ Transaction Types ============

export type TransactionDirection = 'IN' | 'OUT';

export interface Transaction {
  id: number;
  account_id: number;
  category_id: number | null;
  external_id: string;
  amount: string;
  currency: string;
  direction: TransactionDirection;
  counterparty_name: string | null;
  counterparty_id: string | null;
  description: string | null;
  transaction_at: string;
  settled_at: string | null;
  raw_data: Record<string, unknown>;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface TransactionCreate {
  account_id: number;
  external_id: string;
  amount: string;
  currency: string;
  direction: TransactionDirection;
  category_id?: number | null;
  counterparty_name?: string | null;
  counterparty_id?: string | null;
  description?: string | null;
  transaction_at: string;
  settled_at?: string | null;
  raw_data?: Record<string, unknown>;
  tags?: string[];
  notify?: boolean;
}

export interface TransactionUpdate {
  category_id?: number | null;
  tags?: string[] | null;
  description?: string | null;
}

export interface TransactionCreateResult {
  id: number;
  is_duplicate: boolean;
  category_id: number | null;
}

export interface TransactionFilters {
  account_id?: number;
  direction?: TransactionDirection;
  category_id?: number;
  counterparty?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

// ============ Category Types ============

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  is_income: boolean;
  sort_order: number;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreate {
  name: string;
  slug: string;
  icon?: string | null;
  color?: string | null;
  is_income?: boolean;
  sort_order?: number;
  parent_id?: number | null;
}

export interface CategoryUpdate {
  name?: string | null;
  slug?: string | null;
  icon?: string | null;
  color?: string | null;
  is_income?: boolean | null;
  sort_order?: number | null;
  parent_id?: number | null;
}

// ============ Statistics Types ============

export interface StatsPeriod {
  start: string;
  end: string;
}

export interface StatsSummary {
  total_income: string;
  total_expense: string;
  net: string;
  currency: string;
  transaction_count: number;
  period: StatsPeriod;
}

export interface CategoryStats {
  category_id: number | null;
  category_name: string | null;
  category_icon: string | null;
  total: string;
  count: number;
}

export interface CounterpartyStats {
  counterparty_name: string | null;
  total: string;
  count: number;
}

export interface DailyStats {
  date: string;
  income: string;
  expense: string;
}

export interface StatsFilters {
  account_id?: number;
  from: string;
  to: string;
  currency?: string;
  direction?: TransactionDirection;
  limit?: number;
}

// ============ Budget Types ============

export type BudgetPeriod = 'weekly' | 'monthly';

export interface Budget {
  id: number;
  account_id: number;
  category_id: number | null;
  category_name: string | null;
  amount: string;
  currency: string;
  period: BudgetPeriod;
  current_spent: string;
  period_start: string;
  period_end: string;
  is_active: boolean;
}

export interface BudgetCreate {
  account_id: number;
  amount: string;
  currency?: string;
  period?: BudgetPeriod;
  category_id?: number | null;
}

export interface BudgetUpdate {
  amount?: string | null;
  is_active?: boolean | null;
}

export interface BudgetStatus {
  budget: Budget;
  spent: string;
  remaining: string;
  percentage_used: number;
  is_over_budget: boolean;
  days_remaining: number;
  daily_allowance: string | null;
}

export type BudgetAlertType = 'warning' | 'critical' | 'over_budget';

export interface BudgetAlert {
  budget_id: number;
  category_name: string | null;
  amount: string;
  spent: string;
  percentage_used: number;
  alert_type: BudgetAlertType;
  message: string;
}

export interface BudgetFilters {
  account_id: number;
  active_only?: boolean;
}

// ============ Merchant Types ============

export type MerchantTier = 'gold' | 'silver' | 'bronze' | 'regular';

export interface Merchant {
  id: number;
  name: string;
  aliases: string[];
  category_id: number | null;
  total_transactions: number;
  total_amount: string;
  first_seen_at: string | null;
  last_seen_at: string | null;
  score: string | null;
  tier: MerchantTier | null;
}

export interface MerchantListItem {
  id: number;
  name: string;
  category_name: string | null;
  total_transactions: number;
  total_amount: string;
  tier: MerchantTier | null;
  score: string | null;
}

export interface MerchantFilters {
  search?: string;
  order_by?: 'total_transactions' | 'total_amount' | 'name';
  limit?: number;
  offset?: number;
}

export interface AddAliasRequest {
  alias: string;
}

// ============ Transaction Analysis Types ============

export type SpendingType = 'essential' | 'discretionary' | 'recurring' | 'one_time';

export interface TransactionAnalysis {
  id: number;
  transaction_id: number;
  merchant_normalized: string | null;
  merchant_id: number | null;
  suggested_category_id: number | null;
  spending_type: SpendingType | null;
  tags: string[];
  is_unusual: boolean;
  unusual_reason: string | null;
  confidence: number | null;
}

export interface BatchAnalyzeRequest {
  transaction_ids: number[];
  skip_analyzed?: boolean;
}

export interface BatchAnalyzeResponse {
  analyzed_count: number;
  skipped_count: number;
}

// ============ Trend Types ============

export type TrendPeriod = 'daily' | 'weekly' | 'monthly';
export type TrendDirection = 'up' | 'down' | 'stable';

export interface TrendComparison {
  current_total: string;
  previous_total: string;
  change_amount: string;
  change_percentage: number;
  trend_direction: TrendDirection;
}

export interface SpendingTrend {
  period_type: TrendPeriod;
  start_date: string;
  end_date: string;
  total_income: string;
  total_expense: string;
  transaction_count: number;
  by_category: Record<string, string>;
  by_spending_type: Record<string, string>;
  vs_previous: TrendComparison | null;
}

export interface TrendSnapshot {
  id: number;
  snapshot_date: string;
  period_type: TrendPeriod;
  total_expense: number;
}

export interface TrendFilters {
  account_id: number;
  period?: TrendPeriod;
}

// ============ API Response Types ============

export interface FinanceSuccessResponse<T> {
  success: true;
  data: T;
}

export interface FinancePaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface FinanceErrorResponse {
  success: false;
  error: string;
  message: string;
}

// ============ Platform Constants ============

export const PLATFORMS = [
  { value: 'starling', label: 'Starling Bank', icon: '🏦' },
  { value: 'monzo', label: 'Monzo', icon: '💳' },
  { value: 'alipay', label: '支付宝', icon: '💰' },
  { value: 'wechat', label: '微信支付', icon: '💬' },
  { value: 'wechat_pay', label: '微信支付', icon: '💬' },
  { value: 'cmb', label: '招商银行', icon: '🏦' },
  { value: 'manual', label: '手动录入', icon: '✏️' },
] as const;

export const CURRENCIES = [
  { value: 'GBP', label: '英镑', symbol: '£' },
  { value: 'CNY', label: '人民币', symbol: '¥' },
  { value: 'USD', label: '美元', symbol: '$' },
  { value: 'EUR', label: '欧元', symbol: '€' },
] as const;

// Helper function to format currency
export function formatCurrency(amount: string | number, currency: string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const currencyInfo = CURRENCIES.find(c => c.value === currency);
  const symbol = currencyInfo?.symbol || currency;
  return `${symbol}${num.toFixed(2)}`;
}

// Helper function to get platform info
export function getPlatformInfo(platform: string) {
  return PLATFORMS.find(p => p.value === platform) || { value: platform, label: platform, icon: '💳' };
}

// Helper function to check if a string contains garbled characters (乱码)
export function isGarbledText(text: string | null | undefined): boolean {
  if (!text) return true;
  // Check for common garbled patterns: consecutive question marks, replacement characters
  return /^\?+$/.test(text) || /[\uFFFD]/.test(text) || /^[?？]+$/.test(text);
}

// Helper function to get display name for account
export function getAccountDisplayName(account: { name: string | null; platform: string }): string {
  if (account.name && !isGarbledText(account.name)) {
    return account.name;
  }
  // Fallback to platform friendly name
  return getPlatformInfo(account.platform).label;
}
