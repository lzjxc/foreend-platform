import { useState, useRef, useEffect, useCallback } from 'react';
import { Power, PowerOff, RefreshCw, Loader2, Monitor, Camera, Video, VideoOff, Upload, HardDrive, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Hls from 'hls.js';
import {
  useMachines,
  useMachineStatus,
  useWakeMachine,
  useShutdownMachine,
  useTaskStatus,
  useCameraStatus,
  useCameraStorageStatus,
  useSnapshotList,
  useTakeSnapshot,
  useUploadSnapshot,
  useStartStream,
  useStopStream,
} from '@/hooks/use-remote-wake';
import type { TaskStatus, SnapshotItem } from '@/types/remote-wake';

const STATUS_LABELS: Record<TaskStatus, string> = {
  initiated: '初始化中...',
  checking_plug: '检查插座状态...',
  powering_on: '正在通电...',
  waiting_boot: '等待主机启动...',
  waiting_sunshine: '等待 Sunshine 就绪...',
  ready: 'Sunshine 已就绪',
  timeout: '超时',
  failed: '失败',
};

function MachineCard({ name }: { name: string }) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useMachineStatus(name);
  const { data: taskData } = useTaskStatus(activeTaskId);
  const wakeMutation = useWakeMachine();
  const shutdownMutation = useShutdownMachine();

  // Clear task when terminal
  if (taskData && ['ready', 'timeout', 'failed'].includes(taskData.status) && activeTaskId) {
    setTimeout(() => {
      setActiveTaskId(null);
      refetchStatus();
    }, 3000);
  }

  const handleWake = async () => {
    try {
      const result = await wakeMutation.mutateAsync(name);
      if (result.task_id) {
        setActiveTaskId(result.task_id);
      }
    } catch {
      // error handled by React Query
    }
  };

  const handleShutdown = async () => {
    try {
      await shutdownMutation.mutateAsync(name);
      setTimeout(() => refetchStatus(), 2000);
    } catch {
      // error handled by React Query
    }
  };

  const isTaskActive = activeTaskId && taskData && !['ready', 'timeout', 'failed'].includes(taskData.status);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{name}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" onClick={() => refetchStatus()} disabled={statusLoading}>
            <RefreshCw className={`h-4 w-4 ${statusLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {status && (
          <CardDescription>
            {status.plug_on === true ? '已通电' : status.plug_on === false ? '已断电' : '状态未知'}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Badges */}
        {status && (
          <div className="flex flex-wrap gap-2">
            <Badge variant={status.plug_on ? 'success' : 'destructive'}>
              插座: {status.plug_on ? 'ON' : 'OFF'}
            </Badge>
            <Badge variant={status.host_reachable ? 'success' : 'secondary'}>
              主机: {status.host_reachable ? '在线' : '离线'}
            </Badge>
            <Badge variant={status.sunshine_ready ? 'success' : 'secondary'}>
              Sunshine: {status.sunshine_ready ? '就绪' : '未就绪'}
            </Badge>
          </div>
        )}

        {statusLoading && !status && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            加载状态中...
          </div>
        )}

        {/* Active Task Progress */}
        {isTaskActive && taskData && (
          <div className="rounded-lg border bg-muted/50 p-3">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>{STATUS_LABELS[taskData.status] || taskData.status}</span>
            </div>
          </div>
        )}

        {/* Terminal task result */}
        {taskData && taskData.status === 'ready' && activeTaskId && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950">
            <span className="text-sm text-green-700 dark:text-green-300">Sunshine 已就绪，可以连接远程桌面</span>
          </div>
        )}
        {taskData && (taskData.status === 'timeout' || taskData.status === 'failed') && activeTaskId && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
            <span className="text-sm text-red-700 dark:text-red-300">{taskData.message}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          onClick={handleWake}
          disabled={wakeMutation.isPending || !!isTaskActive}
          className="bg-green-600 hover:bg-green-700"
        >
          {wakeMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Power className="mr-2 h-4 w-4" />
          )}
          开机
        </Button>
        <Button
          variant="destructive"
          onClick={handleShutdown}
          disabled={shutdownMutation.isPending || !!isTaskActive}
        >
          {shutdownMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PowerOff className="mr-2 h-4 w-4" />
          )}
          关机
        </Button>
      </CardFooter>
    </Card>
  );
}

// ==================== HLS Video Player ====================

function HlsPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      // Chrome/Firefox/Edge: use hls.js
      const hls = new Hls({ liveDurationInfinity: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS fallback
      video.src = src;
      video.play().catch(() => {});
    }
  }, [src]);

  return (
    <video
      ref={videoRef}
      className="w-full rounded-lg bg-black"
      controls
      autoPlay
      muted
      playsInline
    />
  );
}

// ==================== Camera Section ====================

function CameraSection() {
  const [previewTs, setPreviewTs] = useState(Date.now());
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const { data: cameraStatus, isLoading: cameraLoading, error: cameraError } = useCameraStatus();
  const { data: storageStatus } = useCameraStorageStatus();
  const { data: snapshotData, isLoading: snapshotsLoading } = useSnapshotList();
  const takeSnapshotMutation = useTakeSnapshot();
  const uploadMutation = useUploadSnapshot();
  const startStreamMutation = useStartStream();
  const stopStreamMutation = useStopStream();

  const isStreaming = cameraStatus?.streaming ?? false;
  const isOnline = cameraStatus?.status === 'ok';

  const handleTakeSnapshot = useCallback(async () => {
    try {
      await takeSnapshotMutation.mutateAsync();
      setPreviewTs(Date.now());
    } catch {
      // handled by React Query
    }
  }, [takeSnapshotMutation]);

  const handleToggleStream = useCallback(async () => {
    try {
      if (isStreaming) {
        await stopStreamMutation.mutateAsync();
      } else {
        await startStreamMutation.mutateAsync();
      }
    } catch {
      // handled by React Query
    }
  }, [isStreaming, startStreamMutation, stopStreamMutation]);

  const handleUpload = useCallback(async (filename: string) => {
    try {
      await uploadMutation.mutateAsync(filename);
    } catch {
      // handled by React Query
    }
  }, [uploadMutation]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (cameraLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>检查摄像头状态...</span>
        </CardContent>
      </Card>
    );
  }

  if (cameraError) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">MacBook 摄像头</CardTitle>
            <Badge variant="destructive">离线</Badge>
          </div>
          <CardDescription>摄像头服务不可达，MacBook 可能未开机</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">MacBook 摄像头</CardTitle>
              <Badge variant={isOnline ? 'success' : 'destructive'}>
                {isOnline ? '在线' : '离线'}
              </Badge>
              {isStreaming && (
                <Badge variant="default" className="bg-red-500">
                  <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
                  直播中
                </Badge>
              )}
            </div>
          </div>
          <CardDescription>
            设备: {cameraStatus?.camera_device ?? '-'} / 本地照片: {cameraStatus?.snapshot_count ?? 0} 张
            {storageStatus && (
              <> / MinIO: {storageStatus.connected ? `${storageStatus.remote_files} 张` : '未连接'}
                {storageStatus.auto_upload && ' (自动上传)'}
              </>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={handleTakeSnapshot}
              disabled={takeSnapshotMutation.isPending || !isOnline}
            >
              {takeSnapshotMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Camera className="mr-2 h-4 w-4" />
              )}
              拍照
            </Button>
            <Button
              size="sm"
              variant={isStreaming ? 'destructive' : 'secondary'}
              onClick={handleToggleStream}
              disabled={startStreamMutation.isPending || stopStreamMutation.isPending || !isOnline}
            >
              {(startStreamMutation.isPending || stopStreamMutation.isPending) ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isStreaming ? (
                <VideoOff className="mr-2 h-4 w-4" />
              ) : (
                <Video className="mr-2 h-4 w-4" />
              )}
              {isStreaming ? '停止直播' : '开始直播'}
            </Button>
          </div>

          {/* Storage status */}
          {storageStatus && (
            <div className="flex flex-wrap gap-2">
              <Badge variant={storageStatus.connected ? 'outline' : 'destructive'}>
                <HardDrive className="mr-1 h-3 w-3" />
                MinIO: {storageStatus.connected ? '已连接' : '断开'}
              </Badge>
              {storageStatus.connected && (
                <Badge variant="outline">
                  远程: {storageStatus.remote_files} 张
                </Badge>
              )}
              {storageStatus.auto_upload && (
                <Badge variant="outline" className="text-green-600">
                  自动上传
                </Badge>
              )}
            </div>
          )}

          {/* Latest snapshot preview */}
          {isOnline && (cameraStatus?.snapshot_count ?? 0) > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">最新照片</p>
              <img
                src={`/mac-camera-api/api/v1/camera/snapshot/latest?t=${previewTs}`}
                alt="Latest snapshot"
                className="w-full max-w-md rounded-lg border cursor-pointer"
                onClick={() => setLightboxImage(`/mac-camera-api/api/v1/camera/snapshot/latest?t=${previewTs}`)}
              />
            </div>
          )}

          {/* HLS Live stream */}
          {isStreaming && (
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">直播画面</p>
              <HlsPlayer src="/mac-camera-api/api/v1/camera/stream/live/stream.m3u8" />
            </div>
          )}

          {/* Snapshot gallery */}
          {snapshotsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              加载照片列表...
            </div>
          ) : snapshotData && snapshotData.snapshots.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                照片列表 ({snapshotData.count} 张)
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {snapshotData.snapshots.map((snap: SnapshotItem) => (
                  <div key={snap.filename} className="group relative rounded-lg border overflow-hidden">
                    <img
                      src={`/mac-camera-api${snap.url}`}
                      alt={snap.filename}
                      className="aspect-[4/3] w-full object-cover cursor-pointer"
                      loading="lazy"
                      onClick={() => setLightboxImage(`/mac-camera-api${snap.url}`)}
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-xs text-white truncate">{snap.filename.replace('snapshot_', '').replace('.jpg', '')}</p>
                      <p className="text-xs text-white/70">{formatSize(snap.size)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-7 w-7 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpload(snap.filename);
                      }}
                      disabled={uploadMutation.isPending}
                      title="上传到 MinIO"
                    >
                      {uploadMutation.isPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Upload className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightboxImage(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 text-white hover:bg-white/20"
            onClick={() => setLightboxImage(null)}
          >
            <X className="h-6 w-6" />
          </Button>
          <img
            src={lightboxImage}
            alt="Full size"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

export default function MachinesPage() {
  const { data: machines, isLoading, error } = useMachines();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">远程设备</h1>
        <p className="text-muted-foreground">管理远程主机的电源和连接状态</p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          加载设备列表...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-700 dark:text-red-300">
            无法加载设备列表: {error.message}
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {machines?.map((machine) => (
          <MachineCard key={machine.name} name={machine.name} />
        ))}
      </div>

      {machines?.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          暂无设备配置
        </div>
      )}

      {/* Camera Section */}
      <CameraSection />
    </div>
  );
}
