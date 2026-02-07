import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
  Loader2,
  Coins,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  useFinancialSummary,
  useFinancialTrend,
} from '@/hooks/use-data-fetcher';

// Custom tooltip for financial charts
function FinancialTooltip({ active, payload, label, unit }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  unit: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-lg font-bold">
          {unit}{payload[0].value.toFixed(unit === '¥' ? 4 : 2)}
        </p>
      </div>
    );
  }
  return null;
}

function FinancialTrendChart({
  title,
  data,
  isLoading,
  unit,
  color,
  latestPrice,
  changePercent,
}: {
  title: string;
  data: Array<{ date: string; price: number }>;
  isLoading: boolean;
  unit: string;
  color: string;
  latestPrice?: number;
  changePercent?: number | null;
}) {
  // Calculate min/max for Y-axis domain
  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.1;
  const yDomain = [
    Math.floor((minPrice - padding) * 100) / 100,
    Math.ceil((maxPrice + padding) * 100) / 100,
  ];

  // Calculate average for reference line
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Coins className="h-4 w-4" style={{ color }} />
            {title}
          </CardTitle>
          {latestPrice !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">
                {unit}{latestPrice.toFixed(unit === '¥' ? 4 : 2)}
              </span>
              {changePercent !== null && changePercent !== undefined && (
                <Badge
                  variant={changePercent >= 0 ? 'default' : 'destructive'}
                  className="flex items-center gap-1"
                >
                  {changePercent >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(changePercent).toFixed(2)}%
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            暂无数据
          </div>
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis
                  domain={yDomain}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${unit}${value.toFixed(unit === '¥' ? 2 : 0)}`}
                  width={unit === '¥' ? 65 : 55}
                />
                <Tooltip content={<FinancialTooltip unit={unit} />} />
                <ReferenceLine
                  y={avgPrice}
                  stroke="#888"
                  strokeDasharray="3 3"
                  label={{ value: '平均', position: 'right', fontSize: 10 }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface FinancialTrendsProps {
  showHeader?: boolean;
  defaultDays?: number;
}

export function FinancialTrends({ showHeader = true, defaultDays = 30 }: FinancialTrendsProps) {
  const [days, setDays] = useState(defaultDays);
  const { data: summary, refetch: refetchSummary } = useFinancialSummary();
  const { data: goldTrend, isLoading: goldLoading, refetch: refetchGold } = useFinancialTrend('XAU/USD', days);
  const { data: gbpTrend, isLoading: gbpLoading, refetch: refetchGbp } = useFinancialTrend('GBP/CNY', days);
  const { data: usdTrend, isLoading: usdLoading, refetch: refetchUsd } = useFinancialTrend('USD/CNY', days);

  const handleRefresh = () => {
    refetchSummary();
    refetchGold();
    refetchGbp();
    refetchUsd();
    toast.success('数据已刷新');
  };

  // Helper function to merge trend data with latest summary price
  const mergeTrendWithSummary = (
    trendPrices: Array<{ date: string; price: string | number }> | undefined,
    summaryPrice: string | undefined,
    summaryRecordedAt: string | undefined
  ): Array<{ date: string; price: number }> => {
    if (!trendPrices) return [];

    const data = trendPrices.map(p => ({
      date: p.date,
      price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
    }));

    // If we have summary data, check if it's newer than the last trend point
    if (summaryPrice && summaryRecordedAt) {
      const summaryDate = new Date(summaryRecordedAt);
      const lastTrendDate = data.length > 0 ? new Date(data[data.length - 1].date) : new Date(0);

      // If summary date is newer, add it to the data
      if (summaryDate > lastTrendDate) {
        data.push({
          date: summaryRecordedAt,
          price: parseFloat(summaryPrice),
        });
      }
    }

    return data;
  };

  const goldData = useMemo(() => {
    return mergeTrendWithSummary(
      goldTrend?.prices,
      summary?.gold?.price,
      summary?.gold?.recorded_at
    );
  }, [goldTrend, summary]);

  const gbpData = useMemo(() => {
    return mergeTrendWithSummary(
      gbpTrend?.prices,
      summary?.gbp_cny?.price,
      summary?.gbp_cny?.recorded_at
    );
  }, [gbpTrend, summary]);

  const usdData = useMemo(() => {
    return mergeTrendWithSummary(
      usdTrend?.prices,
      summary?.usd_cny?.price,
      summary?.usd_cny?.recorded_at
    );
  }, [usdTrend, summary]);

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">金融数据趋势</h3>
          <div className="flex items-center gap-2">
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-[120px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 天</SelectItem>
                <SelectItem value="14">14 天</SelectItem>
                <SelectItem value="30">30 天</SelectItem>
                <SelectItem value="60">60 天</SelectItem>
                <SelectItem value="90">90 天</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Coins className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">黄金价格</p>
                    <p className="text-xl font-bold">${parseFloat(summary.gold.price).toFixed(2)}</p>
                  </div>
                </div>
                {summary.gold.change_percent !== null && (
                  <Badge
                    variant={summary.gold.change_percent >= 0 ? 'default' : 'destructive'}
                    className="text-sm"
                  >
                    {summary.gold.change_percent >= 0 ? '+' : ''}
                    {summary.gold.change_percent.toFixed(2)}%
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                更新于: {new Date(summary.gold.recorded_at).toLocaleString('zh-CN')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">$</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">美元/人民币</p>
                    <p className="text-xl font-bold">¥{summary.usd_cny ? parseFloat(summary.usd_cny.price).toFixed(4) : '-'}</p>
                  </div>
                </div>
                {summary.usd_cny?.change_percent !== null && summary.usd_cny?.change_percent !== undefined && (
                  <Badge
                    variant={summary.usd_cny.change_percent >= 0 ? 'default' : 'destructive'}
                    className="text-sm"
                  >
                    {summary.usd_cny.change_percent >= 0 ? '+' : ''}
                    {summary.usd_cny.change_percent.toFixed(2)}%
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                更新于: {summary.usd_cny ? new Date(summary.usd_cny.recorded_at).toLocaleString('zh-CN') : '-'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">£</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">英镑/人民币</p>
                    <p className="text-xl font-bold">¥{parseFloat(summary.gbp_cny.price).toFixed(4)}</p>
                  </div>
                </div>
                {summary.gbp_cny.change_percent !== null && (
                  <Badge
                    variant={summary.gbp_cny.change_percent >= 0 ? 'default' : 'destructive'}
                    className="text-sm"
                  >
                    {summary.gbp_cny.change_percent >= 0 ? '+' : ''}
                    {summary.gbp_cny.change_percent.toFixed(2)}%
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                更新于: {new Date(summary.gbp_cny.recorded_at).toLocaleString('zh-CN')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <FinancialTrendChart
          title="黄金价格 (USD/oz)"
          data={goldData}
          isLoading={goldLoading}
          unit="$"
          color="#eab308"
          latestPrice={summary?.gold?.price ? parseFloat(summary.gold.price) : (goldTrend?.current_price ? (typeof goldTrend.current_price === 'string' ? parseFloat(goldTrend.current_price) : goldTrend.current_price) : undefined)}
          changePercent={summary?.gold?.change_percent ?? goldTrend?.change_1d}
        />

        <FinancialTrendChart
          title="美元/人民币汇率"
          data={usdData}
          isLoading={usdLoading}
          unit="¥"
          color="#22c55e"
          latestPrice={summary?.usd_cny?.price ? parseFloat(summary.usd_cny.price) : (usdTrend?.current_price ? (typeof usdTrend.current_price === 'string' ? parseFloat(usdTrend.current_price) : usdTrend.current_price) : undefined)}
          changePercent={summary?.usd_cny?.change_percent ?? usdTrend?.change_1d}
        />

        <FinancialTrendChart
          title="英镑/人民币汇率"
          data={gbpData}
          isLoading={gbpLoading}
          unit="¥"
          color="#3b82f6"
          latestPrice={summary?.gbp_cny?.price ? parseFloat(summary.gbp_cny.price) : (gbpTrend?.current_price ? (typeof gbpTrend.current_price === 'string' ? parseFloat(gbpTrend.current_price) : gbpTrend.current_price) : undefined)}
          changePercent={summary?.gbp_cny?.change_percent ?? gbpTrend?.change_1d}
        />
      </div>

      {/* Data source info */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            数据来源: 金融数据 API · 每日自动采集 · 上次更新: {summary?.last_updated ? new Date(summary.last_updated).toLocaleString('zh-CN') : '-'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
