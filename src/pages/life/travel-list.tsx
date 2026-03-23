import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { TagInput } from '@/components/ui/tag-input';
import { useTravelPlans, useCreateTravelPlan } from '@/hooks/use-travel';
import type { TravelPlanInput, TravelPlanStatus } from '@/types/life-app';

// ── Status badge ──────────────────────────────────────────────

function StatusBadge({ status }: { status: TravelPlanStatus }) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        已完成
      </span>
    );
  }
  if (status === 'generating') {
    return (
      <span className="inline-flex animate-pulse items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
        生成中...
      </span>
    );
  }
  if (status === 'searching_accommodation') {
    return (
      <span className="inline-flex animate-pulse items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
        搜索住宿...
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
        失败
      </span>
    );
  }
  // pending
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
      待处理
    </span>
  );
}

// ── Default form state ────────────────────────────────────────

interface FormState {
  title: string;
  start_date: string;
  end_date: string;
  departure_city: string;
  cities: string[];
  city_nights: Record<string, number>;
  adults: number;
  children: number;
  children_ages: string[]; // string tags, converted to numbers on submit
  transport_mode: 'public_transit' | 'car' | 'coach';
  pace: 'relaxed' | 'moderate' | 'intensive';
}

const defaultForm: FormState = {
  title: '',
  start_date: '',
  end_date: '',
  departure_city: 'London',
  cities: [],
  city_nights: {},
  adults: 2,
  children: 0,
  children_ages: [],
  transport_mode: 'public_transit',
  pace: 'moderate',
};

// ── Main component ────────────────────────────────────────────

export default function LifeTravelList() {
  const navigate = useNavigate();
  const { data, isLoading } = useTravelPlans();
  const createPlan = useCreateTravelPlan();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);

  const plans = data?.items ?? [];

  // Build the all-cities array (departure + via cities)
  const allCities = form.departure_city
    ? [form.departure_city, ...form.cities]
    : form.cities;

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setCityNight(city: string, nights: number) {
    setForm((prev) => ({
      ...prev,
      city_nights: { ...prev.city_nights, [city]: nights },
    }));
  }

  function handleCitiesChange(tags: string[]) {
    // Keep city_nights in sync: remove keys that are no longer in cities
    const newCityNights: Record<string, number> = {};
    const allNew = form.departure_city ? [form.departure_city, ...tags] : tags;
    allNew.forEach((c) => {
      newCityNights[c] = form.city_nights[c] ?? 1;
    });
    setForm((prev) => ({ ...prev, cities: tags, city_nights: newCityNights }));
  }

  function handleDepartureCityChange(city: string) {
    setForm((prev) => {
      const newCityNights = { ...prev.city_nights };
      if (prev.departure_city && prev.departure_city !== city) {
        delete newCityNights[prev.departure_city];
      }
      if (city) {
        newCityNights[city] = newCityNights[city] ?? 1;
      }
      return { ...prev, departure_city: city, city_nights: newCityNights };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input: TravelPlanInput = {
      title: form.title,
      start_date: form.start_date,
      end_date: form.end_date,
      departure_city: form.departure_city,
      cities: allCities,
      city_nights: form.city_nights,
      adults: Number(form.adults),
      children: Number(form.children),
      children_ages: form.children_ages.map(Number).filter((n) => !isNaN(n)),
      transport_mode: form.transport_mode,
      preferences: { pace: form.pace },
    };
    try {
      await createPlan.mutateAsync(input);
      toast('计划已提交，正在生成...');
      setSheetOpen(false);
      setForm(defaultForm);
    } catch {
      toast.error('提交失败，请重试');
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Link
        to="/life"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        返回生活助手
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">旅行计划</h1>
        <Button onClick={() => setSheetOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          新建计划
        </Button>
      </div>

      {/* Plan list */}
      {isLoading ? (
        <div className="text-muted-foreground text-sm">加载中...</div>
      ) : plans.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          还没有旅行计划，点击上方按钮创建第一个计划
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const subtitle = [
              plan.start_date && plan.end_date
                ? `${plan.start_date} ~ ${plan.end_date}`
                : null,
              plan.cities.length > 0 ? plan.cities.join(' → ') : null,
            ]
              .filter(Boolean)
              .join(' · ');

            return (
              <div
                key={plan.id}
                className="flex items-center justify-between rounded-lg border bg-card px-5 py-4 shadow-sm cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate(`/life/travel/${plan.id}`)}
              >
                <div className="space-y-0.5">
                  <p className="font-semibold">{plan.title}</p>
                  {subtitle && (
                    <p className="text-sm text-muted-foreground">{subtitle}</p>
                  )}
                </div>
                <StatusBadge status={plan.status} />
              </div>
            );
          })}
        </div>
      )}

      {/* Create Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>新建旅行计划</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* 标题 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">标题</label>
              <input
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="家庭英国之旅"
              />
            </div>

            {/* 日期 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">出发日期</label>
                <input
                  required
                  type="date"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={form.start_date}
                  onChange={(e) => setField('start_date', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">结束日期</label>
                <input
                  required
                  type="date"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={form.end_date}
                  onChange={(e) => setField('end_date', e.target.value)}
                />
              </div>
            </div>

            {/* 出发城市 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">出发城市</label>
              <input
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.departure_city}
                onChange={(e) => handleDepartureCityChange(e.target.value)}
              />
            </div>

            {/* 途经城市 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">途经城市</label>
              <TagInput
                value={form.cities}
                onChange={handleCitiesChange}
                placeholder="输入城市名后按回车"
              />
            </div>

            {/* 每城住宿天数 */}
            {allCities.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">每城住宿天数</label>
                <div className="space-y-2">
                  {allCities.map((city) => (
                    <div key={city} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-sm text-muted-foreground truncate">
                        {city}
                      </span>
                      <input
                        type="number"
                        min={1}
                        className="w-20 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        value={form.city_nights[city] ?? 1}
                        onChange={(e) =>
                          setCityNight(city, Math.max(1, Number(e.target.value)))
                        }
                      />
                      <span className="text-sm text-muted-foreground">晚</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 成人数 / 儿童数 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">成人数</label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={form.adults}
                  onChange={(e) => setField('adults', Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">儿童数</label>
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={form.children}
                  onChange={(e) => setField('children', Number(e.target.value))}
                />
              </div>
            </div>

            {/* 儿童年龄 */}
            {form.children > 0 && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium">儿童年龄</label>
                <TagInput
                  value={form.children_ages}
                  onChange={(tags) => setField('children_ages', tags)}
                  placeholder="输入年龄后按回车"
                />
              </div>
            )}

            {/* 交通方式 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">交通方式</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.transport_mode}
                onChange={(e) =>
                  setField(
                    'transport_mode',
                    e.target.value as FormState['transport_mode']
                  )
                }
              >
                <option value="public_transit">公共交通</option>
                <option value="car">自驾</option>
                <option value="coach">大巴</option>
              </select>
            </div>

            {/* 节奏 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">节奏</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.pace}
                onChange={(e) =>
                  setField('pace', e.target.value as FormState['pace'])
                }
              >
                <option value="relaxed">悠闲</option>
                <option value="moderate">适中</option>
                <option value="intensive">紧凑</option>
              </select>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <Button
                type="submit"
                className="w-full"
                disabled={createPlan.isPending}
              >
                {createPlan.isPending ? '提交中...' : '创建计划'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
