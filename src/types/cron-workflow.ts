// Argo CronWorkflow types - 定时任务类型定义

export interface CronWorkflow {
  metadata: {
    name: string;
    namespace: string;
    annotations?: Record<string, string>;
    labels?: Record<string, string>;
    creationTimestamp: string;
    uid: string;
  };
  spec: {
    schedule: string;
    timezone?: string;
    suspend?: boolean;
    concurrencyPolicy?: string;
    successfulJobsHistoryLimit?: number;
    failedJobsHistoryLimit?: number;
    workflowSpec: {
      entrypoint: string;
      serviceAccountName?: string;
      templates: WorkflowTemplate[];
      onExit?: string;
    };
  };
  status?: {
    active?: { name: string; namespace: string }[];
    lastScheduledTime?: string;
    phase?: string;
    conditions?: { type: string; status: string; message?: string }[];
    succeeded?: number;
    failed?: number;
  };
}

export interface WorkflowTemplate {
  name: string;
  container?: {
    image: string;
    command?: string[];
    args?: string[];
  };
  steps?: {
    name: string;
    template?: string;
    templateRef?: { name: string; template: string };
    arguments?: {
      parameters?: { name: string; value: string }[];
    };
    when?: string;
  }[][];
  inputs?: {
    parameters?: { name: string; value?: string }[];
  };
}

export interface CronWorkflowList {
  items: CronWorkflow[];
}

// Parsed display info
export interface CronWorkflowDisplayInfo {
  name: string;
  appName: string;
  description: string;
  schedule: string;
  timezone: string;
  lastScheduledTime?: string;
  phase: string;
  suspended: boolean;
  succeeded: number;
  failed: number;
  createdAt: string;
}
