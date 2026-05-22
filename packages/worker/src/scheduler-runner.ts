import type { ExecutionContext } from '@myco/types';

import type { TaskProcessor } from './task-processor';

/**
 * Periodically re-queues retrying tasks back to pending.
 */
export class SchedulerRunner {
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly processor: TaskProcessor,
    private readonly intervalMs: number,
  ) {}

  start(_context: ExecutionContext): void {
    this.timer = setInterval(() => {
      void this.processor.requeueRetrying();
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }
}
