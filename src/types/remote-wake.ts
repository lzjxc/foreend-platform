export type TaskStatus =
  | 'initiated'
  | 'checking_plug'
  | 'powering_on'
  | 'waiting_boot'
  | 'waiting_sunshine'
  | 'ready'
  | 'timeout'
  | 'failed';

export interface MachineInfo {
  name: string;
  description: string;
  tailscale_ip: string;
  sunshine_port: number;
}

export interface MachineStatus {
  machine: string;
  plug_on: boolean | null;
  host_reachable: boolean;
  sunshine_ready: boolean;
}

export interface WakeResponse {
  success: boolean;
  machine: string;
  action: string;
  message: string;
  task_id: string | null;
}

export interface ShutdownResponse {
  success: boolean;
  machine: string;
  message: string;
}

export interface TaskStatusResponse {
  task_id: string;
  machine_name: string;
  status: TaskStatus;
  message: string;
  started_at: string;
  completed_at: string | null;
}

export interface PlugStatus {
  machine: string;
  is_on: boolean | null;
  error: string | null;
}

// ==================== Camera Types ====================

export interface CameraStatus {
  status: string;
  streaming: boolean;
  snapshot_count: number;
  camera_device: string;
}

export interface CameraStorageStatus {
  connected: boolean;
  bucket: string;
  auto_upload: boolean;
  remote_files: number;
}

export interface SnapshotResponse {
  success: boolean;
  filename: string;
  size: number;
  url: string;
}

export interface SnapshotItem {
  filename: string;
  size: number;
  created: string;
  url: string;
}

export interface SnapshotListResponse {
  count: number;
  snapshots: SnapshotItem[];
}

export interface StreamResponse {
  success: boolean;
  streaming: boolean;
  message: string;
  url: string | null;
}

export interface UploadResult {
  success: boolean;
  message: string;
  minio_key: string | null;
  minio_url: string | null;
}
