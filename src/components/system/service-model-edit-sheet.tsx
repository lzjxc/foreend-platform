import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useUpdateLLMConfig } from '@/hooks/use-config-service';
import type { LLMConfigItem, LLMConfigUpdate } from '@/types/config-service';

interface ServiceModelEditSheetProps {
  config: LLMConfigItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableModels: string[];
}

export function ServiceModelEditSheet({ config, open, onOpenChange, availableModels }: ServiceModelEditSheetProps) {
  const updateMutation = useUpdateLLMConfig();
  const [formData, setFormData] = useState<LLMConfigUpdate>({});

  useEffect(() => {
    if (config) {
      setFormData({
        llm_model: config.llm_model,
        llm_temperature: config.llm_temperature,
        llm_max_tokens: config.llm_max_tokens,
        llm_timeout: config.llm_timeout,
        llm_fallback_model: config.llm_fallback_model,
      });
    }
  }, [config]);

  if (!config) return null;

  const handleSave = async () => {
    try {
      const result = await updateMutation.mutateAsync({
        serviceId: config.service_id,
        update: formData,
      });
      toast.success(`已更新 ${config.service_name}`, {
        description: `修改字段: ${result.updated_fields.join(', ')}`,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error('更新失败', {
        description: error instanceof Error ? error.message : '未知错误',
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>编辑模型配置</SheetTitle>
          <SheetDescription>
            {config.service_name}
            <Badge variant="outline" className="ml-2 text-xs font-mono">
              {config.service_id}
            </Badge>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 py-6">
          {/* Model */}
          <div className="space-y-2">
            <Label>策略模型</Label>
            <Select
              value={formData.llm_model || ''}
              onValueChange={(v) => setFormData(prev => ({ ...prev, llm_model: v || null }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择模型..." />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <Label>Temperature</Label>
            <Input
              type="number"
              min={0}
              max={2}
              step={0.1}
              value={formData.llm_temperature ?? ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                llm_temperature: e.target.value ? parseFloat(e.target.value) : null,
              }))}
              placeholder="0.0 - 2.0"
            />
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <Label>Max Tokens</Label>
            <Input
              type="number"
              min={1}
              value={formData.llm_max_tokens ?? ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                llm_max_tokens: e.target.value ? parseInt(e.target.value) : null,
              }))}
              placeholder="如 2000, 4000"
            />
          </div>

          {/* Timeout */}
          <div className="space-y-2">
            <Label>超时 (秒)</Label>
            <Input
              type="number"
              min={1}
              value={formData.llm_timeout ?? ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                llm_timeout: e.target.value ? parseInt(e.target.value) : null,
              }))}
              placeholder="如 60, 120"
            />
          </div>

          {/* Fallback Model */}
          <div className="space-y-2">
            <Label>Fallback 模型</Label>
            <Select
              value={formData.llm_fallback_model || '_none_'}
              onValueChange={(v) => setFormData(prev => ({ ...prev, llm_fallback_model: v === '_none_' ? null : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="无" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none_">无</SelectItem>
                {availableModels.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? '保存中...' : '保存'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
