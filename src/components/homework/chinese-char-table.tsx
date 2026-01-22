import { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
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
import { useChineseChars, useChineseStats } from '@/hooks/use-chinese';

const DIFFICULTY_LABELS: Record<number, string> = {
  1: '⭐',
  2: '⭐⭐',
  3: '⭐⭐⭐',
  4: '⭐⭐⭐⭐',
  5: '⭐⭐⭐⭐⭐',
};

export function ChineseCharTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  const { data: chars, isLoading, refetch } = useChineseChars({
    source: sourceFilter === 'all' ? undefined : sourceFilter,
    difficulty: difficultyFilter === 'all' ? undefined : Number(difficultyFilter),
  });

  const { data: stats } = useChineseStats();

  // 过滤搜索结果
  const filteredChars = chars?.filter((char) =>
    searchTerm ? char.char.includes(searchTerm) || char.pinyin.includes(searchTerm) : true
  );

  // 获取唯一的来源列表
  const sources = stats?.by_source ? Object.keys(stats.by_source) : [];

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
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="1">⭐</SelectItem>
              <SelectItem value="2">⭐⭐</SelectItem>
              <SelectItem value="3">⭐⭐⭐</SelectItem>
              <SelectItem value="4">⭐⭐⭐⭐</SelectItem>
              <SelectItem value="5">⭐⭐⭐⭐⭐</SelectItem>
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
              <TableHead className="w-24">拼音</TableHead>
              <TableHead className="w-16">笔画</TableHead>
              <TableHead className="w-24">难度</TableHead>
              <TableHead className="w-24">使用次数</TableHead>
              <TableHead>来源</TableHead>
              <TableHead>备注</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                </TableRow>
              ))
            ) : filteredChars && filteredChars.length > 0 ? (
              filteredChars.map((char) => (
                <TableRow key={char.id}>
                  <TableCell className="font-bold text-lg">{char.char}</TableCell>
                  <TableCell>{char.pinyin}</TableCell>
                  <TableCell>{char.stroke_count}</TableCell>
                  <TableCell>{DIFFICULTY_LABELS[char.difficulty] || char.difficulty}</TableCell>
                  <TableCell>{char.usage_count ?? '-'}</TableCell>
                  <TableCell>{char.source}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {char.notes || '-'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
