// Person (家庭成员) types

export interface Person {
  id: string;
  name: string;
  nickname?: string;
  gender: 'male' | 'female' | 'other';
  birth_date?: string;
  relationship: string;
  avatar_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PersonCreate {
  name: string;
  nickname?: string;
  gender: 'male' | 'female' | 'other';
  birth_date?: string;
  relationship: string;
  avatar_url?: string;
  notes?: string;
}

export interface PersonUpdate {
  name?: string;
  nickname?: string;
  gender?: 'male' | 'female' | 'other';
  birth_date?: string;
  relationship?: string;
  avatar_url?: string;
  notes?: string;
}

// Relationship options for dropdown
export const RELATIONSHIP_OPTIONS = [
  { value: 'self', label: '本人' },
  { value: 'spouse', label: '配偶' },
  { value: 'father', label: '父亲' },
  { value: 'mother', label: '母亲' },
  { value: 'son', label: '儿子' },
  { value: 'daughter', label: '女儿' },
  { value: 'brother', label: '兄弟' },
  { value: 'sister', label: '姐妹' },
  { value: 'grandfather', label: '祖父/外祖父' },
  { value: 'grandmother', label: '祖母/外祖母' },
  { value: 'other', label: '其他' },
] as const;

export const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' },
] as const;
