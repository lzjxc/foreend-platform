import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Home, Search, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  useRentalProperties,
  useCreateRentalSearch,
  useRentalSearchResult,
  usePropertyTypes,
} from '@/hooks/use-rental';
import type { RentalSearchInput, SearchStatus } from '@/types/life-app';

// ── Search task tracker ──────────────────────────────────────

interface SearchTask {
  id: string;
  params: RentalSearchInput;
  submittedAt: string;
}

function SearchTaskCard({ task, onDone }: { task: SearchTask; onDone: (id: string, status: SearchStatus, total: number) => void }) {
  const { data } = useRentalSearchResult(task.id);

  useEffect(() => {
    if (!data) return;
    if (data.status === 'completed' || data.status === 'failed') {
      onDone(task.id, data.status, data.total_found);
    }
  }, [data, task.id, onDone]);

  const status = data?.status ?? 'pending';
  const typeLabels = task.params.property_types.join(', ') || '全部';

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm">
      {/* Status icon */}
      {status === 'completed' ? (
        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
      ) : status === 'failed' ? (
        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
      ) : (
        <Loader2 className="h-4 w-4 text-orange-500 animate-spin shrink-0" />
      )}

      {/* Search params summary */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{task.params.location}</span>
          <Badge variant="secondary" className="text-xs">≥{task.params.min_bedrooms}卧</Badge>
          <Badge variant="secondary" className="text-xs">≤£{task.params.max_price}</Badge>
          <span className="text-xs text-muted-foreground">{typeLabels}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          提交于 {new Date(task.submittedAt).toLocaleTimeString('zh-CN')}
          {data?.total_found != null && status === 'completed' && (
            <span className="text-green-600 ml-2">找到 {data.total_found} 套</span>
          )}
          {status === 'failed' && data?.error_message && (
            <span className="text-red-500 ml-2">{data.error_message}</span>
          )}
        </div>
      </div>

      {/* Status label */}
      <span className={`text-xs shrink-0 ${
        status === 'completed' ? 'text-green-600' :
        status === 'failed' ? 'text-red-500' :
        'text-orange-600'
      }`}>
        {status === 'pending' ? '排队中' :
         status === 'processing' ? '搜索中...' :
         status === 'completed' ? '已完成' : '失败'}
      </span>
    </div>
  );
}

// ── Default form ─────────────────────────────────────────────

const DEFAULT_FORM: RentalSearchInput = {
  location: 'Rotherhithe',
  location_identifier: 'REGION%5E85367',
  max_price: 2800,
  min_bedrooms: 3,
  property_types: [],
  dont_show: [],
  radius: 0,
};

// ── Main component ───────────────────────────────────────────

