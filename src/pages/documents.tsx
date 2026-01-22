import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  RefreshCw,
  X,
  ChevronDown,
} from 'lucide-react';
import { usePersons } from '@/hooks/use-persons';
import {
  usePersonDocuments,
  useCreateDocument,
  useUpdateDocument,
  useDeleteDocument,
} from '@/hooks/use-documents';
import type { Document, DocumentCreate, DocumentUpdate, Person } from '@/types';
import {
  DOCUMENT_TYPE_OPTIONS,
  isExpiringSoon,
  isExpired,
  maskDocumentNumber,
} from '@/types/document';

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

  // Update form data when document prop changes (for edit mode)
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
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
            placeholder="可选备注信息"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
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
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
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

          {document.issue_date && (
            <p className="text-sm text-muted-foreground">
              签发日期: {document.issue_date}
            </p>
          )}

          {document.notes && (
            <p className="text-sm text-muted-foreground mt-2">
              备注: {document.notes}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Person selector component
interface PersonSelectorProps {
  persons: Person[];
  selectedPersonId: string | null;
  onSelect: (personId: string | null) => void;
}

function PersonSelector({ persons, selectedPersonId, onSelect }: PersonSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedPerson = persons.find((p) => p.id === selectedPersonId);

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between min-w-[200px]"
      >
        <span>{selectedPerson ? selectedPerson.name : '选择家庭成员'}</span>
        <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <div className="py-1">
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                onSelect(null);
                setIsOpen(false);
              }}
            >
              全部成员
            </button>
            {persons.map((person) => (
              <button
                key={person.id}
                type="button"
                className={`w-full px-3 py-2 text-left text-sm hover:bg-muted ${
                  person.id === selectedPersonId ? 'bg-muted' : ''
                }`}
                onClick={() => {
                  onSelect(person.id);
                  setIsOpen(false);
                }}
              >
                {person.name}
                <span className="ml-2 text-muted-foreground">
                  ({person.relationship === 'self' ? '本人' : person.relationship})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Documents() {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [allDocuments, setAllDocuments] = useState<{ person: Person; documents: Document[] }[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(false);

  // Fetch all persons
  const { data: persons = [], isLoading: isLoadingPersons } = usePersons();

  // Fetch documents for selected person
  const {
    data: documentsData,
    isLoading: isLoadingDocuments,
    refetch: refetchDocuments,
  } = usePersonDocuments(selectedPersonId || '');

  // Ensure selectedPersonDocuments is always an array
  const selectedPersonDocuments = documentsData ?? [];

  // Mutations
  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();
  const deleteDocument = useDeleteDocument();

  // Map backend document format to frontend format
  const mapBackendDocument = (doc: Record<string, unknown>): Document => ({
    id: doc.id as string,
    person_id: doc.person_id as string,
    type: (doc.doc_type as string) as Document['type'],
    number: doc.doc_number as string,
    issue_date: doc.issue_date as string | undefined,
    expiry_date: doc.expiry_date as string | undefined,
    issuing_authority: doc.issuing_authority as string | undefined,
    notes: doc.notes as string | undefined,
    created_at: doc.created_at as string,
    updated_at: doc.updated_at as string,
  });

  // Load all documents for all persons when no specific person is selected
  useEffect(() => {
    const loadAllDocuments = async () => {
      if (selectedPersonId || persons.length === 0) {
        setAllDocuments([]);
        return;
      }

      setIsLoadingAll(true);
      const results: { person: Person; documents: Document[] }[] = [];

      for (const person of persons) {
        try {
          const response = await fetch(`/api/v1/persons/${person.id}/documents`, {
            headers: { 'Content-Type': 'application/json' },
          });
          if (response.ok) {
            const data = await response.json();
            const backendDocs = data.data || [];
            const documents = backendDocs.map(mapBackendDocument);
            if (documents.length > 0) {
              results.push({ person, documents });
            }
          }
        } catch {
          // Continue with other persons
        }
      }

      setAllDocuments(results);
      setIsLoadingAll(false);
    };

    loadAllDocuments();
  }, [selectedPersonId, persons]);

  // Handle create document
  const handleCreate = async (data: Omit<DocumentCreate, 'person_id'>) => {
    if (!selectedPersonId) return;

    try {
      await createDocument.mutateAsync({ personId: selectedPersonId, data });
      setShowForm(false);
      refetchDocuments();
    } catch (error) {
      console.error('Failed to create document:', error);
    }
  };

  // Handle update document
  const handleUpdate = async (data: Omit<DocumentCreate, 'person_id'>) => {
    if (!editingDocument || !selectedPersonId) return;

    try {
      await updateDocument.mutateAsync({
        personId: selectedPersonId,
        docId: editingDocument.id,
        data: data as DocumentUpdate,
      });
      setEditingDocument(null);
      refetchDocuments();
    } catch (error) {
      console.error('Failed to update document:', error);
    }
  };

  // Handle delete document
  const handleDelete = async (personId: string, docId: string) => {
    if (!confirm('确定要删除这个证件记录吗？此操作无法撤销。')) return;

    try {
      await deleteDocument.mutateAsync({ personId, docId });
      if (selectedPersonId) {
        refetchDocuments();
      } else {
        // Reload all documents
        setAllDocuments((prev) =>
          prev
            .map((item) =>
              item.person.id === personId
                ? { ...item, documents: item.documents.filter((d) => d.id !== docId) }
                : item
            )
            .filter((item) => item.documents.length > 0)
        );
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const isLoading = isLoadingPersons || isLoadingDocuments || isLoadingAll;

  // Count expiring documents
  const countExpiring = (docs: Document[] | undefined) => {
    if (!docs) return 0;
    return docs.filter((d) => !isExpired(d.expiry_date) && isExpiringSoon(d.expiry_date, 90)).length;
  };

  const countExpired = (docs: Document[] | undefined) => {
    if (!docs) return 0;
    return docs.filter((d) => isExpired(d.expiry_date)).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">证件管理</h2>
          <p className="text-sm text-muted-foreground">管理家庭成员的各类证件信息</p>
        </div>
        <div className="flex items-center gap-2">
          <PersonSelector
            persons={persons}
            selectedPersonId={selectedPersonId}
            onSelect={setSelectedPersonId}
          />
          {selectedPersonId && (
            <Button onClick={() => setShowForm(true)} disabled={showForm}>
              <Plus className="mr-2 h-4 w-4" />
              添加证件
            </Button>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {(showForm || editingDocument) && selectedPersonId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {editingDocument ? '编辑证件' : '添加证件'}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowForm(false);
                setEditingDocument(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <DocumentForm
              document={editingDocument || undefined}
              onSubmit={editingDocument ? handleUpdate : handleCreate}
              onCancel={() => {
                setShowForm(false);
                setEditingDocument(null);
              }}
              isLoading={createDocument.isPending || updateDocument.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      {selectedPersonId ? (
        // Show documents for selected person
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {persons.find((p) => p.id === selectedPersonId)?.name || '未知'} 的证件
              {selectedPersonDocuments.length > 0 && (
                <Badge variant="secondary">{selectedPersonDocuments.length}</Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refetchDocuments()}>
              <RefreshCw className={`h-4 w-4 ${isLoadingDocuments ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingDocuments ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : selectedPersonDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">暂无证件记录</p>
                <Button className="mt-4" onClick={() => setShowForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  添加第一个证件
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Expiring warning */}
                {(countExpiring(selectedPersonDocuments) > 0 ||
                  countExpired(selectedPersonDocuments) > 0) && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <span className="text-sm">
                      {countExpired(selectedPersonDocuments) > 0 && (
                        <span className="text-red-500 font-medium">
                          {countExpired(selectedPersonDocuments)} 个证件已过期
                        </span>
                      )}
                      {countExpired(selectedPersonDocuments) > 0 &&
                        countExpiring(selectedPersonDocuments) > 0 &&
                        '，'}
                      {countExpiring(selectedPersonDocuments) > 0 && (
                        <span className="text-orange-500 font-medium">
                          {countExpiring(selectedPersonDocuments)} 个证件即将过期
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {selectedPersonDocuments.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onEdit={() => setEditingDocument(doc)}
                    onDelete={() => handleDelete(selectedPersonId, doc.id)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Show all documents grouped by person
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : allDocuments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">暂无证件记录</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    请先选择一个家庭成员来添加证件
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            allDocuments.map(({ person, documents }) => {
              const docs = documents ?? [];
              return (
                <Card key={person.id}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4" />
                      {person.name}
                      <Badge variant="secondary">{docs.length}</Badge>
                      {(countExpiring(docs) > 0 || countExpired(docs) > 0) && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {countExpired(docs) + countExpiring(docs)}
                        </Badge>
                      )}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPersonId(person.id)}
                    >
                      查看全部
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {docs.map((doc) => (
                        <DocumentCard
                          key={doc.id}
                          document={doc}
                          onEdit={() => {
                            setSelectedPersonId(person.id);
                            setEditingDocument(doc);
                          }}
                          onDelete={() => handleDelete(person.id, doc.id)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
