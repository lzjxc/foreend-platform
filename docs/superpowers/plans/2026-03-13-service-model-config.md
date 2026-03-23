# Service Model Config Panel — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an interactive service model configuration card to the model management page, with a table showing each service's LLM policy (model, mode, temperature, etc.) and a Sheet drawer for editing.

**Architecture:** New independent Card between "已注册模型" and "服务模型调用 (最近7天)". Data from config-service `GET /api/v1/config/llm?has_llm=true`. Editing via `PATCH /api/v1/config/llm/{service_id}`. Expandable rows show per-service usage from existing `usage/breakdown` data. Sheet (side drawer) for editing, built on `@radix-ui/react-dialog` (already installed).

**Tech Stack:** React, TypeScript, Radix UI Dialog (for Sheet), TanStack React Query, Axios, Tailwind CSS, Lucide icons

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/ui/sheet.tsx` | Create | shadcn-style Sheet component (side drawer) built on Radix Dialog |
| `src/types/config-service.ts` | Modify | Add `LLMConfigItem`, `LLMConfigListResponse`, `LLMConfigUpdate` types |
| `src/hooks/use-config-service.ts` | Modify | Add `useLLMConfigs()` query + `useUpdateLLMConfig()` mutation hooks |
| `src/components/system/service-model-config.tsx` | Create | Main card: table of service LLM configs, expandable usage rows |
| `src/components/system/service-model-edit-sheet.tsx` | Create | Sheet drawer: edit form for a service's LLM config |
| `src/components/system/model-management.tsx` | Modify | Import and render `ServiceModelConfig` between model registry and usage cards |

---

## Chunk 1: Foundation (Sheet UI + Types + Hooks)

### Task 1: Create Sheet UI Component

**Files:**
- Create: `src/components/ui/sheet.tsx`

- [ ] **Step 1: Create the Sheet component**

Standard shadcn/ui Sheet built on `@radix-ui/react-dialog`. Provides `Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetClose`, `SheetFooter`. Content slides in from the right with overlay backdrop.

```tsx
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={cn(
      'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  side?: 'top' | 'bottom' | 'left' | 'right';
}

const sheetVariants = {
  top: 'inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
  bottom: 'inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
  left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm',
  right: 'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-md',
};

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ side = 'right', className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500',
        sheetVariants[side],
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = DialogPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
);

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
);

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-lg font-semibold text-foreground', className)} {...props} />
));
SheetTitle.displayName = DialogPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
SheetDescription.displayName = DialogPrimitive.Description.displayName;

export { Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription };
```

- [ ] **Step 2: Verify build compiles**

Run: `cd E:\projects\coding\python\foreend-platform && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to sheet.tsx

---

### Task 2: Add LLM Config Types

**Files:**
- Modify: `src/types/config-service.ts`

- [ ] **Step 1: Add LLM config types at the end of the file**

Append after the existing `STATUS_CONFIG` export:

```typescript
// ==================== LLM Config Types ====================

export type LLMPolicyMode = 'enforce' | 'suggest';

export interface LLMConfigItem {
  service_id: string;
  service_name: string;
  llm_model: string | null;
  llm_models_used: string[];
  llm_temperature: number | null;
  llm_max_tokens: number | null;
  llm_timeout: number | null;
  llm_fallback_model: string | null;
  llm_policy_mode?: LLMPolicyMode;
  llm_config_source?: 'seed' | 'manual';
}

export interface LLMConfigListResponse {
  configs: LLMConfigItem[];
  total: number;
}

export interface LLMConfigUpdate {
  llm_model?: string | null;
  llm_temperature?: number | null;
  llm_max_tokens?: number | null;
  llm_timeout?: number | null;
  llm_fallback_model?: string | null;
  llm_models_used?: string[] | null;
}

export interface LLMConfigUpdateResponse {
  service_id: string;
  updated_fields: string[];
  message: string;
}

export const POLICY_MODE_CONFIG: Record<LLMPolicyMode, { name: string; color: string }> = {
  enforce: { name: '强制', color: 'text-red-600 bg-red-100' },
  suggest: { name: '建议', color: 'text-blue-600 bg-blue-100' },
};
```

