import { useState } from 'react';
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
import type { TenancyCreate, TenancyStatus } from '@/types/housing';

const tenancySchema = z.object({
  status: z.enum(['draft', 'active', 'ended'] as const),
  landlord_name: z.string().optional(),
  landlord_contact: z.string().optional(),
  agent_name: z.string().optional(),
  agent_contact: z.string().optional(),
  agent_email: z.string().email().optional().or(z.literal('')),
  rent_pcm: z.coerce.number().min(0).optional(),
  deposit_amount: z.coerce.number().min(0).optional(),
  deposit_scheme: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  contract_signed_date: z.string().optional(),
  notes: z.string().optional(),
});

type TenancyFormData = z.infer<typeof tenancySchema>;

interface TenancyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  defaultValues?: Partial<TenancyCreate>;
  onSubmit: (data: TenancyCreate) => void;
  isLoading?: boolean;
  title?: string;
}

export function TenancyForm({
  open,
  onOpenChange,
  propertyId,
  defaultValues,
  onSubmit,
  isLoading,
  title = '新建租约',
}: TenancyFormProps) {
  const [keywords, setKeywords] = useState<string>(
    defaultValues?.email_keywords?.join(', ') ?? ''
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<TenancyFormData>({
    resolver: zodResolver(tenancySchema),
    defaultValues: {
      status: 'draft',
      ...defaultValues,
    },
  });

  const handleFormSubmit = (data: TenancyFormData) => {
    const emailKeywords = keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    onSubmit({
      property_id: propertyId,
      ...data,
      agent_email: data.agent_email || undefined,
      email_keywords: emailKeywords.length > 0 ? emailKeywords : undefined,
    });
    reset();
    setKeywords('');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              value={watch('status')}
              onChange={(e) => setValue('status', e.target.value as TenancyStatus)}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="ended">Ended</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Landlord Name</Label>
              <Input {...register('landlord_name')} placeholder="Mr. Smith" />
            </div>
            <div className="space-y-1.5">
              <Label>Landlord Contact</Label>
              <Input {...register('landlord_contact')} placeholder="Phone/email" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Agent Name</Label>
              <Input {...register('agent_name')} placeholder="KFH" />
            </div>
            <div className="space-y-1.5">
              <Label>Agent Contact</Label>
              <Input {...register('agent_contact')} placeholder="Phone" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Agent Email</Label>
            <Input {...register('agent_email')} placeholder="agent@kfh.co.uk" type="email" />
            {errors.agent_email && (
              <p className="text-sm text-destructive">{errors.agent_email.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Rent (PCM)</Label>
              <Input type="number" {...register('rent_pcm')} placeholder="1850" min={0} step="0.01" />
            </div>
            <div className="space-y-1.5">
              <Label>Deposit</Label>
              <Input type="number" {...register('deposit_amount')} placeholder="2130" min={0} step="0.01" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Deposit Scheme</Label>
            <Input {...register('deposit_scheme')} placeholder="e.g. TDS Insured" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input type="date" {...register('start_date')} />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input type="date" {...register('end_date')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Contract Signed Date</Label>
            <Input type="date" {...register('contract_signed_date')} />
          </div>

          <div className="space-y-1.5">
            <Label>Email Keywords</Label>
            <Input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="SE16 5DS, KFH, Goodlord (comma-separated)"
            />
            <p className="text-xs text-muted-foreground">
              Used for auto-matching incoming emails to this tenancy
            </p>
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
