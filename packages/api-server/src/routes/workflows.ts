import type { Request, Response } from 'express';
import { Router } from 'express';

import type { Workflow, WorkflowId, CreateWorkflowInput } from '@myco/types';

/**
 * In-memory workflow store (placeholder).
 */
const workflows = new Map<WorkflowId, Workflow>();

export function buildWorkflowRouter(): Router {
  const router = Router();

  router.get('/', (_req: Request, res: Response): void => {
    res.json({ workflows: Array.from(workflows.values()) });
  });

  router.get('/:id', (req: Request, res: Response): void => {
    const wf = workflows.get(req.params.id);
    if (!wf) {
      res.status(404).json({ error: 'Workflow not found' });
      return;
    }
    res.json({ workflow: wf });
  });

  router.post('/', (req: Request, res: Response): void => {
    const input = req.body as CreateWorkflowInput;
    const now = new Date();
    const wf: Workflow = {
      id: `wf_${Math.random().toString(36).slice(2, 11)}`,
      name: input.name,
      status: 'draft',
      steps: input.steps,
      createdAt: now,
      updatedAt: now,
    };
    workflows.set(wf.id, wf);
    res.status(201).json({ workflow: wf });
  });

  return router;
}
