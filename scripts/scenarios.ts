/**
 * Catalogue of error scenarios.
 *
 * Each scenario describes a single, deterministic transformation of a file
 * (or set of files) to inject a planted error.
 *
 * Categories:
 *   - syntax       (control: trivial)
 *   - runtime      (logic bugs, no compile error)
 *   - types        (cross-package type mismatches)
 *   - deps         (dependency/version conflicts)
 *   - lint         (non-trivial lint violations)
 *   - ci           (broken pipeline)
 *   - interface    (breaking interface change cascades)
 */

export type Category = 'syntax' | 'runtime' | 'types' | 'deps' | 'lint' | 'ci' | 'interface';

export type SignalLevel = 'low' | 'medium' | 'high' | 'very-high';

export interface Edit {
  /** Path relative to the workspace root (myco-platform/). */
  readonly file: string;
  /** Substring to find in the file (must match exactly once). */
  readonly find: string;
  /** Replacement string. */
  readonly replace: string;
}

export interface Scenario {
  readonly id: string;
  readonly title: string;
  readonly category: Category;
  readonly signal: SignalLevel;
  /** Branch name suggestion. */
  readonly branch: string;
  /** Why this scenario is interesting for grading Copilot. */
  readonly rationale: string;
  /** The actual file edits to apply. */
  readonly edits: ReadonlyArray<Edit>;
  /** What a correct fix should look like (described in plain English). */
  readonly expectedFix: string;
}

