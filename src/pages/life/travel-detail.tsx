import { useState, lazy, Suspense, Component, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Download, Loader2, Check, Circle, ExternalLink, MapPin, Printer, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  useTravelPlan,
  useExportTravelPlan,
  useExportItinerary,
  usePatchPlan,
  usePatchActivity,
  usePatchAccommodation,
  usePatchTransport,
  useWeather,
} from '@/hooks/use-travel';
import type { Activity, TravelPlan, DayItinerary, Accommodation } from '@/types/life-app';
import WeatherCard from '@/components/travel/weather-card';

const DayMap = lazy(() => import('@/components/travel/day-map'));

class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground text-center">地图加载失败</div>;
    }
    return this.props.children;
  }
}

// ── Helpers ───────────────────────────────────────────────────

const transportModeLabel: Record<string, string> = {
  public_transit: '公共交通',
  car: '自驾',
  coach: '大巴',
};

const statusLabel: Record<string, string> = {
  pending: '待处理',
  generating: '正在生成行程...',
  searching_accommodation: '正在搜索住宿...',
  completed: '已完成',
  failed: '生成失败',
};

function activityBorderClass(type: Activity['type']) {
  switch (type) {
    case 'transport':
      return 'border-l-indigo-500 bg-indigo-50';
    case 'attraction':
      return 'border-l-green-500 bg-green-50';
    case 'meal':
      return 'border-l-orange-500 bg-orange-50';
    case 'rest':
      return 'border-l-purple-500 bg-purple-50';
    default:
      return 'border-l-gray-300 bg-gray-50';
  }
}

const activityTypeLabel: Record<Activity['type'], string> = {
  transport: '交通',
  attraction: '景点',
  meal: '餐饮',
  rest: '休息',
};

function ChildFriendlyStars({ rating }: { rating: number }) {
  const filled = Math.round(Math.max(0, Math.min(5, rating)));
  return (
    <span className="text-yellow-500 text-xs">
      {'★'.repeat(filled)}{'☆'.repeat(5 - filled)}
    </span>
  );
}

function ConfirmedToggle({
  confirmed,
  bookedAt,
  onClick,
  disabled,
}: {
  confirmed: boolean;
  bookedAt?: string | null;
  onClick: () => void;
  disabled?: boolean;
}) {
  const dateStr = bookedAt ? new Date(bookedAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }) + '订' : null;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          confirmed
            ? 'border-green-500 bg-green-500 text-white'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {confirmed && <Check className="w-3 h-3" />}
      </button>
      {dateStr && <span className="text-[10px] text-gray-400 whitespace-nowrap">{dateStr}</span>}
    </div>
  );
}

