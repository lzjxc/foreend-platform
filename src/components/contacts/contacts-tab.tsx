import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MessageCircle,
  Star,
  X,
} from 'lucide-react';
import {
  usePersonContacts,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from '@/hooks/use-contacts';
import type { Contact, ContactCreate, ContactType } from '@/types';
import { CONTACT_TYPE_OPTIONS, maskPhoneNumber, maskEmail } from '@/types/contact';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Contact type label mapping
const contactTypeLabels: Record<string, string> = Object.fromEntries(
  CONTACT_TYPE_OPTIONS.map((opt) => [opt.value, opt.label])
);

// Get icon for contact type
function getContactIcon(type: ContactType) {
  switch (type) {
    case 'mobile':
    case 'phone':
    case 'work':
    case 'emergency':
      return Phone;
    case 'email':
      return Mail;
    case 'wechat':
    case 'qq':
    case 'weibo':
      return MessageCircle;
    default:
      return Phone;
  }
}

// Get color for contact type
function getContactColor(type: ContactType) {
  switch (type) {
    case 'mobile':
      return 'text-green-500';
    case 'phone':
    case 'work':
      return 'text-blue-500';
    case 'email':
      return 'text-purple-500';
    case 'wechat':
      return 'text-emerald-500';
    case 'qq':
      return 'text-cyan-500';
    case 'emergency':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
}

// Mask value based on type
function maskValue(type: ContactType, value: string, showFull: boolean): string {
  if (showFull) return value;
  switch (type) {
    case 'mobile':
    case 'phone':
    case 'work':
    case 'emergency':
      return maskPhoneNumber(value);
    case 'email':
      return maskEmail(value);
    default:
      return value;
  }
}

// Contact form component
interface ContactFormProps {
  contact?: Contact;
  personId: string;
  onSubmit: (data: ContactCreate) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function ContactForm({ contact, personId, onSubmit, onCancel, isLoading }: ContactFormProps) {
  const [formData, setFormData] = useState({
    type: contact?.type || 'mobile',
    value: contact?.value || '',
    label: contact?.label || '',
    is_primary: contact?.is_primary || false,
    notes: contact?.notes || '',
  });

  // Update form data when contact prop changes (for edit mode)
  useEffect(() => {
    if (contact) {
      setFormData({
        type: contact.type || 'mobile',
        value: contact.value || '',
        label: contact.label || '',
        is_primary: contact.is_primary || false,
        notes: contact.notes || '',
      });
    }
  }, [contact]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.value.trim()) {
      toast.error('请输入联系方式');
      return;
    }
    onSubmit({
      person_id: personId,
      type: formData.type as ContactType,
      value: formData.value.trim(),
      label: formData.label.trim() || undefined,
      is_primary: formData.is_primary,
      notes: formData.notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">联系类型 *</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as ContactType })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          >
            {CONTACT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">联系方式 *</label>
          <input
            type="text"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            placeholder={formData.type === 'email' ? '例: example@mail.com' : '例: 13812345678'}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">自定义标签</label>
          <input
            type="text"
            value={formData.label}
            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            placeholder="例: 工作手机、家庭邮箱"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formData.is_primary}
              onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
            设为主要联系方式
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">备注</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="备注信息..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          取消
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '保存中...' : contact ? '更新' : '添加'}
        </Button>
      </div>
    </form>
  );
}

// Main ContactsTab component
interface ContactsTabProps {
  personId: string;
}

export default function ContactsTab({ personId }: ContactsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const { data: contacts, isLoading, refetch } = usePersonContacts(personId);
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  // Toggle reveal for a contact
  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Handle create contact
  const handleCreate = async (data: ContactCreate) => {
    try {
      await createContact.mutateAsync(data);
      toast.success('联系方式添加成功');
      setShowForm(false);
    } catch (error) {
      toast.error('添加失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // Handle update contact
  const handleUpdate = async (data: ContactCreate) => {
    if (!editingContact) return;
    try {
      await updateContact.mutateAsync({
        id: editingContact.id,
        personId: personId,
        data: {
          type: data.type,
          value: data.value,
          label: data.label,
          is_primary: data.is_primary,
          notes: data.notes,
        },
      });
      toast.success('联系方式更新成功');
      setEditingContact(null);
    } catch (error) {
      toast.error('更新失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // Handle delete contact
  const handleDelete = async (contactId: string) => {
    if (!confirm('确定要删除这个联系方式吗？此操作无法撤销。')) return;

    try {
      await deleteContact.mutateAsync({ id: contactId, personId: personId });
      toast.success('联系方式已删除');
      refetch();
    } catch (error) {
      toast.error('删除失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // Close form
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingContact(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">联系方式</h3>
          <Badge variant="secondary">{contacts?.length || 0}</Badge>
        </div>
        {!showForm && !editingContact && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-1 h-4 w-4" />
            添加联系方式
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(showForm || editingContact) && (
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-medium">
                {editingContact ? '编辑联系方式' : '添加联系方式'}
              </h4>
              <Button variant="ghost" size="icon" onClick={handleCloseForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ContactForm
              contact={editingContact || undefined}
              personId={personId}
              onSubmit={editingContact ? handleUpdate : handleCreate}
              onCancel={handleCloseForm}
              isLoading={createContact.isPending || updateContact.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Contacts List */}
      {contacts && contacts.length > 0 ? (
        <div className="space-y-3">
          {contacts.map((contact) => {
            const Icon = getContactIcon(contact.type);
            const colorClass = getContactColor(contact.type);
            const isRevealed = revealedIds.has(contact.id);

            return (
              <Card key={contact.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={cn('p-2 rounded-full bg-muted', colorClass)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="font-mono text-lg cursor-pointer hover:text-primary transition-colors"
                            onClick={() => toggleReveal(contact.id)}
                            title={isRevealed ? '点击隐藏' : '点击显示完整内容'}
                          >
                            {maskValue(contact.type, contact.value, isRevealed)}
                          </span>
                          {contact.is_primary && (
                            <Badge variant="default" className="gap-1">
                              <Star className="h-3 w-3" />
                              主要
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {contactTypeLabels[contact.type] || contact.type}
                          </Badge>
                          {contact.label && (
                            <span className="text-xs">{contact.label}</span>
                          )}
                        </div>
                        {contact.notes && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {contact.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingContact(contact)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(contact.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        !showForm && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Phone className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">暂无联系方式</p>
              <p className="text-sm text-muted-foreground mt-1">
                点击上方"添加联系方式"按钮添加
              </p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
