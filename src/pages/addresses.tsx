import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  ChevronDown,
  Star,
} from 'lucide-react';
import { usePersons } from '@/hooks/use-persons';
import {
  usePersonAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
} from '@/hooks/use-addresses';
import type { Address, AddressCreate, AddressUpdate, Person } from '@/types';
import {
  ADDRESS_TYPE_OPTIONS,
  formatFullAddress,
  CHINA_PROVINCES,
} from '@/types/address';

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

  // Update form data when address prop changes (for edit mode)
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

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
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
    <div className="p-4 rounded-lg border bg-card">
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
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Person selector component
interface PersonSelectorProps {
  persons: Person[];
  selectedPersonId: string | null;
  onSelect: (personId: string | null) => void;
}

function PersonSelector({ persons, selectedPersonId, onSelect }: PersonSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedPerson = persons.find((p) => p.id === selectedPersonId);

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between min-w-[200px]"
      >
        <span>{selectedPerson ? selectedPerson.name : '选择家庭成员'}</span>
        <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <div className="py-1">
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
            >
              全部成员
            </button>
            {persons.map((person) => (
              <button
                key={person.id}
                type="button"
                className={`w-full px-3 py-2 text-left text-sm hover:bg-muted ${
                  person.id === selectedPersonId ? 'bg-muted' : ''
                }`}
                onClick={() => {
                  onSelect(person.id);
                  setIsOpen(false);
                }}
              >
                {person.name}
                <span className="ml-2 text-muted-foreground">
                  ({person.relationship === 'self' ? '本人' : person.relationship})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Addresses() {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [allAddresses, setAllAddresses] = useState<{ person: Person; addresses: Address[] }[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  // Fetch all persons
  const { data: persons = [], isLoading: isLoadingPersons } = usePersons();

  // Fetch addresses for selected person
  const {
    data: addressesData,
    isLoading: isLoadingAddresses,
    refetch: refetchAddresses,
  } = usePersonAddresses(selectedPersonId || '');

  // Ensure selectedPersonAddresses is always an array
  const selectedPersonAddresses: Address[] = addressesData || [];

  // Mutations
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();

  // Load all addresses for all persons when no specific person is selected
  useEffect(() => {
    const loadAllAddresses = async () => {
      if (selectedPersonId || persons.length === 0) {
        setAllAddresses([]);
        return;
      }

      setIsLoadingAll(true);
      const results: { person: Person; addresses: Address[] }[] = [];

      for (const person of persons) {
        try {
          const response = await fetch(`/api/v1/persons/${person.id}/addresses`, {
            headers: { 'Content-Type': 'application/json' },
          });
          if (response.ok) {
            const data = await response.json();
            const addresses = data.data || data || [];
            if (addresses.length > 0) {
              results.push({ person, addresses });
            }
          }
        } catch {
          // Continue with other persons
        }
      }

      setAllAddresses(results);
      setIsLoadingAll(false);
    };

    loadAllAddresses();
  }, [selectedPersonId, persons]);

  // Handle create address
  const handleCreate = async (data: AddressCreate) => {
    try {
      await createAddress.mutateAsync(data);
      setShowForm(false);
      refetchAddresses();
    } catch (error) {
      console.error('Failed to create address:', error);
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
      setEditingAddress(null);
      refetchAddresses();
    } catch (error) {
      console.error('Failed to update address:', error);
    }
  };

  // Handle delete address
  const handleDelete = async (addressId: string, personId: string) => {
    if (!confirm('确定要删除这个地址吗？此操作无法撤销。')) return;

    try {
      await deleteAddress.mutateAsync(addressId);
      if (selectedPersonId) {
        refetchAddresses();
      } else {
        // Reload all addresses
        setAllAddresses((prev) =>
          prev
            .map((item) =>
              item.person.id === personId
                ? { ...item, addresses: item.addresses.filter((a) => a.id !== addressId) }
                : item
            )
            .filter((item) => item.addresses.length > 0)
        );
      }
    } catch (error) {
      console.error('Failed to delete address:', error);
    }
  };

  const isLoading = isLoadingPersons || isLoadingAddresses || isLoadingAll;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">地址管理</h2>
          <p className="text-sm text-muted-foreground">管理家庭成员的各类地址信息</p>
        </div>
        <div className="flex items-center gap-2">
          <PersonSelector
            persons={persons}
            selectedPersonId={selectedPersonId}
            onSelect={setSelectedPersonId}
          />
          {selectedPersonId && (
            <Button onClick={() => setShowForm(true)} disabled={showForm}>
              <Plus className="mr-2 h-4 w-4" />
              添加地址
            </Button>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showForm || editingAddress) && selectedPersonId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {editingAddress ? '编辑地址' : '添加地址'}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowForm(false);
                setEditingAddress(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <AddressForm
              address={editingAddress || undefined}
              personId={selectedPersonId}
              onSubmit={editingAddress ? handleUpdate : handleCreate}
              onCancel={() => {
                setShowForm(false);
                setEditingAddress(null);
              }}
              isLoading={createAddress.isPending || updateAddress.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Addresses List */}
      {selectedPersonId ? (
        // Show addresses for selected person
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {persons.find((p) => p.id === selectedPersonId)?.name || '未知'} 的地址
              {selectedPersonAddresses.length > 0 && (
                <Badge variant="secondary">{selectedPersonAddresses.length}</Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refetchAddresses()}>
              <RefreshCw className={`h-4 w-4 ${isLoadingAddresses ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingAddresses ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : selectedPersonAddresses.length === 0 ? (
              <div className="text-center py-8">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">暂无地址记录</p>
                <Button className="mt-4" onClick={() => setShowForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  添加第一个地址
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedPersonAddresses.map((addr) => (
                  <AddressCard
                    key={addr.id}
                    address={addr}
                    onEdit={() => setEditingAddress(addr)}
                    onDelete={() => handleDelete(addr.id, selectedPersonId)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Show all addresses grouped by person
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : allAddresses.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">暂无地址记录</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    请先选择一个家庭成员来添加地址
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            allAddresses.map(({ person, addresses }) => (
              <Card key={person.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4" />
                    {person.name}
                    <Badge variant="secondary">{addresses.length}</Badge>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPersonId(person.id)}
                  >
                    查看全部
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <AddressCard
                        key={addr.id}
                        address={addr}
                        onEdit={() => {
                          setSelectedPersonId(person.id);
                          setEditingAddress(addr);
                        }}
                        onDelete={() => handleDelete(addr.id, person.id)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
