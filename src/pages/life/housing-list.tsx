import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Plus, Mail, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PropertyCard } from '@/components/housing/property-card';
import { PropertyForm } from '@/components/housing/property-form';
import { useProperties, useCreateProperty, useDeleteProperty } from '@/hooks/use-housing';
import type { PropertyCreate } from '@/types/housing';

export default function HousingList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editProperty, setEditProperty] = useState<PropertyCreate | undefined>();

  const { data, isLoading } = useProperties(page, 10, search || undefined);
  const createProperty = useCreateProperty();
  const deleteProperty = useDeleteProperty();

  const handleCreate = (input: PropertyCreate) => {
    createProperty.mutate(input, {
      onSuccess: (created) => {
        toast.success('房产创建成功');
        setFormOpen(false);
        navigate(`/life/housing/${created.id}`);
      },
      onError: () => toast.error('创建失败'),
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('确定要删除这个房产吗？关联的所有租约也会被删除。')) return;
    deleteProperty.mutate(id, {
      onSuccess: () => toast.success('已删除'),
      onError: () => toast.error('删除失败'),
    });
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">房产管理</h1>
          <p className="text-sm text-muted-foreground">管理房产、租约、水电账单和文档</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setEditProperty(undefined); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            手动创建
          </Button>
          <Button
            variant="outline"
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
            onClick={() => navigate('/life/housing/new')}
          >
            <Mail className="mr-2 h-4 w-4" />
            从邮件初始化
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="搜索地址、邮编..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <Button variant="outline" onClick={handleSearch}>搜索</Button>
      </div>

      {/* Property Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg border bg-muted" />
          ))}
        </div>
      ) : data?.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Home className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-lg font-medium text-muted-foreground">还没有房产</p>
          <p className="mb-4 text-sm text-muted-foreground">创建第一个房产开始管理</p>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            创建房产
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {data?.items.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onEdit={(p) => {
                  setEditProperty({
                    address_line1: p.address_line1,
                    address_line2: p.address_line2 ?? undefined,
                    city: p.city,
                    postcode: p.postcode,
                    country: p.country,
                    property_type: p.property_type,
                    bedrooms: p.bedrooms ?? undefined,
                    bathrooms: p.bathrooms ?? undefined,
                    notes: p.notes ?? undefined,
                  });
                  setFormOpen(true);
                }}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {data.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <PropertyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultValues={editProperty}
        onSubmit={handleCreate}
        isLoading={createProperty.isPending}
        title={editProperty ? '编辑房产' : '新建房产'}
      />
    </div>
  );
}
