import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
  Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useServices, useCatalogHealth } from '@/hooks/use-config-service';
import type { ServiceInfo, ServiceLayer } from '@/types/config-service';
import { LAYER_CONFIG, STATUS_CONFIG } from '@/types/config-service';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

// Custom node component - using Record<string, unknown> for React Flow compatibility
interface ServiceNodeData extends Record<string, unknown> {
  label: string;
  description: string | null;
  layer: ServiceLayer;
  status: string;
  healthStatus?: 'healthy' | 'unhealthy' | 'unknown';
  service: ServiceInfo;
}

function ServiceNode({ data }: { data: ServiceNodeData }) {
  const layerConfig = LAYER_CONFIG[data.layer];
  const statusConfig = STATUS_CONFIG[data.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.active;

  const getHealthIcon = () => {
    switch (data.healthStatus) {
      case 'healthy':
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'unhealthy':
        return <XCircle className="h-3 w-3 text-red-500" />;
      default:
        return <AlertCircle className="h-3 w-3 text-gray-400" />;
    }
  };

  const getBorderColor = () => {
    switch (data.healthStatus) {
      case 'healthy':
        return 'border-green-400';
      case 'unhealthy':
        return 'border-red-400';
      default:
        return 'border-gray-300';
    }
  };

  return (
    <div
      className={`px-3 py-2 rounded-lg border-2 bg-card shadow-sm min-w-[140px] ${getBorderColor()}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{layerConfig.icon}</span>
        <span className="text-xs font-medium truncate">{data.label}</span>
        {getHealthIcon()}
      </div>
      {data.description && (
        <p className="text-[10px] text-muted-foreground truncate">
          {data.description}
        </p>
      )}
      <div className="mt-1 flex gap-1">
        <Badge
          variant="outline"
          className={`text-[9px] px-1 py-0 h-4 ${statusConfig.color}`}
        >
          {statusConfig.name}
        </Badge>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground" />
    </div>
  );
}

const nodeTypes = {
  serviceNode: ServiceNode,
};

// Service Detail Dialog
function ServiceDetailDialog({
  service,
  open,
  onOpenChange,
  healthStatus,
}: {
  service: ServiceInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  healthStatus?: 'healthy' | 'unhealthy' | 'unknown';
}) {
  if (!service) return null;

  const layerConfig = LAYER_CONFIG[service.layer];
  const statusConfig = STATUS_CONFIG[service.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{layerConfig.icon}</span>
            {service.name}
            {healthStatus === 'healthy' && (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
            {healthStatus === 'unhealthy' && (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {service.description && (
            <p className="text-sm text-muted-foreground">{service.description}</p>
          )}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Namespace</p>
              <p className="font-mono">{service.namespace}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Port</p>
              <p className="font-mono">{service.port}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground text-xs">Internal URL</p>
              <p className="font-mono text-xs truncate">{service.internal_url}</p>
            </div>
            {service.tailscale_url && (
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs">Tailscale URL</p>
                <a
                  href={service.tailscale_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-blue-500 hover:underline truncate block"
                >
                  {service.tailscale_url}
                </a>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge className={layerConfig.color}>{layerConfig.name}</Badge>
            <Badge className={statusConfig.color}>{statusConfig.name}</Badge>
          </div>
          {service.dependencies.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Dependencies</p>
              <div className="flex flex-wrap gap-1">
                {service.dependencies.map((dep) => (
                  <Badge key={dep} variant="outline" className="text-xs">
                    {dep}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main component
export default function ServiceArchitectureDiagram() {
  const { data: services, isLoading } = useServices();
  const { data: catalogHealth } = useCatalogHealth();
  const [selectedService, setSelectedService] = useState<ServiceInfo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Get health status for a service
  const getHealthStatus = useCallback(
    (serviceId: string) => {
      return catalogHealth?.services.find((h) => h.id === serviceId)?.status;
    },
    [catalogHealth]
  );

  // Generate nodes and edges from services
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!services || services.length === 0) {
      return { initialNodes: [], initialEdges: [] };
    }

    // Group services by layer
    const layerOrder: ServiceLayer[] = ['infra', 'shared', 'business', 'sensitive'];
    const grouped: Record<ServiceLayer, ServiceInfo[]> = {
      infra: [],
      shared: [],
      business: [],
      sensitive: [],
    };

    services.forEach((service) => {
      if (grouped[service.layer]) {
        grouped[service.layer].push(service);
      }
    });

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Position configuration
    const layerStartY: Record<ServiceLayer, number> = {
      infra: 0,
      shared: 150,
      business: 300,
      sensitive: 450,
    };
    const nodeWidth = 180;
    const nodeGap = 30;

    // Create nodes for each layer
    layerOrder.forEach((layer) => {
      const layerServices = grouped[layer];
      if (layerServices.length === 0) return;

      const totalWidth = layerServices.length * nodeWidth + (layerServices.length - 1) * nodeGap;
      const startX = -totalWidth / 2 + nodeWidth / 2;

      layerServices.forEach((service, index) => {
        nodes.push({
          id: service.id,
          type: 'serviceNode',
          position: {
            x: startX + index * (nodeWidth + nodeGap),
            y: layerStartY[layer],
          },
          data: {
            label: service.name,
            description: service.description,
            layer: service.layer,
            status: service.status,
            healthStatus: getHealthStatus(service.id),
            service,
          },
        });
      });
    });

    // Create edges from dependencies
    services.forEach((service) => {
      service.dependencies.forEach((depId) => {
        // Check if dependency exists as a node
        if (services.some((s) => s.id === depId)) {
          edges.push({
            id: `${service.id}-${depId}`,
            source: depId,
            target: service.id,
            animated: true,
            style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1.5 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: 'hsl(var(--muted-foreground))',
              width: 15,
              height: 15,
            },
          });
        }
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [services, getHealthStatus]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when services or health data changes
  useMemo(() => {
    if (initialNodes.length > 0 && nodes.length === 0) {
      setNodes(initialNodes);
    }
  }, [initialNodes, nodes.length, setNodes]);

  useMemo(() => {
    if (initialEdges.length > 0 && edges.length === 0) {
      setEdges(initialEdges);
    }
  }, [initialEdges, edges.length, setEdges]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const nodeData = node.data as ServiceNodeData;
      if (nodeData.service) {
        setSelectedService(nodeData.service);
        setDialogOpen(true);
      }
    },
    []
  );

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (!services || services.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">
          暂无服务数据，请检查 Config Service 连接
        </p>
      </div>
    );
  }

  return (
    <div className="h-[400px] rounded-lg border bg-muted/20">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background gap={20} size={1} color="hsl(var(--muted-foreground) / 0.1)" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as unknown as ServiceNodeData;
            switch (data.healthStatus) {
              case 'healthy':
                return '#22c55e';
              case 'unhealthy':
                return '#ef4444';
              default:
                return '#9ca3af';
            }
          }}
          maskColor="hsl(var(--background) / 0.8)"
          className="!bg-background !border"
        />
      </ReactFlow>
      <ServiceDetailDialog
        service={selectedService}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        healthStatus={selectedService ? getHealthStatus(selectedService.id) : undefined}
      />
    </div>
  );
}
