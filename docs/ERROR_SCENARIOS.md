# Error Scenarios Catalogue

This document is the **human-readable companion** to `scripts/scenarios.ts`. It explains what
each planted error is, where it lives, why it's a meaningful test for Copilot, and what a
correct fix should look like.

> Inject any scenario into the working tree with:
> ```
> npm run inject-errors -- <SCENARIO_ID>
> ```
> Or test triage ability across multiple scenarios at once:
> ```
> npm run inject-errors -- --combine RUN-001 CI-002 LNT-001
> ```

---

## Signal Levels

| Signal | What it means for testing |
|---|---|
| `very-high` | Cascades across packages, requires reasoning across files, hard to fix superficially |
| `high` | Non-trivial; correct fix requires understanding intent, not pattern matching |
| `medium` | Moderate difficulty; useful for breadth |
| `low` | Control/baseline; Copilot should always succeed |

---

## Category 1 — Cross-Package Interface / Type Errors (Highest Signal)

### INT-001 — `Priority` changed from `number` to string union

**Files affected:** `packages/types/src/task.ts` (root) + cascades to:
- `packages/core/src/scheduler.ts` (sort comparator math breaks)
- `packages/core/src/validation.ts` (zod number schema invalid)
- `packages/core/src/repository.ts` (default `?? 5` no longer valid)
- `packages/web/src/components/TaskList.tsx` (sort math breaks)

**Why it's interesting:** This is the canonical "one type change breaks four files" scenario.
The question we're answering: **does Copilot patch the leaves (e.g. cast `priority as number` in
scheduler.ts) or fix the root (revert the type, OR update all four consumers)?**

**Expected best-case fix:** Decide intent (revert vs. migrate). If migrating: ordering map for
priorities (`{ low: 1, medium: 2, high: 3, critical: 4 }`) used in comparator + zod enum +
update default.

---

### INT-002 — `ExecutionContext` gains required field

**Files affected:** `packages/types/src/execution-context.ts` (root) + cascades to:
- `packages/api-server/src/middleware/auth.ts` (context construction)
- `packages/worker/src/index.ts` (context construction)
- `packages/worker/src/__tests__/task-processor.test.ts` (test fixture)

**Why it's interesting:** Tests Copilot's ability to find **all** construction sites of a type.
Easy to miss the test fixture because Copilot may only look at production code paths.

**Expected best-case fix:** Add the new field to all three call sites with a sensible default
(empty array), or make the field optional.

---

### TYP-001 — `TaskClient.getById` accepts wrong ID type

**Files affected:** `packages/client/src/task-client.ts` (root) + impacts:
- `packages/web/src/hooks/useTasks.ts` (caller will eventually break)
- `packages/api-server/src/routes/tasks.ts` (route param is string)

**Why it's interesting:** A common bug pattern — someone refactors thinking IDs are numeric.
Tests whether Copilot identifies the consistency requirement across the whole stack.

---

## Category 2 — Runtime Logic Errors (No Compiler Help)

### RUN-001 — Scheduler sort comparator inverted

**File:** `packages/core/src/scheduler.ts:31`

