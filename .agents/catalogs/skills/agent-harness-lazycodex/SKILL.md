---
name: agent-harness-lazycodex
description: Test-driven autonomous agent execution harness based on code-yeongyu/lazycodex. Implements strict planning verification gates, AST pre-commit validation, automated test-fail-fix iteration loops (TDD), persistent memory ledgers, and atomic snapshot rollbacks to prevent agent drift. Activate when executing complex refactors, running autonomous multi-step coding loops, enforcing zero-regression guarantees, or recovering safely from failed code modifications.
metadata:
  origin: Antigravity-Core
---

# ⚡ Agent Harness LazyCodex Protocol

This skill enforces the **deterministic test-driven agent execution protocol** (Jamie Dimon risk fortress / Jensen Huang closed-loop acceleration) using the methodology of LazyCodex.

---

## 🎯 When to Use

* **Complex Autonomous Coding Tasks:** Guiding agents through multi-file features where unplanned side effects could break existing tests.
* **TDD Enforcement:** Requiring a failing regression test before writing implementation logic.
* **Pre-Commit AST Verification:** Catching syntax errors, import mismatches, and type inconsistencies before changes touch disk.
* **Resilient Rollback Management:** Saving discrete workspace snapshots before risky edits and restoring them cleanly if tests fail.

---

## 🧭 The 4-Phase Harness Protocol

```
1. Plan Gate Verification ──► 2. Test Anchor (Red) ──► 3. Minimal Impl (Green) ──► 4. AST Audit & Snapshot Commit
```

### Phase 1: Plan Gate Verification
- Review proposed plan against project rules and architecture.
- Identify exact test commands and success criteria before touching application files.

### Phase 2: Test Anchor (Red)
- Create or isolate unit/integration test reproducing expected behavior or bug.
- Execute test command to confirm that the test fails for the expected reason (Red state).

### Phase 3: Minimal Implementation (Green)
- Apply minimal surgical code edits to satisfy test requirements.
- Re-run test command; iterate up to the bounded retry limit if failures persist.

### Phase 4: AST Audit & Snapshot Commit
- Run AST parsers, linters, and type checkers (`tsc --noEmit`, `mypy`, `cargo check`).
- If clean, commit the state snapshot. If broken, rollback to the Phase 1 snapshot.

---

## 🛡️ Operational Guardrails

- [ ] **Bounded Iteration Loop:** Hard limit on automated retry attempts (maximum 5) to prevent infinite token consumption.
- [ ] **Zero Untested Merges:** No code is marked complete without documented green test execution.
- [ ] **State Isolation:** Ensure dirty working tree state is stashed or snapshotted prior to starting autonomous loops.
