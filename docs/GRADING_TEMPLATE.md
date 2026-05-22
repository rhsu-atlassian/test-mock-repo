# Copilot Response Grading Template

> Copy this template into `docs/responses/<SCENARIO_ID>__<DATE>.md` for each test session.
> Fill it in **before** and **after** running Copilot to keep your observations honest.

---

## Session Metadata

| Field | Value |
|---|---|
| Scenario ID | `e.g. INT-001` |
| Scenario Title | |
| Category | `syntax / runtime / types / deps / lint / ci / interface` |
| Signal level (per scenarios.ts) | `low / medium / high / very-high` |
| Branch | `scenario/...` |
| Tester | |
| Date / Time | `YYYY-MM-DD HH:MM TZ` |
| Copilot product | `e.g. GitHub Copilot Chat, Copilot Workspace, Copilot CLI agent` |
| Copilot model | `e.g. GPT-4o, Claude 3.5 Sonnet, etc.` |
| IDE | `e.g. VS Code 1.95, JetBrains` |
| Repo state | `single-error / multi-error triage` |
| Combined scenarios (if multi) | `e.g. INT-001 + CI-002 + LNT-001` |

---

## Setup

- [ ] Workspace reset (`npm run reset-errors`)
- [ ] Branch checked out
- [ ] Error(s) injected (`npm run inject-errors -- <ID>`)
- [ ] Verified baseline failure (record signal below)

### Baseline failure observed

```
# Paste the actual error output from npm run typecheck / npm run lint / npm test / CI
```

### Prompt given to Copilot

> Use the exact prompt you typed. Verbatim. No paraphrasing.

```
Paste prompt here.
```

---

## Copilot Response

### Files Copilot proposed to change

| File | Lines changed | Hunk summary |
|---|---|---|
| | | |

### Diff (paste the suggested patch)

```diff
# Paste the diff verbatim
```

### Reasoning Copilot provided (if any)

> Copy any explanation Copilot gave for *why* it made the change.

---

## Grading Rubric

Score each dimension on a 0–4 scale. Definitions:

| Score | Meaning |
|---|---|
| 0 | Wrong / harmful (introduces a new bug or worsens the issue) |
| 1 | Did not address the issue |
| 2 | Partial fix (addresses symptom but not root cause, or fixes only one of multiple failures) |
| 3 | Correct fix for the immediate issue |
| 4 | Correct fix + identifies root cause + addresses all downstream consequences |

### Dimensions

| Dimension | Score (0–4) | Notes |
|---|---|---|
| **D1. Localized correctness** — Does the suggested edit syntactically/semantically fix the file it touched? | | |
| **D2. Root-cause identification** — Did Copilot identify *where* the actual bug originated (not just where the symptom appeared)? | | |
| **D3. Cross-package reasoning** — When fix requires multi-file changes, did Copilot find them all? | | |
| **D4. Intent preservation** — Did the fix preserve the code's apparent intent (e.g. comments, naming, surrounding logic)? | | |
| **D5. Test/contract awareness** — Did Copilot account for existing tests or contracts? Did it suggest test updates when warranted? | | |
| **D6. Triage ability** (multi-error only) — Did Copilot identify and prioritize the right failures? | | |
| **D7. Confidence calibration** — Did Copilot express appropriate uncertainty, or did it confidently hallucinate? | | |
| **D8. Explanation quality** — Was the rationale clear, accurate, and actionable? | | |

### Overall verdict

- [ ] **Pass** — change works and addresses root cause
- [ ] **Partial** — would unblock the user but leaves further work
- [ ] **Fail** — wrong, harmful, or no useful action

### Time to resolution

| Step | Duration |
|---|---|
| Time spent prompting | |
| Time spent reviewing Copilot's response | |
| Time spent fixing/adjusting Copilot's suggestion | |
| Total (developer time saved/cost vs. baseline) | |

---

## Observations

### What Copilot did well

-

### What Copilot got wrong or missed

-

### Surprising behaviour

-

### Hallucinations / fabrications

> Did Copilot reference functions, files, or APIs that don't exist? Quote them.

-

### Notes for comparison across models/products

-

---

## Verification

- [ ] Suggested fix applied
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] CI pipeline green
- [ ] Manual smoke test (if applicable)

### Final passing diff (what actually worked)

```diff
# If different from Copilot's suggestion, paste the actually-correct diff here
```

---

## Tags / Categorization

Add freeform tags to enable later analysis. Examples:

`#root-cause-found` `#patched-symptom-only` `#missed-cross-package` `#hallucinated-api`
`#correct-but-overreached` `#suggested-test-update` `#confused-by-comments`
