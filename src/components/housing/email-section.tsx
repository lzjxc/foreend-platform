import { useState } from 'react';
import { RefreshCw, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmailSyncDialog } from './email-sync-dialog';
import { useSyncEmails, useBindEmail, useUnbindEmail } from '@/hooks/use-housing';
import type { EmailLink, EmailSyncResult } from '@/types/housing';
import { formatDate } from '@/lib/utils';

interface EmailSectionProps {
  tenancyId: string;
  emailLinks: EmailLink[];
}

export function EmailSection({ tenancyId, emailLinks }: EmailSectionProps) {
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [syncResult, setSyncResult] = useState<EmailSyncResult | null>(null);
  const [newSyncLinks, setNewSyncLinks] = useState<EmailLink[]>([]);
  const [bindOpen, setBindOpen] = useState(false);
  const [emailIdInput, setEmailIdInput] = useState('');

  const syncEmails = useSyncEmails();
  const bindEmail = useBindEmail();
  const unbindEmail = useUnbindEmail();

  const handleSync = () => {
    syncEmails.mutate(
      { tenancyId },
      {
        onSuccess: (result) => {
          setSyncResult(result);
          setNewSyncLinks([]);
          setSyncDialogOpen(true);
        },
        onError: () => toast.error('同步失败'),
      }
    );
  };

  const handleBind = () => {
    if (!emailIdInput.trim()) return;
    bindEmail.mutate(
      { tenancyId, emailId: emailIdInput.trim() },
      {
        onSuccess: () => {
          toast.success('邮件已关联');
          setBindOpen(false);
          setEmailIdInput('');
        },
        onError: () => toast.error('关联失败'),
      }
    );
  };

  const handleUnbind = (linkId: string) => {
    if (!confirm('确定要解绑这封邮件吗？')) return;
    unbindEmail.mutate(
      { linkId, tenancyId },
      {
        onSuccess: () => toast.success('已解绑'),
        onError: () => toast.error('解绑失败'),
      }
    );
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">📧 关联邮件 ({emailLinks.length})</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncEmails.isPending}
          >
            {syncEmails.isPending ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 h-3.5 w-3.5" />
            )}
            同步邮件
          </Button>
          <Button variant="outline" size="sm" onClick={() => setBindOpen(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            手动关联
          </Button>
        </div>
      </div>

      {emailLinks.length === 0 ? (
        <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          暂无关联邮件
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">发件人</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">主题</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">日期</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">匹配</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">关键词</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {emailLinks.map((link) => (
                <tr key={link.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2 text-xs font-medium">{link.email_from}</td>
                  <td className="px-3 py-2 text-xs truncate max-w-[200px]">{link.email_subject}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {link.email_date ? formatDate(link.email_date) : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <Badge
                      className={
                        link.match_type === 'auto'
                          ? link.utility_id
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }
                    >
                      {link.match_type === 'auto'
                        ? link.utility_id
                          ? 'Utility'
                          : 'Auto'
                        : 'Manual'}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-[11px] text-muted-foreground">
                    {link.matched_keyword ?? '—'}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className="text-[11px] text-red-500 hover:underline font-medium"
                      onClick={() => handleUnbind(link.id)}
                    >
                      解绑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EmailSyncDialog
        open={syncDialogOpen}
        onClose={() => setSyncDialogOpen(false)}
        tenancyId={tenancyId}
        syncResult={syncResult}
        newLinks={newSyncLinks}
      />

      <Dialog open={bindOpen} onOpenChange={setBindOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>手动关联邮件</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Email ID</label>
              <Input
                value={emailIdInput}
                onChange={(e) => setEmailIdInput(e.target.value)}
                placeholder="输入邮件 ID"
              />
            </div>
            <Button onClick={handleBind} disabled={!emailIdInput.trim() || bindEmail.isPending} className="w-full">
              {bindEmail.isPending ? '关联中...' : '关联'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
