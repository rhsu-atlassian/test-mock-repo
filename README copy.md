# myco-platform — Copilot Stress-Test Monorepo

A mock TypeScript/Node.js monorepo, purpose-built to **stress-test GitHub Copilot's
error-fixing capabilities** across realistic, cross-cutting failure modes.

The repo simulates a task & workflow orchestration platform. It is **structurally
realistic** (six packages, diamond dependency graph, complex CI), but **strategically
broken on demand** via a scenario-injection script.

---

## What this is for

- Running controlled experiments on Copilot (and other AI coding agents) against
  realistic, multi-file, multi-package error scenarios.
- Comparing model/product behavior across error categories.
- Capturing graded results in a consistent template.

## What this is *not*

- A production codebase. Don't deploy this.
- A complete app — packages have just enough surface area to expose error patterns.

---

## Architecture

### Package graph

```
                    ┌───────────────────┐
                    │   @myco/types     │   pure types, no runtime
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼───────┐    ┌────────▼────────┐    ┌───────▼───────┐
│  @myco/core   │    │  @myco/client   │    │   @myco/web   │
│  scheduler,   │    │  HTTP wrappers  │    │  React UI     │
│  executor,    │    │                 │    │  (consumes    │
│  repository   │    │                 │    │   client)     │
└───────┬───────┘    └────────┬────────┘    └───────────────┘
        │                     │
        ├─────────────────────┤
        │                     │
┌───────▼───────┐    ┌────────▼────────┐
│ @myco/worker  │    │ @myco/api-server│
│ polling +     │    │ Express REST    │
│ task handlers │    │ API (also uses  │
│               │    │  @myco/client)  │
└───────────────┘    └─────────────────┘
```

This **diamond shape** is intentional: changes in `@myco/types` cascade to all five
other packages, creating realistic cross-boundary error scenarios.

### Domain: task / workflow orchestration

Modeled around:
- `Task` — a unit of work with a status state machine
- `Workflow` — an ordered sequence of `WorkflowStep`s with dependencies
- `ExecutionContext` — runtime context propagated through the pipeline
- `Scheduler` — picks tasks for execution based on priority + readiness
- `Executor` — runs handlers and manages state transitions
- `Repository<T>` — generic persistence abstraction

This domain is rich in async patterns, state machines, and generic abstractions —
which naturally produce subtle, high-signal bugs.

---

## Getting started

```bash
cd myco-platform
npm install
npm run build
npm run typecheck
npm run lint
npm test
```

Everything should pass on a clean `main`. If it doesn't, something is wrong before
you've even injected an error.

---

## How to run a Copilot test session

### 1. Pick a scenario

See [`docs/ERROR_SCENARIOS.md`](docs/ERROR_SCENARIOS.md) for the full catalogue.

```bash
npm run inject-errors -- --list
```

### 2. Choose your isolation strategy

**Option A — Isolated branch per scenario:**
```bash
npm run inject-errors -- --branch INT-001
git add -A && git commit -m "inject: INT-001"
```

**Option B — Multi-error triage on a fresh branch:**
```bash
git checkout -b scenario/triage-T-D
npm run inject-errors -- --combine INT-001 INT-002 RUN-001 RUN-003 CI-002 DEP-001 LNT-001
git add -A && git commit -m "inject: triage T-D"
```

### 3. Observe the baseline failure

Run the relevant command — `npm run typecheck`, `npm test`, push to trigger CI, etc.
Capture the exact failure output.

### 4. Ask Copilot to fix it

Use whatever Copilot surface you're testing (Chat, Workspace, agent mode, CLI).
**Record the exact prompt verbatim.**

### 5. Grade the response

Copy [`docs/GRADING_TEMPLATE.md`](docs/GRADING_TEMPLATE.md) into
`docs/responses/<SCENARIO_ID>__YYYY-MM-DD__<tester>.md` and fill it in.

### 6. Reset for the next test

```bash
npm run reset-errors                  # discard local edits
npm run reset-errors -- --switch-main # also return to main
```

---

## Repository layout

```
myco-platform/
├── package.json                       npm workspaces root
├── tsconfig.base.json                 shared TS config
├── tsconfig.json                      project references
├── .eslintrc.js                       strict ESLint config (high-signal rules)
├── .prettierrc.json
├── .github/
│   ├── actions/setup-workspace/       composite action
│   └── workflows/
│       ├── ci.yml                     orchestrator (matrix, conditional, gated)
│       ├── deploy.yml                 sequential test→staging→prod
│       ├── reusable-build.yml         child workflow
│       └── reusable-test.yml          child workflow
├── packages/
│   ├── types/                         @myco/types (leaf — no deps)
│   ├── core/                          @myco/core
│   ├── client/                        @myco/client
│   ├── api-server/                    @myco/api-server (Express)
│   ├── worker/                        @myco/worker
│   └── web/                           @myco/web (React)
├── scripts/
│   ├── scenarios.ts                   catalog of error scenarios (machine-readable)
│   ├── inject-errors.ts               apply a scenario to the working tree
│   └── reset-errors.ts                revert to clean state
└── docs/
    ├── ERROR_SCENARIOS.md             human-readable scenario reference
    ├── GRADING_TEMPLATE.md            per-session grading template
    └── responses/                     filled-in grading documents
```

---

## Error coverage matrix

| Category | Scenarios | Highest signal? |
|---|---|---|
| Cross-package interface | INT-001, INT-002 | ✅ |
| Cross-package types | TYP-001 | ✅ |
| Runtime logic | RUN-001 … RUN-005 | ✅ |
| Dependency resolution | DEP-001, DEP-002 | ✅ |
| CI/CD config | CI-001, CI-002, CI-003 | ✅ |
| Lint violations (non-trivial) | LNT-001 | — |
| Syntax (control) | SYN-001 | (baseline only) |
| Multi-failure triage | T-A, T-B, T-C, T-D | ✅ |

---

## Design principles (why this repo looks the way it does)

1. **Diamond dependency graph** maximizes cross-boundary blast radius from a single
   change in `@myco/types`.
2. **Strict ESLint rules** (e.g. `strict-boolean-expressions`, `no-floating-promises`)
   are chosen to catch real bugs disguised as lint violations.
3. **Realistic naming and JSDoc** (e.g. comments documenting intent in `Scheduler`)
   give Copilot real signal — and let us test whether it uses that signal.
4. **In-memory implementations** keep the focus on the type/logic surface, not on
   infrastructure plumbing.
5. **Error scenarios are deterministic** — a single function call reproduces a known
   broken state. No flaky setup.
6. **Triage scenarios are first-class** — testing one error at a time misses how
   Copilot behaves under real-world conditions where multiple things are wrong.

---

## Adding a new scenario

1. Add an entry to `scripts/scenarios.ts` (the catalog is the source of truth).
2. Add a human-readable section in `docs/ERROR_SCENARIOS.md`.
3. Test it: `npm run inject-errors -- <ID>` then verify the failure mode.
4. Test reset: `npm run reset-errors` should bring you back to clean main.

---

## Comparing across Copilot products / models

Use the `Copilot product` and `Copilot model` fields in the grading template. Suggested
analysis dimensions:

- **Per-category accuracy** — does Model A beat Model B on type errors but lose on CI?
- **Root-cause vs. symptom rate** — what % of fixes addressed the actual cause?
- **Cross-package detection rate** — when fix requires N files, how many did the model find?
- **Hallucination rate** — referenced non-existent APIs, files, packages.
- **Triage rank correlation** — for multi-error scenarios, did the model prioritize the
  same errors a human would?

Aggregate `docs/responses/*.md` into a spreadsheet for trend analysis.