**Why it's interesting:** The intent is documented in a comment two lines above (`// Sort: higher
priority first`). Copilot should read the comment and notice it conflicts with the code. A pure
pattern-matcher will fix only what the test failure points at.

---

### RUN-002 — Retry boundary off-by-one

**File:** `packages/core/src/executor.ts:38`

**Why it's interesting:** Tests pass at `maxRetries=3` because the difference is at the boundary.
Surface symptom: a task with `maxRetries=3` retries 4 times. Often missed without explicit boundary
test cases.

---

### RUN-003 — Unawaited promise in batch processor

**File:** `packages/worker/src/task-processor.ts:34`

**Why it's interesting:** This is both a runtime bug **and** a lint violation
(`no-floating-promises`). Useful for studying whether Copilot relies on the linter's signal or
reasons about the async semantics itself.

---

### RUN-004 — In-place mutation of caller array

**File:** `packages/web/src/components/TaskList.tsx:23`

**Why it's interesting:** Subtle bug — the React component mutates the prop array. Symptoms only
appear on re-render with reused references. Tests Copilot's understanding of referential mutation.

---

### RUN-005 — Backoff exponent off-by-one

**File:** `packages/core/src/retry.ts:13`

**Why it's interesting:** Math bug. First retry waits `backoffMs * multiplier` instead of
`backoffMs`. Easy to miss without explicit timing tests.

---

## Category 3 — Syntax (Control / Baseline)

### SYN-001 — Missing closing brace

**File:** `packages/core/src/repository.ts:61`

**Why it's interesting:** It isn't — that's the point. This is the control case. If Copilot can't
fix this, something is fundamentally wrong. Use SYN-001 results as the **denominator** for the
"how much harder are the other scenarios?" calculation.

---

## Category 4 — Dependency Resolution Failures

### DEP-001 — Wrong zod major version in api-server

**File:** `packages/api-server/package.json` (zod version) + manifests itself at runtime in
`packages/api-server/src/middleware/error-handler.ts` (ZodError instanceof check fails).

**Why it's interesting:** The TypeScript compiler won't catch this — both versions export
`ZodError`. The bug manifests as silent fall-through to the generic 500 error. Tests whether
Copilot inspects `package.json` files at all when debugging.

---

### DEP-002 — Workspace protocol missing

**File:** `packages/worker/package.json`

**Why it's interesting:** `npm install` will fail with a confusing error about not finding
`@myco/types@1.0.0` on the registry. Tests Copilot's understanding of workspace protocol.

---

## Category 5 — CI / CD Errors

### CI-001 — Matrix exclude removes valid combination

**File:** `.github/workflows/ci.yml`

**Why it's interesting:** The pipeline appears green but actually runs **zero** test jobs for
`api-server`. Tests whether Copilot reasons about matrix coverage or just YAML syntax.

---

### CI-002 — Reusable workflow input type mismatch

**File:** `.github/workflows/ci.yml`

**Why it's interesting:** `strict: "true"` (string) is truthy-coerced. The `if: ${{ inputs.strict }}`
check passes for the wrong reason. Subtle and very real-world.

---

### CI-003 — `needs` references renamed job

**File:** `.github/workflows/ci.yml`

**Why it's interesting:** Pipeline fails to start. The error message points at the wrong file.
Tests Copilot's ability to cross-reference job IDs within YAML.

---

## Category 6 — Lint Violations (Non-Trivial)

### LNT-001 — `strict-boolean-expression` violation in auth

**File:** `packages/api-server/src/middleware/auth.ts:18`

**Why it's interesting:** Refactor from `!tenantId` to `tenantId == null` is *almost* equivalent —
but allows empty strings to pass auth. A security issue caught only by the strict lint rule and a
careful reader.

---

## Category 7 — Triage Scenarios (Multiple Failures Combined)

Use `--combine` to plant multiple errors at once. Recommended starter combinations:

| Triage scenario | Combine | Question being tested |
|---|---|---|
| **T-A "Compile + lint cascade"** | `INT-001`, `LNT-001` | Does Copilot fix in the right order (type root first)? |
| **T-B "Build + CI + runtime"** | `RUN-001`, `CI-002`, `DEP-001` | Does Copilot triage by failure type? |
| **T-C "Distributed cross-package"** | `INT-002`, `TYP-001`, `RUN-003` | Does Copilot detect that fixes span 5+ files? |
| **T-D "Stress test"** | `INT-001`, `INT-002`, `RUN-001`, `RUN-003`, `CI-002`, `DEP-001`, `LNT-001` | Does Copilot collapse under volume? |

---

## Mapping Scenarios → Stages

| Stage | Scenarios that fail here |
|---|---|
| `npm install` | DEP-002 |
| `npm run lint` | LNT-001, RUN-003 (lint-side), RUN-004 (depending on rule path) |
| `npm run typecheck` | INT-001, INT-002, TYP-001, SYN-001 |
| `npm run build` | (same as typecheck) |
| `npm test` | RUN-001, RUN-002, RUN-005 (boundary tests) |
| Runtime / smoke | RUN-003, RUN-004, DEP-001 |
| CI pipeline parse | CI-001, CI-002, CI-003 |

Use this table to predict which logs Copilot will be presented with — this affects how it'll
reason about each scenario.
