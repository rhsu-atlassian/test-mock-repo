import { Executor, InMemoryTaskRepository, Scheduler } from '@myco/core';
import type { ExecutionContext } from '@myco/types';

import { registerHandlers } from './handlers';
import { SchedulerRunner } from './scheduler-runner';
import { TaskProcessor } from './task-processor';

async function main(): Promise<void> {
  const repo = new InMemoryTaskRepository();
  const scheduler = new Scheduler(repo);
  const executor = new Executor(repo);
  registerHandlers(executor);

  const processor = new TaskProcessor(scheduler, executor, repo, {
    batchSize: 10,
    pollIntervalMs: 1000,
  });

  const runner = new SchedulerRunner(processor, 5000);
  const context: ExecutionContext = {
    tenantId: 'system',
    userId: 'worker',
    correlationId: `boot-${Date.now()}`,
    environment: (process.env.NODE_ENV as ExecutionContext['environment']) ?? 'development',
    startedAt: new Date(),
    timeoutMs: 60000,
  };

  runner.start(context);
  await processor.start(context);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[worker] crashed:', err);
  process.exit(1);
});

export { TaskProcessor } from './task-processor';
export { SchedulerRunner } from './scheduler-runner';
