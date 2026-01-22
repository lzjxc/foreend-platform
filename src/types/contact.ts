// Contact (联系方式) types

export type ContactType =
  | 'mobile'        // 手机号
  | 'phone'         // 固定电话
  | 'email'         // 电子邮箱
  | 'wechat'        // 微信
  | 'qq'            // QQ
  | 'weibo'         // 微博
  | 'emergency'     // 紧急联系人
  | 'work'          // 工作电话
  | 'other';        // 其他

export interface Contact {
  id: string;
  person_id: string;
  type: ContactType;
  value: string;          // 联系方式的值
  label?: string;         // 自定义标签
  is_primary: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactCreate {
  person_id: string;
  type: ContactType;
  value: string;
  label?: string;
  is_primary?: boolean;
  notes?: string;
}

export interface ContactUpdate {
  type?: ContactType;
  value?: string;
  label?: string;
  is_primary?: boolean;
  notes?: string;
}

// Contact type options for dropdown
export const CONTACT_TYPE_OPTIONS = [
  { value: 'mobile', label: '手机号' },
  { value: 'phone', label: '固定电话' },
  { value: 'email', label: '电子邮箱' },
  { value: 'wechat', label: '微信' },
  { value: 'qq', label: 'QQ' },
  { value: 'weibo', label: '微博' },
  { value: 'emergency', label: '紧急联系人' },
  { value: 'work', label: '工作电话' },
  { value: 'other', label: '其他' },
] as const;

// Helper function to mask phone number
export function maskPhoneNumber(phone: string): string {
  if (phone.length < 7) return phone;
  // For Chinese mobile: 138****1234
  if (phone.length === 11) {
    return phone.slice(0, 3) + '****' + phone.slice(-4);
  }
  // For other formats
  const visibleStart = 3;
  const visibleEnd = 4;
  const masked = '*'.repeat(phone.length - visibleStart - visibleEnd);
  return phone.slice(0, visibleStart) + masked + phone.slice(-visibleEnd);
}

// Helper function to mask email
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  if (local.length <= 2) return '*'.repeat(local.length) + '@' + domain;
  return local.slice(0, 2) + '*'.repeat(local.length - 2) + '@' + domain;
}
