/**
 * Core Task types for the workflow engine.
 * These types are consumed by every other package in the platform.
 */

export type TaskId = string;

export type TaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'retrying'
  | 'cancelled';

/**
 * Priority for task scheduling.
 * Higher tier = higher priority.
 */
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export const PRIORITY_ORDER: Readonly<Record<Priority, number>> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export interface TaskMetadata {
  readonly createdBy: string;
  readonly correlationId?: string;
  readonly tags?: ReadonlyArray<string>;
}

export interface Task {
  readonly id: TaskId;
  readonly name: string;
  readonly status: TaskStatus;
  readonly priority: Priority;
  readonly payload: Record<string, unknown>;
  readonly metadata: TaskMetadata;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly scheduledFor?: Date;
  readonly completedAt?: Date;
  readonly error?: string;
}

export interface CreateTaskInput {
  name: string;
  priority?: Priority;
  payload: Record<string, unknown>;
  metadata: TaskMetadata;
  maxRetries?: number;
  scheduledFor?: Date;
}

export interface UpdateTaskInput {
  status?: TaskStatus;
  retryCount?: number;
  completedAt?: Date;
  error?: string;
}
