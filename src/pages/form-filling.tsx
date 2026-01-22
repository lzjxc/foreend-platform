import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileInput,
  User,
  FileText,
  Check,
  X,
  Copy,
  Download,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePersons } from '@/hooks/use-persons';
import { useTemplates, useTemplate, useFillTemplate } from '@/hooks/use-form-filling';
import type { TemplateListItem, FilledField } from '@/types/form-filling';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '@/types/form-filling';
import { cn } from '@/lib/utils';

// ========== Template Card Component ==========
interface TemplateCardProps {
  template: TemplateListItem;
  isSelected: boolean;
  onClick: () => void;
}

function TemplateCard({ template, isSelected, onClick }: TemplateCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{template.name}</CardTitle>
          <Badge
            variant="secondary"
            className={cn('text-xs', CATEGORY_COLORS[template.category])}
          >
            {CATEGORY_LABELS[template.category] || template.category}
          </Badge>
        </div>
        {template.description && (
          <CardDescription className="text-sm">
            {template.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{template.field_count} 个字段</span>
          <span>v{template.version}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ========== Person Selector Component ==========
interface PersonSelectorProps {
  selectedPersonId: string | null;
  onSelect: (personId: string) => void;
}

function PersonSelector({ selectedPersonId, onSelect }: PersonSelectorProps) {
  const { data: persons, isLoading } = usePersons();

  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }

  return (
    <Select value={selectedPersonId || ''} onValueChange={onSelect}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="选择家庭成员..." />
      </SelectTrigger>
      <SelectContent>
        {persons?.map((person) => (
          <SelectItem key={person.id} value={person.id}>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{person.name}</span>
              <span className="text-muted-foreground">
                ({person.relationship})
              </span>
            </div>
          </SelectItem>
        ))}
        {(!persons || persons.length === 0) && (
          <div className="py-2 px-4 text-sm text-muted-foreground">
            暂无家庭成员数据
          </div>
        )}
      </SelectContent>
    </Select>
  );
}

// ========== Filled Field Row Component ==========
interface FilledFieldRowProps {
  field: FilledField;
}

function FilledFieldRow({ field }: FilledFieldRowProps) {
  const copyValue = () => {
    if (field.value !== null && field.value !== undefined) {
      navigator.clipboard.writeText(String(field.value));
      toast.success(`已复制: ${field.label}`);
    }
  };

  return (
    <div className="flex items-center gap-4 py-3 border-b last:border-b-0">
      <div className="flex-shrink-0">
        {field.filled ? (
          <Check className="h-5 w-5 text-green-500" />
        ) : (
          <X className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{field.label}</div>
        <div className="text-xs text-muted-foreground truncate">
          {field.source}
        </div>
      </div>
      <div className="flex-1 min-w-0 text-right">
        {field.filled ? (
          <span className="font-mono text-sm">{String(field.value)}</span>
        ) : (
          <span className="text-sm text-muted-foreground italic">
            {field.error || '未填充'}
          </span>
        )}
      </div>
      {field.filled && (
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-8 w-8"
          onClick={copyValue}
        >
          <Copy className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// ========== Main Page Component ==========
export default function FormFilling() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [fillResult, setFillResult] = useState<{
    template_name: string;
    person_name: string;
    filled_fields: FilledField[];
    fill_rate: number;
    filled_at: string;
  } | null>(null);

  // Fetch templates
  const { data: templates, isLoading: templatesLoading, refetch: refetchTemplates } = useTemplates(
    selectedCategory === 'all' ? undefined : selectedCategory
  );

  // Fetch selected template details
  const { data: selectedTemplate } = useTemplate(selectedTemplateId || '');

  // Fill mutation
  const fillMutation = useFillTemplate();

  // Filter templates by category (client-side backup filter)
  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    if (selectedCategory === 'all') return templates;
    return templates.filter((t) => t.category === selectedCategory);
  }, [templates, selectedCategory]);

  // Handle template selection
  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setFillResult(null); // Clear previous fill result
  };

  // Handle fill action
  const handleFill = async () => {
    if (!selectedTemplateId || !selectedPersonId) {
      toast.error('请先选择模板和家庭成员');
      return;
    }

    try {
      const result = await fillMutation.mutateAsync({
        templateId: selectedTemplateId,
        personId: selectedPersonId,
      });

      setFillResult({
        template_name: result.template_name,
        person_name: result.person_name,
        filled_fields: result.filled_fields,
        fill_rate: result.fill_rate,
        filled_at: result.filled_at,
      });

      toast.success(`表单填充完成，填充率: ${result.fill_rate}%`);
    } catch (error: any) {
      toast.error(error.message || '填充失败');
    }
  };

  // Copy all filled fields to clipboard
  const handleCopyAll = () => {
    if (!fillResult) return;

    const filledData = fillResult.filled_fields
      .filter((f) => f.filled)
      .map((f) => `${f.label}: ${f.value}`)
      .join('\n');

    navigator.clipboard.writeText(filledData);
    toast.success('已复制所有填充数据');
  };

  // Export as JSON
  const handleExportJson = () => {
    if (!fillResult) return;

    const exportData = {
      template: fillResult.template_name,
      person: fillResult.person_name,
      filled_at: fillResult.filled_at,
      fill_rate: fillResult.fill_rate,
      data: Object.fromEntries(
        fillResult.filled_fields
          .filter((f) => f.filled)
          .map((f) => [f.name, f.value])
      ),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `form-data-${fillResult.template_name}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('已导出 JSON 文件');
  };

  // Count filled fields
  const filledCount = fillResult?.filled_fields.filter((f) => f.filled).length || 0;
  const totalFields = fillResult?.filled_fields.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileInput className="h-6 w-6" />
            表单填充
          </h1>
          <p className="text-muted-foreground mt-1">
            选择模板和家庭成员，自动填充表单数据
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchTemplates()}
          disabled={templatesLoading}
        >
          <RefreshCw
            className={cn('h-4 w-4 mr-2', templatesLoading && 'animate-spin')}
          />
          刷新
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Template Selection */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                选择模板
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="筛选分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  <SelectItem value="travel">出行</SelectItem>
                  <SelectItem value="finance">金融</SelectItem>
                  <SelectItem value="education">教育</SelectItem>
                  <SelectItem value="insurance">保险</SelectItem>
                </SelectContent>
              </Select>

              {/* Template list */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {templatesLoading ? (
                  <>
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </>
                ) : filteredTemplates.length > 0 ? (
                  filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isSelected={selectedTemplateId === template.id}
                      onClick={() => handleSelectTemplate(template.id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>暂无可用模板</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle: Person Selection & Action */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                选择人员
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PersonSelector
                selectedPersonId={selectedPersonId}
                onSelect={setSelectedPersonId}
              />

              {/* Selected template info */}
              {selectedTemplate && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium">{selectedTemplate.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {selectedTemplate.fields.length} 个字段
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {selectedTemplate.fields
                      .slice(0, 5)
                      .map((f) => f.label)
                      .join('、')}
                    {selectedTemplate.fields.length > 5 && '...'}
                  </div>
                </div>
              )}

              {/* Fill button */}
              <Button
                className="w-full"
                size="lg"
                disabled={
                  !selectedTemplateId ||
                  !selectedPersonId ||
                  fillMutation.isPending
                }
                onClick={handleFill}
              >
                {fillMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    填充中...
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4 mr-2" />
                    开始填充
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Fill Result */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">填充结果</CardTitle>
                {fillResult && (
                  <Badge
                    variant={fillResult.fill_rate >= 80 ? 'default' : 'secondary'}
                  >
                    {fillResult.fill_rate}% ({filledCount}/{totalFields})
                  </Badge>
                )}
              </div>
              {fillResult && (
                <CardDescription>
                  {fillResult.template_name} - {fillResult.person_name}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {fillResult ? (
                <div className="space-y-4">
                  {/* Export buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleCopyAll}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      复制全部
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleExportJson}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      导出 JSON
                    </Button>
                  </div>

                  {/* Filled fields list */}
                  <div className="max-h-[400px] overflow-y-auto">
                    {fillResult.filled_fields.map((field, index) => (
                      <FilledFieldRow key={index} field={field} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>选择模板和人员后</p>
                  <p>点击"开始填充"查看结果</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
