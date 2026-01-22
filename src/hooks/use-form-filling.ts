/**
 * React Query hooks for form filling functionality.
 */

import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import type {
  ApiResponse,
  FillTemplateRequest,
  FillTemplateResponse,
  Template,
  TemplateListItem,
} from '@/types/form-filling';

// Personal Info API base URL (via vite proxy)
const PERSONAL_API_URL = '/personal-api';

// Service headers required by the backend
const SERVICE_HEADERS = {
  'X-Service-ID': import.meta.env.VITE_SERVICE_ID || 'personal-info-frontend',
  'X-Service-Token': import.meta.env.VITE_SERVICE_TOKEN,
};

// Query keys factory
export const formFillingKeys = {
  all: ['form-filling'] as const,
  templates: () => [...formFillingKeys.all, 'templates'] as const,
  template: (id: string) => [...formFillingKeys.all, 'template', id] as const,
  fill: (templateId: string, personId: string) =>
    [...formFillingKeys.all, 'fill', templateId, personId] as const,
};

/**
 * Fetch all form templates.
 */
export function useTemplates(category?: string) {
  return useQuery({
    queryKey: [...formFillingKeys.templates(), category],
    queryFn: async (): Promise<TemplateListItem[]> => {
      const params = new URLSearchParams();
      if (category) {
        params.append('category', category);
      }
      params.append('active_only', 'true');

      const { data } = await axios.get<ApiResponse<TemplateListItem[]>>(
        `${PERSONAL_API_URL}/api/v1/templates?${params.toString()}`,
        { headers: SERVICE_HEADERS }
      );

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch templates');
      }

      return data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch a single template by ID.
 */
export function useTemplate(templateId: string) {
  return useQuery({
    queryKey: formFillingKeys.template(templateId),
    queryFn: async (): Promise<Template> => {
      const { data } = await axios.get<ApiResponse<Template>>(
        `${PERSONAL_API_URL}/api/v1/templates/${templateId}`,
        { headers: SERVICE_HEADERS }
      );

      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch template');
      }

      return data.data;
    },
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fill a template with person data.
 */
export function useFillTemplate() {
  return useMutation({
    mutationFn: async ({
      templateId,
      personId,
      documentTypes,
    }: {
      templateId: string;
      personId: string;
      documentTypes?: Record<string, string>;
    }): Promise<FillTemplateResponse> => {
      const request: FillTemplateRequest = {
        person_id: personId,
        document_types: documentTypes,
      };

      const { data } = await axios.post<ApiResponse<FillTemplateResponse>>(
        `${PERSONAL_API_URL}/api/v1/templates/${templateId}/fill`,
        request,
        { headers: SERVICE_HEADERS }
      );

      if (!data.success) {
        throw new Error(data.message || 'Failed to fill template');
      }

      return data.data;
    },
  });
}
