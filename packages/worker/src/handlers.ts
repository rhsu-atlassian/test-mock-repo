import type { Executor } from '@myco/core';
import type { Task, ExecutionContext } from '@myco/types';

/**
 * Example handlers showcasing different task types.
 */

async function sendEmailHandler(task: Task, _context: ExecutionContext): Promise<void> {
  const to = task.payload.to;
  if (typeof to !== 'string') {
    throw new Error('Email task payload missing "to" field');
  }
  // Simulated network call
  await new Promise((r) => setTimeout(r, 50));
}

async function generateReportHandler(task: Task, _context: ExecutionContext): Promise<void> {
  const reportId = task.payload.reportId;
  if (typeof reportId !== 'string') {
    throw new Error('Report task payload missing "reportId" field');
  }
  await new Promise((r) => setTimeout(r, 100));
}

async function cleanupHandler(_task: Task, _context: ExecutionContext): Promise<void> {
  await new Promise((r) => setTimeout(r, 25));
}

export function registerHandlers(executor: Executor): void {
  executor.register('send-email', sendEmailHandler);
  executor.register('generate-report', generateReportHandler);
  executor.register('cleanup', cleanupHandler);
}
