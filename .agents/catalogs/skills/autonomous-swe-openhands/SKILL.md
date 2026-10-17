---
name: autonomous-swe-openhands
description: Autonomous Software Engineering workflows based on OpenHands architecture. Implements sandboxed issue-to-PR pipelines, iterative test-driven bug fixes, autonomous multi-file refactoring, web research, and critic-gated code generation. Activate when configuring autonomous coding agents, delegating end-to-end repository fixes, or designing isolated sandbox developer environments.
metadata:
  origin: Antigravity-Core
---

# 🤖 Autonomous SWE OpenHands

This skill encapsulates the **autonomous software engineering standard** (Jeff Dean systems rigor / Andy Jassy frugal execution / George Kurtz sandboxed containment) for executing end-to-end code changes within isolated containerized boundaries.

---

## 🎯 When to Use

* **Autonomous Issue Resolution:** Solving GitHub issues or bugs end-to-end (diagnose, locate files, write reproducing tests, patch code, verify).
* **Multi-File Refactoring:** Restructuring complex architectures across multiple files while maintaining behavior parity.
* **Sandbox Environment Orchestration:** Running untrusted code, exploratory builds, or package installations inside Docker micro-containers.
* **Continuous Verification Loops:** Enforcing a rigorous test-driven cycle before accepting any agent-generated diff.

---

## 🧭 The 5-Phase OpenHands Engineering Loop

```
1. Workspace Scoping ──► 2. Test Reproduction ──► 3. Surgical Patching ──► 4. Verification Gate ──► 5. Diff Audit
```

### Phase 1: Workspace Scoping & Localization
- Index repository symbols, call graphs, and directory tree.
- Identify the exact files involved without reading unnecessary files.
- Pin current git SHA as the baseline anchor.

### Phase 2: Failure Reproduction (TDD)
- Create or run a minimal reproducing test case that fails against current code.
- Confirm the failure mode matches the reported issue specification.

### Phase 3: Surgical Patching
- Apply minimal, atomic modifications to solve the root cause.
- Avoid style-only changes or scope creep outside the target issue.

### Phase 4: Verification Gate
- Run the full test suite (`pytest`, `npm test`, `cargo test`, `go test`).
- Verify that the reproduction test now passes AND zero existing tests regressed.
- Run static linters and type checkers (`tsc`, `flake8`, `mypy`).

### Phase 5: Diff Audit & Artifact Delivery
- Produce a clean patch or pull request summary.
- Verify that no secrets, `.env` files, or temporary artifacts were committed.

---

## 🛡️ Inviolable Execution Gates

- [ ] **Docker Sandbox Enforcement:** All execution commands run with restricted network and filesystem access.
- [ ] **Deterministic Exit:** Bounded iterations (`max_iterations: 25`) with graceful fallback if unresolvable.
- [ ] **Clean Git State:** Workspace tree verified pristine except for explicitly modified files.
