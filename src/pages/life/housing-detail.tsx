import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Pencil, Home } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PropertyForm } from '@/components/housing/property-form';
import { TenancyForm } from '@/components/housing/tenancy-form';
import {
  useProperty,
  useUpdateProperty,
  useCreateTenancy,
  useDeleteTenancy,
} from '@/hooks/use-housing';
import { PROPERTY_TYPE_LABELS, TENANCY_STATUS_LABELS } from '@/types/housing';
import type { PropertyUpdate, TenancyCreate } from '@/types/housing';
import { formatDate } from '@/lib/utils';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  ended: 'bg-gray-100 text-gray-600',
};

export default function HousingDetail() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [tenancyOpen, setTenancyOpen] = useState(false);

  const { data: property, isLoading } = useProperty(propertyId ?? '');
  const updateProperty = useUpdateProperty();
  const createTenancy = useCreateTenancy();
  const deleteTenancy = useDeleteTenancy();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-40 animate-pulse rounded-lg border bg-muted" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Property not found.
        <Button variant="link" onClick={() => navigate('/life/housing')}>返回列表</Button>
      </div>
    );
  }

  const handleUpdateProperty = (data: PropertyUpdate) => {
    updateProperty.mutate(
      { id: property.id, ...data },
      {
        onSuccess: () => { toast.success('已更新'); setEditOpen(false); },
        onError: () => toast.error('更新失败'),
      }
    );
  };

  const handleCreateTenancy = (data: TenancyCreate) => {
    createTenancy.mutate(data, {
      onSuccess: (created) => {
        toast.success('租约创建成功');
        setTenancyOpen(false);
        navigate(`/life/housing/${property.id}/tenancy/${created.id}`);
      },
      onError: () => toast.error('创建失败'),
    });
  };

  const handleDeleteTenancy = (tenancyId: string) => {
    if (!confirm('确定要删除这个租约吗？')) return;
    deleteTenancy.mutate(
      { id: tenancyId, propertyId: property.id },
      {
        onSuccess: () => toast.success('已删除'),
        onError: () => toast.error('删除失败'),
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          className="mb-2 flex items-center gap-1 text-sm text-primary hover:underline"
          onClick={() => navigate('/life/housing')}
        >
          <ChevronLeft className="h-4 w-4" />
          返回房产列表
        </button>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50">
              <Home className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{property.address_line1}</h1>
              <p className="text-sm text-muted-foreground">
                {property.city} · {property.postcode} · {PROPERTY_TYPE_LABELS[property.property_type]}
                {property.bedrooms ? ` · ${property.bedrooms} bed` : ''}
                {property.bathrooms ? ` · ${property.bathrooms} bath` : ''}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-3.5 w-3.5" />
            编辑
          </Button>
        </div>
      </div>

      {/* Tenancy List */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">租约 ({property.tenancies?.length ?? 0})</h2>
          <Button size="sm" onClick={() => setTenancyOpen(true)}>
            <Plus className="mr-2 h-3.5 w-3.5" />
            新建租约
          </Button>
        </div>

        {property.tenancies?.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
            <p>暂无租约</p>
          </div>
        ) : (
          <div className="space-y-3">
            {property.tenancies?.map((tenancy) => (
              <Card
                key={tenancy.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => navigate(`/life/housing/${property.id}/tenancy/${tenancy.id}`)}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[tenancy.status] ?? ''}>
                        {TENANCY_STATUS_LABELS[tenancy.status]}
                      </Badge>
                      {tenancy.agent_name && (
                        <span className="text-sm text-muted-foreground">{tenancy.agent_name}</span>
                      )}
                    </div>
                    <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                      {tenancy.rent_pcm && <span>£{tenancy.rent_pcm.toLocaleString()}/月</span>}
                      {tenancy.start_date && tenancy.end_date && (
                        <span>
                          {formatDate(tenancy.start_date)} → {formatDate(tenancy.end_date)}
                        </span>
                      )}
                      <span>{tenancy.utilities?.length ?? 0} utilities</span>
                      <span>{tenancy.documents?.length ?? 0} docs</span>
                      <span>{tenancy.email_links?.length ?? 0} emails</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTenancy(tenancy.id);
                    }}
                  >
                    删除
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      {property.notes && (
        <div>
          <h2 className="mb-2 text-lg font-semibold">备注</h2>
          <p className="text-sm text-muted-foreground">{property.notes}</p>
        </div>
      )}

      <PropertyForm
        open={editOpen}
        onOpenChange={setEditOpen}
        defaultValues={{
          address_line1: property.address_line1,
          address_line2: property.address_line2 ?? undefined,
          city: property.city,
          postcode: property.postcode,
          country: property.country,
          property_type: property.property_type,
          bedrooms: property.bedrooms ?? undefined,
          bathrooms: property.bathrooms ?? undefined,
          notes: property.notes ?? undefined,
        }}
        onSubmit={handleUpdateProperty}
        isLoading={updateProperty.isPending}
        title="编辑房产"
      />

      <TenancyForm
        open={tenancyOpen}
        onOpenChange={setTenancyOpen}
        propertyId={property.id}
        onSubmit={handleCreateTenancy}
        isLoading={createTenancy.isPending}
      />
    </div>
  );
}
