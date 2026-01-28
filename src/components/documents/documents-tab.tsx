import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  X,
} from 'lucide-react';
import {
  usePersonDocuments,
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
} from '@/hooks/use-documents';
import type { Document, DocumentCreate, DocumentUpdate } from '@/types';
import {
  DOCUMENT_TYPE_OPTIONS,
  isExpiringSoon,
  isExpired,
  maskDocumentNumber,
} from '@/types/document';
import { toast } from 'sonner';

// Document type label mapping
const documentTypeLabels: Record<string, string> = Object.fromEntries(
  DOCUMENT_TYPE_OPTIONS.map((opt) => [opt.value, opt.label])
);

// Document form component
interface DocumentFormProps {
  document?: Document;
  onSubmit: (data: Omit<DocumentCreate, 'person_id'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function DocumentForm({ document, onSubmit, onCancel, isLoading }: DocumentFormProps) {
  const [formData, setFormData] = useState({
    type: document?.type || 'id_card',
    number: document?.number || '',
    issue_date: document?.issue_date || '',
    expiry_date: document?.expiry_date || '',
    issuing_authority: document?.issuing_authority || '',
    notes: document?.notes || '',
  });

  useEffect(() => {
    if (document) {
      setFormData({
        type: document.type || 'id_card',
        number: document.number || '',
        issue_date: document.issue_date || '',
        expiry_date: document.expiry_date || '',
        issuing_authority: document.issuing_authority || '',
        notes: document.notes || '',
      });
    }
  }, [document]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type: formData.type as DocumentCreate['type'],
      number: formData.number,
      issue_date: formData.issue_date || undefined,
      expiry_date: formData.expiry_date || undefined,
      issuing_authority: formData.issuing_authority || undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">证件类型 *</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as DocumentCreate['type'] })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          >
            {DOCUMENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">证件号码 *</label>
          <input
            type="text"
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
            placeholder="请输入证件号码"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">签发日期</label>
          <input
            type="date"
            value={formData.issue_date}
            onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">过期日期</label>
          <input
            type="date"
            value={formData.expiry_date}
            onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium">签发机关</label>
          <input
            type="text"
            value={formData.issuing_authority}
            onChange={(e) => setFormData({ ...formData, issuing_authority: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="请输入签发机关"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium">备注</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[60px]"
            placeholder="可选备注信息"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          取消
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '保存中...' : document ? '更新' : '添加'}
        </Button>
      </div>
    </form>
  );
}

// Document card component
interface DocumentCardProps {
  document: Document;
  onEdit: () => void;
  onDelete: () => void;
}

function DocumentCard({ document, onEdit, onDelete }: DocumentCardProps) {
  const [showNumber, setShowNumber] = useState(false);
  const expired = isExpired(document.expiry_date);
  const expiringSoon = isExpiringSoon(document.expiry_date, 90);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {documentTypeLabels[document.type] || document.type}
              </span>
              {expired && (
                <Badge variant="destructive" className="text-xs">
                  已过期
                </Badge>
              )}
              {!expired && expiringSoon && (
                <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">
                  即将过期
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">证件号码:</span>
              <span className="font-mono">
                {showNumber ? document.number : maskDocumentNumber(document.number)}
              </span>
              <button
                type="button"
                onClick={() => setShowNumber(!showNumber)}
                className="text-muted-foreground hover:text-foreground"
              >
                {showNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {document.expiry_date && (
              <p className="text-sm text-muted-foreground">
                过期日期: {document.expiry_date}
                {expired && <span className="text-red-500 ml-2">(已过期)</span>}
                {!expired && expiringSoon && (
                  <span className="text-orange-500 ml-2">
                    (剩余 {Math.ceil((new Date(document.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} 天)
                  </span>
                )}
              </p>
            )}

            {document.issuing_authority && (
              <p className="text-sm text-muted-foreground">
                签发机关: {document.issuing_authority}
              </p>
            )}

            {document.notes && (
              <p className="text-sm text-muted-foreground mt-2">
                备注: {document.notes}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
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

// Main DocumentsTab component
interface DocumentsTabProps {
  personId: string;
}

export default function DocumentsTab({ personId }: DocumentsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);

  const { data: documents, isLoading, refetch } = usePersonDocuments(personId);
  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();

  // Handle create document
  const handleCreate = async (data: Omit<DocumentCreate, 'person_id'>) => {
    try {
      await createDocument.mutateAsync({ personId, data });
      toast.success('证件添加成功');
      setShowForm(false);
      refetch();
    } catch (error) {
      toast.error('添加失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // Handle update document
  const handleUpdate = async (data: Omit<DocumentCreate, 'person_id'>) => {
    if (!editingDocument) return;
    try {
      await updateDocument.mutateAsync({
        personId,
        docId: editingDocument.id,
        data: data as DocumentUpdate,
      });
      toast.success('证件更新成功');
      setEditingDocument(null);
      refetch();
    } catch (error) {
      toast.error('更新失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // Handle delete document
  const handleDelete = async (docId: string) => {
    if (!confirm('确定要删除这个证件记录吗？此操作无法撤销。')) return;
    try {
      await deleteDocument.mutateAsync({ personId, docId });
      toast.success('证件已删除');
      refetch();
    } catch (error) {
      toast.error('删除失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // Close form
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingDocument(null);
  };

  // Count expiring documents
  const countExpiring = (docs: Document[] | undefined) => {
    if (!docs) return 0;
    return docs.filter((d) => !isExpired(d.expiry_date) && isExpiringSoon(d.expiry_date, 90)).length;
  };

  const countExpired = (docs: Document[] | undefined) => {
    if (!docs) return 0;
    return docs.filter((d) => isExpired(d.expiry_date)).length;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
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
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">证件管理</h3>
          <Badge variant="secondary">{documents?.length || 0}</Badge>
        </div>
        {!showForm && !editingDocument && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-1 h-4 w-4" />
            添加证件
          </Button>
        )}
      </div>

      {/* Expiring warning */}
      {documents && (countExpiring(documents) > 0 || countExpired(documents) > 0) && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <span className="text-sm">
            {countExpired(documents) > 0 && (
              <span className="text-red-500 font-medium">
                {countExpired(documents)} 个证件已过期
              </span>
            )}
            {countExpired(documents) > 0 && countExpiring(documents) > 0 && '，'}
            {countExpiring(documents) > 0 && (
              <span className="text-orange-500 font-medium">
                {countExpiring(documents)} 个证件即将过期
              </span>
            )}
          </span>
        </div>
      )}

      {/* Add/Edit Form */}
      {(showForm || editingDocument) && (
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-medium">
                {editingDocument ? '编辑证件' : '添加证件'}
              </h4>
              <Button variant="ghost" size="icon" onClick={handleCloseForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DocumentForm
              document={editingDocument || undefined}
              onSubmit={editingDocument ? handleUpdate : handleCreate}
              onCancel={handleCloseForm}
              isLoading={createDocument.isPending || updateDocument.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      {documents && documents.length > 0 ? (
        <div className="space-y-3">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onEdit={() => setEditingDocument(doc)}
              onDelete={() => handleDelete(doc.id)}
            />
          ))}
        </div>
      ) : (
        !showForm && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">暂无证件记录</p>
              <p className="text-sm text-muted-foreground mt-1">
                点击上方"添加证件"按钮添加
              </p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
