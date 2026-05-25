import type { Request, Response, NextFunction } from 'express';

import type { ExecutionContext } from '@myco/types';

declare module 'express-serve-static-core' {
  interface Request {
    context?: ExecutionContext;
  }
}

/**
 * Builds an ExecutionContext from request headers.
 * Required headers: x-tenant-id, x-user-id, x-correlation-id.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const tenantId = req.header('x-tenant-id');
  const userId = req.header('x-user-id');
  const correlationId = req.header('x-correlation-id');

  if (tenantId == null || userId == null || correlationId == null) {
    res.status(401).json({ error: 'Missing required auth headers' });
    return;
  }

  req.context = {
    tenantId,
    userId,
    correlationId,
    environment: (process.env.NODE_ENV as ExecutionContext['environment']) ?? 'development',
    startedAt: new Date(),
    timeoutMs: 30000,
  };
  next();
}
