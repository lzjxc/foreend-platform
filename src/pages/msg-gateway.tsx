import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Send,
  Power,
  PowerOff,
  Loader2,
  AlertTriangle,
  Clock,
  Zap,
  Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatDateTime } from '@/lib/utils';
import {
  useProviders,
  useProviderTypes,
  useChannels,
  useMsgGwHealth,
  useReloadMsgGw,
  useCreateProvider,
  useUpdateProvider,
  useDeleteProvider,
  useCreateChannel,
  useUpdateChannel,
  useDeleteChannel,
  useTestChannel,
  useNotificationStats,
  useNotificationLogs,
  useSourceStats,
} from '@/hooks/use-msg-gw';
import type {
  MsgGwProvider,
  MsgGwChannel,
  CreateProviderInput,
  UpdateProviderInput,
  CreateChannelInput,
  UpdateChannelInput,
  ProviderTypeInfo,
  NotificationStats,
  SourceStats,
} from '@/types/msg-gw';

// ==================== Constants ====================

const PROVIDER_TYPE_COLORS: Record<string, string> = {
  dingtalk: 'bg-blue-500 text-white',
  telegram: 'bg-cyan-500 text-white',
  wecom: 'bg-green-500 text-white',
  email: 'bg-orange-500 text-white',
  whatsapp: 'bg-purple-500 text-white',
};

function providerBadgeClass(type: string) {
  return PROVIDER_TYPE_COLORS[type] || 'bg-gray-500 text-white';
}

// ==================== Channel Card ====================

