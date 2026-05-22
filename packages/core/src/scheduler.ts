import { PRIORITY_ORDER, type Task, type ExecutionContext } from '@myco/types';

import type { InMemoryTaskRepository } from './repository';

/**
 * Scheduler decides which pending tasks should be picked up next.
 * Sorts by priority (higher first) and then by createdAt (older first).
 */
export class Scheduler {
  constructor(private readonly repo: InMemoryTaskRepository) {}

  async getNextBatch(context: ExecutionContext, batchSize: number): Promise<ReadonlyArray<Task>> {
    const pending = await this.repo.findByStatus('pending');
    const now = new Date();

    const eligible = pending.filter((task) => {
      if (task.scheduledFor && task.scheduledFor > now) {
        return false;
      }
      return true;
    });

    // Sort: higher priority first, then older tasks first.
    const sorted = [...eligible].sort((a, b) => {
      if (a.priority !== b.priority) {
        return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    this.logSelection(context, sorted.length, batchSize);
    return sorted.slice(0, batchSize);
  }

  private logSelection(context: ExecutionContext, eligible: number, batchSize: number): void {
    // eslint-disable-next-line no-console
    console.log(
      `[scheduler] correlationId=${context.correlationId} tenant=${context.tenantId} ` +
        `eligible=${eligible} batchSize=${batchSize}`,
    );
  }
}
