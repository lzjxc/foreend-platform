// Bank Account (银行账户) types

export type BankAccountType =
  | 'savings'       // 储蓄卡
  | 'checking'      // 活期账户
  | 'credit'        // 信用卡
  | 'debit'         // 借记卡
  | 'business'      // 对公账户
  | 'other';        // 其他

export interface BankAccount {
  id: string;
  person_id: string;
  bank_name: string;
  account_type: BankAccountType;
  account_number: string;     // 账号 (敏感)
  card_number?: string;       // 卡号 (敏感)
  branch_name?: string;       // 开户支行
  swift_code?: string;        // SWIFT代码
  is_primary: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BankAccountCreate {
  person_id: string;
  bank_name: string;
  account_type: BankAccountType;
  account_number: string;
  card_number?: string;
  branch_name?: string;
  swift_code?: string;
  is_primary?: boolean;
  notes?: string;
}

export interface BankAccountUpdate {
  bank_name?: string;
  account_type?: BankAccountType;
  account_number?: string;
  card_number?: string;
  branch_name?: string;
  swift_code?: string;
  is_primary?: boolean;
  notes?: string;
}

// Bank account type options for dropdown
export const BANK_ACCOUNT_TYPE_OPTIONS = [
  { value: 'savings', label: '储蓄卡' },
  { value: 'checking', label: '活期账户' },
  { value: 'credit', label: '信用卡' },
  { value: 'debit', label: '借记卡' },
  { value: 'business', label: '对公账户' },
  { value: 'other', label: '其他' },
] as const;

// Common banks in China
export const CHINA_BANKS = [
  '中国工商银行',
  '中国建设银行',
  '中国银行',
  '中国农业银行',
  '交通银行',
  '招商银行',
  '中信银行',
  '浦发银行',
  '民生银行',
  '兴业银行',
  '光大银行',
  '华夏银行',
  '广发银行',
  '平安银行',
  '北京银行',
  '上海银行',
  '邮政储蓄银行',
  '其他',
] as const;

// Helper function to mask account/card number
export function maskBankNumber(number: string): string {
  if (number.length <= 4) return '****';
  // Show only last 4 digits: **** **** **** 1234
  const masked = '*'.repeat(number.length - 4);
  const groups = [];
  for (let i = 0; i < masked.length; i += 4) {
    groups.push(masked.slice(i, i + 4));
  }
  groups.push(number.slice(-4));
  return groups.join(' ');
}

// Helper function to format bank card number for display
export function formatBankNumber(number: string): string {
  // Format as: 6222 0200 0000 1234
  const cleaned = number.replace(/\s/g, '');
  const groups = [];
  for (let i = 0; i < cleaned.length; i += 4) {
    groups.push(cleaned.slice(i, i + 4));
  }
  return groups.join(' ');
}
