import { Book, Clock, CheckCircle, Flame, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { WordbookStats } from '@/types/wordbook';

interface StatsCardProps {
  stats?: WordbookStats;
  isLoading?: boolean;
}

export function StatsCard({ stats, isLoading }: StatsCardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const items = [
    {
      label: '总词数',
      value: stats?.total_words ?? 0,
      icon: Book,
      color: 'text-blue-500',
    },
    {
      label: '新词',
      value: stats?.new_words ?? 0,
      icon: BookOpen,
      color: 'text-green-500',
    },
    {
      label: '待复习',
      value: stats?.due_words ?? 0,
      icon: Clock,
      color: 'text-orange-500',
    },
    {
      label: '今日已复习',
      value: stats?.reviewed_today ?? 0,
      icon: CheckCircle,
      color: 'text-purple-500',
    },
    {
      label: '连续天数',
      value: stats?.streak_days ?? 0,
      icon: Flame,
      color: 'text-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
            <item.icon className={`h-4 w-4 ${item.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
