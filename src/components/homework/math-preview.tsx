import { useState } from 'react';
import { RefreshCw, Database, CheckCircle, XCircle, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMathStats, useMathProblems } from '@/hooks/use-math';

const OPERATION_LABELS: Record<string, string> = {
  add: '加法',
  subtract: '减法',
};

const OPERATION_COLORS: Record<string, string> = {
  add: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  subtract: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

export function MathPreview() {
  const [operation, setOperation] = useState<'add' | 'subtract' | 'mixed' | undefined>(undefined);
  const [hasWrong, setHasWrong] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'wrong_count' | 'occurrence_count' | 'last_used_date'>('wrong_count');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: stats, isLoading: statsLoading } = useMathStats();
  const { data: problemsData, isLoading: problemsLoading, refetch } = useMathProblems({
    operation,
    has_wrong: hasWrong,
    sort_by: sortBy,
    sort_desc: true,
    page,
    page_size: pageSize,
  });

  const totalPages = problemsData?.total_pages || 1;

  return (
    <div className="space-y-4">
      {/* 题库统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Database className="h-4 w-4" />
              <span className="text-xs">题库总数</span>
            </div>
            {statsLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total_problems || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs">错题数</span>
            </div>
            {statsLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold text-red-600">{stats?.wrong_problems || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs">答题正确率</span>
            </div>
            {statsLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {(stats?.accuracy || 0).toFixed(1)}%
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">答题次数</span>
            </div>
            {statsLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-lg font-bold">
                <span className="text-green-600">{stats?.total_correct_answers || 0}</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-red-600">{stats?.total_wrong_answers || 0}</span>
              </div>
            )}
            <div className="text-xs text-muted-foreground">正确/错误</div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选和表格 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-5 w-5" />
              题库列表
              {problemsData && (
                <span className="text-sm font-normal text-muted-foreground">
                  (共 {problemsData.total} 题)
                </span>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>
              <RefreshCw className={`h-4 w-4 ${problemsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 筛选条件 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label>运算类型</Label>
              <Select
                value={operation || 'all'}
                onValueChange={(v) => {
                  setOperation(v === 'all' ? undefined : v as 'add' | 'subtract');
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="add">加法</SelectItem>
                  <SelectItem value="subtract">减法</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>题目类型</Label>
              <Select
                value={hasWrong === undefined ? 'all' : hasWrong ? 'wrong' : 'correct'}
                onValueChange={(v) => {
                  setHasWrong(v === 'all' ? undefined : v === 'wrong');
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="wrong">有错误记录</SelectItem>
                  <SelectItem value="correct">无错误记录</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>排序方式</Label>
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as typeof sortBy)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wrong_count">按错误次数</SelectItem>
                  <SelectItem value="occurrence_count">按出现次数</SelectItem>
                  <SelectItem value="last_used_date">按使用时间</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 题目表格 */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">算式</TableHead>
                  <TableHead className="w-20">答案</TableHead>
                  <TableHead className="w-20">类型</TableHead>
                  <TableHead className="w-20">进退位</TableHead>
                  <TableHead className="w-24">出现次数</TableHead>
                  <TableHead className="w-24">正确</TableHead>
                  <TableHead className="w-24">错误</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {problemsLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                    </TableRow>
                  ))
                ) : problemsData?.data && problemsData.data.length > 0 ? (
                  problemsData.data.map((problem) => (
                    <TableRow key={problem.id}>
                      <TableCell className="font-mono text-lg">{problem.expression}</TableCell>
                      <TableCell className="font-medium">{problem.answer}</TableCell>
                      <TableCell>
                        <Badge className={OPERATION_COLORS[problem.operation_type]}>
                          {OPERATION_LABELS[problem.operation_type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {problem.has_carry ? (
                          <Badge variant="outline" className="text-orange-600">有</Badge>
                        ) : (
                          <span className="text-muted-foreground">无</span>
                        )}
                      </TableCell>
                      <TableCell>{problem.occurrence_count}</TableCell>
                      <TableCell className="text-green-600">{problem.correct_count}</TableCell>
                      <TableCell className={problem.wrong_count > 0 ? 'text-red-600 font-medium' : ''}>
                        {problem.wrong_count}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      暂无题目数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                第 {page} 页，共 {totalPages} 页
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