function ChannelCard({
  channel,
  onEdit,
  onDelete,
  onTest,
  onToggle,
}: {
  channel: MsgGwChannel;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
  onToggle: () => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{channel.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={cn('border-0', providerBadgeClass(channel.provider_type))}>
                {channel.provider_type}
              </Badge>
              <span className="text-xs text-muted-foreground">{channel.provider_name}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggle}
            title={channel.enabled ? '禁用' : '启用'}
          >
            {channel.enabled ? (
              <Power className="h-4 w-4 text-green-500" />
            ) : (
              <PowerOff className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {channel.description && (
          <p className="text-sm text-muted-foreground">{channel.description}</p>
        )}
        {channel.default_recipients?.length > 0 && (
          <p className="text-xs text-muted-foreground">
            默认接收: {channel.default_recipients.join(', ')}
          </p>
        )}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onTest}>
            <Send className="mr-1 h-3 w-3" />
            测试
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="mr-1 h-3 w-3" />
            编辑
          </Button>
          <Button variant="outline" size="sm" className="text-destructive" onClick={onDelete}>
            <Trash2 className="mr-1 h-3 w-3" />
            删除
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Provider Card ====================

function ProviderCard({
  provider,
  onEdit,
  onDelete,
  onToggle,
}: {
  provider: MsgGwProvider;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const healthColor =
    provider.healthy === true
      ? 'bg-green-500'
      : provider.healthy === false
        ? 'bg-red-500'
        : 'bg-gray-400';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{provider.name}</CardTitle>
              <span className={cn('h-2.5 w-2.5 rounded-full', healthColor)} />
            </div>
            <div className="flex items-center gap-2">
              <Badge className={cn('border-0', providerBadgeClass(provider.type))}>
                {provider.type}
              </Badge>
              <span className="text-xs text-muted-foreground">
                关联渠道: {provider.channel_count}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggle}
            title={provider.enabled ? '禁用' : '启用'}
          >
            {provider.enabled ? (
              <Power className="h-4 w-4 text-green-500" />
            ) : (
              <PowerOff className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {provider.description && (
          <p className="text-sm text-muted-foreground">{provider.description}</p>
        )}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="mr-1 h-3 w-3" />
            编辑
          </Button>
          <Button variant="outline" size="sm" className="text-destructive" onClick={onDelete}>
            <Trash2 className="mr-1 h-3 w-3" />
            删除
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== Channel Dialog ====================

function ChannelDialog({
  open,
  onOpenChange,
  channel,
  providers,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel?: MsgGwChannel | null;
  providers: MsgGwProvider[];
}) {
  const isEdit = !!channel;
  const createChannel = useCreateChannel();
  const updateChannel = useUpdateChannel();

  const [name, setName] = useState(channel?.name || '');
  const [providerId, setProviderId] = useState(channel?.provider_id || '');
  const [description, setDescription] = useState(channel?.description || '');
  const [titlePrefix, setTitlePrefix] = useState(channel?.default_title_prefix || '');
  const [recipients, setRecipients] = useState(channel?.default_recipients.join(', ') || '');
  const [enabled, setEnabled] = useState(channel?.enabled ?? true);

  const loading = createChannel.isPending || updateChannel.isPending;

  const handleSubmit = async () => {
    if (!name.trim() || !providerId) {
      toast.error('请填写渠道名称并选择 Provider');
      return;
    }
    const recipientList = recipients
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);

    try {
      if (isEdit) {
        const input: UpdateChannelInput & { name: string } = {
          name: channel!.name,
          provider_id: providerId,
          description,
          default_title_prefix: titlePrefix,
          default_recipients: recipientList,
          enabled,
        };
        await updateChannel.mutateAsync(input);
        toast.success('渠道已更新');
      } else {
        const input: CreateChannelInput = {
          name: name.trim(),
          provider_id: providerId,
          description,
          default_title_prefix: titlePrefix,
          default_recipients: recipientList,
          enabled,
        };
        await createChannel.mutateAsync(input);
        toast.success('渠道已创建');
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '操作失败';
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑渠道' : '新建渠道'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改渠道配置' : '创建一个新的消息渠道'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">名称 *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={isEdit} placeholder="如: dingtalk-team" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Provider *</label>
            <Select value={providerId} onValueChange={setProviderId}>
              <SelectTrigger>
                <SelectValue placeholder="选择 Provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">描述</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="渠道用途说明" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">标题前缀</label>
            <Input value={titlePrefix} onChange={(e) => setTitlePrefix(e.target.value)} placeholder="如: [告警]" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">默认接收人 (逗号分隔)</label>
            <Input value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="user1, user2" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="rounded" />
            启用
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? '保存' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Provider Dialog ====================

function ProviderDialog({
  open,
  onOpenChange,
  provider,
  providerTypes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider?: MsgGwProvider | null;
  providerTypes: ProviderTypeInfo[];
}) {
  const isEdit = !!provider;
  const createProvider = useCreateProvider();
  const updateProvider = useUpdateProvider();

  const [name, setName] = useState(provider?.name || '');
  const [type, setType] = useState(provider?.type || '');
  const [description, setDescription] = useState(provider?.description || '');
  const [enabled, setEnabled] = useState(provider?.enabled ?? true);
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  const loading = createProvider.isPending || updateProvider.isPending;

  const selectedType = providerTypes.find((t) => t.type === type);

  const handleSubmit = async () => {
    if (!name.trim() || !type) {
      toast.error('请填写名称并选择类型');
      return;
    }
    try {
      if (isEdit) {
        const input: UpdateProviderInput & { id: string } = {
          id: provider!.id,
          description,
          enabled,
          ...(Object.keys(credentials).length > 0 && { credentials }),
        };
        await updateProvider.mutateAsync(input);
        toast.success('Provider 已更新');
      } else {
        const input: CreateProviderInput = {
          name: name.trim(),
          type,
          description,
          enabled,
          ...(Object.keys(credentials).length > 0 && { credentials }),
        };
        await createProvider.mutateAsync(input);
        toast.success('Provider 已创建');
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '操作失败';
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑 Provider' : '新建 Provider'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改 Provider 配置和凭证' : '添加一个新的消息 Provider'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">名称 *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={isEdit} placeholder="如: dingtalk-main" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">类型 *</label>
            <Select value={type} onValueChange={setType} disabled={isEdit}>
              <SelectTrigger>
                <SelectValue placeholder="选择类型" />
              </SelectTrigger>
              <SelectContent>
                {providerTypes.map((t) => (
                  <SelectItem key={t.type} value={t.type}>
                    {t.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">描述</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provider 用途说明" />
          </div>
          {selectedType && selectedType.credential_fields.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">
                凭证 {isEdit && <span className="text-xs text-muted-foreground">(留空不修改)</span>}
              </label>
              {selectedType.credential_fields.map((field) => (
                <div key={field} className="space-y-1">
                  <label className="text-xs text-muted-foreground">{field}</label>
                  <Input
                    type="password"
                    value={credentials[field] || ''}
                    onChange={(e) => setCredentials((prev) => ({ ...prev, [field]: e.target.value }))}
                    placeholder={isEdit ? '(不修改)' : field}
                  />
                </div>
              ))}
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="rounded" />
            启用
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? '保存' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Test Dialog ====================

function TestDialog({
  open,
  onOpenChange,
  channelName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelName: string;
}) {
  const testChannel = useTestChannel();
  const [title, setTitle] = useState('测试消息');
  const [content, setContent] = useState('这是一条来自消息网关管理页面的测试消息。');

  const handleSend = async () => {
    try {
      await testChannel.mutateAsync({ name: channelName, title, content });
      toast.success('测试消息已发送');
      onOpenChange(false);
    } catch {
      toast.error('发送失败');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>测试发送: {channelName}</DialogTitle>
          <DialogDescription>发送一条测试消息到该渠道</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">标题</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">内容</label>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSend} disabled={testChannel.isPending}>
            {testChannel.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            发送
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Delete Confirm Dialog ====================

function DeleteDialog({
  open,
  onOpenChange,
  name,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onConfirm: () => void;
  loading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
          <DialogDescription>此操作不可撤销</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <span>确定要删除 <strong>{name}</strong> 吗？</span>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Notification Tasks ====================

interface NotificationTask {
  name: string;
  trigger: 'cron' | 'event';
  schedule?: string;
  channel: string;
  providerType: string;
  app: string;
  purpose: string;
}

const NOTIFICATION_TASKS: NotificationTask[] = [
  {
    name: '金融日报',
    trigger: 'cron',
    schedule: '每天 10:00',
    channel: 'finance-wecom',
    providerType: 'wecom',
    app: 'data-fetcher',
    purpose: '每日金价、汇率(GBP/CNY, USD/CNY)走势汇总，下跌提醒',
  },
  {
    name: '金融下跌提醒',
    trigger: 'event',
    channel: 'finance',
    providerType: 'dingtalk',
    app: 'data-fetcher',
    purpose: '订阅品种连续下跌N天时，钉钉群告警',
  },
  {
    name: 'Starling 交易提醒',
    trigger: 'event',
    channel: 'finance-wecom',
    providerType: 'wecom',
    app: 'finance-service',
    purpose: '新交易入账时实时通知，含AI分析(商户/类型/异常检测)',
  },
  {
    name: '作业周报',
    trigger: 'cron',
    schedule: '每周日 19:00',
    channel: 'homework',
    providerType: 'dingtalk',
    app: 'homework-api',
    purpose: '周作业统计: 提交数、正确率、常错题Top5',
  },
  {
    name: '知识复习推送',
    trigger: 'cron',
    schedule: '每天 09:00',
    channel: '钉钉互动卡片',
    providerType: 'dingtalk',
    app: 'knowledge-svc',
    purpose: '每日推送5张间隔重复复习卡片，支持"知道/不知道"按钮互动',
  },
  {
    name: 'AI 新闻日报',
    trigger: 'cron',
    schedule: '每天',
    channel: 'ai-weekly',
    providerType: 'dingtalk',
    app: 'ai-weekly-api',
    purpose: '每日AI/科技新闻摘要推送，周报含PDF下载',
  },
  {
    name: '游戏新闻日报',
    trigger: 'cron',
    schedule: '每天',
    channel: 'game-news',
    providerType: 'dingtalk',
    app: 'game-weekly-api',
    purpose: '每日游戏行业新闻(产业/产品/市场/技术)，周报含PDF下载',
  },
  {
    name: 'Argo 失败告警',
    trigger: 'event',
    channel: 'telegram',
    providerType: 'telegram',
    app: 'Argo Workflow',
    purpose: 'CronWorkflow 执行失败时自动发送 Telegram 告警',
  },
  {
    name: '邮件转发',
    trigger: 'event',
    channel: 'telegram',
    providerType: 'telegram',
    app: 'msg-gw (IMAP)',
    purpose: 'IMAP 监听收件箱，新邮件自动转发到 Telegram',
  },
];

function NotificationLogDialog({
  open,
  onOpenChange,
  channelName,
  taskName,
  source,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelName: string;
  taskName: string;
  source: string;
}) {
  const { data: logs, isLoading } = useNotificationLogs(channelName, source);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{taskName} - 通知记录</DialogTitle>
          <DialogDescription>
            渠道: {channelName} | 来源: {source} | 共 {logs?.length ?? 0} 条记录
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !logs?.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">暂无通知记录</p>
          ) : (
            <div className="space-y-1">
              {logs.map((log) => {
                const isExpanded = expandedId === log.id;
                return (
                  <div
                    key={log.id}
                    className={cn(
                      'rounded-lg border transition-colors',
                      log.success ? 'border-border' : 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30',
                      !isExpanded && 'hover:bg-muted/30 cursor-pointer'
                    )}
                  >
                    <div
                      className="flex items-center justify-between px-3 py-2 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn(
                          'h-2 w-2 rounded-full shrink-0',
                          log.success ? 'bg-green-500' : 'bg-red-500'
                        )} />
                        <span className="text-sm font-medium truncate">{log.title || '(无标题)'}</span>
                        {log.content_preview && !isExpanded && (
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            — {log.content_preview.split('\n')[0]}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {log.sent_at ? formatDateTime(log.sent_at) : '-'}
                      </span>
                    </div>
                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-border/50">
                        {log.content_preview ? (
                          <pre className="text-xs text-muted-foreground pt-2 whitespace-pre-wrap font-sans">
                            {log.content_preview}
                          </pre>
                        ) : (
                          <p className="text-xs text-muted-foreground pt-2 italic">无内容</p>
                        )}
                        {log.error && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            错误: {log.error}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NotificationTaskList({ stats, sourceStats }: { stats?: NotificationStats[]; sourceStats?: SourceStats[] }) {
  const [logDialog, setLogDialog] = useState<{ open: boolean; channelName: string; taskName: string; source: string }>({
    open: false, channelName: '', taskName: '', source: '',
  });
  const statsMap = new Map(stats?.map((s) => [s.channel_name, s]) || []);

  // Build source stats lookup: "channel:source" → SourceStats
  const sourceStatsMap = new Map(
    sourceStats?.map((s) => [`${s.channel_name}:${s.source}`, s]) || []
  );

  // Track which channels are shared by multiple tasks
  const channelUsage = new Map<string, number>();
  NOTIFICATION_TASKS.forEach((t) => {
    channelUsage.set(t.channel, (channelUsage.get(t.channel) || 0) + 1);
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        共 {NOTIFICATION_TASKS.length} 个提醒任务
      </p>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">任务名</th>
              <th className="px-4 py-3 text-left font-medium">触发方式</th>
              <th className="px-4 py-3 text-left font-medium">渠道</th>
              <th className="px-4 py-3 text-left font-medium">发送App</th>
              <th className="px-4 py-3 text-left font-medium">用途</th>
              <th className="px-4 py-3 text-right font-medium">通知次数</th>
              <th className="px-4 py-3 text-left font-medium">最后通知</th>
              <th className="px-4 py-3 text-left font-medium">首次记录</th>
            </tr>
          </thead>
          <tbody>
            {NOTIFICATION_TASKS.map((task) => {
              const channelStat = statsMap.get(task.channel);
              const srcStat = sourceStatsMap.get(`${task.channel}:${task.app}`);
              const isSharedChannel = (channelUsage.get(task.channel) || 0) > 1;

              // Use source-specific stats when available, fall back to channel stats
              const taskCount = srcStat?.total_count ?? null;
              const taskFailCount = srcStat?.fail_count ?? 0;
              const taskLastSent = srcStat?.last_sent_at ?? null;
              const taskFirstSent = srcStat?.first_sent_at ?? null;

              return (
                <tr
                  key={task.name}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                  onClick={() => setLogDialog({ open: true, channelName: task.channel, taskName: task.name, source: task.app })}
                >
                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      {task.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {task.trigger === 'cron' ? (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-xs">{task.schedule}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-xs">事件触发</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Badge className={cn('border-0 text-[11px]', providerBadgeClass(task.providerType))}>
                        {task.providerType}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{task.channel}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{task.app}</code>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs">{task.purpose}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {taskCount !== null ? (
                      <div>
                        <div>
                          <span className="text-[10px] text-muted-foreground">任务: </span>
                          <span className="font-medium">{taskCount}</span>
                          {taskFailCount > 0 && (
                            <span className="ml-1 text-xs text-red-500">({taskFailCount} 失败)</span>
                          )}
                        </div>
                        {isSharedChannel && channelStat && (
                          <div className="text-[10px] text-muted-foreground">
                            渠道合计: {channelStat.total_count}
                          </div>
                        )}
                      </div>
                    ) : channelStat ? (
                      <div>
                        {isSharedChannel && (
                          <div className="text-[10px] text-muted-foreground">任务: -</div>
                        )}
                        <div className="text-[10px] text-muted-foreground">
                          渠道合计: <span className="font-medium text-foreground text-sm">{channelStat.total_count}</span>
                          {channelStat.fail_count > 0 && (
                            <span className="ml-1 text-red-500">({channelStat.fail_count} 失败)</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {taskLastSent ? (
                      <span className="text-xs">{formatDateTime(taskLastSent)}</span>
                    ) : channelStat?.last_sent_at ? (
                      <div>
                        <span className="text-xs">{formatDateTime(channelStat.last_sent_at)}</span>
                        <div className="text-[10px] text-muted-foreground">渠道合计</div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {taskFirstSent ? (
                      <span className="text-xs">{formatDateTime(taskFirstSent)}</span>
                    ) : channelStat?.created_at ? (
                      <span className="text-xs">{formatDateTime(channelStat.created_at)}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {logDialog.open && (
        <NotificationLogDialog
          open={logDialog.open}
          onOpenChange={(open) => setLogDialog((prev) => ({ ...prev, open }))}
          channelName={logDialog.channelName}
          taskName={logDialog.taskName}
          source={logDialog.source}
        />
      )}
    </div>
  );
}

// ==================== Main Page ====================

export default function MsgGateway() {
  const { data: health } = useMsgGwHealth();
  const { data: channels, isLoading: channelsLoading } = useChannels();
  const { data: providers, isLoading: providersLoading } = useProviders();
  const { data: providerTypes } = useProviderTypes();
  const { data: notifStats } = useNotificationStats();
  const { data: srcStats } = useSourceStats();
  const reloadMsgGw = useReloadMsgGw();
  const deleteChannel = useDeleteChannel();
  const deleteProvider = useDeleteProvider();
  const updateChannel = useUpdateChannel();
  const updateProvider = useUpdateProvider();

  // Dialog states
  const [channelDialog, setChannelDialog] = useState<{ open: boolean; channel?: MsgGwChannel | null }>({ open: false });
  const [providerDialog, setProviderDialog] = useState<{ open: boolean; provider?: MsgGwProvider | null }>({ open: false });
  const [testDialog, setTestDialog] = useState<{ open: boolean; channelName: string }>({ open: false, channelName: '' });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; name: string; type: 'channel' | 'provider'; id: string }>({ open: false, name: '', type: 'channel', id: '' });

  const isHealthy = health?.status === 'ok' || health?.status === 'healthy';

  const handleReload = async () => {
    try {
      await reloadMsgGw.mutateAsync();
      toast.success('热加载完成');
    } catch {
      toast.error('热加载失败');
    }
  };

  const handleDelete = async () => {
    try {
      if (deleteDialog.type === 'channel') {
        await deleteChannel.mutateAsync(deleteDialog.id);
        toast.success('渠道已删除');
      } else {
        await deleteProvider.mutateAsync(deleteDialog.id);
        toast.success('Provider 已删除');
      }
      setDeleteDialog({ open: false, name: '', type: 'channel', id: '' });
    } catch {
      toast.error('删除失败');
    }
  };

  const handleToggleChannel = async (channel: MsgGwChannel) => {
    try {
      await updateChannel.mutateAsync({ name: channel.name, enabled: !channel.enabled });
      toast.success(channel.enabled ? '渠道已禁用' : '渠道已启用');
    } catch {
      toast.error('操作失败');
    }
  };

  const handleToggleProvider = async (provider: MsgGwProvider) => {
    try {
      await updateProvider.mutateAsync({ id: provider.id, enabled: !provider.enabled });
      toast.success(provider.enabled ? 'Provider 已禁用' : 'Provider 已启用');
    } catch {
      toast.error('操作失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">消息网关</h1>
          <span
            className={cn(
              'h-3 w-3 rounded-full',
              isHealthy ? 'bg-green-500' : 'bg-red-500'
            )}
            title={isHealthy ? '健康' : '异常'}
          />
          {health && (
            <span className="text-sm text-muted-foreground">
              {health.channels_loaded} 个渠道已加载
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={handleReload} disabled={reloadMsgGw.isPending}>
          {reloadMsgGw.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          热加载
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">提醒任务</TabsTrigger>
          <TabsTrigger value="channels">渠道管理</TabsTrigger>
          <TabsTrigger value="providers">Provider 管理</TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <NotificationTaskList stats={notifStats} sourceStats={srcStats} />
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              共 {channels?.length ?? 0} 个渠道
            </p>
            <Button size="sm" onClick={() => setChannelDialog({ open: true, channel: null })}>
              <Plus className="mr-1 h-4 w-4" />
              新建渠道
            </Button>
          </div>
          {channelsLoading ? (
            <p className="text-sm text-muted-foreground">加载中...</p>
          ) : !channels?.length ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                暂无渠道，点击「新建渠道」开始配置
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {channels.map((ch) => (
                <ChannelCard
                  key={ch.id}
                  channel={ch}
                  onEdit={() => setChannelDialog({ open: true, channel: ch })}
                  onDelete={() => setDeleteDialog({ open: true, name: ch.name, type: 'channel', id: ch.name })}
                  onTest={() => setTestDialog({ open: true, channelName: ch.name })}
                  onToggle={() => handleToggleChannel(ch)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Providers Tab */}
        <TabsContent value="providers">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              共 {providers?.length ?? 0} 个 Provider
            </p>
            <Button size="sm" onClick={() => setProviderDialog({ open: true, provider: null })}>
              <Plus className="mr-1 h-4 w-4" />
              新建 Provider
            </Button>
          </div>
          {providersLoading ? (
            <p className="text-sm text-muted-foreground">加载中...</p>
          ) : !providers?.length ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                暂无 Provider，点击「新建 Provider」开始配置
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {providers.map((p) => (
                <ProviderCard
                  key={p.id}
                  provider={p}
                  onEdit={() => setProviderDialog({ open: true, provider: p })}
                  onDelete={() => setDeleteDialog({ open: true, name: p.name, type: 'provider', id: p.id })}
                  onToggle={() => handleToggleProvider(p)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {channelDialog.open && (
        <ChannelDialog
          open={channelDialog.open}
          onOpenChange={(open) => setChannelDialog({ open, channel: null })}
          channel={channelDialog.channel}
          providers={providers || []}
        />
      )}

      {providerDialog.open && (
        <ProviderDialog
          open={providerDialog.open}
          onOpenChange={(open) => setProviderDialog({ open, provider: null })}
          provider={providerDialog.provider}
          providerTypes={providerTypes || []}
        />
      )}

      {testDialog.open && (
        <TestDialog
          open={testDialog.open}
          onOpenChange={(open) => setTestDialog({ open, channelName: '' })}
          channelName={testDialog.channelName}
        />
      )}

      <DeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        name={deleteDialog.name}
        onConfirm={handleDelete}
        loading={deleteChannel.isPending || deleteProvider.isPending}
      />
    </div>
  );
}
