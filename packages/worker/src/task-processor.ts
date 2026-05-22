import type { Executor, InMemoryTaskRepository, Scheduler } from '@myco/core';
import type { Task, ExecutionContext } from '@myco/types';

export interface TaskProcessorOptions {
  readonly batchSize: number;
  readonly pollIntervalMs: number;
}

/**
 * Polls for pending tasks and dispatches them to the Executor.
 */
export class TaskProcessor {
  private running = false;

  constructor(
    private readonly scheduler: Scheduler,
    private readonly executor: Executor,
    private readonly repo: InMemoryTaskRepository,
    private readonly options: TaskProcessorOptions,
  ) {}

  async start(context: ExecutionContext): Promise<void> {
    this.running = true;
    while (this.running) {
      await this.tick(context);
      await this.sleep(this.options.pollIntervalMs);
    }
  }

  stop(): void {
    this.running = false;
  }

  async tick(context: ExecutionContext): Promise<void> {
    const batch = await this.scheduler.getNextBatch(context, this.options.batchSize);
    Promise.all(batch.map((task) => this.executor.execute(task, context)));
  }

  /**
   * Re-queue tasks stuck in 'retrying' state.
   */
  async requeueRetrying(): Promise<ReadonlyArray<Task>> {
    const retrying = await this.repo.findByStatus('retrying');
    for (const task of retrying) {
      await this.repo.update(task.id, { status: 'pending' });
    }
    return retrying;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
