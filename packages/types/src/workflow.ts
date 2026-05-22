import type { Task, TaskId, Priority } from './task';

export type WorkflowId = string;

export type WorkflowStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'completed'
  | 'failed';

export interface WorkflowStep {
  readonly id: string;
  readonly taskName: string;
  readonly dependsOn: ReadonlyArray<string>;
  readonly priority?: Priority;
  readonly retryPolicy?: RetryPolicy;
}

export interface RetryPolicy {
  readonly maxRetries: number;
  readonly backoffMs: number;
  readonly backoffMultiplier: number;
}

export interface Workflow {
  readonly id: WorkflowId;
  readonly name: string;
  readonly status: WorkflowStatus;
  readonly steps: ReadonlyArray<WorkflowStep>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface WorkflowExecution {
  readonly workflowId: WorkflowId;
  readonly startedAt: Date;
  readonly completedAt?: Date;
  readonly stepTasks: ReadonlyMap<string, TaskId>;
  readonly currentStepIds: ReadonlyArray<string>;
}

export interface CreateWorkflowInput {
  name: string;
  steps: ReadonlyArray<WorkflowStep>;
}

export type WorkflowSnapshot = Pick<Workflow, 'id' | 'name' | 'status'> & {
  readonly stepCount: number;
};

// Helper type for runtime resolution
export type WorkflowStepWithTask = WorkflowStep & {
  readonly task?: Task;
};
