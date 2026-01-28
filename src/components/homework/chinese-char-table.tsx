import { useState } from 'react';
import { Search, RefreshCw, CheckCircle, XCircle, Star } from 'lucide-react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useChineseChars, useChineseStats } from '@/hooks/use-chinese';

const DIFFICULTY_LABELS: Record<number, string> = {
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
};

export function ChineseCharTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'wrong' | 'usage' | 'neatness'>('default');

  const { data: chars, isLoading, refetch } = useChineseChars({
    source: sourceFilter === 'all' ? undefined : sourceFilter,
    difficulty: difficultyFilter === 'all' ? undefined : Number(difficultyFilter),
  });

  const { data: stats } = useChineseStats();

  // 过滤和排序
  let filteredChars = chars?.filter((char) =>
    searchTerm ? char.char.includes(searchTerm) || char.pinyin.includes(searchTerm) : true
  );

  // 排序
  if (filteredChars && sortBy !== 'default') {
    filteredChars = [...filteredChars].sort((a, b) => {
      switch (sortBy) {
        case 'wrong':
          return (b.wrong_count || 0) - (a.wrong_count || 0);
        case 'usage':
          return (b.usage_count || 0) - (a.usage_count || 0);
        case 'neatness':
          const aAvg = a.neatness_count > 0 ? a.neatness_total / a.neatness_count : 0;
          const bAvg = b.neatness_count > 0 ? b.neatness_total / b.neatness_count : 0;
          return aAvg - bAvg;
        default:
          return 0;
      }
    });
  }

  // 获取唯一的来源列表
  const sources = stats?.by_source ? Object.keys(stats.by_source) : [];

  // 计算平均工整度
  const getAverageNeatness = (total: number, count: number) => {
    if (count === 0) return null;
    return (total / count).toFixed(0);
  };

  return (
    <div className="space-y-4">
      {/* 统计信息 */}
      {stats && (
        <div className="text-sm text-muted-foreground">
          总计: {stats.total_chars} 字
          {stats.by_source && Object.keys(stats.by_source).length > 0 && (
            <span className="ml-4">
              {Object.entries(stats.by_source).map(([source, count]) => (
                <span key={source} className="mr-3">
                  {source}: {count}字
                </span>
              ))}
            </span>
          )}
        </div>
      )}

      {/* 筛选和搜索 */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm">来源:</Label>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {sources.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-sm">难度:</Label>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-sm">排序:</Label>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">默认</SelectItem>
              <SelectItem value="wrong">错误次数</SelectItem>
              <SelectItem value="usage">使用次数</SelectItem>
              <SelectItem value="neatness">工整度(低优先)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索汉字或拼音..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8"
          />
        </div>

        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" />
          刷新
        </Button>
      </div>

      {/* 表格 */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">汉字</TableHead>
              <TableHead className="w-20">拼音</TableHead>
              <TableHead className="w-14">笔画</TableHead>
              <TableHead className="w-14">难度</TableHead>
              <TableHead className="w-16">使用</TableHead>
              <TableHead className="w-16">正确</TableHead>
              <TableHead className="w-16">错误</TableHead>
              <TableHead className="w-20">工整度</TableHead>
              <TableHead>来源</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-14" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-14" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                </TableRow>
              ))
            ) : filteredChars && filteredChars.length > 0 ? (
              filteredChars.map((char) => {
                const avgNeatness = getAverageNeatness(char.neatness_total || 0, char.neatness_count || 0);
                return (
                  <TableRow key={char.id}>
                    <TableCell className="font-bold text-lg">{char.char}</TableCell>
                    <TableCell>{char.pinyin}</TableCell>
                    <TableCell>{char.stroke_count}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs">{DIFFICULTY_LABELS[char.difficulty] || char.difficulty}</span>
                      </div>
                    </TableCell>
                    <TableCell>{char.usage_count || 0}</TableCell>
                    <TableCell>
                      {(char.correct_count || 0) > 0 ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>{char.correct_count}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(char.wrong_count || 0) > 0 ? (
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-3 w-3" />
                          <span>{char.wrong_count}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {avgNeatness ? (
                        <Badge
                          variant="outline"
                          className={
                            Number(avgNeatness) >= 80
                              ? 'border-green-500 text-green-600'
                              : Number(avgNeatness) >= 60
                              ? 'border-yellow-500 text-yellow-600'
                              : 'border-red-500 text-red-600'
                          }
                        >
                          {avgNeatness}分
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{char.source}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filteredChars && (
        <div className="text-sm text-muted-foreground">
          显示 {filteredChars.length} 条记录
        </div>
      )}
    </div>
  );
}
