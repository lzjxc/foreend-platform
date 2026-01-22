import { useState } from 'react';
import { Search, RefreshCw, Image as ImageIcon } from 'lucide-react';
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
import { useEnglishWords, useEnglishStats } from '@/hooks/use-english';

const DIFFICULTY_LABELS: Record<number, string> = {
  1: '⭐',
  2: '⭐⭐',
  3: '⭐⭐⭐',
  4: '⭐⭐⭐⭐',
  5: '⭐⭐⭐⭐⭐',
};

export function EnglishWordTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [hasImageFilter, setHasImageFilter] = useState<string>('all');

  const { data: words, isLoading, refetch } = useEnglishWords({
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    difficulty: difficultyFilter === 'all' ? undefined : Number(difficultyFilter),
    has_image: hasImageFilter === 'all' ? undefined : hasImageFilter === 'true',
  });

  const { data: stats } = useEnglishStats();

  // 过滤搜索结果
  const filteredWords = words?.filter((word) =>
    searchTerm
      ? word.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.meaning.includes(searchTerm)
      : true
  );

  // 获取唯一的分类列表
  const categories = stats?.by_category ? Object.keys(stats.by_category) : [];

  return (
    <div className="space-y-4">
      {/* 统计信息 */}
      {stats && (
        <div className="text-sm text-muted-foreground">
          总计: {stats.total_words} 词
          {stats.with_image !== undefined && (
            <span className="ml-2">({stats.with_image} 有图)</span>
          )}
          {stats.by_category && Object.keys(stats.by_category).length > 0 && (
            <span className="ml-4">
              {Object.entries(stats.by_category).map(([cat, count]) => (
                <span key={cat} className="mr-3">
                  {cat}: {count}
                </span>
              ))}
            </span>
          )}
        </div>
      )}

      {/* 筛选和搜索 */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm">分类:</Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
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

        <div className="flex items-center gap-2">
          <Label className="text-sm">图片:</Label>
          <Select value={hasImageFilter} onValueChange={setHasImageFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="true">有图</SelectItem>
              <SelectItem value="false">无图</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索单词或中文..."
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
              <TableHead className="w-24">单词</TableHead>
              <TableHead className="w-24">中文</TableHead>
              <TableHead className="w-24">音标</TableHead>
              <TableHead className="w-24">分类</TableHead>
              <TableHead className="w-24">难度</TableHead>
              <TableHead className="w-24">使用次数</TableHead>
              <TableHead className="w-16">图片</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-8" /></TableCell>
                </TableRow>
              ))
            ) : filteredWords && filteredWords.length > 0 ? (
              filteredWords.map((word) => (
                <TableRow key={word.id}>
                  <TableCell className="font-medium">{word.word}</TableCell>
                  <TableCell>{word.meaning}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {word.phonetic || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{word.category}</Badge>
                  </TableCell>
                  <TableCell>{DIFFICULTY_LABELS[word.difficulty] || word.difficulty}</TableCell>
                  <TableCell>{word.usage_count ?? '-'}</TableCell>
                  <TableCell>
                    {word.image_url || word.image_path ? (
                      <ImageIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
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

      {filteredWords && (
        <div className="text-sm text-muted-foreground">
          显示 {filteredWords.length} 条记录
        </div>
      )}
    </div>
  );
}
