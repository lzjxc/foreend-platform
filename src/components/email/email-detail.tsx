import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Mail, Star, Paperclip, Send, Loader2, X, Home } from 'lucide-react';
import DOMPurify from 'dompurify';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { toast } from 'sonner';
import { useEmailDetail, useMarkEmailRead, useGenerateDraft, useSendReply } from '@/hooks/use-emails';

interface EmailDetailProps {
  emailId: string | null;
}

const IMPORTANCE_LABELS: Record<string, string> = {
  whitelist: '白名单',
  llm: 'AI 分析',
};

export function EmailDetail({ emailId }: EmailDetailProps) {
  const navigate = useNavigate();
  const { data: email, isLoading } = useEmailDetail(emailId || '');
  const markRead = useMarkEmailRead();
  const generateDraft = useGenerateDraft();
  const sendReply = useSendReply();

  const [replyMode, setReplyMode] = useState<'idle' | 'intent' | 'draft'>('idle');
  const [intent, setIntent] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const markedRef = useRef<string | null>(null);

  // Auto mark-as-read (guard against re-calls)
  useEffect(() => {
    if (email && !email.is_read && markedRef.current !== email.id) {
      markedRef.current = email.id;
      markRead.mutate(email.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email?.id, email?.is_read]);

  // Reset reply mode when switching emails
  useEffect(() => {
    setReplyMode('idle');
    setIntent('');
    setDraftBody('');
  }, [emailId]);

  if (!emailId) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center text-muted-foreground">
          <Mail className="mx-auto mb-2 h-12 w-12 opacity-30" />
          <p>选择一封邮件查看详情</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        邮件未找到
      </div>
    );
  }

  const handleGenerateDraft = async () => {
    if (!intent.trim()) return;
    try {
      const result = await generateDraft.mutateAsync({ id: email.id, intent });
      setDraftBody(result.draft);
      setReplyMode('draft');
    } catch {
      toast.error('生成草稿失败');
    }
  };

  const handleSendReply = async () => {
    if (!draftBody.trim()) return;
    try {
      await sendReply.mutateAsync({ id: email.id, body: draftBody });
      toast.success('回复已发送');
      setReplyMode('idle');
      setIntent('');
      setDraftBody('');
    } catch {
      toast.error('发送失败');
    }
  };

  const sanitizedHtml = email.body_html
    ? DOMPurify.sanitize(email.body_html, { USE_PROFILES: { html: true } })
    : null;

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-start gap-2">
          <h2 className="flex-1 text-lg font-semibold">{email.subject || '(无主题)'}</h2>
          {email.is_important && (
            <Badge variant="outline" className="flex-shrink-0 border-amber-500 text-amber-500">
              <Star className="mr-1 h-3 w-3 fill-amber-500" />
              {IMPORTANCE_LABELS[email.importance_rule || ''] || '重要'}
            </Badge>
          )}
        </div>
        {email.is_important && email.importance_reason && (
          <p className="mt-1 text-xs text-muted-foreground">{email.importance_reason}</p>
        )}
        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">{email.from_name || email.from_address}</span>
            {email.from_name && <span className="ml-1">&lt;{email.from_address}&gt;</span>}
          </p>
          <p>收件人: {email.to_addresses.join(', ')}</p>
          {email.cc_addresses.length > 0 && (
            <p>抄送: {email.cc_addresses.join(', ')}</p>
          )}
          <p>{format(new Date(email.email_date), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</p>
        </div>
        {email.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {email.attachments.map((att, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                <Paperclip className="mr-1 h-3 w-3" />
                {att.filename} ({(att.size / 1024).toFixed(0)}KB)
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 p-4">
        {sanitizedHtml ? (
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
        ) : (
          <pre className="whitespace-pre-wrap text-sm">{email.body_text}</pre>
        )}
      </div>

      {/* Reply area — only for inbound emails */}
      {email.direction === 'inbound' && (
        <div className="border-t p-4">
          {replyMode === 'idle' && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setReplyMode('intent')}>
                <Send className="mr-2 h-4 w-4" />
                回复
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/life/housing/new?email_id=${email.id}`)}
              >
                <Home className="mr-2 h-4 w-4" />
                初始化为房产
              </Button>
            </div>
          )}

          {replyMode === 'intent' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">简要说明回复意图：</p>
              <div className="flex gap-2">
                <Input
                  placeholder="例如：同意这个方案、请求延期..."
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateDraft()}
                />
                <Button onClick={handleGenerateDraft} disabled={generateDraft.isPending || !intent.trim()}>
                  {generateDraft.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  生成草稿
                </Button>
                <Button variant="ghost" onClick={() => setReplyMode('idle')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {generateDraft.isPending && (
                <p className="text-xs text-muted-foreground">正在生成回复草稿，请稍候...</p>
              )}
            </div>
          )}

          {replyMode === 'draft' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">回复草稿（可编辑）：</p>
              <textarea
                className="min-h-[120px] w-full rounded-md border bg-background p-3 text-sm"
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={handleSendReply} disabled={sendReply.isPending || !draftBody.trim()}>
                  {sendReply.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  确认发送
                </Button>
                <Button variant="ghost" onClick={() => { setReplyMode('idle'); setDraftBody(''); }}>
                  取消
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
