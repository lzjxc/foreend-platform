import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Home, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PropertyForm } from '@/components/housing/property-form';
import { EmailInitDialog } from '@/components/housing/email-init-dialog';
import { useCreateProperty } from '@/hooks/use-housing';
import type { PropertyCreate, InitFromEmailResult } from '@/types/housing';

export default function HousingNew() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailId = searchParams.get('email_id');

  const [mode, setMode] = useState<'manual' | 'email'>(emailId ? 'email' : 'manual');
  const [formOpen, setFormOpen] = useState(!emailId);
  const [emailDialogOpen, setEmailDialogOpen] = useState(!!emailId);

  const createProperty = useCreateProperty();

  const handleManualCreate = (data: PropertyCreate) => {
    createProperty.mutate(data, {
      onSuccess: (created) => {
        toast.success('房产创建成功');
        navigate(`/life/housing/${created.id}`);
      },
      onError: () => toast.error('创建失败'),
    });
  };

  const handleEmailSuccess = (result: InitFromEmailResult) => {
    toast.success('房产和租约已创建');
    navigate(
      `/life/housing/${result.property.id}/tenancy/${result.tenancy.id}`
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <button
          className="mb-2 flex items-center gap-1 text-sm text-primary hover:underline"
          onClick={() => navigate('/life/housing')}
        >
          <ChevronLeft className="h-4 w-4" />
          返回房产列表
        </button>
        <h1 className="text-2xl font-bold">新建房产</h1>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2">
        <Button
          variant={mode === 'manual' ? 'default' : 'outline'}
          onClick={() => {
            setMode('manual');
            setFormOpen(true);
            setEmailDialogOpen(false);
          }}
        >
          <Home className="mr-2 h-4 w-4" />
          手动创建
        </Button>
        <Button
          variant={mode === 'email' ? 'default' : 'outline'}
          className={mode === 'email' ? '' : 'border-purple-200 text-purple-700 hover:bg-purple-50'}
          onClick={() => {
            setMode('email');
            setFormOpen(false);
            setEmailDialogOpen(true);
          }}
        >
          <Mail className="mr-2 h-4 w-4" />
          从邮件初始化
        </Button>
      </div>

      {/* Manual form (inline, not Sheet) */}
      {mode === 'manual' && (
        <div className="max-w-lg">
          <PropertyForm
            open={formOpen}
            onOpenChange={setFormOpen}
            onSubmit={handleManualCreate}
            isLoading={createProperty.isPending}
          />
          {!formOpen && (
            <Button onClick={() => setFormOpen(true)}>打开表单</Button>
          )}
        </div>
      )}

      {/* Email init dialog */}
      <EmailInitDialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        onSuccess={handleEmailSuccess}
        preselectedEmailId={emailId ?? undefined}
      />
    </div>
  );
}
