import { useMemo, useState } from 'react';
import { CheckCircle, XCircle, Trash2, Send, ZoomIn, RefreshCw, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { PendingReviewItem } from '@/types/homework';

interface PendingReviewCardProps {
  item: PendingReviewItem;
  onEdit: (index: number, correct: boolean) => void;
  onConfirm: () => void;
  onDelete: () => void;
  onTypeChange?: (newType: 'math' | 'english' | 'chinese') => void;
  onNeatnessOverride?: (passed: boolean) => void;
  isConfirming?: boolean;
  isChangingType?: boolean;
  isOverridingNeatness?: boolean;
}

const HOMEWORK_TYPE_CONFIG = {
  math: {
    label: '数学',
    color: 'bg-blue-100 text-blue-800',
  },
  english: {
    label: '英语',
    color: 'bg-green-100 text-green-800',
  },
  chinese: {
    label: '语文',
    color: 'bg-orange-100 text-orange-800',
  },
} as const;

export function PendingReviewCard({
  item,
  onEdit,
  onConfirm,
  onDelete,
  onTypeChange,
  onNeatnessOverride,
  isConfirming = false,
  isChangingType = false,
  isOverridingNeatness = false,
}: PendingReviewCardProps) {
  const [showTypeSelect, setShowTypeSelect] = useState(false);
  // 构建图片 URL - 优先使用标注图、其次原图预览、最后从 imagePath 构建
  const imageUrl = useMemo(() => {
    if (item.annotatedImageUrl) return item.annotatedImageUrl;
    // blob URL 以 blob: 开头，刷新后会失效
    if (item.originalPreviewUrl && !item.originalPreviewUrl.startsWith('blob:')) {
      return item.originalPreviewUrl;
    }
    // 使用 imagePath 构建 MinIO URL
    if (item.imagePath) {
      return `/minio-s3/images/${item.imagePath}`;
    }
    return item.originalPreviewUrl; // fallback
  }, [item.annotatedImageUrl, item.originalPreviewUrl, item.imagePath]);

  // 计算当前结果（考虑用户编辑）
  const { results, totalCorrect, totalWrong, accuracy } = useMemo(() => {
    if (item.homeworkType === 'chinese') {
      // 语文直接返回规范分数
      const score = item.neatnessResult?.average_score ?? 0;
      return {
        results: [],
        totalCorrect: 0,
        totalWrong: 0,
        accuracy: score,
      };
    }

    // 数学/英语计算正确/错误数
    const results = item.results || [];
    let correct = 0;
    let wrong = 0;

    results.forEach((result, index) => {
      // 优先使用用户编辑，否则使用原始结果
      const isCorrect = item.userEdits[index] ?? result.correct;
      if (isCorrect) {
        correct++;
      } else {
        wrong++;
      }
    });

    const total = correct + wrong;
    const acc = total > 0 ? Math.round((correct / total) * 100) : 0;

    return {
      results,
      totalCorrect: correct,
      totalWrong: wrong,
      accuracy: acc,
    };
  }, [item]);

  const typeConfig = HOMEWORK_TYPE_CONFIG[item.homeworkType];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3 px-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showTypeSelect && onTypeChange ? (
              <Select
                defaultValue={item.homeworkType}
                onValueChange={(value) => {
                  onTypeChange(value as 'math' | 'english' | 'chinese');
                  setShowTypeSelect(false);
                }}
                disabled={isChangingType}
              >
                <SelectTrigger className="w-24 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="math">数学</SelectItem>
                  <SelectItem value="english">英语</SelectItem>
                  <SelectItem value="chinese">语文</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge
                className={cn(typeConfig.color, onTypeChange && 'cursor-pointer hover:opacity-80')}
                onClick={() => onTypeChange && setShowTypeSelect(true)}
                title={onTypeChange ? '点击修改类型' : undefined}
              >
                {isChangingType ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : null}
                {typeConfig.label}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {item.homeworkDate}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {item.homeworkType === 'chinese' ? (
              <span
                className={cn(
                  'font-medium',
                  accuracy >= 60 ? 'text-green-600' : 'text-red-600'
                )}
              >
                规范分: {accuracy.toFixed(1)}
              </span>
            ) : (
              <>
                <span className="text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  {totalCorrect}
                </span>
                <span className="text-red-600 font-medium flex items-center gap-1">
                  <XCircle className="h-4 w-4" />
                  {totalWrong}
                </span>
                <span className="text-muted-foreground">({accuracy}%)</span>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* 原图预览 */}
        <div className="relative">
          <Dialog>
            <DialogTrigger asChild>
              <div className="relative cursor-pointer group">
                <img
                  src={imageUrl}
                  alt="作业图片"
                  className="w-full max-h-64 object-contain rounded-lg border"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                  <ZoomIn className="h-8 w-8 text-white" />
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
              <img
                src={imageUrl}
                alt="作业图片"
                className="w-full h-auto"
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* 识别结果 */}
        {item.homeworkType === 'chinese' ? (
          // 语文书写规范结果
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">书写规范评估</span>
                <Badge
                  className={cn(
                    accuracy >= 60
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  )}
                >
                  {accuracy >= 60 ? '通过' : '未通过'}
                </Badge>
              </div>
              {/* 手动切换通过/不通过 */}
              {onNeatnessOverride && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onNeatnessOverride(accuracy < 60)}
                  disabled={isOverridingNeatness}
                  className="h-7 text-xs"
                >
                  {isOverridingNeatness ? (
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <CheckCheck className="h-3 w-3 mr-1" />
                  )}
                  {accuracy >= 60 ? '改为不通过' : '改为通过'}
                </Button>
              )}
            </div>
            {item.neatnessResult?.chars && (
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
                {item.neatnessResult.chars.map((char, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex flex-col items-center p-1 rounded text-xs',
                      char.score >= 60 ? 'bg-green-50' : 'bg-red-50'
                    )}
                    title={`${char.char}: ${char.score.toFixed(0)}分`}
                  >
                    <span className="text-base font-medium">{char.char}</span>
                    <span
                      className={cn(
                        char.score >= 60 ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {char.score.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {item.neatnessResult?.overall_feedback && (
              <p className="text-sm text-muted-foreground">
                {item.neatnessResult.overall_feedback}
              </p>
            )}
            {/* 没有评语时显示提示 */}
            {!item.neatnessResult?.overall_feedback && accuracy < 60 && (
              <p className="text-sm text-muted-foreground italic">
                书写有待改进，请继续练习
              </p>
            )}
          </div>
        ) : (
          // 数学/英语批改结果
          <div className="space-y-2">
            <span className="text-sm font-medium">批改结果（点击切换）</span>
            <div className="grid grid-cols-10 gap-1">
              {results.map((result, index) => {
                // 优先使用用户编辑
                const isCorrect = item.userEdits[index] ?? result.correct;
                const hasEdit = index in item.userEdits;

                return (
                  <button
                    key={index}
                    onClick={() => onEdit(index, !isCorrect)}
                    className={cn(
                      'w-8 h-8 rounded flex items-center justify-center text-xs font-medium transition-colors',
                      isCorrect
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-red-100 text-red-800 hover:bg-red-200',
                      hasEdit && 'ring-2 ring-primary ring-offset-1'
                    )}
                    title={
                      item.homeworkType === 'math'
                        ? `题目 ${index + 1}${result.student_answer ? `: 学生答案 ${result.student_answer}` : ''}`
                        : `单词 ${index + 1}: ${result.word || ''}${result.student_spelling ? ` (写: ${result.student_spelling})` : ''}`
                    }
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            {/* 错误详情 */}
            {totalWrong > 0 && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">错误:</span>{' '}
                {results
                  .map((r, i) => ({ ...r, index: i }))
                  .filter((r) => !(item.userEdits[r.index] ?? r.correct))
                  .map((r) => {
                    if (item.homeworkType === 'math') {
                      return `第${r.index + 1}题${r.student_answer ? `(答:${r.student_answer})` : ''}`;
                    }
                    return `${r.word || `第${r.index + 1}个`}${r.student_spelling ? `(写:${r.student_spelling})` : ''}`;
                  })
                  .join(', ')}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="px-4 py-3 bg-muted/30 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          disabled={isConfirming}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          删除
        </Button>
        <Button
          size="sm"
          onClick={onConfirm}
          disabled={isConfirming}
        >
          <Send className="h-4 w-4 mr-1" />
          {isConfirming ? '提交中...' : '确认提交'}
        </Button>
      </CardFooter>
    </Card>
  );
}
