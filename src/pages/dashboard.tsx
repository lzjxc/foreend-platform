import { Sparkles } from 'lucide-react';
import { FinancialTrends } from '@/components/financial/financial-trends';
import { CurrencyStats } from '@/components/financial/currency-stats';

export default function Dashboard() {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 12) return '早上好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-2xl border border-white/5">
        {/* Animated mesh gradient background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl animate-pulse" />
          <div className="absolute -right-10 -bottom-10 h-60 w-60 rounded-full bg-purple-500/20 blur-3xl animate-pulse [animation-delay:1s]" />
          <div className="absolute left-1/3 top-0 h-40 w-40 rounded-full bg-cyan-500/15 blur-3xl animate-pulse [animation-delay:2s]" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Decorative accent line */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-cyan-400 via-indigo-400 to-purple-400" />

        <div className="relative flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {getGreeting()}
                </h2>
                <p className="text-sm text-indigo-200/80">
                  {dateStr}
                </p>
              </div>
            </div>
            <p className="text-base text-indigo-100/90 pl-[52px]">
              个人AI外脑 &mdash; 统一管理，智能联动
            </p>
          </div>
        </div>
      </div>

      {/* Financial Trends */}
      <FinancialTrends />

      {/* Currency Transaction Stats */}
      <CurrencyStats />
    </div>
  );
}
