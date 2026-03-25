import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUnbindEmail } from '@/hooks/use-housing';
import type { EmailSyncResult, EmailLink } from '@/types/housing';

interface EmailSyncDialogProps {
  open: boolean;
  onClose: () => void;
  tenancyId: string;
  syncResult: EmailSyncResult | null;
  newLinks: EmailLink[];
}

export function EmailSyncDialog({
  open,
  onClose,
  tenancyId,
  syncResult,
  newLinks,
}: EmailSyncDialogProps) {
  const unbindEmail = useUnbindEmail();

  const handleUnbind = (linkId: string) => {
    unbindEmail.mutate(
      { linkId, tenancyId },
      {
        onSuccess: () => toast.success('已撤销'),
        onError: () => toast.error('撤销失败'),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>📧 邮件同步结果</DialogTitle>
        </DialogHeader>

        {syncResult && (
          <div className="flex gap-4 text-xs">
            <span className="text-muted-foreground">扫描: <strong>{syncResult.matched}</strong></span>
            <span className="text-green-600">新匹配: <strong>{syncResult.new_links}</strong></span>
            <span className="text-muted-foreground">跳过: <strong>{syncResult.skipped_duplicates}</strong></span>
          </div>
        )}

        {newLinks.length > 0 ? (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">发件人</th>
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">主题</th>
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">关键词</th>
                  <th className="px-2 py-1.5 text-left font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {newLinks.map((link) => (
                  <tr key={link.id} className="border-t">
                    <td className="px-2 py-1.5 font-medium">{link.email_from}</td>
                    <td className="px-2 py-1.5 truncate max-w-[180px]">{link.email_subject}</td>
                    <td className="px-2 py-1.5">
                      {link.matched_keyword && (
                        <span className="text-orange-600 font-medium">{link.matched_keyword}</span>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      <button
                        className="text-red-500 hover:underline font-medium"
                        onClick={() => handleUnbind(link.id)}
                        disabled={unbindEmail.isPending}
                      >
                        撤销
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-4 text-center text-sm text-muted-foreground">
            没有新的匹配
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={onClose}>确认</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
