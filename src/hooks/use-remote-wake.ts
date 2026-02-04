import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { remoteWakeClient, macCameraClient } from '@/api/client';
import type {
  MachineInfo,
  MachineStatus,
  WakeResponse,
  ShutdownResponse,
  TaskStatusResponse,
  CameraStatus,
  CameraStorageStatus,
  SnapshotResponse,
  SnapshotListResponse,
  StreamResponse,
  UploadResult,
} from '@/types/remote-wake';

export const machineKeys = {
  all: ['machines'] as const,
  list: () => [...machineKeys.all, 'list'] as const,
  status: (name: string) => [...machineKeys.all, 'status', name] as const,
  task: (taskId: string) => [...machineKeys.all, 'task', taskId] as const,
};

const machinesApi = {
  listMachines: async (): Promise<MachineInfo[]> => {
    const resp = await remoteWakeClient.get('/api/v1/machines');
    return resp.data;
  },
  getMachineStatus: async (name: string): Promise<MachineStatus> => {
    const resp = await remoteWakeClient.get(`/api/v1/machines/${name}/status`);
    return resp.data;
  },
  wake: async (name: string): Promise<WakeResponse> => {
    const resp = await remoteWakeClient.post(`/api/v1/wake/${name}`);
    return resp.data;
  },
  shutdown: async (name: string): Promise<ShutdownResponse> => {
    const resp = await remoteWakeClient.post(`/api/v1/shutdown/${name}`);
    return resp.data;
  },
  getTaskStatus: async (taskId: string): Promise<TaskStatusResponse> => {
    const resp = await remoteWakeClient.get(`/api/v1/wake/task/${taskId}`);
    return resp.data;
  },
};

export function useMachines() {
  return useQuery({
    queryKey: machineKeys.list(),
    queryFn: machinesApi.listMachines,
    staleTime: 60 * 1000,
  });
}

export function useMachineStatus(name: string) {
  return useQuery({
    queryKey: machineKeys.status(name),
    queryFn: () => machinesApi.getMachineStatus(name),
    staleTime: 10 * 1000,
    enabled: !!name,
  });
}

export function useTaskStatus(taskId: string | null) {
  return useQuery({
    queryKey: machineKeys.task(taskId!),
    queryFn: () => machinesApi.getTaskStatus(taskId!),
    enabled: !!taskId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'ready' || status === 'timeout' || status === 'failed') {
        return false;
      }
      return 3000;
    },
  });
}

export function useWakeMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: machinesApi.wake,
    onSuccess: (_data, machineName) => {
      queryClient.invalidateQueries({ queryKey: machineKeys.status(machineName) });
    },
  });
}

export function useShutdownMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: machinesApi.shutdown,
    onSuccess: (_data, machineName) => {
      queryClient.invalidateQueries({ queryKey: machineKeys.status(machineName) });
    },
  });
}

// ==================== Camera Hooks ====================

export const cameraKeys = {
  all: ['camera'] as const,
  status: () => [...cameraKeys.all, 'status'] as const,
  storageStatus: () => [...cameraKeys.all, 'storage'] as const,
  snapshots: () => [...cameraKeys.all, 'snapshots'] as const,
};

const cameraApi = {
  getStatus: async (): Promise<CameraStatus> => {
    const resp = await macCameraClient.get('/api/v1/camera/status');
    return resp.data;
  },
  getStorageStatus: async (): Promise<CameraStorageStatus> => {
    const resp = await macCameraClient.get('/api/v1/camera/storage/status');
    return resp.data;
  },
  takeSnapshot: async (): Promise<SnapshotResponse> => {
    const resp = await macCameraClient.post('/api/v1/camera/snapshot');
    return resp.data;
  },
  listSnapshots: async (): Promise<SnapshotListResponse> => {
    const resp = await macCameraClient.get('/api/v1/camera/snapshot/list');
    return resp.data;
  },
  startStream: async (): Promise<StreamResponse> => {
    const resp = await macCameraClient.post('/api/v1/camera/stream/start');
    return resp.data;
  },
  stopStream: async (): Promise<StreamResponse> => {
    const resp = await macCameraClient.post('/api/v1/camera/stream/stop');
    return resp.data;
  },
  uploadSnapshot: async (filename: string): Promise<UploadResult> => {
    const resp = await macCameraClient.post(`/api/v1/camera/snapshot/${filename}/upload`);
    return resp.data;
  },
};

export function useCameraStatus() {
  return useQuery({
    queryKey: cameraKeys.status(),
    queryFn: cameraApi.getStatus,
    staleTime: 10 * 1000,
    retry: 1,
  });
}

export function useCameraStorageStatus() {
  return useQuery({
    queryKey: cameraKeys.storageStatus(),
    queryFn: cameraApi.getStorageStatus,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

export function useSnapshotList() {
  return useQuery({
    queryKey: cameraKeys.snapshots(),
    queryFn: cameraApi.listSnapshots,
    staleTime: 30 * 1000,
    retry: 1,
  });
}

export function useTakeSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cameraApi.takeSnapshot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cameraKeys.snapshots() });
      queryClient.invalidateQueries({ queryKey: cameraKeys.status() });
      queryClient.invalidateQueries({ queryKey: cameraKeys.storageStatus() });
    },
  });
}

export function useUploadSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cameraApi.uploadSnapshot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cameraKeys.storageStatus() });
    },
  });
}

export function useStartStream() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cameraApi.startStream,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cameraKeys.status() });
    },
  });
}

export function useStopStream() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cameraApi.stopStream,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cameraKeys.status() });
    },
  });
}
