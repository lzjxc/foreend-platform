import { useState, useEffect, useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Save, Trash2, Loader2, X, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { useDraftDetail, useCompose, useUpdateDraft, useDeleteDraft, useSendDraft } from '@/hooks/use-emails';
import type { EmailAttachment } from '@/types/email';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AttachmentChipProps {
  name: string;
  size: number;
  onRemove?: () => void;
}

function AttachmentChip({ name, size, onRemove }: AttachmentChipProps) {
  return (
    <span className="flex items-center gap-1 rounded-full border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
      <Paperclip className="h-3 w-3 flex-shrink-0" />
      <span className="max-w-[140px] truncate">{name}</span>
      <span className="flex-shrink-0 opacity-60">({formatFileSize(size)})</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 flex-shrink-0 rounded-full hover:text-destructive focus:outline-none"
          aria-label={`删除附件 ${name}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

interface EmailComposeProps {
  draftId?: string;
  onClose: () => void;
}

export function EmailCompose({ draftId, onClose }: EmailComposeProps) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<EmailAttachment[]>([]);

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
      setExistingAttachments(draft.attachments ?? []);
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

  const onDrop = useCallback((accepted: File[], rejected: FileRejection[]) => {
    rejected.forEach(({ file, errors }) => {
      if (errors.some((e) => e.code === 'file-too-large')) {
        toast.error(`${file.name} 超过 10 MB 限制`);
      }
    });
    if (accepted.length === 0) return;
    setNewFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name + f.size));
      const toAdd = accepted.filter((f) => !existing.has(f.name + f.size));
      return [...prev, ...toAdd];
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    maxSize: MAX_FILE_SIZE,
    noClick: true,
    noKeyboard: true,
  });

  const removeNewFile = useCallback((index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const isBusy = compose.isPending || updateDraft.isPending || deleteDraft.isPending || sendDraft.isPending;

  const handleSaveDraft = useCallback(async () => {
    if (!to.trim()) { toast.error('请填写收件人'); return; }
    try {
      if (draftId) {
        await updateDraft.mutateAsync({ id: draftId, to: [to.trim()], subject, body, attachments: newFiles });
        toast.success('草稿已保存');
      } else {
        await compose.mutateAsync({ to: [to.trim()], subject, body, send: false, attachments: newFiles });
        toast.success('草稿已保存');
      }
      onClose();
    } catch {
      toast.error('保存失败');
    }
  }, [draftId, to, subject, body, newFiles, compose, updateDraft, onClose]);

  const handleSend = useCallback(async () => {
    if (!to.trim()) { toast.error('请填写收件人'); return; }
    if (!subject.trim()) { toast.error('请填写主题'); return; }
    try {
      if (draftId) {
        await updateDraft.mutateAsync({ id: draftId, to: [to.trim()], subject, body, attachments: newFiles });
        await sendDraft.mutateAsync(draftId);
      } else {
        await compose.mutateAsync({ to: [to.trim()], subject, body, send: true, attachments: newFiles });
      }
      toast.success('邮件已发送');
      onClose();
    } catch {
      toast.error('发送失败');
    }
  }, [draftId, to, subject, body, newFiles, compose, updateDraft, sendDraft, onClose]);

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

  const hasAttachments = existingAttachments.length > 0 || newFiles.length > 0;

  return (
    <div
      className="flex h-full flex-col"
      {...getRootProps()}
    >
      <input {...getInputProps()} />

      {/* Drag overlay */}
      {isDragActive && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-md border-2 border-dashed border-primary bg-primary/5">
          <div className="flex flex-col items-center gap-2 text-primary">
            <Paperclip className="h-8 w-8" />
            <span className="text-sm font-medium">松开以添加附件</span>
          </div>
        </div>
      )}

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
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={open} disabled={isBusy} title="添加附件">
            <Paperclip className="h-4 w-4" />
          </Button>
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

      {/* Attachment area */}
      {hasAttachments && (
        <div className="flex flex-wrap gap-1.5 border-t px-3 py-2">
          {existingAttachments.map((att) => (
            <AttachmentChip key={att.filename + att.size} name={att.filename} size={att.size} />
          ))}
          {newFiles.map((file, i) => (
            <AttachmentChip
              key={file.name + file.size + i}
              name={file.name}
              size={file.size}
              onRemove={() => removeNewFile(i)}
            />
          ))}
        </div>
      )}

      {/* Drop hint when no attachments */}
      {!hasAttachments && (
        <div className="border-t px-3 py-1.5 text-center text-xs text-muted-foreground/50">
          拖拽文件到此处或点击 <Paperclip className="inline h-3 w-3" /> 添加附件（单个文件 ≤ 10 MB）
        </div>
      )}
    </div>
  );
}
