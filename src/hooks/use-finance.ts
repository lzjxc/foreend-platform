/**
 * Finance Service Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeClient } from '@/api/client';
import type {
  Account,
  AccountCreate,
  AccountUpdate,
  AccountBalanceUpdate,
  EstimatedBalance,
  AllEstimatedBalances,
  Transaction,
  TransactionCreate,
  TransactionUpdate,
  TransactionCreateResult,
  TransactionFilters,
  Category,
  CategoryCreate,
  CategoryUpdate,
  StatsSummary,
  CategoryStats,
  CounterpartyStats,
  DailyStats,
  StatsFilters,
  FinanceSuccessResponse,
  FinancePaginatedResponse,
  // Budget types
  Budget,
  BudgetCreate,
  BudgetUpdate,
  BudgetStatus,
  BudgetAlert,
  BudgetFilters,
  // Merchant types
  Merchant,
  MerchantListItem,
  MerchantFilters,
  AddAliasRequest,
  // Analysis types
  TransactionAnalysis,
  BatchAnalyzeRequest,
  BatchAnalyzeResponse,
  // Trend types
  SpendingTrend,
  TrendSnapshot,
  TrendFilters,
} from '@/types/finance';

// ============ Query Keys ============

export const financeKeys = {
  all: ['finance'] as const,
  accounts: () => [...financeKeys.all, 'accounts'] as const,
  account: (id: number) => [...financeKeys.accounts(), id] as const,
  estimatedBalance: (accountId: number) => [...financeKeys.accounts(), 'estimated-balance', accountId] as const,
  allEstimatedBalances: () => [...financeKeys.accounts(), 'all-estimated-balances'] as const,
  transactions: (filters?: TransactionFilters) => [...financeKeys.all, 'transactions', filters] as const,
  transaction: (id: number) => [...financeKeys.all, 'transaction', id] as const,
  transactionAnalysis: (id: number) => [...financeKeys.all, 'transaction-analysis', id] as const,
  categories: () => [...financeKeys.all, 'categories'] as const,
  category: (id: number) => [...financeKeys.categories(), id] as const,
  // Budget keys
  budgets: (filters: BudgetFilters) => [...financeKeys.all, 'budgets', filters] as const,
  budget: (id: number) => [...financeKeys.all, 'budget', id] as const,
  budgetStatus: (id: number) => [...financeKeys.all, 'budget-status', id] as const,
  budgetAlerts: (accountId: number) => [...financeKeys.all, 'budget-alerts', accountId] as const,
  // Merchant keys
  merchants: (filters?: MerchantFilters) => [...financeKeys.all, 'merchants', filters] as const,
  topMerchants: (limit: number, days: number) => [...financeKeys.all, 'top-merchants', limit, days] as const,
  merchant: (id: number) => [...financeKeys.all, 'merchant', id] as const,
  // Stats keys
  stats: () => [...financeKeys.all, 'stats'] as const,
  statsSummary: (filters: StatsFilters) => [...financeKeys.stats(), 'summary', filters] as const,
  statsByCategory: (filters: StatsFilters) => [...financeKeys.stats(), 'by-category', filters] as const,
  statsByCounterparty: (filters: StatsFilters) => [...financeKeys.stats(), 'by-counterparty', filters] as const,
  statsDaily: (filters: StatsFilters) => [...financeKeys.stats(), 'daily', filters] as const,
  // Trend keys
  spendingTrends: (filters: TrendFilters) => [...financeKeys.stats(), 'trends', filters] as const,
  trendSummary: (filters: TrendFilters) => [...financeKeys.stats(), 'trend-summary', filters] as const,
};

// ============ Account Hooks ============

export function useAccounts(platform?: string, isActive?: boolean) {
  return useQuery({
    queryKey: financeKeys.accounts(),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (platform) params.append('platform', platform);
      if (isActive !== undefined) params.append('is_active', String(isActive));
      const query = params.toString() ? `?${params.toString()}` : '';
      const { data } = await financeClient.get<FinanceSuccessResponse<Account[]>>(
        `/api/v1/accounts${query}`
      );
      return data.data;
    },
  });
}

export function useAccount(id: number) {
  return useQuery({
    queryKey: financeKeys.account(id),
    queryFn: async () => {
      const { data } = await financeClient.get<FinanceSuccessResponse<Account>>(
        `/api/v1/accounts/${id}`
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AccountCreate) => {
      const { data } = await financeClient.post<FinanceSuccessResponse<Account>>(
        `/api/v1/accounts`,
        input
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.accounts() });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: AccountUpdate & { id: number }) => {
      const { data } = await financeClient.patch<FinanceSuccessResponse<Account>>(
        `/api/v1/accounts/${id}`,
        input
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.account(variables.id) });
      queryClient.invalidateQueries({ queryKey: financeKeys.accounts() });
    },
  });
}

// ============ Balance Hooks ============

export function useUpdateAccountBalance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId, balance }: { accountId: number; balance: string }) => {
      const { data } = await financeClient.patch<FinanceSuccessResponse<Account>>(
        `/api/v1/accounts/${accountId}/balance`,
        { balance } as AccountBalanceUpdate
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.account(variables.accountId) });
      queryClient.invalidateQueries({ queryKey: financeKeys.accounts() });
      queryClient.invalidateQueries({ queryKey: financeKeys.estimatedBalance(variables.accountId) });
      queryClient.invalidateQueries({ queryKey: financeKeys.allEstimatedBalances() });
    },
  });
}

export function useEstimatedBalance(accountId: number) {
  return useQuery({
    queryKey: financeKeys.estimatedBalance(accountId),
    queryFn: async () => {
      const { data } = await financeClient.get<FinanceSuccessResponse<EstimatedBalance>>(
        `/api/v1/accounts/${accountId}/estimated-balance`
      );
      return data.data;
    },
    enabled: !!accountId,
  });
}

export function useAllEstimatedBalances() {
  return useQuery({
    queryKey: financeKeys.allEstimatedBalances(),
    queryFn: async () => {
      const { data } = await financeClient.get<FinanceSuccessResponse<AllEstimatedBalances>>(
        `/api/v1/accounts/estimated-balances/all`
      );
      return data.data;
    },
  });
}

// ============ Transaction Hooks ============

export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: financeKeys.transactions(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.account_id) params.append('account_id', String(filters.account_id));
      if (filters?.direction) params.append('direction', filters.direction);
      if (filters?.category_id) params.append('category_id', String(filters.category_id));
      if (filters?.counterparty) params.append('counterparty', filters.counterparty);
      if (filters?.from) params.append('from', filters.from);
      if (filters?.to) params.append('to', filters.to);
      if (filters?.limit) params.append('limit', String(filters.limit));
      if (filters?.offset) params.append('offset', String(filters.offset));
      const query = params.toString() ? `?${params.toString()}` : '';
      const { data } = await financeClient.get<FinancePaginatedResponse<Transaction>>(
        `/api/v1/transactions${query}`
      );
      return data;
    },
  });
}

export function useTransaction(id: number) {
  return useQuery({
    queryKey: financeKeys.transaction(id),
    queryFn: async () => {
      const { data } = await financeClient.get<FinanceSuccessResponse<Transaction>>(
        `/api/v1/transactions/${id}`
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TransactionCreate) => {
      const { data } = await financeClient.post<FinanceSuccessResponse<TransactionCreateResult>>(
        `/api/v1/transactions`,
        input
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: financeKeys.stats() });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: TransactionUpdate & { id: number }) => {
      const { data } = await financeClient.patch<FinanceSuccessResponse<Transaction>>(
        `/api/v1/transactions/${id}`,
        input
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.transaction(variables.id) });
      queryClient.invalidateQueries({ queryKey: financeKeys.transactions() });
    },
  });
}

// ============ Category Hooks ============

export function useCategories() {
  return useQuery({
    queryKey: financeKeys.categories(),
    queryFn: async () => {
      const { data } = await financeClient.get<FinanceSuccessResponse<Category[]>>(
        `/api/v1/categories`
      );
      return data.data;
    },
  });
}

export function useCategory(id: number) {
  return useQuery({
    queryKey: financeKeys.category(id),
    queryFn: async () => {
      const { data } = await financeClient.get<FinanceSuccessResponse<Category>>(
        `/api/v1/categories/${id}`
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CategoryCreate) => {
      const { data } = await financeClient.post<FinanceSuccessResponse<Category>>(
        `/api/v1/categories`,
        input
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.categories() });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: CategoryUpdate & { id: number }) => {
      const { data } = await financeClient.patch<FinanceSuccessResponse<Category>>(
        `/api/v1/categories/${id}`,
        input
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.category(variables.id) });
      queryClient.invalidateQueries({ queryKey: financeKeys.categories() });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await financeClient.delete(`/api/v1/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.categories() });
    },
  });
}

// ============ Statistics Hooks ============

export function useStatsSummary(filters: StatsFilters) {
  return useQuery({
    queryKey: financeKeys.statsSummary(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('from', filters.from);
      params.append('to', filters.to);
      if (filters.account_id) params.append('account_id', String(filters.account_id));
      if (filters.currency) params.append('currency', filters.currency);
      const { data } = await financeClient.get<FinanceSuccessResponse<StatsSummary>>(
        `/api/v1/stats/summary?${params.toString()}`
      );
      return data.data;
    },
    enabled: !!filters.from && !!filters.to,
  });
}

export function useStatsByCategory(filters: StatsFilters) {
  return useQuery({
    queryKey: financeKeys.statsByCategory(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('from', filters.from);
      params.append('to', filters.to);
      if (filters.account_id) params.append('account_id', String(filters.account_id));
      if (filters.direction) params.append('direction', filters.direction);
      const { data } = await financeClient.get<FinanceSuccessResponse<CategoryStats[]>>(
        `/api/v1/stats/by-category?${params.toString()}`
      );
      return data.data;
    },
    enabled: !!filters.from && !!filters.to,
  });
}

export function useStatsByCounterparty(filters: StatsFilters) {
  return useQuery({
    queryKey: financeKeys.statsByCounterparty(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('from', filters.from);
      params.append('to', filters.to);
      if (filters.account_id) params.append('account_id', String(filters.account_id));
      if (filters.direction) params.append('direction', filters.direction);
      if (filters.limit) params.append('limit', String(filters.limit));
      const { data } = await financeClient.get<FinanceSuccessResponse<CounterpartyStats[]>>(
        `/api/v1/stats/by-counterparty?${params.toString()}`
      );
      return data.data;
    },
    enabled: !!filters.from && !!filters.to,
  });
}

export function useStatsDaily(filters: StatsFilters) {
  return useQuery({
    queryKey: financeKeys.statsDaily(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('from', filters.from);
      params.append('to', filters.to);
      if (filters.account_id) params.append('account_id', String(filters.account_id));
      const { data } = await financeClient.get<FinanceSuccessResponse<DailyStats[]>>(
        `/api/v1/stats/daily?${params.toString()}`
      );
      return data.data;
    },
    enabled: !!filters.from && !!filters.to,
  });
}

// ============ Budget Hooks ============

export function useBudgets(filters: BudgetFilters) {
  return useQuery({
    queryKey: financeKeys.budgets(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('account_id', String(filters.account_id));
      if (filters.active_only !== undefined) params.append('active_only', String(filters.active_only));
      const { data } = await financeClient.get<FinanceSuccessResponse<Budget[]>>(
        `/api/v1/budgets?${params.toString()}`
      );
      return data.data;
    },
    enabled: !!filters.account_id,
  });
}

export function useBudget(id: number) {
  return useQuery({
    queryKey: financeKeys.budget(id),
    queryFn: async () => {
      const { data } = await financeClient.get<FinanceSuccessResponse<Budget>>(
        `/api/v1/budgets/${id}`
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function useBudgetStatus(id: number) {
  return useQuery({
    queryKey: financeKeys.budgetStatus(id),
    queryFn: async () => {
      const { data } = await financeClient.get<FinanceSuccessResponse<BudgetStatus>>(
        `/api/v1/budgets/${id}/status`
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function useBudgetAlerts(accountId: number) {
  return useQuery({
    queryKey: financeKeys.budgetAlerts(accountId),
    queryFn: async () => {
      const { data } = await financeClient.get<FinanceSuccessResponse<BudgetAlert[]>>(
        `/api/v1/budgets/alerts/${accountId}`
      );
      return data.data;
    },
    enabled: !!accountId,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: BudgetCreate) => {
      const { data } = await financeClient.post<FinanceSuccessResponse<Budget>>(
        `/api/v1/budgets`,
        input
      );
      return data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.budgets({ account_id: data.account_id }) });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: BudgetUpdate & { id: number }) => {
      const { data } = await financeClient.patch<FinanceSuccessResponse<Budget>>(
        `/api/v1/budgets/${id}`,
        input
      );
      return data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.budget(variables.id) });
      queryClient.invalidateQueries({ queryKey: financeKeys.budgetStatus(variables.id) });
      queryClient.invalidateQueries({ queryKey: financeKeys.budgets({ account_id: data.account_id }) });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, accountId }: { id: number; accountId: number }) => {
      await financeClient.delete(`/api/v1/budgets/${id}`);
      return { accountId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.budgets({ account_id: result.accountId }) });
    },
  });
}

export function useRecalculateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await financeClient.post<FinanceSuccessResponse<Budget>>(
        `/api/v1/budgets/${id}/recalculate`
      );
      return data.data;
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.budget(id) });
      queryClient.invalidateQueries({ queryKey: financeKeys.budgetStatus(id) });
      queryClient.invalidateQueries({ queryKey: financeKeys.budgets({ account_id: data.account_id }) });
    },
  });
}

export function useRolloverBudgets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await financeClient.post<FinanceSuccessResponse<{ rolled_over_count: number }>>(
        `/api/v1/budgets/rollover`
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
    },
  });
}

// ============ Merchant Hooks ============

export function useMerchants(filters?: MerchantFilters) {
  return useQuery({
    queryKey: financeKeys.merchants(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.order_by) params.append('order_by', filters.order_by);
      if (filters?.limit) params.append('limit', String(filters.limit));
      if (filters?.offset) params.append('offset', String(filters.offset));
      const query = params.toString() ? `?${params.toString()}` : '';
      const { data } = await financeClient.get<FinancePaginatedResponse<MerchantListItem>>(
        `/api/v1/merchants${query}`
      );
      return data;
    },
  });
}

export function useTopMerchants(limit: number = 10, days: number = 30) {
  return useQuery({
    queryKey: financeKeys.topMerchants(limit, days),
    queryFn: async () => {
      const { data } = await financeClient.get<FinanceSuccessResponse<MerchantListItem[]>>(
        `/api/v1/merchants/top?limit=${limit}&days=${days}`
      );
      return data.data;
    },
  });
}

export function useMerchant(id: number) {
  return useQuery({
    queryKey: financeKeys.merchant(id),
    queryFn: async () => {
      const { data } = await financeClient.get<FinanceSuccessResponse<Merchant>>(
        `/api/v1/merchants/${id}`
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function useAddMerchantAlias() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, alias }: { id: number; alias: string }) => {
      const { data } = await financeClient.post<FinanceSuccessResponse<Merchant>>(
        `/api/v1/merchants/${id}/aliases`,
        { alias } as AddAliasRequest
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.merchant(variables.id) });
      queryClient.invalidateQueries({ queryKey: financeKeys.merchants() });
    },
  });
}

export function useRecalculateMerchant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await financeClient.post<FinanceSuccessResponse<Merchant>>(
        `/api/v1/merchants/${id}/recalculate`
      );
      return data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.merchant(id) });
      queryClient.invalidateQueries({ queryKey: financeKeys.merchants() });
    },
  });
}

export function useRecalculateAllMerchants() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await financeClient.post<FinanceSuccessResponse<{ updated_count: number }>>(
        `/api/v1/merchants/recalculate-all`
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.merchants() });
    },
  });
}

// ============ Transaction Analysis Hooks ============

export function useTransactionAnalysis(transactionId: number) {
  return useQuery({
    queryKey: financeKeys.transactionAnalysis(transactionId),
    queryFn: async () => {
      const { data } = await financeClient.get<FinanceSuccessResponse<TransactionAnalysis | null>>(
        `/api/v1/transactions/${transactionId}/analysis`
      );
      return data.data;
    },
    enabled: !!transactionId,
  });
}

export function useAnalyzeTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transactionId: number) => {
      const { data } = await financeClient.post<FinanceSuccessResponse<TransactionAnalysis>>(
        `/api/v1/transactions/${transactionId}/analyze`
      );
      return data.data;
    },
    onSuccess: (_, transactionId) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.transactionAnalysis(transactionId) });
      queryClient.invalidateQueries({ queryKey: financeKeys.transaction(transactionId) });
    },
  });
}

export function useAnalyzeBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: BatchAnalyzeRequest) => {
      const { data } = await financeClient.post<FinanceSuccessResponse<BatchAnalyzeResponse>>(
        `/api/v1/transactions/analyze-batch`,
        request
      );
      return data.data;
    },
    onSuccess: (_, request) => {
      // Invalidate all transaction analysis queries for the batch
      request.transaction_ids.forEach(id => {
        queryClient.invalidateQueries({ queryKey: financeKeys.transactionAnalysis(id) });
      });
      queryClient.invalidateQueries({ queryKey: financeKeys.transactions() });
    },
  });
}

// ============ Trend Hooks ============

export function useSpendingTrends(filters: TrendFilters) {
  return useQuery({
    queryKey: financeKeys.spendingTrends(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('account_id', String(filters.account_id));
      if (filters.period) params.append('period', filters.period);
      const { data } = await financeClient.get<FinanceSuccessResponse<SpendingTrend>>(
        `/api/v1/stats/trends?${params.toString()}`
      );
      return data.data;
    },
    enabled: !!filters.account_id,
  });
}

export function useTrendSummary(filters: TrendFilters) {
  return useQuery({
    queryKey: financeKeys.trendSummary(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('account_id', String(filters.account_id));
      if (filters.period) params.append('period', filters.period);
      const { data } = await financeClient.get<FinanceSuccessResponse<string>>(
        `/api/v1/stats/trends/summary?${params.toString()}`
      );
      return data.data;
    },
    enabled: !!filters.account_id,
  });
}

export function useCreateTrendSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (filters: TrendFilters) => {
      const params = new URLSearchParams();
      params.append('account_id', String(filters.account_id));
      if (filters.period) params.append('period', filters.period);
      const { data } = await financeClient.post<FinanceSuccessResponse<TrendSnapshot>>(
        `/api/v1/stats/trends/snapshot?${params.toString()}`
      );
      return data.data;
    },
    onSuccess: (_, filters) => {
      queryClient.invalidateQueries({ queryKey: financeKeys.spendingTrends(filters) });
    },
  });
}
