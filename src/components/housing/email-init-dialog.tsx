import { useState, useEffect } from 'react';
import { Search, Loader2, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useInitFromEmail, useSearchEmails } from '@/hooks/use-housing';
import type { InitFromEmailResult } from '@/types/housing';

interface EmailInitDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (result: InitFromEmailResult) => void;
  preselectedEmailId?: string;
}

type Step = 'search' | 'parsing' | 'review';

export function EmailInitDialog({
  open,
  onClose,
  onSuccess,
  preselectedEmailId,
}: EmailInitDialogProps) {
  const [step, setStep] = useState<Step>(preselectedEmailId ? 'parsing' : 'search');
  const [searchQuery, setSearchQuery] = useState('');
  const [result, setResult] = useState<InitFromEmailResult | null>(null);

  const { data: searchResults } = useSearchEmails(searchQuery);
  const initFromEmail = useInitFromEmail();

  useEffect(() => {
    if (preselectedEmailId && open) {

      setStep('parsing');
      handleInit(preselectedEmailId);
    }
  }, [preselectedEmailId, open]);

  const handleInit = (emailId: string) => {
    setStep('parsing');
    initFromEmail.mutate(emailId, {
      onSuccess: (data) => {
        setResult(data);
        setStep('review');
      },
      onError: () => {
        toast.error('LLM 解析失败，请手动创建');
        onClose();
      },
    });
  };

  const handleConfirm = () => {
    if (result) {
      onSuccess(result);
      onClose();
    }
  };

  const handleReset = () => {
    setStep('search');
    setResult(null);
    setSearchQuery('');
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emails: any[] = searchResults?.items ?? searchResults ?? [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'search' && '选择邮件'}
            {step === 'parsing' && 'LLM 解析中...'}
            {step === 'review' && '确认解析结果'}
          </DialogTitle>
        </DialogHeader>

        {step === 'search' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="搜索邮件 (发件人、主题...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="max-h-[300px] space-y-1 overflow-y-auto">
              {emails.length === 0 && searchQuery.length >= 2 && (
                <p className="py-4 text-center text-sm text-muted-foreground">无搜索结果</p>
              )}
              {searchQuery.length < 2 && (
                <p className="py-4 text-center text-sm text-muted-foreground">输入至少 2 个字符搜索</p>
              )}
              {emails.map((email: { id: string; from_address?: string; from_name?: string; subject?: string; email_date?: string }) => (
                <div
                  key={email.id}
                  className="cursor-pointer rounded-md border p-2 transition-colors hover:bg-muted/50"
                  onClick={() => handleInit(email.id)}
                >
                  <div className="text-xs font-medium">{email.from_name || email.from_address}</div>
                  <div className="text-xs text-muted-foreground truncate">{email.subject}</div>
                  <div className="text-[10px] text-muted-foreground/70">{email.email_date}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 'parsing' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">LLM 正在解析邮件内容...</p>
            <p className="text-xs text-muted-foreground/70">最长约 30 秒</p>
          </div>
        )}

        {step === 'review' && result && (
          <div className="space-y-4">
            <button
              className="flex items-center gap-1 text-xs text-primary hover:underline"
              onClick={handleReset}
            >
              <ChevronLeft className="h-3 w-3" />
              重新选择
            </button>

            <div className="space-y-3">
              <div className="rounded-lg border p-3">
                <h4 className="mb-2 text-xs font-semibold text-muted-foreground uppercase">房产信息</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">地址:</span> {result.property.address_line1}</div>
                  <div><span className="text-muted-foreground">城市:</span> {result.property.city}</div>
                  <div><span className="text-muted-foreground">邮编:</span> {result.property.postcode}</div>
                  <div><span className="text-muted-foreground">类型:</span> {result.property.property_type}</div>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <h4 className="mb-2 text-xs font-semibold text-muted-foreground uppercase">租约信息</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {result.tenancy.agent_name && (
                    <div><span className="text-muted-foreground">中介:</span> {result.tenancy.agent_name}</div>
                  )}
                  {result.tenancy.agent_email && (
                    <div><span className="text-muted-foreground">邮箱:</span> {result.tenancy.agent_email}</div>
                  )}
                  {result.tenancy.landlord_name && (
                    <div><span className="text-muted-foreground">房东:</span> {result.tenancy.landlord_name}</div>
                  )}
                  {result.tenancy.rent_pcm && (
                    <div><span className="text-muted-foreground">月租:</span> £{result.tenancy.rent_pcm}</div>
                  )}
                  {result.tenancy.start_date && (
                    <div><span className="text-muted-foreground">开始:</span> {result.tenancy.start_date}</div>
                  )}
                  {result.tenancy.end_date && (
                    <div><span className="text-muted-foreground">结束:</span> {result.tenancy.end_date}</div>
                  )}
                </div>
                {result.tenancy.email_keywords?.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    关键词: {result.tenancy.email_keywords.join(', ')}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>取消</Button>
              <Button onClick={handleConfirm}>确认创建</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
