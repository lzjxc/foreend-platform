import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, GitCompareArrows, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TagInput } from '@/components/ui/tag-input';
import {
  useAccommodationListings,
  useCreateAccommodationSearch,
  useAccommodationSearchResult,
  useCompareAccommodations,
} from '@/hooks/use-accommodation';
import type { AccommodationSearchInput } from '@/types/life-app';

type SortField = 'total_price' | 'rating' | 'distance_from_centre';

// ─── Search polling helper ───────────────────────────────────────────────────
function SearchPoller({
  searchId,
  onDone,
}: {
  searchId: string;
  onDone: () => void;
}) {
  const { data } = useAccommodationSearchResult(searchId);
  if (data?.status === 'completed') {
    toast.success(`搜索完成，找到 ${data.total_found} 条住宿`);
    onDone();
  } else if (data?.status === 'failed') {
    toast.error(`搜索失败：${data.error_message ?? '未知错误'}`);
    onDone();
  }
  return null;
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LifeAccommodationList() {
  const navigate = useNavigate();

  // sort state
  const [sortBy, setSortBy] = useState<SortField>('total_price');
  const [order] = useState<'asc' | 'desc'>('asc');

  // data
  const { data, isLoading } = useAccommodationListings(1, 20, sortBy, order);
  const listings = data?.items ?? [];

  // selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // search sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchForm, setSearchForm] = useState<AccommodationSearchInput>({
    destination: '',
    checkin: '',
    checkout: '',
    adults: 2,
    children: 0,
    children_ages: [],
    rooms: 1,
    max_price_total: null,
    sort_by: 'price',
    min_rating: null,
  });
  const [childAgesTags, setChildAgesTags] = useState<string[]>([]);
  const [pollingId, setPollingId] = useState<string | null>(null);

  const createSearch = useCreateAccommodationSearch();

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: AccommodationSearchInput = {
      ...searchForm,
      children_ages: childAgesTags.map(Number).filter((n) => !isNaN(n)),
    };
    try {
      const result = await createSearch.mutateAsync(payload);
      toast.info('搜索已提交，正在等待结果…');
      setPollingId(result.id);
      setSheetOpen(false);
    } catch {
      toast.error('提交搜索失败');
    }
  };

  // compare dialog
  const [compareOpen, setCompareOpen] = useState(false);
  const { data: compareListings, isLoading: compareLoading } =
    useCompareAccommodations(compareOpen ? selectedIds : []);

  // sort buttons config
  const sortOptions: { label: string; value: SortField }[] = [
    { label: '价格', value: 'total_price' },
    { label: '评分', value: 'rating' },
    { label: '距离', value: 'distance_from_centre' },
  ];

  const compareRows: {
    label: string;
    key: keyof import('@/types/life-app').Listing;
    boolean?: boolean;
  }[] = [
    { label: '总价', key: 'total_price' },
    { label: '每晚', key: 'price_per_night' },
    { label: '评分', key: 'rating' },
    { label: '评论数', key: 'review_count' },
    { label: '距市中心', key: 'distance_from_centre' },
    { label: '厨房', key: 'has_kitchen', boolean: true },
    { label: '免费停车', key: 'has_free_parking', boolean: true },
    { label: '免费取消', key: 'has_free_cancellation', boolean: true },
    { label: '含早', key: 'breakfast_included', boolean: true },
    { label: '免费WiFi', key: 'has_free_wifi', boolean: true },
    { label: '儿童免费', key: 'child_stays_free', boolean: true },
    { label: '泳池', key: 'has_pool', boolean: true },
    { label: '热水浴缸', key: 'has_hot_tub', boolean: true },
    { label: '允许宠物', key: 'pets_allowed', boolean: true },
  ];

  return (
    <div className="p-6 space-y-4">
      {/* polling side-effect component */}
      {pollingId && (
        <SearchPoller searchId={pollingId} onDone={() => setPollingId(null)} />
      )}

      {/* Breadcrumb */}
      <Link
        to="/life"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        返回生活助手
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">住宿记录</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={selectedIds.length < 2}
            onClick={() => setCompareOpen(true)}
          >
            <GitCompareArrows className="h-4 w-4 mr-1" />
            比较已选 ({selectedIds.length})
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => setSheetOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            新建搜索
          </Button>
        </div>
      </div>

      {/* Sort buttons */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">排序：</span>
        {sortOptions.map((opt) => (
          <Button
            key={opt.value}
            variant={sortBy === opt.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Card grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">加载中…</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          还没有住宿记录，点击上方按钮搜索住宿
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listings.map((listing) => {
            const isSelected = selectedIds.includes(listing.id);
            return (
              <div
                key={listing.id}
                className="relative rounded-lg border bg-card p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/life/accommodation/${listing.id}`)}
              >
                {/* Checkbox */}
                <button
                  type="button"
                  className={`absolute top-3 right-3 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground bg-background hover:border-primary'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(listing.id);
                  }}
                >
                  {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                </button>

                {/* Name */}
                <h3 className="font-bold text-base pr-8 mb-2 line-clamp-2">{listing.name}</h3>

                {/* Stats */}
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                    {listing.rating != null ? listing.rating.toFixed(1) : '—'}
                    <span className="text-xs">({listing.review_count})</span>
                  </span>
                  <span>£{listing.price_per_night.toFixed(0)}/晚</span>
                  <span>总价 £{listing.total_price.toFixed(0)}</span>
                </div>

                {/* Distance */}
                {listing.distance_from_centre && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                    <MapPin className="h-3.5 w-3.5" />
                    {listing.distance_from_centre}
                  </div>
                )}

                {/* Feature tags */}
                <div className="flex flex-wrap gap-1.5">
                  {listing.has_free_cancellation && (
                    <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
                      免费取消
                    </span>
                  )}
                  {listing.breakfast_included && (
                    <span className="inline-flex items-center rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 text-xs font-medium">
                      含早
                    </span>
                  )}
                  {'has_free_wifi' in listing && (listing as import('@/types/life-app').Listing).has_free_wifi && (
                    <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
                      免费WiFi
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Search Sheet ── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>新建住宿搜索</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSearchSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label>目的地</Label>
              <Input
                value={searchForm.destination}
                onChange={(e) =>
                  setSearchForm((f) => ({ ...f, destination: e.target.value }))
                }
                placeholder="如：London"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>入住日期</Label>
                <Input
                  type="date"
                  value={searchForm.checkin}
                  onChange={(e) =>
                    setSearchForm((f) => ({ ...f, checkin: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>退房日期</Label>
                <Input
                  type="date"
                  value={searchForm.checkout}
                  onChange={(e) =>
                    setSearchForm((f) => ({ ...f, checkout: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>成人数</Label>
                <Input
                  type="number"
                  min={1}
                  value={searchForm.adults}
                  onChange={(e) =>
                    setSearchForm((f) => ({ ...f, adults: Number(e.target.value) }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>儿童数</Label>
                <Input
                  type="number"
                  min={0}
                  value={searchForm.children}
                  onChange={(e) =>
                    setSearchForm((f) => ({ ...f, children: Number(e.target.value) }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>儿童年龄（按 Enter 添加）</Label>
              <TagInput
                value={childAgesTags}
                onChange={setChildAgesTags}
                placeholder="如：5 8 10"
              />
            </div>

            <div className="space-y-1.5">
              <Label>房间数</Label>
              <Input
                type="number"
                min={1}
                value={searchForm.rooms}
                onChange={(e) =>
                  setSearchForm((f) => ({ ...f, rooms: Number(e.target.value) }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>最高总价（可选）</Label>
              <Input
                type="number"
                min={0}
                value={searchForm.max_price_total ?? ''}
                placeholder="不限"
                onChange={(e) =>
                  setSearchForm((f) => ({
                    ...f,
                    max_price_total: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label>排序</Label>
              <Select
                value={searchForm.sort_by}
                onValueChange={(v) =>
                  setSearchForm((f) => ({
                    ...f,
                    sort_by: v as AccommodationSearchInput['sort_by'],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">价格</SelectItem>
                  <SelectItem value="rating">评分</SelectItem>
                  <SelectItem value="distance">距离</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>最低评分（可选）</Label>
              <Input
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={searchForm.min_rating ?? ''}
                placeholder="不限"
                onChange={(e) =>
                  setSearchForm((f) => ({
                    ...f,
                    min_rating: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              disabled={createSearch.isPending}
            >
              {createSearch.isPending ? '提交中…' : '开始搜索'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Compare Dialog ── */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>住宿比较</DialogTitle>
          </DialogHeader>

          {compareLoading ? (
            <div className="py-8 text-center text-muted-foreground">加载中…</div>
          ) : compareListings && compareListings.length >= 2 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-28">
                      项目
                    </th>
                    {compareListings.map((l) => (
                      <th key={l.id} className="text-left py-2 px-2 font-semibold min-w-[140px]">
                        <span className="line-clamp-2">{l.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row) => (
                    <tr key={row.key} className="border-t">
                      <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">
                        {row.label}
                      </td>
                      {compareListings.map((l) => {
                        const raw = l[row.key];
                        let display: React.ReactNode;
                        if (row.boolean) {
                          display = raw ? (
                            <span className="text-green-600 font-bold">✓</span>
                          ) : (
                            <span className="text-muted-foreground">✗</span>
                          );
                        } else if (
                          row.key === 'total_price' ||
                          row.key === 'price_per_night'
                        ) {
                          display = raw != null ? `£${Number(raw).toFixed(0)}` : '—';
                        } else {
                          display = raw != null ? String(raw) : '—';
                        }
                        return (
                          <td key={l.id} className="py-2 px-2">
                            {display}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              请至少选择 2 个住宿进行比较
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
