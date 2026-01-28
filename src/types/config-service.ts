// Config Service API types

export type ServiceLayer = 'infra' | 'shared' | 'business' | 'sensitive';
export type ServiceStatus = 'active' | 'deprecated' | 'maintenance';

export interface ServiceInfo {
  id: string;
  name: string;
  description: string | null;
  namespace: string;
  service_name: string;
  port: string;
  internal_url: string;
  tailscale_url: string | null;
  tailscale_hostname: string | null;
  tailscale_protocol: string;
  layer: ServiceLayer;
  status: ServiceStatus;
  health_endpoint: string;
  openapi_endpoint: string | null;
  docs_endpoint: string | null;
  openapi_url: string | null;
  docs_url: string | null;
  owner: string | null;
  repo_url: string | null;
  tags: string[];
  dependencies: string[];
  created_at: string;
  updated_at: string | null;
}

export interface ServiceListResponse {
  services: ServiceInfo[];
}

export interface ServiceHealthResponse {
  service_id: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  response_time_ms: number | null;
  checked_at: string;
  error: string | null;
}

// Catalog health API response uses different field names
export interface CatalogHealthServiceItem {
  id: string;
  name: string;
  layer: ServiceLayer;
  status: 'healthy' | 'unhealthy' | 'unknown';
  response_time_ms: number | null;
  url: string;
}

export interface CatalogHealthResponse {
  checked_at: string;
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
  };
  services: CatalogHealthServiceItem[];
}

export interface ServiceDependency {
  service_id: string;
  dependencies: string[];
  dependents: string[];
}

export interface DependenciesResponse {
  services: ServiceDependency[];
}

// Layer display config
export const LAYER_CONFIG: Record<ServiceLayer, { name: string; icon: string; color: string }> = {
  infra: { name: '基础设施', icon: '🏗️', color: 'text-purple-600 bg-purple-100' },
  shared: { name: '共享服务', icon: '🔧', color: 'text-blue-600 bg-blue-100' },
  business: { name: '业务服务', icon: '💼', color: 'text-green-600 bg-green-100' },
  sensitive: { name: '敏感数据', icon: '🔒', color: 'text-red-600 bg-red-100' },
};

export const STATUS_CONFIG: Record<ServiceStatus, { name: string; color: string }> = {
  active: { name: '运行中', color: 'text-green-600 bg-green-100' },
  deprecated: { name: '已弃用', color: 'text-yellow-600 bg-yellow-100' },
  maintenance: { name: '维护中', color: 'text-orange-600 bg-orange-100' },
};
