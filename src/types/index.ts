// Re-export all types from a single entry point

export * from './person';
export * from './document';
export * from './address';
export * from './contact';
export * from './bank-account';
export * from './medical';

// Common utility types
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface PersonLinkedEntity extends BaseEntity {
  person_id: string;
}

// Dashboard statistics type
export interface DashboardStats {
  total_persons: number;
  total_documents: number;
  total_addresses: number;
  total_bank_accounts: number;
  expiring_documents: number;
  expired_documents: number;
}

// Audit log type (for tracking changes)
export interface AuditLog {
  id: string;
  entity_type: 'person' | 'document' | 'address' | 'contact' | 'bank_account' | 'medical';
  entity_id: string;
  action: 'create' | 'update' | 'delete' | 'view';
  changes?: Record<string, { old: unknown; new: unknown }>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
