import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, Star, TrendingUp, X } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useEmailStats } from '@/hooks/use-emails';

const PERIOD_OPTIONS = [
  { label: '7天', value: 7 },
  { label: '14天', value: 14 },
  { label: '30天', value: 30 },
  { label: '全部', value: 365 },
];

interface EmailStatsProps {
  onDateSelect?: (date: string) => void;
}

export function EmailStats({ onDateSelect }: EmailStatsProps) {
  const [days, setDays] = useState(30);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const { data: stats, isLoading } = useEmailStats(days);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">加载中...</p>;
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          暂无邮件数据
        </CardContent>
      </Card>
    );
  }

  const cards = [
    { title: '收到邮件', value: stats.total_received, icon: Mail, color: 'text-blue-500' },
    { title: '发送邮件', value: stats.total_sent, icon: Send, color: 'text-green-500' },
    { title: '重要邮件', value: stats.important_count, icon: Star, color: 'text-amber-500' },
    { title: '重要率', value: `${(stats.important_rate * 100).toFixed(1)}%`, icon: TrendingUp, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{stats.period}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily Trend Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">每日趋势</CardTitle>
          <div className="flex gap-1">
            {PERIOD_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={days === opt.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDays(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {selectedDate && (
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                已选择: {selectedDate}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => { setSelectedDate(null); onDateSelect?.(''); }}
                />
              </Badge>
              <span className="text-xs text-muted-foreground">点击图表中的日期可切换，点击 × 清除筛选</span>
            </div>
          )}
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={stats.daily_trend}
              margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
              onClick={(e) => {
                if (e?.activeLabel) {
                  const date = e.activeLabel as string;
                  if (selectedDate === date) {
                    setSelectedDate(null);
                    onDateSelect?.('');
                  } else {
                    setSelectedDate(date);
                    onDateSelect?.(date);
                  }
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <defs>
                <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorImportant" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="received" name="收到" stroke="#3b82f6" fill="url(#colorReceived)" />
              <Area type="monotone" dataKey="sent" name="发送" stroke="#22c55e" fill="url(#colorSent)" />
              <Area type="monotone" dataKey="important" name="重要" stroke="#f59e0b" fill="url(#colorImportant)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Senders */}
      {stats.top_senders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">发件人排行</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.top_senders.map((sender, i) => (
                <div key={sender.address} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{sender.name || sender.address}</p>
                      {sender.name && (
                        <p className="text-xs text-muted-foreground">{sender.address}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium">{sender.count} 封</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
