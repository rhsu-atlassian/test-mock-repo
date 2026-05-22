import type { Task, ExecutionContext, TaskStatus } from '@myco/types';

import type { InMemoryTaskRepository } from './repository';

export type TaskHandler = (task: Task, context: ExecutionContext) => Promise<void>;

/**
 * Executor runs a task using a registered handler.
 * Manages state transitions: pending -> running -> completed | failed | retrying.
 */
export class Executor {
  private readonly handlers = new Map<string, TaskHandler>();

  constructor(private readonly repo: InMemoryTaskRepository) {}

  register(taskName: string, handler: TaskHandler): void {
    this.handlers.set(taskName, handler);
  }

  async execute(task: Task, context: ExecutionContext): Promise<void> {
    const handler = this.handlers.get(task.name);
    if (!handler) {
      await this.transition(task, 'failed', `No handler registered for: ${task.name}`);
      return;
    }

    if (!this.canTransition(task.status, 'running')) {
      throw new Error(`Cannot transition task ${task.id} from ${task.status} to running`);
    }
    await this.repo.update(task.id, { status: 'running' });

    try {
      await handler(task, context);
      await this.transition(task, 'completed');
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      if (task.retryCount <= task.maxRetries) {
        await this.repo.update(task.id, {
          status: 'retrying',
          retryCount: task.retryCount + 1,
          error,
        });
      } else {
        await this.transition(task, 'failed', error);
      }
    }
  }

  private async transition(task: Task, status: TaskStatus, error?: string): Promise<void> {
    await this.repo.update(task.id, {
      status,
      completedAt: status === 'completed' ? new Date() : undefined,
      error,
    });
  }

  /**
   * State machine validation: which transitions are allowed?
   */
  private canTransition(from: TaskStatus, to: TaskStatus): boolean {
    const allowed: Record<TaskStatus, ReadonlyArray<TaskStatus>> = {
      pending: ['running', 'cancelled'],
      running: ['completed', 'failed', 'retrying'],
      retrying: ['running', 'failed', 'cancelled'],
      completed: [],
      failed: [],
      cancelled: [],
    };
    return allowed[from].includes(to);
  }
}