---

### Task 3: Add LLM Config Hooks

**Files:**
- Modify: `src/hooks/use-config-service.ts`

- [ ] **Step 1: Add imports for new types and useMutation**

Add `useMutation, useQueryClient` to the React Query import. Add `LLMConfigItem`, `LLMConfigListResponse`, `LLMConfigUpdate`, `LLMConfigUpdateResponse` to the config-service types import.

- [ ] **Step 2: Add query keys for LLM configs**

Add to the existing `configServiceKeys` object:

```typescript
llmConfigs: () => [...configServiceKeys.all, 'llm-configs'] as const,
llmConfig: (id: string) => [...configServiceKeys.all, 'llm-config', id] as const,
```

- [ ] **Step 3: Add useLLMConfigs hook**

```typescript
export function useLLMConfigs(hasLlm: boolean = true) {
  return useQuery({
    queryKey: configServiceKeys.llmConfigs(),
    queryFn: async (): Promise<LLMConfigItem[]> => {
      const { data } = await axios.get<LLMConfigListResponse>(
        `${CONFIG_SERVICE_URL}/api/v1/config/llm`,
        { params: { has_llm: hasLlm } }
      );
      return data.configs;
    },
    staleTime: 60_000,
  });
}
```

- [ ] **Step 4: Add useUpdateLLMConfig mutation hook**

```typescript
export function useUpdateLLMConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ serviceId, update }: { serviceId: string; update: LLMConfigUpdate }) => {
      const { data } = await axios.patch<LLMConfigUpdateResponse>(
        `${CONFIG_SERVICE_URL}/api/v1/config/llm/${serviceId}`,
        update,
        { headers: { 'X-API-Key': 'VfSEn5dBWdl97BeLkDr2d0AZSqKV7QkOjqa3kjXqTWk' } }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: configServiceKeys.llmConfigs() });
    },
  });
}
```

- [ ] **Step 5: Verify build compiles**

Run: `cd E:\projects\coding\python\foreend-platform && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 6: Commit foundation**

```bash
git add src/components/ui/sheet.tsx src/types/config-service.ts src/hooks/use-config-service.ts
git commit -m "feat: add Sheet UI component and LLM config types/hooks"
```

---

## Chunk 2: Service Model Config Card + Edit Sheet

### Task 4: Create Edit Sheet Component

**Files:**
- Create: `src/components/system/service-model-edit-sheet.tsx`

- [ ] **Step 1: Create the edit sheet component**

A Sheet (side drawer) that opens when a service row is clicked. Contains a form with:
- Service name (read-only display)
- Model (text input or select)
- Temperature (number input, 0-2, step 0.1)
- Max tokens (number input)
- Timeout (number input, seconds)
- Fallback model (text input)
- Save / Cancel buttons

Uses `useUpdateLLMConfig` mutation. Shows toast on success/error via Sonner.

```tsx
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

  // Reset form when config changes
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
```

---

### Task 5: Create Service Model Config Card

**Files:**
- Create: `src/components/system/service-model-config.tsx`

- [ ] **Step 1: Create the main config card component**

A Card containing:
1. Header: "服务模型配置" with service count badge
2. Table rows for each service with LLM config:
   - Service name
   - Model (with color dot)
   - Mode badge (enforce = red, suggest = blue)
   - Temperature, Max tokens, Timeout (compact display)
   - Config source badge (seed = gray "系统默认", manual = blue "自定义") — gracefully handle when field is absent
   - Edit button (pencil icon) → opens Sheet
3. Expandable section per row: shows models_used list and usage stats from breakdown data
4. Imports `ServiceModelEditSheet` for the edit drawer

The component receives `usageBreakdown` as a prop from the parent (already fetched by `ModelManagement`).

```tsx
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Settings2,
  ChevronDown,
  ChevronUp,
  Pencil,
  Shield,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLLMConfigs } from '@/hooks/use-config-service';
