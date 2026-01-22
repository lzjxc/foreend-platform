/**
 * Form filling types for template-based form auto-fill functionality.
 */

/**
 * Single field definition within a template.
 */
export interface TemplateFieldDefinition {
  name: string;
  label: string;
  source: string;
  required: boolean;
  field_type: 'text' | 'date' | 'number' | 'select' | 'textarea';
  options?: string[];
  format?: string;
  description?: string;
}

/**
 * Template summary for list view.
 */
export interface TemplateListItem {
  id: string;
  name: string;
  description: string | null;
  category: 'travel' | 'finance' | 'education' | 'insurance';
  field_count: number;
  version: string;
  is_active: boolean;
}

/**
 * Full template details including field definitions.
 */
export interface Template {
  id: string;
  name: string;
  description: string | null;
  category: 'travel' | 'finance' | 'education' | 'insurance';
  fields: TemplateFieldDefinition[];
  version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Request to fill a template with person data.
 */
export interface FillTemplateRequest {
  person_id: string;
  document_types?: Record<string, string>;
}

/**
 * A single filled field in the response.
 */
export interface FilledField {
  name: string;
  label: string;
  value: string | number | boolean | null;
  source: string;
  filled: boolean;
  error: string | null;
}

/**
 * Response from filling a template.
 */
export interface FillTemplateResponse {
  template_id: string;
  template_name: string;
  person_id: string;
  person_name: string;
  filled_fields: FilledField[];
  fill_rate: number;
  filled_at: string;
}

/**
 * API response wrapper.
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * Category labels in Chinese.
 */
export const CATEGORY_LABELS: Record<string, string> = {
  travel: '出行',
  finance: '金融',
  education: '教育',
  insurance: '保险',
};

/**
 * Category colors for badges.
 */
export const CATEGORY_COLORS: Record<string, string> = {
  travel: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  finance: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  education: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  insurance: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};
