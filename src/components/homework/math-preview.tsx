import { useState } from 'react';
import { RefreshCw, Calculator } from 'lucide-react';
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
import { useMathPreview } from '@/hooks/use-math';
import type { MathOperation } from '@/types/homework';

const OPERATION_LABELS: Record<MathOperation, string> = {
  add: '加法',
  subtract: '减法',
  mixed: '混合',
};

const OPERATION_COLORS: Record<MathOperation, string> = {
  add: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  subtract: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  mixed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

export function MathPreview() {
  const [count, setCount] = useState(10);
  const [operation, setOperation] = useState<MathOperation>('mixed');
  const [maxNumber, setMaxNumber] = useState(100);
  const [allowCarry, setAllowCarry] = useState(true);

  const { data: preview, isLoading, refetch } = useMathPreview({
    count,
    operation,
    max_number: maxNumber,
    allow_carry: allowCarry,
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calculator className="h-5 w-5" />
            题目参数配置
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>题目数量</Label>
              <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20, 30, 40, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} 题
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>运算类型</Label>
              <Select value={operation} onValueChange={(v) => setOperation(v as MathOperation)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">加法</SelectItem>
                  <SelectItem value="subtract">减法</SelectItem>
                  <SelectItem value="mixed">混合</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>最大数值</Label>
              <Select value={String(maxNumber)} onValueChange={(v) => setMaxNumber(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[20, 50, 100, 200, 500, 1000].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>允许进位/借位</Label>
              <Select value={String(allowCarry)} onValueChange={(v) => setAllowCarry(v === 'true')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">允许</SelectItem>
                  <SelectItem value="false">不允许</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              重新生成预览
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 预览表格 */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead className="w-48">算式</TableHead>
              <TableHead className="w-24">答案</TableHead>
              <TableHead className="w-24">类型</TableHead>
              <TableHead className="w-24">进位/借位</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: count }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-6" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                </TableRow>
              ))
            ) : preview?.problems && preview.problems.length > 0 ? (
              preview.problems.map((problem, index) => (
                <TableRow key={index}>
                  <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-mono text-lg">{problem.expression}</TableCell>
                  <TableCell className="font-medium">{problem.answer}</TableCell>
                  <TableCell>
                    <Badge className={OPERATION_COLORS[problem.operation]}>
                      {OPERATION_LABELS[problem.operation]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {problem.has_carry ? (
                      <Badge variant="outline" className="text-orange-600">
                        有
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">无</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  暂无预览数据，点击"重新生成预览"按钮生成题目
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
        <p>说明：数学题目为实时随机生成，每次刷新都会获取新的题目。</p>
        <p className="mt-1">生成作业时会自动生成新的题目，此处仅作预览参考。</p>
      </div>
    </div>
  );
}
