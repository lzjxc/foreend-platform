import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type {
  ServiceInfo,
  ServiceListResponse,
  ServiceHealthResponse,
  CatalogHealthResponse,
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
