---
name: scope-creep-detector
description: Audits Git diffs and code changes against stated task goals. Detects feature bloat, extraneous edits, and unnecessary refactoring. Recommends what changes to keep, split into separate commits, or justify. Activate before committing code, when reviewing PRs, or when a task feels larger than initially planned.
metadata:
  origin: Antigravity-Core
---

# 🔭 Scope Creep Detector

This skill enforces surgical development discipline (Andy Jassy / Jeff Bezos / Boris Cherny philosophy). It protects codebases from **accidental bloat, unfocused refactorings, and scope creep** by rigorously cross-examining every modified line against the stated objective of the task.

---

## 🎯 When to Use

* Before creating a Git commit or opening a Pull Request: ensuring all changes strictly serve the declared ticket or prompt.
* During implementation: when an edit has touched more than 5 files or 150 lines, verifying whether the task has drifted.
* During code reviews: identifying opportunistic refactors that should be isolated into separate pull requests to maintain bisectability.

---

## 🧭 The 3-Phase Scope Audit Protocol

```
1. State the Intent Anchor ──► 2. Inspect the Exact Diff ──► 3. Classify & Deliver Triage Scorecard
```

### Phase 1: Ingest the Intent Anchor
Establish the unambiguous goal of the task:
* What exact bug was being fixed, or what specific requirement was requested?
* If the user prompt was: *"Fix the null pointer exception on user logout"*, any edits to billing routes or cosmetic CSS restyling constitute scope creep.

### Phase 2: Differential Audit (`git diff`)
Inspect uncommitted changes line by line:
```bash
git diff --stat
git diff
```

### Phase 3: Change Classification
Every modified file or block is categorized into one of three buckets:

1. **🎯 Core Intent:** Directly necessary to fulfill the objective and pass verification tests.
2. **🧹 Necessary Hygiene:** Small, directly related cleanup (e.g., fixing a broken import or typo in the immediate vicinity of the edit).
3. **⚠️ Scope Creep:**
   * "While I was here, I updated 4 other functions."
   * Unrequested styling or formatting changes across unrelated files.
   * Premature abstractions or unused helper utilities.

---

## 📊 The Scope Creep Scorecard

When invoked, generate a concise report before committing:

```markdown
### 🔭 Scope Creep Audit: [Task Name]
* **Target Intent:** Fix null pointer on user logout.
* **Diff Size:** 4 files changed, +48 / -12 lines.

| File / Component | Category | Assessment & Recommendation |
| :--- | :---: | :--- |
| `src/auth/logout.ts` | 🎯 Core Intent | Keep: Directly addresses null check. |
| `tests/auth/logout.test.ts` | 🎯 Core Intent | Keep: Unit test asserting edge case. |
| `src/billing/invoice.ts` | ⚠️ Scope Creep | **Split:** Unrelated billing formatting. Revert or branch separately. |

**Verdict:** 1 extraneous file detected. Revert `src/billing/invoice.ts` prior to committing to ensure atomic, reviewable history.
```

---

## 🔒 Non-Destructive Guardrail

* Never automatically revert files without explicit user approval. Always present the scorecard and recommend the separation.
