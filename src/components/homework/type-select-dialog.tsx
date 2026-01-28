import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calculator, BookOpen, PenTool, X, Image } from 'lucide-react';
import type { NeedsTypeItem } from '@/stores/grading-queue-store';

interface TypeSelectDialogProps {
  files: NeedsTypeItem[];
  onSelect: (type: 'math' | 'english' | 'chinese') => void;
  onCancel: () => void;
}

export function TypeSelectDialog({ files, onSelect, onCancel }: TypeSelectDialogProps) {
  const [selectedType, setSelectedType] = useState<'math' | 'english' | 'chinese' | null>(null);

  if (files.length === 0) return null;

  const handleConfirm = () => {
    if (selectedType) {
      onSelect(selectedType);
      setSelectedType(null);
    }
  };

  const handleCancel = () => {
    setSelectedType(null);
    onCancel();
  };

  const typeOptions = [
    {
      type: 'math' as const,
      label: '数学',
      icon: Calculator,
      description: '识别对错标记 (✓/✗)',
    },
    {
      type: 'english' as const,
      label: '英语',
      icon: BookOpen,
      description: '识别对错标记 (✓/✗)',
    },
    {
      type: 'chinese' as const,
      label: '语文',
      icon: PenTool,
      description: '评估书写规范度',
    },
  ];

  return (
    <Dialog open={files.length > 0} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-orange-500" />
            无法识别 QR 码
          </DialogTitle>
          <DialogDescription>
            以下 {files.length} 个文件无法自动识别作业类型，请手动选择：
          </DialogDescription>
        </DialogHeader>

        {/* 文件预览缩略图 */}
        <div className="flex gap-2 overflow-x-auto py-2">
          {files.slice(0, 5).map((file) => (
            <div
              key={file.id}
              className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border bg-muted"
            >
              <img
                src={file.previewUrl}
                alt={file.file.name}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
          {files.length > 5 && (
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-md border bg-muted text-sm text-muted-foreground">
              +{files.length - 5}
            </div>
          )}
        </div>

        {/* 类型选择按钮 */}
        <div className="grid grid-cols-3 gap-3 py-2">
          {typeOptions.map(({ type, label, icon: Icon, description }) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all hover:bg-accent ${
                selectedType === type
                  ? 'border-primary bg-primary/5'
                  : 'border-transparent bg-muted/50'
              }`}
            >
              <Icon
                className={`h-8 w-8 ${
                  selectedType === type ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <span className="font-medium">{label}</span>
              <span className="text-xs text-muted-foreground text-center">{description}</span>
            </button>
          ))}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedType}>
            确认并上传
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
