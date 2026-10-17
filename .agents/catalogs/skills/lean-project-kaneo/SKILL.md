---
name: lean-project-kaneo
description: High-velocity, zero-bloat agile project tracking and task lifecycle management using Kaneo principles. Eliminates Jira-style overhead by focusing strictly on actionable engineering tasks, acceptance criteria, blocker identification, and milestone burndown. Activate when managing sprint tasks, tracking implementation roadmaps, decomposing epics, or reviewing project status.
metadata:
  origin: Antigravity-Core
---

# 🎯 Lean Project Tracking (Kaneo Philosophy)

This skill formalizes the **high-velocity engineering management framework** (Jeff Bezos "Day 1" / Andy Jassy operational frugality standard). It replaces cumbersome ticketing bureaucracy with crisp, developer-first task tracking.

---

## 🎯 When to Use

* **Epic Decomposition:** Breaking complex feature requests into atomic, independent 1-turn tasks.
* **Sprint Burndown Tracking:** Monitoring active tasks, identifying dependency blockers, and measuring progress.
* **Bug Triage & Resolution:** Logging defects with reproduction steps, severity ranking, and verification criteria.
* **Release Milestones:** Tracking progress toward tangible version goals without administrative drag.

---

## 🧭 The 3-Rule Lean Agile Discipline

```
1. Crisp Task Anchoring ──► 2. Active Blocker Elimination ──► 3. Gated Done Criteria
```

### Rule 1: Crisp Task Anchoring
Every tracked task must adhere to the 3-part specification:
- **What:** Exact functionality or fix to implement.
- **Why:** Business or customer value served.
- **Acceptance Criteria:** Deterministic check (e.g. test passes, endpoint returns 200, build compiles with 0 errors).

### Rule 2: Active Blocker Elimination
- If a task is marked `blocked`, immediately identify the dependency (e.g. database schema, third-party API token, upstream PR).
- Escalate blockers rather than allowing tasks to linger in an ambiguous in-progress state.

### Rule 3: Gated Done Criteria
- A task can NEVER transition to `done` without recorded evidence of verification (unit tests, manual smoke test, or automated build).

---

## 🛡️ Efficiency Checklist

- [ ] **No Vanity Tasks:** Avoid creating tasks for trivial changes that take less time to complete than to track.
- [ ] **Deterministic Done Definition:** Clear verification gate documented for every completed item.