function formatDuration(min: number) {
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h${m}m` : `${h}h`;
  }
  return `${min}m`;
}

function googleMapsUrl(name: string, city?: string) {
  const query = city ? `${name}, ${city}` : name;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function MapLink({ name, city }: { name: string; city?: string }) {
  return (
    <a
      href={googleMapsUrl(name, city)}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 text-muted-foreground hover:text-blue-600 transition-colors"
      title="在 Google Maps 中查看"
    >
      <MapPin className="w-3.5 h-3.5" />
    </a>
  );
}

// ── Main component ────────────────────────────────────────────

export default function LifeTravelDetail() {
  const { planId } = useParams<{ planId: string }>();
  const { data: plan, isLoading } = useTravelPlan(planId ?? '');
  const exportPlan = useExportTravelPlan();
  const exportItinerary = useExportItinerary();
  const patchPlan = usePatchPlan();
  const [activeTab, setActiveTab] = useState(0);

  async function handleExport() {
    if (!planId) return;
    try {
      await exportPlan.mutateAsync(planId);
    } catch {
      toast.error('导出失败');
    }
  }

  async function handleExportItinerary() {
    if (!planId) return;
    try {
      await exportItinerary.mutateAsync(planId);
    } catch {
      toast.error('导出失败');
    }
  }

  async function handleTogglePlanConfirmed() {
    if (!planId || !plan) return;
    await patchPlan.mutateAsync({ planId, data: { confirmed: !plan.confirmed } });
  }

  if (isLoading || !plan) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Link
          to="/life/travel"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          返回计划列表
        </Link>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  const isInProgress =
    plan.status !== 'completed' && plan.status !== 'failed';

  if (isInProgress) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Link
          to="/life/travel"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          返回计划列表
        </Link>
        <h1 className="text-2xl font-bold">{plan.title}</h1>
        <div className="flex items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 px-5 py-4 text-orange-700">
          <Loader2 className="h-5 w-5 animate-spin shrink-0" />
          <span>{statusLabel[plan.status] ?? plan.status}</span>
        </div>
      </div>
    );
  }

  if (plan.status === 'failed') {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <Link
          to="/life/travel"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          返回计划列表
        </Link>
        <h1 className="text-2xl font-bold">{plan.title}</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-red-700">
          <p className="font-medium">生成失败</p>
          {plan.error_message && (
            <p className="mt-1 text-sm">{plan.error_message}</p>
          )}
        </div>
      </div>
    );
  }

  const budget = plan.total_budget;
  const budgetTotal = budget
    ? budget.accommodation +
      budget.transport +
      budget.attractions +
      budget.dining_estimate
    : null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Link
        to="/life/travel"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        返回计划列表
      </Link>

      {/* Title + confirmed + export */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{plan.title}</h1>
          <button
            onClick={handleTogglePlanConfirmed}
            disabled={patchPlan.isPending}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              plan.confirmed
                ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {plan.confirmed ? <Check className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
            {plan.confirmed ? '已确认出行' : '草案'}
          </button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={plan.status !== 'completed' || exportItinerary.isPending}
            onClick={handleExportItinerary}
          >
            <Printer className="h-4 w-4 mr-1.5" />
            行程单
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={plan.status !== 'completed' || exportPlan.isPending}
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Markdown
          </Button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap gap-4 rounded-lg border bg-muted/40 px-5 py-3 text-sm">
        {plan.start_date && plan.end_date && (
          <span>
            {plan.start_date} ~ {plan.end_date}
          </span>
        )}
        <span>
          {plan.adults}大{plan.children}小
        </span>
        <span>
          {transportModeLabel[
            (plan as unknown as { transport_mode?: string }).transport_mode ?? ''
          ] ?? '公共交通'}
        </span>
        {budgetTotal != null && budget && (
          <span>
            {budgetTotal.toLocaleString()} {budget.currency}
          </span>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b overflow-x-auto">
        <button
          className={`shrink-0 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 0
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab(0)}
        >
          概览
        </button>
        {plan.days.map((day, idx) => (
          <button
            key={day.date}
            className={`shrink-0 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === idx + 1
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab(idx + 1)}
          >
            D{day.day_number}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 0 && (
        <OverviewTab plan={plan} budgetTotal={budgetTotal} />
      )}
      {plan.days.map((day, idx) =>
        activeTab === idx + 1 ? (
          <DayTab key={day.date} day={day} accommodations={plan.accommodations} />
        ) : null
      )}
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────

function OverviewTab({
  plan,
  budgetTotal,
}: {
  plan: TravelPlan;
  budgetTotal: number | null;
}) {
  const patchTransport = usePatchTransport();
  const patchAccommodation = usePatchAccommodation();
  const patchActivity = usePatchActivity();

  // Collect all paid activities for tickets section
  const paidActivities = plan.days.flatMap((day) =>
    day.activities
      .filter((a) => a.price_adult > 0 && a.type !== 'transport')
      .map((a) => ({ ...a, city: day.city, dayNumber: day.day_number }))
  );

  // Collect unconfirmed booking_required activities
  const pendingBookings = plan.days.flatMap((day) =>
    day.activities
      .filter((a) => a.booking_required && !a.confirmed)
      .map((a) => ({ ...a, city: day.city, dayNumber: day.day_number, date: day.date }))
  );

  return (
    <div className="space-y-6">
      {/* Route summary card */}
      <div className="rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 space-y-2">
        <h2 className="text-base font-semibold">路线概述</h2>
        <p className="text-sm text-muted-foreground">
          {plan.departure_city} → {plan.cities?.join(' → ')} → {plan.departure_city}
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>{plan.start_date} ~ {plan.end_date}</span>
          <span>{plan.adults}大{plan.children}小</span>
          {plan.city_nights && Object.entries(plan.city_nights).map(([city, nights]) => (
            <span key={city}>{city} {nights}晚</span>
          ))}
        </div>
      </div>

      {/* Pending bookings action list */}
      {pendingBookings.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            待预订 ({pendingBookings.length})
          </h2>
          <div className="rounded-lg border border-amber-200 bg-amber-50 divide-y divide-amber-200">
            {pendingBookings.map((act) => (
              <div key={act.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <button
                  onClick={() => patchActivity.mutate({ id: act.id, data: { confirmed: true } })}
                  disabled={patchActivity.isPending}
                  className="text-[10px] bg-red-100 text-red-700 rounded px-2 py-0.5 font-medium whitespace-nowrap hover:bg-red-200 cursor-pointer shrink-0"
                >需预约</button>
                <span className="font-medium">{act.name}</span>
                <span className="text-muted-foreground text-xs">D{act.dayNumber} · {act.city}</span>
                {act.booking_url && (
                  <a href={act.booking_url} target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-xs ml-auto shrink-0">预订 →</a>
                )}
                {act.notes && (
                  <span className="text-xs text-muted-foreground ml-auto max-w-[200px] truncate">{act.notes}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accommodations */}
      {plan.accommodations && plan.accommodations.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base font-semibold">住宿</h2>
          <div className="space-y-2">
            {plan.accommodations.map((acc) => (
              <AccommodationCard
                key={acc.id}
                acc={acc}
                onToggleConfirmed={() =>
                  patchAccommodation.mutate({
                    id: acc.id,
                    data: { confirmed: !acc.confirmed },
                  })
                }
                disabled={patchAccommodation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tickets */}
      {paidActivities.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base font-semibold">门票</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2.5 text-center font-medium w-10">状态</th>
                  <th className="px-3 py-2.5 text-left font-medium">景点</th>
                  <th className="px-3 py-2.5 text-left font-medium">城市</th>
                  <th className="px-3 py-2.5 text-right font-medium">票价</th>
                  <th className="px-3 py-2.5 text-center font-medium">链接</th>
                  <th className="px-3 py-2.5 text-left font-medium">备注</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paidActivities.map((act) => (
                  <tr key={act.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2.5 text-center">
                      {act.confirmed ? (
                        <ConfirmedToggle
                          confirmed
                          bookedAt={act.booked_at}
                          onClick={() => patchActivity.mutate({ id: act.id, data: { confirmed: false } })}
                          disabled={patchActivity.isPending}
                        />
                      ) : act.booking_required ? (
                        <button
                          onClick={() => patchActivity.mutate({ id: act.id, data: { confirmed: true } })}
                          disabled={patchActivity.isPending}
                          className="text-[10px] bg-red-100 text-red-700 rounded px-1.5 py-0.5 font-medium whitespace-nowrap hover:bg-red-200 cursor-pointer"
                        >需预约</button>
                      ) : (
                        <button
                          onClick={() => patchActivity.mutate({ id: act.id, data: { confirmed: true } })}
                          disabled={patchActivity.isPending}
                          className="text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 font-medium whitespace-nowrap hover:bg-gray-200 cursor-pointer"
                        >可现场买</button>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-medium">{act.name}</span>
                      <span className="text-muted-foreground ml-1.5 text-xs">D{act.dayNumber}</span>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{act.city}</td>
                    <td className="px-3 py-2.5 text-right">
                      £{act.price_adult}{act.child_free ? ' (童免)' : ''}
                    </td>
                    <td className="px-3 py-2.5 text-center flex gap-1.5 justify-center">
                      <a href={googleMapsUrl(act.name, act.city)} target="_blank" rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-blue-600"><MapPin className="w-3.5 h-3.5" /></a>
                      {act.booking_url && (
                        <a href={act.booking_url} target="_blank" rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"><ExternalLink className="w-3.5 h-3.5" /></a>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[200px]">
                      {act.notes ?? ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transport legs */}
      {plan.transport_legs.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base font-semibold">交通路线</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2.5 text-center font-medium w-10">状态</th>
                  <th className="px-3 py-2.5 text-left font-medium">路线</th>
                  <th className="px-3 py-2.5 text-left font-medium">方式</th>
                  <th className="px-3 py-2.5 text-left font-medium">运营商</th>
                  <th className="px-3 py-2.5 text-left font-medium">出发</th>
                  <th className="px-3 py-2.5 text-right font-medium">时长</th>
                  <th className="px-3 py-2.5 text-right font-medium">总价</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {plan.transport_legs.map((leg) => (
                  <tr key={leg.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2.5 text-center">
                      {leg.mode === 'bus' ? (
                        <span className="text-[10px] text-blue-600 font-medium whitespace-nowrap">可刷卡</span>
                      ) : (
                        <ConfirmedToggle
                          confirmed={leg.confirmed}
                          bookedAt={leg.booked_at}
                          onClick={() =>
                            patchTransport.mutate({
                              id: leg.id,
                              data: { confirmed: !leg.confirmed },
                            })
                          }
                          disabled={patchTransport.isPending}
                        />
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {leg.from_city} → {leg.to_city}
                    </td>
                    <td className="px-3 py-2.5">{leg.mode}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {leg.operator ?? '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      {leg.departure_time ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {formatDuration(leg.duration_min)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      £{leg.price_total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Budget summary */}
      {plan.total_budget && (
        <div className="space-y-2">
          <h2 className="text-base font-semibold">预算概览</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">类别</th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    金额 ({plan.total_budget.currency})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr className="hover:bg-muted/30">
                  <td className="px-4 py-2.5">住宿</td>
                  <td className="px-4 py-2.5 text-right">
                    {plan.total_budget.accommodation.toLocaleString()}
                  </td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="px-4 py-2.5">交通</td>
                  <td className="px-4 py-2.5 text-right">
                    {plan.total_budget.transport.toLocaleString()}
                  </td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="px-4 py-2.5">景点</td>
                  <td className="px-4 py-2.5 text-right">
                    {plan.total_budget.attractions.toLocaleString()}
                  </td>
                </tr>
                <tr className="hover:bg-muted/30">
                  <td className="px-4 py-2.5">餐饮（估算）</td>
                  <td className="px-4 py-2.5 text-right">
                    {plan.total_budget.dining_estimate.toLocaleString()}
                  </td>
                </tr>
                {budgetTotal != null && (
                  <tr className="bg-muted/50 font-semibold">
                    <td className="px-4 py-2.5">合计</td>
                    <td className="px-4 py-2.5 text-right">
                      {budgetTotal.toLocaleString()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!plan.transport_legs.length && !plan.total_budget && !(plan.accommodations?.length) && (
        <p className="text-muted-foreground text-sm">暂无概览数据</p>
      )}
    </div>
  );
}

// ── Accommodation card ───────────────────────────────────────

function AccommodationCard({
  acc,
  onToggleConfirmed,
  disabled,
}: {
  acc: Accommodation;
  onToggleConfirmed: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3 shadow-sm">
      <ConfirmedToggle
        confirmed={acc.confirmed}
        bookedAt={acc.booked_at}
        onClick={onToggleConfirmed}
        disabled={disabled}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm">{acc.name ?? acc.city}</p>
          {acc.rating && (
            <span className="text-xs bg-blue-100 text-blue-700 rounded px-1.5 py-0.5 font-medium">
              {acc.rating}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
          <span>{acc.city}</span>
          <span>{acc.checkin} ~ {acc.checkout}</span>
          {acc.price && <span className="font-medium text-foreground">£{acc.price}</span>}
          {acc.type_desc && <span>{acc.type_desc}</span>}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3">
          {acc.location && <span>{acc.location}</span>}
          {acc.cancellation_policy && (
            <span className={acc.cancellation_policy.includes('免费') ? 'text-green-600' : 'text-orange-600'}>
              {acc.cancellation_policy}
            </span>
          )}
        </p>
      </div>
      <div className="flex flex-col gap-2 shrink-0">
        <a
          href={googleMapsUrl(acc.name ?? acc.city, acc.city)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-blue-600 transition-colors"
          title="在 Google Maps 中查看"
        >
          <MapPin className="w-4 h-4" />
        </a>
        {acc.booking_url && (
          <a
            href={acc.booking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Booking.com"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}

// ── Day tab ───────────────────────────────────────────────────

function DayTab({ day, accommodations }: { day: DayItinerary; accommodations?: Accommodation[] }) {
  const patchActivity = usePatchActivity();
  const { data: weather } = useWeather(day.city, day.date);

  // Find accommodation for this day (checkin <= date < checkout)
  const dayAcc = accommodations?.find((a) => a.checkin <= day.date && day.date < a.checkout) ?? null;

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold">
          第 {day.day_number} 天 · {day.city}
        </h2>
        {day.theme && (
          <p className="text-sm text-muted-foreground">{day.theme}</p>
        )}
      </div>

      {/* Weather card */}
      {weather && <WeatherCard weather={weather} />}

      {/* Day map */}
      <MapErrorBoundary>
        <Suspense fallback={<div className="h-[350px] rounded-lg border bg-muted/30 animate-pulse" />}>
          <DayMap activities={day.activities} city={day.city} accommodation={dayAcc} />
        </Suspense>
      </MapErrorBoundary>

      {day.activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无活动安排</p>
      ) : (() => {
        // Build a map marker index: activity id → marker number (1-based)
        const markerMap = new Map<string, number>();
        let markerIdx = 1;
        for (const a of day.activities) {
          if (a.latitude != null && a.longitude != null && a.type !== 'transport') {
            markerMap.set(a.id, markerIdx++);
          }
        }
        return (
        <div className="space-y-2">
          {day.activities.map((act) => {
            // Only show booking status for paid attractions/activities (not transport — tracked in overview)
            const needsBooking = act.price_adult > 0 && act.type !== 'transport';
            const mapNum = markerMap.get(act.id);
            return (
              <div
                key={act.id}
                className={`flex gap-3 rounded-r-lg border-l-4 px-4 py-3 ${activityBorderClass(act.type)}`}
              >
                {/* Confirmed toggle — only for paid/transport items */}
                {needsBooking ? (
                  <div className="pt-0.5">
                    <ConfirmedToggle
                      confirmed={act.confirmed}
                      bookedAt={act.booked_at}
                      onClick={() =>
                        patchActivity.mutate({
                          id: act.id,
                          data: { confirmed: !act.confirmed },
                        })
                      }
                      disabled={patchActivity.isPending}
                    />
                  </div>
                ) : (
                  <div className="w-5 shrink-0" />
                )}

                {/* Time */}
                <span className="w-12 shrink-0 text-xs text-gray-500 pt-0.5">
                  {act.time}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {mapNum && (
                      <span className="shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                        {mapNum}
                      </span>
                    )}
                    <p className="font-semibold text-sm leading-snug">{act.name}</p>
                    {(act.type === 'attraction' || act.type === 'meal') && (
                      <MapLink name={act.name} city={day.city} />
                    )}
                    {act.booking_url && (
                      <a
                        href={act.booking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="预订链接"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {needsBooking && !act.confirmed && act.booking_required && (
                      <span className="text-[10px] bg-red-100 text-red-700 rounded px-1.5 py-0.5 font-medium">
                        需预约
                      </span>
                    )}
                    {needsBooking && !act.confirmed && !act.booking_required && (
                      <span className="text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 font-medium">
                        可现场买
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                    <span>{activityTypeLabel[act.type]}</span>
                    {act.price_adult > 0 && (
                      <span>£{act.price_adult}</span>
                    )}
                    {act.duration_min > 0 && (
                      <span>{formatDuration(act.duration_min)}</span>
                    )}
                    {act.child_friendly_rating > 0 && (
                      <ChildFriendlyStars rating={act.child_friendly_rating} />
                    )}
                    {act.notes && (
                      <span className="text-gray-400">{act.notes}</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        );
      })()}
    </div>
  );
}