export default function LifeRentalList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<RentalSearchInput>(DEFAULT_FORM);
  const [tasks, setTasks] = useState<SearchTask[]>([]);

  const { data, isLoading } = useRentalProperties(page);
  const { data: propertyTypes } = usePropertyTypes();
  const createSearch = useCreateRentalSearch();

  const handleTaskDone = (taskId: string, status: SearchStatus, total: number) => {
    if (status === 'completed') {
      toast.success(`搜索完成，找到 ${total} 套房源`);
    } else {
      toast.error('搜索失败');
    }
    // Keep completed/failed tasks visible for 10 seconds then remove
    setTimeout(() => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }, 10000);
  };

  const handleSubmit = async () => {
    try {
      const result = await createSearch.mutateAsync(form);
      setTasks((prev) => [...prev, {
        id: result.id,
        params: { ...form },
        submittedAt: new Date().toISOString(),
      }]);
      setSheetOpen(false);
      toast.info('搜索已提交，正在抓取 Rightmove 数据…');
    } catch {
      toast.error('提交搜索失败');
    }
  };

  const togglePropertyType = (value: string) => {
    setForm((prev) => ({
      ...prev,
      property_types: prev.property_types.includes(value)
        ? prev.property_types.filter((t) => t !== value)
        : [...prev.property_types, value],
    }));
  };

  const properties = data?.items ?? [];
  const totalPages = data?.pages ?? 1;
  const activeTasks = tasks.length;

  return (
    <div className="p-6 space-y-5">
      {/* Breadcrumb */}
      <div>
        <Link
          to="/life"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          返回生活助手
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">房源列表</h1>
        <Button
          onClick={() => setSheetOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="h-4 w-4 mr-1" />
          新建搜索
        </Button>
      </div>

      {/* Active search tasks */}
      {activeTasks > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Search className="h-3.5 w-3.5" />
            搜索任务 ({activeTasks})
          </h2>
          {tasks.map((task) => (
            <SearchTaskCard key={task.id} task={task} onDone={handleTaskDone} />
          ))}
        </div>
      )}

      {/* Filter context badges */}
      {data && data.total > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">共 {data.total} 套房源</Badge>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          加载中…
        </div>
      )}

      {/* Empty state */}
      {!isLoading && properties.length === 0 && activeTasks === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Home className="h-12 w-12 opacity-40" />
            <p className="text-sm">还没有搜索记录，点击上方按钮开始搜索房源</p>
          </CardContent>
        </Card>
      )}

      {/* Property cards */}
      {properties.length > 0 && (
        <div className="grid gap-3">
          {properties.map((prop) => {
            const overBudget = prop.price_pcm > 2800;
            return (
              <Card
                key={prop.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/life/rental/${prop.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="font-semibold text-sm leading-snug truncate">{prop.address}</p>
                      <p className="text-xs text-muted-foreground">
                        {prop.property_type} · {prop.bedrooms} 卧 · {prop.bathrooms} 浴
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground pt-1">
                        {prop.listing_date && (
                          <span><span className="text-foreground/60">上架:</span> {prop.listing_date}</span>
                        )}
                        {prop.created_at && (
                          <span><span className="text-foreground/60">采集:</span> {new Date(prop.created_at).toLocaleDateString('zh-CN')}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${overBudget ? 'border-orange-300 text-orange-600' : 'border-green-300 text-green-600'}`}
                        >
                          {overBudget ? '超出预算' : '预算内'}
                        </Badge>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`font-bold text-base ${overBudget ? 'text-orange-600' : 'text-green-600'}`}>
                        £{prop.price_pcm.toLocaleString()}/月
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            下一页
          </Button>
        </div>
      )}

      {/* Search Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              新建房源搜索
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">位置</label>
              <Input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Rotherhithe"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Location ID</label>
              <Input
                value={form.location_identifier}
                onChange={(e) => setForm((f) => ({ ...f, location_identifier: e.target.value }))}
                placeholder="e.g. REGION%5E85367"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">最高月租 £</label>
              <Input
                type="number"
                value={form.max_price}
                onChange={(e) => setForm((f) => ({ ...f, max_price: Number(e.target.value) }))}
                min={0}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">最少卧室</label>
              <Input
                type="number"
                value={form.min_bedrooms}
                onChange={(e) => setForm((f) => ({ ...f, min_bedrooms: Number(e.target.value) }))}
                min={0}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">房屋类型</label>
              <div className="space-y-2">
                {(propertyTypes ?? []).map((pt) => (
                  <label key={pt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-orange-500"
                      checked={form.property_types.includes(pt.value)}
                      onChange={() => togglePropertyType(pt.value)}
                    />
                    <span className="text-sm">{pt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">搜索半径 miles</label>
              <Input
                type="number"
                value={form.radius}
                onChange={(e) => setForm((f) => ({ ...f, radius: Number(e.target.value) }))}
                min={0}
              />
            </div>

            <div className="rounded-md bg-orange-50 border border-orange-200 p-3 text-sm text-orange-700">
              ⏳ 搜索约需 1-3 分钟（异步爬取 Rightmove）
            </div>
          </div>

          <SheetFooter>
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleSubmit}
              disabled={createSearch.isPending}
            >
              {createSearch.isPending ? '提交中…' : '开始搜索'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
