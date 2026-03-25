import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TenancyForm } from '@/components/housing/tenancy-form';
import { TenancyAnchorNav } from '@/components/housing/tenancy-anchor-nav';
import { UtilitySection } from '@/components/housing/utility-section';
import { BillSection } from '@/components/housing/bill-section';
import { DocumentSection } from '@/components/housing/document-section';
import { EmailSection } from '@/components/housing/email-section';
import { useTenancy, useUpdateTenancy } from '@/hooks/use-housing';
import { TENANCY_STATUS_LABELS } from '@/types/housing';
import type { TenancyCreate } from '@/types/housing';
import { formatDate } from '@/lib/utils';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  ended: 'bg-gray-100 text-gray-600',
};

export default function HousingTenancyDetail() {
  const { propertyId, tenancyId } = useParams<{ propertyId: string; tenancyId: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const { data: tenancy, isLoading } = useTenancy(tenancyId ?? '');
  const updateTenancy = useUpdateTenancy();

  const allBills = useMemo(
    () => tenancy?.utilities.flatMap((u) => u.bills) ?? [],
    [tenancy]
  );

  const sections = useMemo(
    () => [
      { id: 'info', label: '租约', icon: '📋' },
      { id: 'utilities', label: '水电', icon: '⚡', count: tenancy?.utilities.length ?? 0 },
      { id: 'bills', label: '账单', icon: '💷', count: allBills.length },
      { id: 'docs', label: '文档', icon: '📄', count: tenancy?.documents.length ?? 0 },
      { id: 'emails', label: '邮件', icon: '📧', count: tenancy?.email_links.length ?? 0 },
    ],
    [tenancy, allBills]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded-lg border bg-muted" />
      </div>
    );
  }

  if (!tenancy) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Tenancy not found.
        <Button variant="link" onClick={() => navigate('/life/housing')}>返回列表</Button>
      </div>
    );
  }

  const handleUpdate = (data: TenancyCreate) => {
    const { property_id: _, ...updateData } = data;
    updateTenancy.mutate(
      { id: tenancy.id, ...updateData },
      {
        onSuccess: () => { toast.success('已更新'); setEditOpen(false); },
        onError: () => toast.error('更新失败'),
      }
    );
  };

  return (
    <div className="flex gap-6">
      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-6">
        {/* Header */}
        <div>
          <button
            className="mb-2 flex items-center gap-1 text-sm text-primary hover:underline"
            onClick={() => navigate(`/life/housing/${propertyId}`)}
          >
            <ChevronLeft className="h-4 w-4" />
            返回房产详情
          </button>
          <div className="flex items-start justify-between border-b pb-4">
            <div>
              <h1 className="text-xl font-bold">
                {tenancy.agent_name ? `${tenancy.agent_name} · ` : ''}
                Tenancy
              </h1>
              <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                {tenancy.rent_pcm && <span>£{tenancy.rent_pcm.toLocaleString()}/月</span>}
                {tenancy.start_date && tenancy.end_date && (
                  <span>{formatDate(tenancy.start_date)} → {formatDate(tenancy.end_date)}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={statusColors[tenancy.status] ?? ''}>
                {TENANCY_STATUS_LABELS[tenancy.status]}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-1 h-3.5 w-3.5" />
                编辑
              </Button>
            </div>
          </div>
        </div>

        {/* Section: Info */}
        <div id="info" className="scroll-mt-20">
          <h3 className="mb-3 text-sm font-semibold">📋 租约信息</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-3">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                房东 & 中介
              </div>
              <div className="space-y-1 text-sm">
                {tenancy.landlord_name && <div>房东: <strong>{tenancy.landlord_name}</strong></div>}
                {tenancy.landlord_contact && <div className="text-muted-foreground">{tenancy.landlord_contact}</div>}
                {tenancy.agent_name && <div>中介: <strong>{tenancy.agent_name}</strong></div>}
                {tenancy.agent_contact && <div className="text-muted-foreground">{tenancy.agent_contact}</div>}
                {tenancy.agent_email && <div className="text-primary">{tenancy.agent_email}</div>}
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                押金 & 合同
              </div>
              <div className="space-y-1 text-sm">
                {tenancy.deposit_amount && (
                  <div>押金: <strong>£{tenancy.deposit_amount.toLocaleString()}</strong>
                    {tenancy.deposit_scheme && ` · ${tenancy.deposit_scheme}`}
                  </div>
                )}
                {tenancy.contract_signed_date && (
                  <div>合同签署: {formatDate(tenancy.contract_signed_date)}</div>
                )}
                {tenancy.email_keywords.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    关键词: {tenancy.email_keywords.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
          {tenancy.notes && (
            <div className="mt-3 rounded-lg border p-3">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">备注</div>
              <p className="text-sm">{tenancy.notes}</p>
            </div>
          )}
        </div>

        {/* Section: Utilities */}
        <div id="utilities" className="scroll-mt-20">
          <UtilitySection tenancyId={tenancy.id} utilities={tenancy.utilities} />
        </div>

        {/* Section: Bills */}
        <div id="bills" className="scroll-mt-20">
          <BillSection tenancyId={tenancy.id} utilities={tenancy.utilities} />
        </div>

        {/* Section: Documents */}
        <div id="docs" className="scroll-mt-20">
          <DocumentSection tenancyId={tenancy.id} documents={tenancy.documents} />
        </div>

        {/* Section: Emails */}
        <div id="emails" className="scroll-mt-20">
          <EmailSection tenancyId={tenancy.id} emailLinks={tenancy.email_links} />
        </div>
      </div>

      {/* Side anchor nav */}
      <TenancyAnchorNav sections={sections} />

      {/* Edit form */}
      <TenancyForm
        open={editOpen}
        onOpenChange={setEditOpen}
        propertyId={tenancy.property_id}
        defaultValues={{
          status: tenancy.status,
          landlord_name: tenancy.landlord_name ?? undefined,
          landlord_contact: tenancy.landlord_contact ?? undefined,
          agent_name: tenancy.agent_name ?? undefined,
          agent_contact: tenancy.agent_contact ?? undefined,
          agent_email: tenancy.agent_email ?? undefined,
          rent_pcm: tenancy.rent_pcm ?? undefined,
          deposit_amount: tenancy.deposit_amount ?? undefined,
          deposit_scheme: tenancy.deposit_scheme ?? undefined,
          start_date: tenancy.start_date ?? undefined,
          end_date: tenancy.end_date ?? undefined,
          contract_signed_date: tenancy.contract_signed_date ?? undefined,
          email_keywords: tenancy.email_keywords,
          notes: tenancy.notes ?? undefined,
        }}
        onSubmit={handleUpdate}
        isLoading={updateTenancy.isPending}
        title="编辑租约"
      />
    </div>
  );
}
