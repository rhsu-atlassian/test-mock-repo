/**
 * Execution context propagated through the task pipeline.
 * Adding a required field here is a great cross-package break point.
 */
export interface ExecutionContext {
  readonly tenantId: string;
  readonly userId: string;
  readonly environment: 'development' | 'staging' | 'production';
  readonly correlationId: string;
  readonly startedAt: Date;
  readonly timeoutMs: number;
}

export interface ContextAwareLogger {
  info(context: ExecutionContext, message: string, data?: Record<string, unknown>): void;
  warn(context: ExecutionContext, message: string, data?: Record<string, unknown>): void;
  error(context: ExecutionContext, message: string, error?: Error): void;
  debug(context: ExecutionContext, message: string, data?: Record<string, unknown>): void;
}
