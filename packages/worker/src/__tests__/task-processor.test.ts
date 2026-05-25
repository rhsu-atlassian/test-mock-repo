import { Executor, InMemoryTaskRepository, Scheduler } from '@myco/core';
import type { ExecutionContext } from '@myco/types';

import { TaskProcessor } from '../task-processor';

const context: ExecutionContext = {
  tenantId: 't1',
  userId: 'u1',
  correlationId: 'c1',
  environment: 'development',
  startedAt: new Date(),
  timeoutMs: 5000,
  featureFlags: [],
};

describe('TaskProcessor', () => {
  it('processes a batch of pending tasks', async () => {
    const repo = new InMemoryTaskRepository();
    const executor = new Executor(repo);
    executor.register('noop', async () => Promise.resolve());

    const scheduler = new Scheduler(repo);
    const processor = new TaskProcessor(scheduler, executor, repo, {
      batchSize: 5,
      pollIntervalMs: 1000,
    });

    await repo.create({
      name: 'noop',
      payload: {},
      metadata: { createdBy: 'test' },
    });

    await processor.tick(context);

    const all = await repo.findAll();
    expect(all[0].status).toBe('completed');
  });
});
