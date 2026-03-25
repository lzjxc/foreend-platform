import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Save, Trash2, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useDraftDetail, useCompose, useUpdateDraft, useDeleteDraft, useSendDraft } from '@/hooks/use-emails';

interface EmailComposeProps {
  draftId?: string;
  onClose: () => void;
}

export function EmailCompose({ draftId, onClose }: EmailComposeProps) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const { data: draft, isLoading: isDraftLoading } = useDraftDetail(draftId || '');
  const compose = useCompose();
  const updateDraft = useUpdateDraft();
  const deleteDraft = useDeleteDraft();
  const sendDraft = useSendDraft();

  // Populate form when draft loads
  useEffect(() => {
    if (draft) {
      setTo(draft.to_addresses?.[0] || '');
      setSubject(draft.subject || '');
      setBody(draft.body_text || '');
    }
  }, [draft]);

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isBusy = compose.isPending || updateDraft.isPending || deleteDraft.isPending || sendDraft.isPending;

  const handleSaveDraft = useCallback(async () => {
    if (!to.trim()) { toast.error('请填写收件人'); return; }
    try {
      if (draftId) {
        await updateDraft.mutateAsync({ id: draftId, to: to.trim(), subject, body });
        toast.success('草稿已保存');
      } else {
        await compose.mutateAsync({ to: to.trim(), subject, body, send: false });
        toast.success('草稿已保存');
      }
      onClose();
    } catch {
      toast.error('保存失败');
    }
  }, [draftId, to, subject, body, compose, updateDraft, onClose]);

  const handleSend = useCallback(async () => {
    if (!to.trim()) { toast.error('请填写收件人'); return; }
    if (!subject.trim()) { toast.error('请填写主题'); return; }
    try {
      if (draftId) {
        // Save changes first, then send
        await updateDraft.mutateAsync({ id: draftId, to: to.trim(), subject, body });
        await sendDraft.mutateAsync(draftId);
      } else {
        await compose.mutateAsync({ to: to.trim(), subject, body, send: true });
      }
      toast.success('邮件已发送');
      onClose();
    } catch {
      toast.error('发送失败');
    }
  }, [draftId, to, subject, body, compose, updateDraft, sendDraft, onClose]);

  const handleDelete = useCallback(async () => {
    if (!draftId) return;
    try {
      await deleteDraft.mutateAsync(draftId);
      toast.success('草稿已删除');
      onClose();
    } catch {
      toast.error('删除失败');
    }
  }, [draftId, deleteDraft, onClose]);

  if (draftId && isDraftLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b p-3">
        <span className="font-semibold">{draftId ? '编辑草稿' : '新邮件'}</span>
        <div className="flex items-center gap-2">
          {draftId && (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isBusy}>
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              删除
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={isBusy}>
            {(compose.isPending || updateDraft.isPending) && !sendDraft.isPending ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="mr-1 h-3.5 w-3.5" />
            )}
            存草稿
          </Button>
          <Button size="sm" onClick={handleSend} disabled={isBusy}>
            {sendDraft.isPending ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="mr-1 h-3.5 w-3.5" />
            )}
            发送
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* To field */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <span className="w-10 flex-shrink-0 text-xs text-muted-foreground">收件人</span>
        <Input
          className="h-8 border-0 p-0 text-sm shadow-none focus-visible:ring-0"
          placeholder="email@example.com"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>

      {/* Subject field */}
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <span className="w-10 flex-shrink-0 text-xs text-muted-foreground">主题</span>
        <Input
          className="h-8 border-0 p-0 text-sm shadow-none focus-visible:ring-0"
          placeholder="邮件主题"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      {/* Body */}
      <textarea
        className="flex-1 resize-none bg-background p-3 text-sm focus:outline-none"
        placeholder="在此输入正文..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
    </div>
  );
}