import { ServiceModelEditSheet } from './service-model-edit-sheet';
import type { LLMConfigItem } from '@/types/config-service';

// Props: pass usage breakdown from parent to avoid duplicate fetch
interface ServiceModelConfigProps {
  usageByApp?: Map<string, { requests: number; tokens: number; cost: number; models: { model: string; requests: number }[] }>;
  availableModels?: string[];
}

export function ServiceModelConfig({ usageByApp, availableModels = [] }: ServiceModelConfigProps) {
  const { data: configs, isLoading, error } = useLLMConfigs();
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<LLMConfigItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleEdit = (config: LLMConfigItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConfig(config);
    setSheetOpen(true);
  };

  const toggleExpand = (serviceId: string) => {
    setExpandedService(prev => prev === serviceId ? null : serviceId);
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-base">
              <Settings2 className="h-5 w-5" />
              服务模型配置
            </span>
            {configs && (
              <Badge variant="secondary">{configs.length} 个服务</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : error ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              加载失败: {error instanceof Error ? error.message : '未知错误'}
            </div>
          ) : !configs || configs.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">暂无配置</div>
          ) : (
            <div className="space-y-2">
              {configs.map(config => {
                const isExpanded = expandedService === config.service_id;
                const usage = usageByApp?.get(config.service_id) || usageByApp?.get(config.service_id.replace(/-/g, '-'));
                const policyMode = config.llm_policy_mode;
                const configSource = config.llm_config_source;

                return (
                  <div key={config.service_id} className="rounded-lg border overflow-hidden">
                    {/* Main row */}
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/30 transition-colors"
                      onClick={() => toggleExpand(config.service_id)}
                    >
                      {/* Service name */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{config.service_name}</span>
                          {policyMode && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] px-1.5',
                                policyMode === 'enforce'
                                  ? 'border-red-200 text-red-600 bg-red-50'
                                  : 'border-blue-200 text-blue-600 bg-blue-50'
                              )}
                            >
                              {policyMode === 'enforce' ? (
                                <><Shield className="h-2.5 w-2.5 mr-0.5" />强制</>
                              ) : (
                                <><MessageSquare className="h-2.5 w-2.5 mr-0.5" />建议</>
                              )}
                            </Badge>
                          )}
                          {configSource && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] px-1.5',
                                configSource === 'manual'
                                  ? 'border-blue-200 text-blue-600 bg-blue-50'
                                  : 'border-gray-200 text-gray-500 bg-gray-50'
                              )}
                            >
                              {configSource === 'manual' ? '自定义' : '系统默认'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {config.llm_model || '—'}
                          {config.llm_temperature != null && <span className="ml-2">t={config.llm_temperature}</span>}
                          {config.llm_max_tokens != null && <span className="ml-2">max={config.llm_max_tokens}</span>}
                          {config.llm_timeout != null && <span className="ml-2">timeout={config.llm_timeout}s</span>}
                        </p>
                      </div>

                      {/* Usage badge */}
                      {usage && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {usage.requests} 次
                        </Badge>
                      )}

                      {/* Edit + Expand buttons */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={(e) => handleEdit(config, e)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      }
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t px-3 py-2.5 bg-muted/30 space-y-2">
                        {/* Config details */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">模型</span>
                            <p className="font-mono font-medium">{config.llm_model || '—'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Temperature</span>
                            <p className="font-mono font-medium">{config.llm_temperature ?? '—'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Max Tokens</span>
                            <p className="font-mono font-medium">{config.llm_max_tokens ?? '—'}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">超时</span>
                            <p className="font-mono font-medium">{config.llm_timeout ? `${config.llm_timeout}s` : '—'}</p>
                          </div>
                        </div>

                        {/* Fallback model */}
                        {config.llm_fallback_model && (
                          <div className="text-xs">
                            <span className="text-muted-foreground">Fallback: </span>
                            <span className="font-mono">{config.llm_fallback_model}</span>
                          </div>
                        )}

                        {/* Models used */}
                        {config.llm_models_used.length > 0 && (
                          <div>
                            <span className="text-xs text-muted-foreground">已用模型:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {config.llm_models_used.map(m => (
                                <Badge key={m} variant="outline" className="text-[10px] font-mono">
                                  {m}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Usage stats from breakdown */}
                        {usage && (
                          <div className="pt-1 border-t border-muted">
                            <span className="text-xs text-muted-foreground">最近 7 天调用:</span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {usage.models.map(um => (
                                <Badge key={um.model} variant="secondary" className="text-[10px] font-normal gap-1">
                                  {um.model}
                                  <span className="text-muted-foreground">({um.requests})</span>
                                </Badge>
                              ))}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              总计 {usage.requests} 次 · {usage.tokens > 1000 ? `${(usage.tokens / 1000).toFixed(1)}K` : usage.tokens} tokens
                              {usage.cost > 0 && ` · $${usage.cost.toFixed(4)}`}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Sheet */}
      <ServiceModelEditSheet
        config={editingConfig}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        availableModels={availableModels}
      />
    </>
  );
}
```

---

### Task 6: Integrate into ModelManagement

**Files:**
- Modify: `src/components/system/model-management.tsx`

- [ ] **Step 1: Add import for ServiceModelConfig**

At the top of the file, add:
```typescript
import { ServiceModelConfig } from './service-model-config';
```

- [ ] **Step 2: Build usageByApp map and availableModels from existing data**

Inside the component, after the existing `appModelUsage` memo, add a new memo:

```typescript
const usageByAppMap = useMemo(() => {
  if (!usageBreakdown?.by_model) return new Map();
  const map = new Map<string, { requests: number; tokens: number; cost: number; models: { model: string; requests: number }[] }>();
  usageBreakdown.by_model.forEach(m => {
    m.apps.forEach(app => {
      const existing = map.get(app.app) || { requests: 0, tokens: 0, cost: 0, models: [] };
      existing.requests += app.requests;
      existing.tokens += app.tokens;
      existing.cost += app.cost;
      existing.models.push({ model: m.model, requests: app.requests });
      map.set(app.app, existing);
    });
  });
  return map;
}, [usageBreakdown]);

const availableModelIds = useMemo(() => {
  return models.filter(m => m.id !== 'default').map(m => m.id);
}, [models]);
```

- [ ] **Step 3: Insert ServiceModelConfig card between model registry and per-app usage**

In the JSX, between the "Model Registry" `</Card>` (around line 375) and the "Per-App Model Usage" `<Card>` (around line 378), insert:

```tsx
{/* ==================== Service Model Config ==================== */}
<ServiceModelConfig usageByApp={usageByAppMap} availableModels={availableModelIds} />
```

- [ ] **Step 4: Verify build compiles**

Run: `cd E:\projects\coding\python\foreend-platform && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors

- [ ] **Step 5: Commit feature**

```bash
git add src/components/system/service-model-config.tsx src/components/system/service-model-edit-sheet.tsx src/components/system/model-management.tsx
git commit -m "feat: add service model config card with edit sheet drawer"
```

---

## Chunk 3: Polish & Deploy

### Task 7: Verify & Fix

- [ ] **Step 1: Run dev server and verify**

Run: `cd E:\projects\coding\python\foreend-platform && npm run dev`

Open browser to system dashboard → Models tab. Verify:
1. New "服务模型配置" card appears between model registry and usage cards
2. Shows all services with LLM config
3. Click a row → expands to show details + usage
4. Click pencil icon → Sheet opens from right
5. Edit model/temperature → Save → toast confirmation → list refreshes
6. Mode badges show correctly (enforce=red, suggest=blue)

- [ ] **Step 2: Fix any issues found**

- [ ] **Step 3: Build for production**

Run: `cd E:\projects\coding\python\foreend-platform && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 4: Final commit if any fixes**

```bash
git add -u
git commit -m "fix: polish service model config card"
```
