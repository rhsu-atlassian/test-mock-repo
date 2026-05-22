import type { RetryPolicy } from '@myco/types';

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  backoffMs: 1000,
  backoffMultiplier: 2,
};

/**
 * Compute the next backoff delay for a given retry attempt.
 * attempt is 1-based (first retry = attempt 1).
 */
export function computeBackoff(policy: RetryPolicy, attempt: number): number {
  return policy.backoffMs * Math.pow(policy.backoffMultiplier, attempt - 1);
}

export function shouldRetry(policy: RetryPolicy, currentRetries: number): boolean {
  return currentRetries < policy.maxRetries;
}
