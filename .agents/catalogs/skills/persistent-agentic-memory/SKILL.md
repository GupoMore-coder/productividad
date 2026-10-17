---
name: persistent-agentic-memory
description: Long-term memory curation and conflict reconciliation for AI agents. Combines Engram's single-binary SQLite FTS5 persistence with Memanto's cognitive governance (conflict resolution, decay of stale rules, and cross-session handoffs). Activate when managing evolving architectural decisions, persisting conventions across sessions, or preventing memory contradictions.
metadata:
  origin: Antigravity-Core
---

# 🧠 Persistent Agentic Memory & Governance

This skill establishes the operating contract for cross-session continuity and memory governance. It bridges **Engram** (high-speed local SQLite+FTS5 store) and **Memanto** (cognitive reconciliation of contradictions, decay policies, and handoffs).

---

## 🎯 When to Use

* Beginning a session: Orienting on the active project, recovering past decisions, and reading the previous session's handoff.
* During implementation: Persisting crucial architectural decisions, newly adopted conventions, or bug fixes with stable topic keys.
* Resolving contradictions: When an incoming instruction or new library version conflicts with an established rule, superseding the old belief with an audit trail.
* Ending a session: Leaving a structured `mem_session_summary` so the next agent invocation retains 100% operational momentum.

---

## 🧭 The 4-Phase Memory Lifecycle

```
Phase 1: Orient (Start) ──► Phase 2: Inquire (Pre-decision) ──► Phase 3: Consolidate (Post-fix) ──► Phase 4: Handoff (Close)
```

### Phase 1: Orientation at Session Bootstrap
Execute at the beginning of any substantial task:
1. `mem_current_project`: Confirm project scope.
2. `mem_context`: Fetch the most recent handoff summary, active architecture decisions, and durable user preferences.

### Phase 2: Inquiry Before Deliberation
Before asking the user to re-explain a convention or before re-solving an already fixed defect:
* Run `mem_search(query="auth token expiration policy")` to verify if a decision was already committed.

### Phase 3: Consolidation with Conflict Reconciliation (Memanto Principle)
* When persisting a new rule, use a **stable topic key** (e.g. `architecture/database-schema` or `rules/coding-standards`).
* **Conflict Superseding:** If a new decision contradicts a prior memory, do not duplicate. Explicitly mark the old topic key as superseded:
  ```markdown
  [SUPERSEDED: 2026-09-28] Previously used session cookies; replaced by JWT bearer tokens due to mobile app parity requirement.
  ```

### Phase 4: End-of-Session Handoff
Before stopping work, register a formal handoff:
```json
call_tool("mem_session_summary", {
  "goal": "Refactor authentication flow to JWT",
  "accomplished": "Migrated auth routes, added token unit tests, updated swagger docs",
  "next_steps": "Update frontend api client to inject Bearer header in axios interceptor",
  "files_touched": ["src/auth/jwt.service.ts", "src/auth/auth.controller.ts"]
})
```

---

## ⚡ Memory Anti-Patterns (What NOT to Store)

* ❌ **Do NOT save raw terminal outputs or multi-megabyte log files.** Memory is a curated knowledge base, not a dumpster.
* ❌ **Do NOT save transient scratch code.** Only persist validated, passing patterns.
* ❌ **Do NOT create fragmented competing topic keys.** (e.g., `auth_rule_1`, `auth_new`, `auth_final`). Use one stable key `security/auth` and update it in place.
