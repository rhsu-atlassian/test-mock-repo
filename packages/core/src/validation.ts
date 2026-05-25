import { z } from 'zod';

export const createTaskSchema = z.object({
  name: z.string().min(1).max(255),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  payload: z.record(z.unknown()),
  metadata: z.object({
    createdBy: z.string().min(1),
    correlationId: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
  maxRetries: z.number().int().min(0).max(10).optional(),
  scheduledFor: z.date().optional(),
});

export type CreateTaskPayload = z.infer<typeof createTaskSchema>;
