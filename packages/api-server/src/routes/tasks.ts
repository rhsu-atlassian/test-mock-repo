import type { Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';

import { createTaskSchema } from '@myco/core';
import type { InMemoryTaskRepository } from '@myco/core';

const updateTaskSchema = z.object({
  status: z.enum(['pending', 'running', 'completed', 'failed', 'retrying', 'cancelled']).optional(),
  retryCount: z.number().int().min(0).optional(),
  completedAt: z.date().optional(),
  error: z.string().optional(),
});

export function buildTaskRouter(repo: InMemoryTaskRepository): Router {
  const router = Router();

  router.get('/', async (_req: Request, res: Response): Promise<void> => {
    const tasks = await repo.findAll();
    res.json({ tasks });
  });

  router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    const task = await repo.findById(req.params.id);
    if (task === null) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ task });
  });

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    const input = createTaskSchema.parse(req.body);
    const task = await repo.create(input);
    res.status(201).json({ task });
  });

  router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
    const patch = updateTaskSchema.parse(req.body);
    const task = await repo.update(req.params.id, patch);
    res.json({ task });
  });

  router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    await repo.delete(req.params.id);
    res.status(204).send();
  });

  return router;
}
