import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type {
  ServiceInfo,
  ServiceListResponse,
  ServiceHealthResponse,
  CatalogHealthResponse,
  LLMConfigItem,
  LLMConfigListResponse,
  LLMConfigUpdate,
  LLMConfigUpdateResponse,
} from '@/types/config-service';

// Config Service API base URL (via vite proxy)
const CONFIG_SERVICE_URL = '/config-api';

// Query keys
export const configServiceKeys = {
  all: ['config-service'] as const,
  services: () => [...configServiceKeys.all, 'services'] as const,
  service: (id: string) => [...configServiceKeys.all, 'service', id] as const,
  health: (id: string) => [...configServiceKeys.all, 'health', id] as const,
  catalogHealth: () => [...configServiceKeys.all, 'catalog-health'] as const,
  llmConfigs: () => [...configServiceKeys.all, 'llm-configs'] as const,
  llmConfig: (id: string) => [...configServiceKeys.all, 'llm-config', id] as const,
};

// Fetch all services
export function useServices() {
  return useQuery({
    queryKey: configServiceKeys.services(),
    queryFn: async (): Promise<ServiceInfo[]> => {
      const { data } = await axios.get<ServiceListResponse>(
        `${CONFIG_SERVICE_URL}/api/v1/services`
      );
      return data.services;
    },
    staleTime: 60_000, // 1 minute
  });
}

// Fetch single service
export function useService(serviceId: string) {
  return useQuery({
    queryKey: configServiceKeys.service(serviceId),
    queryFn: async (): Promise<ServiceInfo> => {
      const { data } = await axios.get<ServiceInfo>(
        `${CONFIG_SERVICE_URL}/api/v1/services/${serviceId}`
      );
      return data;
    },
    enabled: !!serviceId,
    staleTime: 60_000,
  });
}

// Fetch service health
export function useServiceHealth(serviceId: string) {
  return useQuery({
    queryKey: configServiceKeys.health(serviceId),
    queryFn: async (): Promise<ServiceHealthResponse> => {
      const { data } = await axios.get<ServiceHealthResponse>(
        `${CONFIG_SERVICE_URL}/api/v1/services/${serviceId}/health`
      );
      return data;
    },
    enabled: !!serviceId,
    staleTime: 30_000, // 30 seconds
  });
}

// Fetch all services health
export function useCatalogHealth() {
  return useQuery({
    queryKey: configServiceKeys.catalogHealth(),
    queryFn: async (): Promise<CatalogHealthResponse> => {
      const { data } = await axios.get<CatalogHealthResponse>(
        `${CONFIG_SERVICE_URL}/api/v1/catalog/health`
      );
      return data;
    },
    staleTime: 30_000,
  });
}

// Fetch LLM configs for all services, merged with policy modes from llm-policies
export function useLLMConfigs(hasLlm: boolean = true) {
  return useQuery({
    queryKey: configServiceKeys.llmConfigs(),
    queryFn: async (): Promise<LLMConfigItem[]> => {
      const [configResp, policiesResp] = await Promise.all([
        axios.get<LLMConfigListResponse>(
          `${CONFIG_SERVICE_URL}/api/v1/config/llm`,
          { params: { has_llm: hasLlm } }
        ),
        axios.get<Array<{ id: string; llm_policy_mode?: string }>>(
          `${CONFIG_SERVICE_URL}/api/v1/llm-policies`
        ).catch(() => ({ data: [] as Array<{ id: string; llm_policy_mode?: string }> })),
      ]);

      // Build policy mode map
      const policyMap = new Map<string, string>();
      for (const p of policiesResp.data) {
        if (p.id && p.llm_policy_mode) {
          policyMap.set(p.id, p.llm_policy_mode);
        }
      }

      // Merge policy mode into configs
      return configResp.data.configs.map(c => ({
        ...c,
        llm_policy_mode: (policyMap.get(c.service_id) as LLMConfigItem['llm_policy_mode']) || c.llm_policy_mode,
      }));
    },
    staleTime: 60_000,
  });
}

// Update LLM config for a service
export function useUpdateLLMConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId, update }: { serviceId: string; update: LLMConfigUpdate }) => {
      const { data } = await axios.patch<LLMConfigUpdateResponse>(
        `${CONFIG_SERVICE_URL}/api/v1/config/llm/${serviceId}`,
        update,
        { headers: { 'X-API-Key': 'VfSEn5dBWdl97BeLkDr2d0AZSqKV7QkOjqa3kjXqTWk' } }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configServiceKeys.llmConfigs() });
    },
  });
}

// Fetch service OpenAPI spec
export async function fetchServiceOpenAPI(serviceId: string): Promise<object | null> {
  try {
    const { data } = await axios.get(
      `${CONFIG_SERVICE_URL}/api/v1/services/${serviceId}/openapi`
    );
    return data;
  } catch {
    return null;
  }
}
