import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import type { PropertyCreate, PropertyType } from '@/types/housing';

const propertySchema = z.object({
  address_line1: z.string().min(1, 'Address is required'),
  address_line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  postcode: z.string().min(1, 'Postcode is required'),
  country: z.string().optional(),
  property_type: z.enum(['apartment', 'house', 'studio', 'room', 'other'] as const),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().int().min(0).optional(),
  notes: z.string().optional(),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface PropertyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<PropertyCreate>;
  onSubmit: (data: PropertyFormData) => void;
  isLoading?: boolean;
  title?: string;
}

export function PropertyForm({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  isLoading,
  title = '新建房产',
}: PropertyFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      country: 'UK',
      property_type: 'apartment',
      ...defaultValues,
    },
  });

  const handleFormSubmit = (data: PropertyFormData) => {
    onSubmit(data);
    reset();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label>Address Line 1 *</Label>
            <Input {...register('address_line1')} placeholder="e.g. Apartment 13, 392 Rotherhithe Street" />
            {errors.address_line1 && (
              <p className="text-sm text-destructive">{errors.address_line1.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Address Line 2</Label>
            <Input {...register('address_line2')} placeholder="Optional" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>City *</Label>
              <Input {...register('city')} placeholder="London" />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Postcode *</Label>
              <Input {...register('postcode')} placeholder="SE16 5DS" />
              {errors.postcode && (
                <p className="text-sm text-destructive">{errors.postcode.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Input {...register('country')} placeholder="UK" />
            </div>
            <div className="space-y-1.5">
              <Label>Property Type</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={watch('property_type')}
                onChange={(e) => setValue('property_type', e.target.value as PropertyType)}
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="studio">Studio</option>
                <option value="room">Room</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Bedrooms</Label>
              <Input type="number" {...register('bedrooms')} placeholder="0" min={0} />
            </div>
            <div className="space-y-1.5">
              <Label>Bathrooms</Label>
              <Input type="number" {...register('bathrooms')} placeholder="0" min={0} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <textarea
              {...register('notes')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring min-h-[80px]"
              placeholder="Optional notes..."
            />
          </div>

          <SheetFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? '保存中...' : '保存'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
