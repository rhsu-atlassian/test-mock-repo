import express from 'express';

import { InMemoryTaskRepository } from '@myco/core';

import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error-handler';
import { buildTaskRouter } from './routes/tasks';
import { buildWorkflowRouter } from './routes/workflows';

export function buildApp(): express.Express {
  const app = express();
  app.use(express.json());

  // Health check (no auth required)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(authMiddleware);

  const taskRepo = new InMemoryTaskRepository();
  app.use('/api/tasks', buildTaskRouter(taskRepo));
  app.use('/api/workflows', buildWorkflowRouter());

  app.use(errorHandler);
  return app;
}
