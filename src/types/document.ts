// Document (证件) types

export type DocumentType =
  | 'id_card'           // 身份证
  | 'passport'          // 护照
  | 'driver_license'    // 驾驶证
  | 'birth_certificate' // 出生证明
  | 'household_register'// 户口本
  | 'social_security'   // 社保卡
  | 'medical_insurance' // 医保卡
  | 'student_id'        // 学生证
  | 'work_permit'       // 工作证
  | 'residence_permit'  // 居住证
  | 'other';            // 其他

export interface Document {
  id: string;
  person_id: string;
  type: DocumentType;
  number: string;           // 证件号码 (敏感)
  issue_date?: string;      // 签发日期
  expiry_date?: string;     // 过期日期
  issuing_authority?: string; // 签发机关
  front_image_url?: string; // 正面照片
  back_image_url?: string;  // 背面照片
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentCreate {
  person_id: string;
  type: DocumentType;
  number: string;
  issue_date?: string;
  expiry_date?: string;
  issuing_authority?: string;
  front_image_url?: string;
  back_image_url?: string;
  notes?: string;
}

export interface DocumentUpdate {
  type?: DocumentType;
  number?: string;
  issue_date?: string;
  expiry_date?: string;
  issuing_authority?: string;
  front_image_url?: string;
  back_image_url?: string;
  notes?: string;
}

// Document type options for dropdown
export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'id_card', label: '身份证' },
  { value: 'passport', label: '护照' },
  { value: 'driver_license', label: '驾驶证' },
  { value: 'birth_certificate', label: '出生证明' },
  { value: 'household_register', label: '户口本' },
  { value: 'social_security', label: '社保卡' },
  { value: 'medical_insurance', label: '医保卡' },
  { value: 'student_id', label: '学生证' },
  { value: 'work_permit', label: '工作证' },
  { value: 'residence_permit', label: '居住证' },
  { value: 'other', label: '其他' },
] as const;

// Helper function to check if document is expiring soon (within days)
export function isExpiringSoon(expiryDate: string | undefined, days: number = 90): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 && diffDays <= days;
}

// Helper function to check if document is expired
export function isExpired(expiryDate: string | undefined): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
}

// Helper function to mask document number
export function maskDocumentNumber(number: string | undefined | null): string {
  if (!number) return '****';
  if (number.length <= 4) return '****';
  return '*'.repeat(number.length - 4) + number.slice(-4);
}
