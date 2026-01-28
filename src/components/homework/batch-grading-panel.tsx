import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Pencil } from 'lucide-react';
import { MultiFileDropzone } from './multi-file-dropzone';
import { UploadQueueProgress } from './upload-queue-progress';
import { PendingReviewList } from './pending-review-list';
import { TypeSelectDialog } from './type-select-dialog';
import { useGradingQueue } from '@/hooks/use-grading-queue';

export function BatchGradingPanel() {
  const {
    uploadQueue,
    processingQueue,
    pendingReviews,
    needsTypeQueue,
    isUploading,
    confirmingIds,
    isConfirmingAll,
    isClearingAll,
    changingTypeIds,
    overridingNeatnessIds,
    addFiles,
    retryWithType,
    clearNeedsTypeQueue,
    updateUserEdit,
    confirmReview,
    deleteReview,
    confirmAllReviews,
    clearAllReviews,
    changeReviewType,
    overrideNeatness,
  } = useGradingQueue();

  // 处理用户选择类型后的重试
  const handleTypeSelect = (type: 'math' | 'english' | 'chinese') => {
    retryWithType(needsTypeQueue, type);
  };

  // 处理取消类型选择
  const handleTypeCancel = () => {
    clearNeedsTypeQueue();
  };

  return (
    <div className="space-y-6">
      {/* 类型选择弹窗 */}
      <TypeSelectDialog
        files={needsTypeQueue}
        onSelect={handleTypeSelect}
        onCancel={handleTypeCancel}
      />

      {/* 上传区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            上传批改
          </CardTitle>
          <CardDescription>
            上传已批改的作业照片，系统自动识别类型并批改（支持JPG/PNG/PDF）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <MultiFileDropzone
            onFilesSelected={addFiles}
            disabled={false}
            isUploading={isUploading}
            maxFiles={20}
          />

          {/* 上传/处理队列进度 */}
          <UploadQueueProgress
            uploadQueue={uploadQueue}
            processingQueue={processingQueue}
          />
        </CardContent>
      </Card>

      {/* 待核查列表 */}
      <Card>
        <CardContent className="pt-6">
          <PendingReviewList
            items={pendingReviews}
            onEdit={updateUserEdit}
            onConfirm={confirmReview}
            onDelete={deleteReview}
            onTypeChange={changeReviewType}
            onNeatnessOverride={overrideNeatness}
            onConfirmAll={confirmAllReviews}
            onClearAll={clearAllReviews}
            confirmingIds={confirmingIds}
            changingTypeIds={changingTypeIds}
            overridingNeatnessIds={overridingNeatnessIds}
            isConfirmingAll={isConfirmingAll}
            isClearingAll={isClearingAll}
          />
        </CardContent>
      </Card>
    </div>
  );
}
