import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEmailSettings, useUpdateEmailSettings } from '@/hooks/use-emails';

interface EmailSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailSettingsDialog({ open, onOpenChange }: EmailSettingsDialogProps) {
  const { data: settings } = useEmailSettings();
  const updateSettings = useUpdateEmailSettings();

  const [senders, setSenders] = useState<string[]>([]);
  const [domains, setDomains] = useState<string[]>([]);
  const [llmEnabled, setLlmEnabled] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('08:00');
  const [newSender, setNewSender] = useState('');
  const [newDomain, setNewDomain] = useState('');

  useEffect(() => {
    if (settings) {
      setSenders(settings.whitelist_senders);
      setDomains(settings.whitelist_domains);
      setLlmEnabled(settings.llm_analysis_enabled);
      setQuietHoursEnabled(!!settings.quiet_hours);
      if (settings.quiet_hours) {
        setQuietStart(settings.quiet_hours.start);
        setQuietEnd(settings.quiet_hours.end);
      }
    }
  }, [settings]);

  const addSender = () => {
    const v = newSender.trim();
    if (v && !senders.includes(v)) {
      setSenders([...senders, v]);
      setNewSender('');
    }
  };

  const addDomain = () => {
    const v = newDomain.trim();
    if (v && !domains.includes(v)) {
      setDomains([...domains, v]);
      setNewDomain('');
    }
  };

  const handleSave = async () => {
    // Auto-add any pending input before saving
    const finalSenders = [...senders];
    const finalDomains = [...domains];
    const pendingSender = newSender.trim();
    const pendingDomain = newDomain.trim();
    if (pendingSender && !finalSenders.includes(pendingSender)) {
      finalSenders.push(pendingSender);
      setSenders(finalSenders);
      setNewSender('');
    }
    if (pendingDomain && !finalDomains.includes(pendingDomain)) {
      finalDomains.push(pendingDomain);
      setDomains(finalDomains);
      setNewDomain('');
    }
    try {
      await updateSettings.mutateAsync({
        whitelist_senders: finalSenders,
        whitelist_domains: finalDomains,
        llm_analysis_enabled: llmEnabled,
        quiet_hours: quietHoursEnabled ? { start: quietStart, end: quietEnd } : null,
      });
      toast.success('设置已保存');
      onOpenChange(false);
    } catch {
      toast.error('保存失败');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>邮件设置</DialogTitle>
          <DialogDescription>管理邮件白名单和分析设置</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Whitelist senders */}
          <div>
            <label className="text-sm font-medium">白名单发件人</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {senders.map((s) => (
                <Badge key={s} variant="secondary" className="gap-1">
                  {s}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setSenders(senders.filter((x) => x !== s))}
                  />
                </Badge>
              ))}
            </div>
            <div className="mt-1 flex gap-1">
              <Input
                placeholder="添加发件人邮箱..."
                value={newSender}
                onChange={(e) => setNewSender(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSender()}
                className="h-8 text-sm"
              />
              <Button variant="ghost" size="sm" onClick={addSender}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Whitelist domains */}
          <div>
            <label className="text-sm font-medium">白名单域名</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {domains.map((d) => (
                <Badge key={d} variant="secondary" className="gap-1">
                  {d}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => setDomains(domains.filter((x) => x !== d))}
                  />
                </Badge>
              ))}
            </div>
            <div className="mt-1 flex gap-1">
              <Input
                placeholder="添加域名..."
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addDomain()}
                className="h-8 text-sm"
              />
              <Button variant="ghost" size="sm" onClick={addDomain}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* LLM toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">LLM 智能分析</label>
              <p className="text-xs text-muted-foreground">使用 AI 分析邮件重要性</p>
            </div>
            <Button
              variant={llmEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLlmEnabled(!llmEnabled)}
            >
              {llmEnabled ? '已启用' : '已禁用'}
            </Button>
          </div>

          {/* Quiet hours */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">静默时段</label>
                <p className="text-xs text-muted-foreground">在指定时段内不推送重要邮件通知</p>
              </div>
              <Button
                variant={quietHoursEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => setQuietHoursEnabled(!quietHoursEnabled)}
              >
                {quietHoursEnabled ? '已启用' : '已禁用'}
              </Button>
            </div>
            {quietHoursEnabled && (
              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="time"
                  value={quietStart}
                  onChange={(e) => setQuietStart(e.target.value)}
                  className="h-8 w-28 text-sm"
                />
                <span className="text-sm text-muted-foreground">至</span>
                <Input
                  type="time"
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(e.target.value)}
                  className="h-8 w-28 text-sm"
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