export const SCENARIOS: ReadonlyArray<Scenario> = [
  // ============================================================
  // CATEGORY 1: CROSS-PACKAGE TYPE / INTERFACE ERRORS (highest signal)
  // ============================================================
  {
    id: 'INT-001',
    title: 'Priority changed from number to string union',
    category: 'interface',
    signal: 'very-high',
    branch: 'scenario/int-001-priority-string-union',
    rationale:
      'Changing Priority from `number` to a string union in @myco/types cascades to ' +
      'core/scheduler (sort comparator), api-server (validation), worker (handlers), and ' +
      'web (TaskList sort). Tests Copilot ability to (a) trace the root cause back to ' +
      'the types package, and (b) update all four downstream consumers consistently.',
    edits: [
      {
        file: 'packages/types/src/task.ts',
        find: 'export type Priority = number;',
        replace: "export type Priority = 'low' | 'medium' | 'high' | 'critical';",
      },
    ],
    expectedFix:
      'Either revert Priority back to number, OR keep the string union and update: ' +
      '(1) Scheduler sort comparator (b.priority - a.priority is invalid), ' +
      '(2) createTaskSchema validation (z.number → z.enum), ' +
      '(3) repository default value (priority ?? 5 → ?? "medium"), ' +
      '(4) TaskList sort in web package.',
  },
  {
    id: 'INT-002',
    title: 'ExecutionContext gains required tenantId-less variant',
    category: 'interface',
    signal: 'very-high',
    branch: 'scenario/int-002-context-required-field',
    rationale:
      'Adds a required field `featureFlags` to ExecutionContext. All call sites that ' +
      'construct one (api-server auth, worker main, tests) now fail TS compilation ' +
      'simultaneously. Tests root-cause-vs-symptom fixing.',
    edits: [
      {
        file: 'packages/types/src/execution-context.ts',
        find: '  readonly timeoutMs: number;\n}',
        replace:
          '  readonly timeoutMs: number;\n  readonly featureFlags: ReadonlyArray<string>;\n}',
      },
    ],
    expectedFix:
      'Add featureFlags to all ExecutionContext constructions: auth.ts middleware, ' +
      'worker/index.ts main(), all test fixtures. Alternative: make the field optional.',
  },
  {
    id: 'TYP-001',
    title: 'TaskClient.getById accepts wrong ID type',
    category: 'types',
    signal: 'high',
    branch: 'scenario/typ-001-id-type-mismatch',
    rationale:
      'Changes TaskClient.getById signature from `id: TaskId` to `id: number`. ' +
      'Every web/server caller breaks. Realistic refactor mistake.',
    edits: [
      {
        file: 'packages/client/src/task-client.ts',
        find: 'async getById(id: TaskId): Promise<Task | null> {',
        replace: 'async getById(id: number): Promise<Task | null> {',
      },
    ],
    expectedFix:
      'Revert id parameter to TaskId (string). String IDs are used throughout the system ' +
      '(Repository.findById uses string, route param is string).',
  },

  // ============================================================
  // CATEGORY 2: RUNTIME LOGIC ERRORS (no compile error)
  // ============================================================
  {
    id: 'RUN-001',
    title: 'Scheduler sort comparator inverted',
    category: 'runtime',
    signal: 'high',
    branch: 'scenario/run-001-scheduler-sort-inverted',
    rationale:
      'Sort comparator returns `a.priority - b.priority` instead of `b.priority - a.priority`. ' +
      'Code compiles, sometimes tests pass, but high-priority tasks are starved. Tests ' +
      "Copilot's ability to identify intent from surrounding context (comment says " +
      '"higher priority first").',
    edits: [
      {
        file: 'packages/core/src/scheduler.ts',
        find: '        return b.priority - a.priority;',
        replace: '        return a.priority - b.priority;',
      },
    ],
    expectedFix: 'Restore `b.priority - a.priority` to sort highest-priority-first.',
  },
  {
    id: 'RUN-002',
    title: 'Retry boundary off-by-one in Executor',
    category: 'runtime',
    signal: 'high',
    branch: 'scenario/run-002-retry-off-by-one',
    rationale:
      'Changes `task.retryCount < task.maxRetries` to `task.retryCount <= task.maxRetries`. ' +
      'Tasks retry one extra time beyond the configured maximum. Subtle, not caught by ' +
      'type system, may pass tests with low maxRetries values.',
    edits: [
      {
        file: 'packages/core/src/executor.ts',
        find: '      if (task.retryCount < task.maxRetries) {',
        replace: '      if (task.retryCount <= task.maxRetries) {',
      },
    ],
    expectedFix: 'Revert to strict less-than comparison.',
  },
  {
    id: 'RUN-003',
    title: 'Unawaited promise in batch processor',
    category: 'runtime',
    signal: 'high',
    branch: 'scenario/run-003-unawaited-batch',
    rationale:
      'Drops the await in TaskProcessor.tick on Promise.all. Tasks appear to start but ' +
      'tick returns immediately; downstream callers see empty results. ' +
      '@typescript-eslint/no-floating-promises should also catch this — does Copilot ' +
      'rely on the lint hint, or reason about correctness?',
    edits: [
      {
        file: 'packages/worker/src/task-processor.ts',
        find: '    await Promise.all(batch.map((task) => this.executor.execute(task, context)));',
        replace: '    Promise.all(batch.map((task) => this.executor.execute(task, context)));',
      },
    ],
    expectedFix: 'Restore the await keyword.',
  },
  {
    id: 'RUN-004',
    title: 'In-place mutation of caller array in TaskList',
    category: 'runtime',
    signal: 'high',
    branch: 'scenario/run-004-in-place-mutation',
    rationale:
      'Removes the spread before .sort() so the caller\'s task array is mutated. ' +
      'no-param-reassign lint rule may or may not flag this depending on path. ' +
      'Excellent test of whether Copilot understands referential mutation hazards.',
    edits: [
      {
        file: 'packages/web/src/components/TaskList.tsx',
        find: '  const sorted = [...visible].sort((a, b) => b.priority - a.priority);',
        replace: '  const sorted = visible.sort((a, b) => b.priority - a.priority);',
      },
    ],
    expectedFix: 'Restore the [...visible] spread before sorting.',
  },
  {
    id: 'RUN-005',
    title: 'Backoff exponent off-by-one',
    category: 'runtime',
    signal: 'medium',
    branch: 'scenario/run-005-backoff-math',
    rationale:
      'Changes Math.pow(multiplier, attempt - 1) to Math.pow(multiplier, attempt). ' +
      'First retry waits backoffMs * multiplier instead of backoffMs.',
    edits: [
      {
        file: 'packages/core/src/retry.ts',
        find: '  return policy.backoffMs * Math.pow(policy.backoffMultiplier, attempt - 1);',
        replace: '  return policy.backoffMs * Math.pow(policy.backoffMultiplier, attempt);',
      },
    ],
    expectedFix: 'Restore `attempt - 1` exponent.',
  },

  // ============================================================
  // CATEGORY 3: SYNTAX (control / baseline)
  // ============================================================
  {
    id: 'SYN-001',
    title: 'Missing closing brace in repository.ts',
    category: 'syntax',
    signal: 'low',
    branch: 'scenario/syn-001-missing-brace',
    rationale:
      'Trivial syntax error — Copilot should always fix this. Useful as control/baseline ' +
      'against which to compare harder scenarios.',
    edits: [
      {
        file: 'packages/core/src/repository.ts',
        find: '    this.store.delete(id);\n  }',
        replace: '    this.store.delete(id);\n  ', // missing closing brace
      },
    ],
    expectedFix: 'Add the missing closing brace.',
  },

  // ============================================================
  // CATEGORY 4: DEPENDENCY RESOLUTION FAILURES
  // ============================================================
  {
    id: 'DEP-001',
    title: 'Wrong zod major version in api-server',
    category: 'deps',
    signal: 'high',
    branch: 'scenario/dep-001-zod-version-conflict',
    rationale:
      'Pins api-server to zod ^2.0.0 while core uses ^3.22.4. Two zod versions resolve, ' +
      'and the zod schema instances from core are not recognized by api-server\'s zod ' +
      'instance (instanceof checks fail in error-handler).',
    edits: [
      {
        file: 'packages/api-server/package.json',
        find: '    "zod": "^3.22.4"',
        replace: '    "zod": "^2.0.0"',
      },
    ],
    expectedFix: 'Align zod version with @myco/core (^3.22.4).',
  },
  {
    id: 'DEP-002',
    title: 'Workspace protocol missing on @myco/types',
    category: 'deps',
    signal: 'high',
    branch: 'scenario/dep-002-missing-workspace-protocol',
    rationale:
      'Changes "@myco/types": "*" to "@myco/types": "99.0.0" in worker. ' +
      'npm tries to resolve from the registry at that exact version (which does not ' +
      'exist). Realistic mistake when copy-pasting from a non-workspace project.',
    edits: [
      {
        file: 'packages/worker/package.json',
        find: '    "@myco/types": "*"',
        replace: '    "@myco/types": "99.0.0"',
      },
    ],
    expectedFix:
      'Restore "*" (or another spec that resolves to the local workspace package), ' +
      'so npm picks up packages/types instead of going to the registry.',
  },

  // ============================================================
  // CATEGORY 5: CI / CD ERRORS
  // ============================================================
  {
    id: 'CI-001',
    title: 'Matrix exclude removes valid combination',
    category: 'ci',
    signal: 'high',
    branch: 'scenario/ci-001-matrix-exclude-bug',
    rationale:
      'Adds an exclude entry that silently removes node 20 (the only supported version ' +
      'for api-server). Pipeline appears green but runs zero jobs for that combination.',
    edits: [
      {
        file: '.github/workflows/ci.yml',
        find: "          - package: api-server\n            node-version: '18'",
        replace:
          "          - package: api-server\n            node-version: '18'\n          - package: api-server\n            node-version: '20'",
      },
    ],
    expectedFix: 'Remove the spurious exclude for api-server / node 20.',
  },
  {
    id: 'CI-002',
    title: 'Reusable workflow input type passed as string',
    category: 'ci',
    signal: 'high',
    branch: 'scenario/ci-002-input-type-mismatch',
    rationale:
      'Changes `strict: true` (boolean) to `strict: "true"` (string) when calling ' +
      'reusable-build.yml. GitHub Actions silently coerces and the conditional always ' +
      'evaluates truthy — masks the intent.',
    edits: [
      {
        file: '.github/workflows/ci.yml',
        find: '    with:\n      package: ${{ matrix.package }}',
        replace:
          '    with:\n      package: ${{ matrix.package }}\n      strict: "true"',
      },
    ],
    expectedFix:
      'Pass strict as a boolean literal (strict: true), not a quoted string.',
  },
  {
    id: 'CI-003',
    title: 'needs references a renamed job',
    category: 'ci',
    signal: 'medium',
    branch: 'scenario/ci-003-needs-broken-reference',
    rationale:
      'Changes `needs: [test-unit]` to `needs: [unit-tests]`. Workflow fails to start ' +
      'with a cryptic error about a job that does not exist.',
    edits: [
      {
        file: '.github/workflows/ci.yml',
        find: '    needs: [test-unit]',
        replace: '    needs: [unit-tests]',
      },
    ],
    expectedFix:
      'Restore `needs: [test-unit]` to match the actual job id.',
  },

  // ============================================================
  // CATEGORY 6: LINT VIOLATIONS (non-trivial)
  // ============================================================
  {
    id: 'LNT-001',
    title: 'strict-boolean-expression violation in auth middleware',
    category: 'lint',
    signal: 'medium',
    branch: 'scenario/lnt-001-strict-boolean',
    rationale:
      'Replaces the explicit `=== undefined || === ""` checks with a permissive ' +
      '`tenantId == null` check. Empty strings now pass auth — runtime security ' +
      'issue caught only by strict-boolean-expressions lint rule (or careful testing). ' +
      'Note: triggers @typescript-eslint/strict-boolean-expressions AND eqeqeq if Copilot ' +
      'just adds `===` without fixing the empty-string case.',
    edits: [
      {
        file: 'packages/api-server/src/middleware/auth.ts',
        find:
          "  if (\n" +
          "    tenantId === undefined || tenantId === '' ||\n" +
          "    userId === undefined || userId === '' ||\n" +
          "    correlationId === undefined || correlationId === ''\n" +
          "  ) {",
        replace:
          '  if (tenantId == null || userId == null || correlationId == null) {',
      },
    ],
    expectedFix:
      'Restore the explicit emptiness checks so empty strings are rejected. ' +
      'Note: switching `==` to `===` alone is NOT enough — empty strings would still pass.',
  },

  // ============================================================
  // CATEGORY 7: TRIAGE SCENARIO (multiple failures combined)
  // ============================================================
  // (Use scripts/inject-errors.ts with --combine to apply N scenarios at once.)
];
