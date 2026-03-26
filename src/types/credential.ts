// Web credential types for account/password storage

export interface WebCredential {
  id: string;
  person_id: string;
  credential_key: string;
  site_name: string;
  site_url?: string | null;
  category?: string | null;
  username: string;
  password: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebCredentialCreate {
  credential_key: string;
  site_name: string;
  site_url?: string | null;
  category?: string | null;
  notes?: string | null;
  username: string;
  password: string;
}

export interface WebCredentialUpdate {
  credential_key?: string | null;
  site_name?: string | null;
  site_url?: string | null;
  username?: string | null;
  password?: string | null;
  category?: string | null;
  notes?: string | null;
}

// Category options for credentials
export const CREDENTIAL_CATEGORY_OPTIONS = [
  { value: 'housing', label: '住房' },
  { value: 'finance', label: '金融' },
  { value: 'government', label: '政府' },
  { value: 'education', label: '教育' },
  { value: 'healthcare', label: '医疗' },
  { value: 'shopping', label: '购物' },
  { value: 'social', label: '社交' },
  { value: 'work', label: '工作' },
  { value: 'utility', label: '水电煤' },
  { value: 'insurance', label: '保险' },
  { value: 'travel', label: '旅行' },
  { value: 'other', label: '其他' },
] as const;

export const CREDENTIAL_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CREDENTIAL_CATEGORY_OPTIONS.map((opt) => [opt.value, opt.label])
);

// Mask password for display
export function maskPassword(password: string): string {
  if (!password) return '';
  return '*'.repeat(Math.min(password.length, 12));
}
