import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  KeyRound,
  Plus,
  Edit2,
  Trash2,
  X,
  Eye,
  EyeOff,
  Globe,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import {
  usePersonCredentials,
  useCreateCredential,
  useUpdateCredential,
  useDeleteCredential,
} from '@/hooks/use-credentials';
import type { WebCredential, WebCredentialCreate } from '@/types/credential';
import {
  CREDENTIAL_CATEGORY_OPTIONS,
  CREDENTIAL_CATEGORY_LABELS,
  maskPassword,
} from '@/types/credential';
import { toast } from 'sonner';

// Credential form component
interface CredentialFormProps {
  credential?: WebCredential;
  personId: string;
  onSubmit: (data: WebCredentialCreate) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function CredentialForm({ credential, onSubmit, onCancel, isLoading }: CredentialFormProps) {
  const [formData, setFormData] = useState({
    credential_key: credential?.credential_key || '',
    site_name: credential?.site_name || '',
    site_url: credential?.site_url || '',
    category: credential?.category || '',
    username: credential?.username || '',
    password: credential?.password || '',
    notes: credential?.notes || '',
  });

  useEffect(() => {
    if (credential) {
      setFormData({
        credential_key: credential.credential_key || '',
        site_name: credential.site_name || '',
        site_url: credential.site_url || '',
        category: credential.category || '',
        username: credential.username || '',
        password: credential.password || '',
        notes: credential.notes || '',
      });
    }
  }, [credential]);

  const [showPassword, setShowPassword] = useState(false);

  // Auto-generate credential_key from site_name
  const handleSiteNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      site_name: value,
      // Only auto-fill key if it's empty or was auto-generated
      credential_key: prev.credential_key === '' || prev.credential_key === prev.site_name.toLowerCase().replace(/\s+/g, '_')
        ? value.toLowerCase().replace(/\s+/g, '_')
        : prev.credential_key,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      credential_key: formData.credential_key,
      site_name: formData.site_name,
      site_url: formData.site_url || undefined,
      category: formData.category || undefined,
      username: formData.username,
      password: formData.password,
      notes: formData.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">网站名称 *</label>
          <input
            type="text"
            value={formData.site_name}
            onChange={(e) => handleSiteNameChange(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
            placeholder="如 Goodlord, HMRC, NHS"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">标识键 *</label>
          <input
            type="text"
            value={formData.credential_key}
            onChange={(e) => setFormData({ ...formData, credential_key: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            required
            placeholder="如 goodlord, hmrc"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">网站地址</label>
          <input
            type="url"
            value={formData.site_url}
            onChange={(e) => setFormData({ ...formData, site_url: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="https://..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">分类</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">未分类</option>
            {CREDENTIAL_CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">用户名 *</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
            required
            placeholder="用户名/邮箱/手机号"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">密码 *</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm font-mono"
              required
              placeholder="密码"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium">备注</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]"
            placeholder="可选备注（如安全问题答案等）"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          取消
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '保存中...' : credential ? '更新' : '添加'}
        </Button>
      </div>
    </form>
  );
}

// Credential card with sensitive data masking
interface CredentialCardProps {
  credential: WebCredential;
  onEdit: () => void;
  onDelete: () => void;
}

function CredentialCard({ credential, onEdit, onDelete }: CredentialCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showUsername, setShowUsername] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('复制失败');
    }
  };

  const maskUsername = (username: string): string => {
    if (username.length <= 4) return '****';
    // If it's an email, mask the local part
    if (username.includes('@')) {
      const [local, domain] = username.split('@');
      return local.slice(0, 2) + '***@' + domain;
    }
    return username.slice(0, 2) + '****' + username.slice(-2);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1 min-w-0">
            {/* Header: site name + category */}
            <div className="flex items-center gap-2 flex-wrap">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium">{credential.site_name}</span>
              {credential.category && (
                <Badge variant="outline" className="text-xs">
                  {CREDENTIAL_CATEGORY_LABELS[credential.category] || credential.category}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs font-mono">
                {credential.credential_key}
              </Badge>
            </div>

            {/* Site URL */}
            {credential.site_url && (
              <a
                href={credential.site_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-500 hover:underline truncate"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                <span className="truncate">{credential.site_url}</span>
              </a>
            )}

            {/* Username */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground shrink-0">用户名:</span>
              <span className="font-mono text-sm truncate">
                {showUsername ? credential.username : maskUsername(credential.username)}
              </span>
              <button
                type="button"
                onClick={() => setShowUsername(!showUsername)}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                {showUsername ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => handleCopy(credential.username, 'username')}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                {copiedField === 'username' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Password */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground shrink-0">密码:</span>
              <span className="font-mono text-sm">
                {showPassword ? credential.password : maskPassword(credential.password)}
              </span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => handleCopy(credential.password, 'password')}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                {copiedField === 'password' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Notes */}
            {credential.notes && (
              <p className="text-sm text-muted-foreground mt-2">
                备注: {credential.notes}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main CredentialsTab component
interface CredentialsTabProps {
  personId: string;
}

export default function CredentialsTab({ personId }: CredentialsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingCredential, setEditingCredential] = useState<WebCredential | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');

  const { data: credentials, isLoading, refetch } = usePersonCredentials(personId);
  const createCredential = useCreateCredential();
  const updateCredential = useUpdateCredential();
  const deleteCredential = useDeleteCredential();

  const filteredCredentials = credentials?.filter((cred) =>
    filterCategory ? cred.category === filterCategory : true
  );

  const handleCreate = async (data: WebCredentialCreate) => {
    try {
      await createCredential.mutateAsync({ personId, data });
      toast.success('账号添加成功');
      setShowForm(false);
      refetch();
    } catch (error) {
      toast.error('添加失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleUpdate = async (data: WebCredentialCreate) => {
    if (!editingCredential) return;
    try {
      await updateCredential.mutateAsync({
        personId,
        credentialId: editingCredential.id,
        data,
      });
      toast.success('账号更新成功');
      setEditingCredential(null);
      refetch();
    } catch (error) {
      toast.error('更新失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleDelete = async (credentialId: string) => {
    if (!confirm('确定要删除这个账号密码吗？此操作无法撤销。')) return;
    try {
      await deleteCredential.mutateAsync({ personId, credentialId });
      toast.success('账号已删除');
      refetch();
    } catch (error) {
      toast.error('删除失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCredential(null);
  };

  // Get unique categories for filter
  const categories = [...new Set(credentials?.map((c) => c.category).filter(Boolean) as string[])];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">网站账号</h3>
          <Badge variant="secondary">{credentials?.length || 0}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Category filter */}
          {categories.length > 0 && (
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              <option value="">全部分类</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {CREDENTIAL_CATEGORY_LABELS[cat] || cat}
                </option>
              ))}
            </select>
          )}
          {!showForm && !editingCredential && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="mr-1 h-4 w-4" />
              添加账号
            </Button>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showForm || editingCredential) && (
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-medium">
                {editingCredential ? '编辑账号' : '添加账号'}
              </h4>
              <Button variant="ghost" size="icon" onClick={handleCloseForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CredentialForm
              credential={editingCredential || undefined}
              personId={personId}
              onSubmit={editingCredential ? handleUpdate : handleCreate}
              onCancel={handleCloseForm}
              isLoading={createCredential.isPending || updateCredential.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Credentials List */}
      {filteredCredentials && filteredCredentials.length > 0 ? (
        <div className="space-y-3">
          {filteredCredentials.map((cred) => (
            <CredentialCard
              key={cred.id}
              credential={cred}
              onEdit={() => setEditingCredential(cred)}
              onDelete={() => handleDelete(cred.id)}
            />
          ))}
        </div>
      ) : (
        !showForm && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <KeyRound className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {filterCategory ? '该分类下暂无账号记录' : '暂无网站账号记录'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                点击上方"添加账号"按钮添加，如 Goodlord、HMRC 等
              </p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
