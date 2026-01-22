// Medical (医疗信息) types

export type BloodType = 'A' | 'B' | 'AB' | 'O' | 'unknown';
export type RhFactor = 'positive' | 'negative' | 'unknown';

export interface MedicalInfo {
  id: string;
  person_id: string;
  blood_type?: BloodType;
  rh_factor?: RhFactor;
  height_cm?: number;
  weight_kg?: number;
  allergies?: string[];
  chronic_conditions?: string[];
  medications?: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  primary_hospital?: string;
  medical_insurance_number?: string;  // 医保号 (敏感)
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicalInfoCreate {
  person_id: string;
  blood_type?: BloodType;
  rh_factor?: RhFactor;
  height_cm?: number;
  weight_kg?: number;
  allergies?: string[];
  chronic_conditions?: string[];
  medications?: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  primary_hospital?: string;
  medical_insurance_number?: string;
  notes?: string;
}

export interface MedicalInfoUpdate {
  blood_type?: BloodType;
  rh_factor?: RhFactor;
  height_cm?: number;
  weight_kg?: number;
  allergies?: string[];
  chronic_conditions?: string[];
  medications?: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  primary_hospital?: string;
  medical_insurance_number?: string;
  notes?: string;
}

// Blood type options
export const BLOOD_TYPE_OPTIONS = [
  { value: 'A', label: 'A型' },
  { value: 'B', label: 'B型' },
  { value: 'AB', label: 'AB型' },
  { value: 'O', label: 'O型' },
  { value: 'unknown', label: '未知' },
] as const;

// Rh factor options
export const RH_FACTOR_OPTIONS = [
  { value: 'positive', label: 'Rh阳性 (+)' },
  { value: 'negative', label: 'Rh阴性 (-)' },
  { value: 'unknown', label: '未知' },
] as const;

// Common allergies (for autocomplete)
export const COMMON_ALLERGIES = [
  '青霉素',
  '头孢类',
  '磺胺类',
  '阿司匹林',
  '花粉',
  '尘螨',
  '海鲜',
  '坚果',
  '牛奶',
  '鸡蛋',
  '小麦',
  '大豆',
  '乳胶',
  '蜂毒',
] as const;

// Common chronic conditions (for autocomplete)
export const COMMON_CONDITIONS = [
  '高血压',
  '糖尿病',
  '心脏病',
  '哮喘',
  '甲状腺疾病',
  '关节炎',
  '抑郁症',
  '焦虑症',
  '胃溃疡',
  '肝炎',
  '肾病',
  '贫血',
] as const;

// Helper function to format blood type display
export function formatBloodType(bloodType?: BloodType, rhFactor?: RhFactor): string {
  if (!bloodType || bloodType === 'unknown') return '未知';
  let result = bloodType + '型';
  if (rhFactor && rhFactor !== 'unknown') {
    result += rhFactor === 'positive' ? ' Rh+' : ' Rh-';
  }
  return result;
}

// Helper function to calculate BMI
export function calculateBMI(heightCm?: number, weightKg?: number): number | null {
  if (!heightCm || !weightKg) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

// Helper function to get BMI category
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return '偏瘦';
  if (bmi < 24) return '正常';
  if (bmi < 28) return '偏胖';
  return '肥胖';
}
