import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUploadDocument, useDownloadDocument } from '@/hooks/use-housing';
import type { HousingDocument, HousingDocumentType } from '@/types/housing';
import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_ICONS } from '@/types/housing';

interface DocumentSectionProps {
  tenancyId: string;
  documents: HousingDocument[];
}

const DOC_TYPES: HousingDocumentType[] = ['contract', 'epc', 'gas_safety', 'how_to_rent', 'inventory', 'deposit_cert', 'other'];

const DOC_BG: Record<HousingDocumentType, string> = {
  contract: 'bg-purple-50',
  epc: 'bg-green-50',
  gas_safety: 'bg-orange-50',
  how_to_rent: 'bg-blue-50',
  inventory: 'bg-gray-50',
  deposit_cert: 'bg-yellow-50',
  other: 'bg-gray-50',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function DocumentSection({ tenancyId, documents }: DocumentSectionProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<HousingDocumentType>('contract');
  const [docName, setDocName] = useState('');

  const uploadDoc = useUploadDocument();
  const downloadDoc = useDownloadDocument();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setDocName(acceptedFiles[0].name.replace(/\.[^.]+$/, ''));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  });

  const handleUpload = () => {
    if (!file || !docName.trim()) { toast.error('请选择文件并填写名称'); return; }
    uploadDoc.mutate(
      { tenancyId, file, type: docType, name: docName.trim() },
      {
        onSuccess: () => {
          toast.success('文档已上传');
          setUploadOpen(false);
          setFile(null);
          setDocName('');
        },
        onError: () => toast.error('上传失败'),
      }
    );
  };

  const handleDownload = (docId: string) => {
    downloadDoc.mutate(docId, {
      onError: () => toast.error('下载失败'),
    });
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">📄 文档 ({documents.length})</h3>
        <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)}>
          <Upload className="mr-1 h-3.5 w-3.5" />
          上传
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          暂无文档
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded-lg border bg-card p-3 text-center cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => handleDownload(doc.id)}
            >
              <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg ${DOC_BG[doc.type]}`}>
                <span className="text-lg">{DOCUMENT_TYPE_ICONS[doc.type]}</span>
              </div>
              <div className="text-xs font-semibold truncate">{doc.name}</div>
              <div className="text-[10px] text-muted-foreground">
                {DOCUMENT_TYPE_LABELS[doc.type]} · {formatFileSize(doc.file_size)}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>上传文档</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">{file.name} ({formatFileSize(file.size)})</span>
                </div>
              ) : (
                <div>
                  <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">拖拽文件到这里或点击选择</p>
                  <p className="text-xs text-muted-foreground/70">PDF, Images, Word</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Document Type</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as HousingDocumentType)}
                >
                  {DOC_TYPES.map((t) => (
                    <option key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Display Name</Label>
                <Input value={docName} onChange={(e) => setDocName(e.target.value)} className="h-8 text-sm" />
              </div>
            </div>

            <Button onClick={handleUpload} disabled={!file || uploadDoc.isPending} className="w-full">
              {uploadDoc.isPending ? '上传中...' : '上传'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
