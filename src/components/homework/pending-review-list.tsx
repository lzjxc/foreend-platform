import { ClipboardList, CheckCheck, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PendingReviewCard } from './pending-review-card';
import type { PendingReviewItem } from '@/types/homework';

interface PendingReviewListProps {
  items: PendingReviewItem[];
  onEdit: (reviewId: string, index: number, correct: boolean) => void;
  onConfirm: (reviewId: string) => void;
  onDelete: (reviewId: string) => void;
  onTypeChange?: (reviewId: string, newType: 'math' | 'english' | 'chinese') => void;
  onNeatnessOverride?: (reviewId: string, passed: boolean) => void;
  onConfirmAll: () => void;
  onClearAll: () => void;
  confirmingIds: Set<string>;
  changingTypeIds?: Set<string>;
  overridingNeatnessIds?: Set<string>;
  isConfirmingAll?: boolean;
  isClearingAll?: boolean;
}

export function PendingReviewList({
  items,
  onEdit,
  onConfirm,
  onDelete,
  onTypeChange,
  onNeatnessOverride,
  onConfirmAll,
  onClearAll,
  confirmingIds,
  changingTypeIds = new Set(),
  overridingNeatnessIds = new Set(),
  isConfirmingAll = false,
  isClearingAll = false,
}: PendingReviewListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <ClipboardList className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-center">
          暂无待核查项目
          <br />
          <span className="text-sm">上传作业照片后，识别结果将显示在这里</span>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 标题和操作栏 */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          待核查历史 ({items.length})
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAll}
            disabled={isConfirmingAll || isClearingAll || confirmingIds.size > 0}
          >
            {isClearingAll ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                删除中...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-1" />
                全部删除
              </>
            )}
          </Button>
          <Button
            size="sm"
            onClick={onConfirmAll}
            disabled={isConfirmingAll || isClearingAll || confirmingIds.size > 0}
          >
            {isConfirmingAll ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                提交中...
              </>
            ) : (
              <>
                <CheckCheck className="h-4 w-4 mr-1" />
                全部确认
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 核查卡片列表 */}
      <div className="space-y-4">
        {items.map((item) => (
          <PendingReviewCard
            key={item.id}
            item={item}
            onEdit={(index, correct) => onEdit(item.id, index, correct)}
            onConfirm={() => onConfirm(item.id)}
            onDelete={() => onDelete(item.id)}
            onTypeChange={onTypeChange ? (newType) => onTypeChange(item.id, newType) : undefined}
            onNeatnessOverride={
              onNeatnessOverride && item.homeworkType === 'chinese'
                ? (passed) => onNeatnessOverride(item.id, passed)
                : undefined
            }
            isConfirming={confirmingIds.has(item.id) || isConfirmingAll}
            isChangingType={changingTypeIds.has(item.id)}
            isOverridingNeatness={overridingNeatnessIds.has(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
