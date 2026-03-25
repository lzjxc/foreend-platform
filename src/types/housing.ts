// Housing Management Types — mirrors backend app/housing/models.py + db_models.py

import type { PaginatedResponse } from './life-app';

export type { PaginatedResponse };

// --- Enums ---

export type PropertyType = 'apartment' | 'house' | 'studio' | 'room' | 'other';
export type TenancyStatus = 'draft' | 'active' | 'ended';
export type UtilityType = 'electricity' | 'gas' | 'water' | 'internet' | 'council_tax' | 'other';
export type HousingDocumentType = 'contract' | 'epc' | 'gas_safety' | 'how_to_rent' | 'inventory' | 'deposit_cert' | 'other';
export type MatchType = 'auto' | 'manual';

// --- Property ---

export interface Property {
  id: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postcode: string;
  country: string;
  property_type: PropertyType;
  bedrooms: number | null;
  bathrooms: number | null;
  notes: string | null;
  tenancies: Tenancy[];
  created_at: string;
  updated_at: string;
}

export interface PropertyCreate {
  address_line1: string;
  address_line2?: string;
  city: string;
  postcode: string;
  country?: string;
  property_type?: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  notes?: string;
}

export interface PropertyUpdate extends Partial<PropertyCreate> {}

// --- Tenancy ---

export interface Tenancy {
  id: string;
  property_id: string;
  status: TenancyStatus;
  landlord_name: string | null;
  landlord_contact: string | null;
  agent_name: string | null;
  agent_contact: string | null;
  agent_email: string | null;
  rent_pcm: number | null;
  deposit_amount: number | null;
  deposit_scheme: string | null;
  start_date: string | null;
  end_date: string | null;
  contract_signed_date: string | null;
  email_keywords: string[];
  notes: string | null;
  utilities: Utility[];
  documents: HousingDocument[];
  email_links: EmailLink[];
  created_at: string;
  updated_at: string;
}

export interface TenancyCreate {
  property_id: string;
  status?: TenancyStatus;
  landlord_name?: string;
  landlord_contact?: string;
  agent_name?: string;
  agent_contact?: string;
  agent_email?: string;
  rent_pcm?: number;
  deposit_amount?: number;
  deposit_scheme?: string;
  start_date?: string;
  end_date?: string;
  contract_signed_date?: string;
  email_keywords?: string[];
  notes?: string;
}

export interface TenancyUpdate extends Partial<Omit<TenancyCreate, 'property_id'>> {}

// --- Utility ---

export interface Utility {
  id: string;
  tenancy_id: string;
  type: UtilityType;
  provider: string;
  account_number: string | null;
  monthly_cost: number | null;
  contact_info: string | null;
  email_keywords: string[];
  notes: string | null;
  bills: Bill[];
  created_at: string;
  updated_at: string;
}

export interface UtilityCreate {
  type: UtilityType;
  provider: string;
  account_number?: string;
  monthly_cost?: number;
  contact_info?: string;
  email_keywords?: string[];
  notes?: string;
}

export interface UtilityUpdate extends Partial<UtilityCreate> {}

// --- Bill ---

export interface Bill {
  id: string;
  utility_id: string;
  amount: number;
  period_start: string | null;
  period_end: string | null;
  due_date: string | null;
  paid: boolean;
  paid_date: string | null;
  source_email_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillCreate {
  amount: number;
  period_start?: string;
  period_end?: string;
  due_date?: string;
  paid?: boolean;
  paid_date?: string;
  notes?: string;
}

export interface BillUpdate extends Partial<BillCreate> {}

// --- Document ---

export interface HousingDocument {
  id: string;
  tenancy_id: string;
  type: HousingDocumentType;
  name: string;
  minio_bucket: string;
  minio_key: string;
  file_size: number;
  content_type: string;
  source_email_id: string | null;
  uploaded_at: string;
  updated_at: string;
  notes: string | null;
}

// --- EmailLink ---

export interface EmailLink {
  id: string;
  tenancy_id: string;
  utility_id: string | null;
  email_id: string;
  email_subject: string;
  email_from: string;
  email_date: string;
  match_type: MatchType;
  matched_keyword: string | null;
  created_at: string;
}

// --- API Results ---

export interface EmailSyncResult {
  matched: number;
  new_links: number;
  skipped_duplicates: number;
}

export interface InitFromEmailResult {
  property: Property;
  tenancy: Tenancy;
}

// --- Display Helpers ---

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: 'Apartment',
  house: 'House',
  studio: 'Studio',
  room: 'Room',
  other: 'Other',
};

export const TENANCY_STATUS_LABELS: Record<TenancyStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  ended: 'Ended',
};

export const UTILITY_TYPE_LABELS: Record<UtilityType, string> = {
  electricity: 'Electricity',
  gas: 'Gas',
  water: 'Water',
  internet: 'Internet',
  council_tax: 'Council Tax',
  other: 'Other',
};

export const UTILITY_TYPE_ICONS: Record<UtilityType, string> = {
  electricity: '⚡',
  gas: '🔥',
  water: '💧',
  internet: '🌐',
  council_tax: '🏛',
  other: '📦',
};

export const DOCUMENT_TYPE_LABELS: Record<HousingDocumentType, string> = {
  contract: 'Tenancy Agreement',
  epc: 'EPC Certificate',
  gas_safety: 'Gas Safety',
  how_to_rent: 'How to Rent',
  inventory: 'Inventory',
  deposit_cert: 'Deposit Certificate',
  other: 'Other',
};

export const DOCUMENT_TYPE_ICONS: Record<HousingDocumentType, string> = {
  contract: '📑',
  epc: '🏠',
  gas_safety: '🔥',
  how_to_rent: '📖',
  inventory: '📋',
  deposit_cert: '🔒',
  other: '📄',
};
