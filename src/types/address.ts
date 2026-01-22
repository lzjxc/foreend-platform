// Address (地址) types

export type AddressType =
  | 'home'          // 家庭住址
  | 'work'          // 工作地址
  | 'school'        // 学校地址
  | 'registered'    // 户籍地址
  | 'mailing'       // 邮寄地址
  | 'temporary'     // 临时住址
  | 'other';        // 其他

export interface Address {
  id: string;
  person_id: string;
  type: AddressType;
  country: string;
  province: string;
  city: string;
  district?: string;
  street: string;
  postal_code?: string;
  is_primary: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AddressCreate {
  person_id: string;
  type: AddressType;
  country: string;
  province: string;
  city: string;
  district?: string;
  street: string;
  postal_code?: string;
  is_primary?: boolean;
  notes?: string;
}

export interface AddressUpdate {
  type?: AddressType;
  country?: string;
  province?: string;
  city?: string;
  district?: string;
  street?: string;
  postal_code?: string;
  is_primary?: boolean;
  notes?: string;
}

// Address type options for dropdown
export const ADDRESS_TYPE_OPTIONS = [
  { value: 'home', label: '家庭住址' },
  { value: 'work', label: '工作地址' },
  { value: 'school', label: '学校地址' },
  { value: 'registered', label: '户籍地址' },
  { value: 'mailing', label: '邮寄地址' },
  { value: 'temporary', label: '临时住址' },
  { value: 'other', label: '其他' },
] as const;

// Helper function to format full address
export function formatFullAddress(address: Address): string {
  const parts = [
    address.country,
    address.province,
    address.city,
    address.district,
    address.street,
  ].filter(Boolean);
  return parts.join(' ');
}

// Common provinces in China
export const CHINA_PROVINCES = [
  '北京市', '天津市', '上海市', '重庆市',
  '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
  '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省',
  '河南省', '湖北省', '湖南省', '广东省', '海南省',
  '四川省', '贵州省', '云南省', '陕西省', '甘肃省',
  '青海省', '台湾省',
  '内蒙古自治区', '广西壮族自治区', '西藏自治区',
  '宁夏回族自治区', '新疆维吾尔自治区',
  '香港特别行政区', '澳门特别行政区',
] as const;
