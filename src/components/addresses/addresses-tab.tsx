import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  X,
  Star,
} from 'lucide-react';
import {
  usePersonAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
} from '@/hooks/use-addresses';
import type { Address, AddressCreate, AddressUpdate } from '@/types';
import {
  ADDRESS_TYPE_OPTIONS,
  formatFullAddress,
  CHINA_PROVINCES,
} from '@/types/address';
import { toast } from 'sonner';

// Address type label mapping
const addressTypeLabels: Record<string, string> = Object.fromEntries(
  ADDRESS_TYPE_OPTIONS.map((opt) => [opt.value, opt.label])
);

// Address form component
interface AddressFormProps {
  address?: Address;
  personId: string;
  onSubmit: (data: AddressCreate) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function AddressForm({ address, personId, onSubmit, onCancel, isLoading }: AddressFormProps) {
  const [formData, setFormData] = useState({
    type: address?.type || 'home',
    country: address?.country || '中国',
    province: address?.province || '',
    city: address?.city || '',
    district: address?.district || '',
    street: address?.street || '',
    postal_code: address?.postal_code || '',
    is_primary: address?.is_primary || false,
    notes: address?.notes || '',
  });

  useEffect(() => {
    if (address) {
      setFormData({
        type: address.type || 'home',
        country: address.country || '中国',
        province: address.province || '',
        city: address.city || '',
        district: address.district || '',
        street: address.street || '',
        postal_code: address.postal_code || '',
        is_primary: address.is_primary || false,
        notes: address.notes || '',
      });
    }
  }, [address]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      person_id: personId,
      type: formData.type as AddressCreate['type'],
      country: formData.country,
      province: formData.province,
      city: formData.city,
      district: formData.district || undefined,
      street: formData.street,
      postal_code: formData.postal_code || undefined,
      is_primary: formData.is_primary,
      notes: formData.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">地址类型 *</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as AddressCreate['type'] })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          >
            {ADDRESS_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">国家/地区 *</label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
            placeholder="中国"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">省/自治区/直辖市 *</label>
          <select
            value={formData.province}
            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          >
            <option value="">请选择</option>
            {CHINA_PROVINCES.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">城市 *</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
            placeholder="请输入城市"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">区/县</label>
          <input
            type="text"
            value={formData.district}
            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="请输入区/县"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">邮政编码</label>
          <input
            type="text"
            value={formData.postal_code}
            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="请输入邮政编码"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium">详细地址 *</label>
          <input
            type="text"
            value={formData.street}
            onChange={(e) => setFormData({ ...formData, street: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
            placeholder="请输入街道、门牌号等详细地址"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium">备注</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]"
            placeholder="可选备注信息"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_primary}
              onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
              className="rounded border-input"
            />
            <span className="text-sm font-medium">设为主要地址</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          取消
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '保存中...' : address ? '更新' : '添加'}
        </Button>
      </div>
    </form>
  );
}

// Address card component
interface AddressCardProps {
  address: Address;
  onEdit: () => void;
  onDelete: () => void;
}

function AddressCard({ address, onEdit, onDelete }: AddressCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {addressTypeLabels[address.type] || address.type}
              </span>
              {address.is_primary && (
                <Badge variant="default" className="text-xs gap-1">
                  <Star className="h-3 w-3" />
                  主要
                </Badge>
              )}
            </div>

            <p className="text-sm text-foreground">
              {formatFullAddress(address)}
            </p>

            {address.postal_code && (
              <p className="text-sm text-muted-foreground">
                邮编: {address.postal_code}
              </p>
            )}

            {address.notes && (
              <p className="text-sm text-muted-foreground mt-2">
                备注: {address.notes}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main AddressesTab component
interface AddressesTabProps {
  personId: string;
}

export default function AddressesTab({ personId }: AddressesTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const { data: addresses, isLoading, refetch } = usePersonAddresses(personId);
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();

  // Handle create address
  const handleCreate = async (data: AddressCreate) => {
    try {
      await createAddress.mutateAsync(data);
      toast.success('地址添加成功');
      setShowForm(false);
      refetch();
    } catch (error) {
      toast.error('添加失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // Handle update address
  const handleUpdate = async (data: AddressCreate) => {
    if (!editingAddress) return;
    try {
      const updateData: AddressUpdate = {
        type: data.type,
        country: data.country,
        province: data.province,
        city: data.city,
        district: data.district,
        street: data.street,
        postal_code: data.postal_code,
        is_primary: data.is_primary,
        notes: data.notes,
      };
      await updateAddress.mutateAsync({
        id: editingAddress.id,
        data: updateData,
      });
      toast.success('地址更新成功');
      setEditingAddress(null);
      refetch();
    } catch (error) {
      toast.error('更新失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // Handle delete address
  const handleDelete = async (addressId: string) => {
    if (!confirm('确定要删除这个地址吗？此操作无法撤销。')) return;
    try {
      await deleteAddress.mutateAsync(addressId);
      toast.success('地址已删除');
      refetch();
    } catch (error) {
      toast.error('删除失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // Close form
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAddress(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">地址管理</h3>
          <Badge variant="secondary">{addresses?.length || 0}</Badge>
        </div>
        {!showForm && !editingAddress && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-1 h-4 w-4" />
            添加地址
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showForm || editingAddress) && (
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-medium">
                {editingAddress ? '编辑地址' : '添加地址'}
              </h4>
              <Button variant="ghost" size="icon" onClick={handleCloseForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AddressForm
              address={editingAddress || undefined}
              personId={personId}
              onSubmit={editingAddress ? handleUpdate : handleCreate}
              onCancel={handleCloseForm}
              isLoading={createAddress.isPending || updateAddress.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Addresses List */}
      {addresses && addresses.length > 0 ? (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              onEdit={() => setEditingAddress(addr)}
              onDelete={() => handleDelete(addr.id)}
            />
          ))}
        </div>
      ) : (
        !showForm && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">暂无地址记录</p>
              <p className="text-sm text-muted-foreground mt-1">
                点击上方"添加地址"按钮添加
              </p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
