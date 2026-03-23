import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useTravelPlan, useExportTravelPlan } from '@/hooks/use-travel';
import type { Activity } from '@/types/life-app';

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

// ── Main component ────────────────────────────────────────────

export default function LifeTravelDetail() {
  const { planId } = useParams<{ planId: string }>();
  const { data: plan, isLoading } = useTravelPlan(planId ?? '');
  const exportPlan = useExportTravelPlan();
  const [activeTab, setActiveTab] = useState(0); // 0 = overview, 1+ = day tabs

  async function handleExport() {
    if (!planId) return;
    try {
      await exportPlan.mutateAsync(planId);
    } catch {
      toast.error('导出失败');
    }
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

      {/* Title + export */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold">{plan.title}</h1>
        <Button
          variant="outline"
          size="sm"
          disabled={plan.status !== 'completed' || exportPlan.isPending}
          onClick={handleExport}
        >
          <Download className="h-4 w-4 mr-1.5" />
          导出 Markdown
        </Button>
      </div>

      {/* Summary bar */}
      <div className="flex flex-wrap gap-4 rounded-lg border bg-muted/40 px-5 py-3 text-sm">
        {plan.start_date && plan.end_date && (
          <span>
            📅 {plan.start_date} ~ {plan.end_date}
          </span>
        )}
        <span>
          👥 {plan.adults}大{plan.children}小
        </span>
        <span>
          🚂{' '}
          {transportModeLabel[
            (plan as unknown as { transport_mode?: string }).transport_mode ?? ''
          ] ?? '公共交通'}
        </span>
        {budgetTotal != null && budget && (
          <span>
            💰 {budgetTotal.toLocaleString()} {budget.currency}
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
          <DayTab key={day.date} day={day} />
        ) : null
      )}
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────

import type { TravelPlan } from '@/types/life-app';

function OverviewTab({
  plan,
  budgetTotal,
}: {
  plan: TravelPlan;
  budgetTotal: number | null;
}) {
  return (
    <div className="space-y-6">
      {/* Transport legs */}
      {plan.transport_legs.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-base font-semibold">交通路线</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">出发</th>
                  <th className="px-4 py-2.5 text-left font-medium">到达</th>
                  <th className="px-4 py-2.5 text-left font-medium">方式</th>
                  <th className="px-4 py-2.5 text-left font-medium">运营商</th>
                  <th className="px-4 py-2.5 text-right font-medium">时长</th>
                  <th className="px-4 py-2.5 text-right font-medium">成人价</th>
                  <th className="px-4 py-2.5 text-center font-medium">儿童免费</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {plan.transport_legs.map((leg, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5">{leg.from_city}</td>
                    <td className="px-4 py-2.5">{leg.to_city}</td>
                    <td className="px-4 py-2.5">{leg.mode}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {leg.operator ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {leg.duration_min >= 60
                        ? `${Math.floor(leg.duration_min / 60)}h${leg.duration_min % 60 > 0 ? `${leg.duration_min % 60}m` : ''}`
                        : `${leg.duration_min}m`}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {leg.price_estimate_per_adult.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {leg.child_free ? '✓' : '—'}
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

      {!plan.transport_legs.length && !plan.total_budget && (
        <p className="text-muted-foreground text-sm">暂无概览数据</p>
      )}
    </div>
  );
}

// ── Day tab ───────────────────────────────────────────────────

import type { DayItinerary } from '@/types/life-app';

function DayTab({ day }: { day: DayItinerary }) {
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

      {day.activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无活动安排</p>
      ) : (
        <div className="space-y-2">
          {day.activities.map((act, i) => (
            <div
              key={i}
              className={`flex gap-4 rounded-r-lg border-l-4 px-4 py-3 ${activityBorderClass(act.type)}`}
            >
              {/* Time */}
              <span className="w-12 shrink-0 text-xs text-gray-500 pt-0.5">
                {act.time}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-snug">{act.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                  <span>{activityTypeLabel[act.type]}</span>
                  {act.price_adult > 0 && (
                    <span>£{act.price_adult}</span>
                  )}
                  {act.duration_min > 0 && (
                    <span>
                      {act.duration_min >= 60
                        ? `${Math.floor(act.duration_min / 60)}h${act.duration_min % 60 > 0 ? `${act.duration_min % 60}m` : ''}`
                        : `${act.duration_min}m`}
                    </span>
                  )}
                  {act.child_friendly_rating > 0 && (
                    <ChildFriendlyStars rating={act.child_friendly_rating} />
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
