import { useState } from 'react';
import { FileText, Loader2, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGenerateHomework } from '@/hooks/use-homework';
import type { HomeworkType, GenerateHomeworkResponse } from '@/types/homework';
import { toast } from 'sonner';

const HOMEWORK_TYPES: { value: HomeworkType; label: string }[] = [
  { value: 'combined', label: '综合作业' },
  { value: 'chinese', label: '语文作业' },
  { value: 'math', label: '数学作业' },
  { value: 'english', label: '英语作业' },
];

const HOMEWORK_TYPE_LABELS: Record<HomeworkType, string> = {
  combined: '综合作业',
  chinese: '语文作业',
  math: '数学作业',
  english: '英语作业',
};

export function HomeworkGenerator() {
  const [homeworkType, setHomeworkType] = useState<HomeworkType>('combined');
  const [homeworkDate, setHomeworkDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [chineseCount, setChineseCount] = useState<number>(4);
  const [mathCount, setMathCount] = useState<number>(40);
  const [englishCount, setEnglishCount] = useState<number>(8);
  const [result, setResult] = useState<GenerateHomeworkResponse | null>(null);

  const generateMutation = useGenerateHomework();

  const handleGenerate = async () => {
    try {
      const response = await generateMutation.mutateAsync({
        homework_type: homeworkType,
        homework_date: homeworkDate,
        chinese_count: chineseCount,
        math_count: mathCount,
        english_count: englishCount,
      });
      setResult(response);
      toast.success('作业生成成功！');
    } catch (error) {
      toast.error('作业生成失败，请重试');
      console.error('Failed to generate homework:', error);
    }
  };

  const showCounts = homeworkType === 'combined';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          生成作业
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 作业类型和日期 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>作业类型</Label>
            <Select value={homeworkType} onValueChange={(v) => setHomeworkType(v as HomeworkType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOMEWORK_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>作业日期</Label>
            <input
              type="date"
              value={homeworkDate}
              onChange={(e) => setHomeworkDate(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>

        {/* 题目数量配置 (仅综合作业显示) */}
        {showCounts && (
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>语文字数</Label>
              <Select value={String(chineseCount)} onValueChange={(v) => setChineseCount(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6, 8, 10].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} 字
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>数学题数</Label>
              <Select value={String(mathCount)} onValueChange={(v) => setMathCount(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[20, 30, 40, 50, 60, 80, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} 题
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>英语词数</Label>
              <Select value={String(englishCount)} onValueChange={(v) => setEnglishCount(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[4, 6, 8, 10, 12, 16, 20].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} 词
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* 生成按钮 */}
        <Button
          className="w-full"
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              生成作业
            </>
          )}
        </Button>

        {/* 生成结果 */}
        {result && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-800 dark:text-green-200">
                  {HOMEWORK_TYPE_LABELS[result.homework_type]}生成成功！
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  日期: {result.homework_date}
                </p>
              </div>
              {result.pdf_url && (
                <a
                  href={result.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <Download className="h-4 w-4" />
                  下载 PDF
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
