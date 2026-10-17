---
name: selfhosted-taskview-pm
description: Self-hosted project and sprint task orchestration using TaskView Community and its native Docker MCP server. Manages multi-board Kanban workflows, syncs Git commits with task cards, tracks engineering velocity, and maintains private task registries without cloud SaaS lock-in under Andy Jassy operational principles. Activate when managing project backlogs, coordinating sprint milestones, automating task status updates, or hosting on-premises issue trackers.
metadata:
  origin: Antigravity-Core
---

# 📋 Self-Hosted TaskView Project Management

This skill formalizes the **self-hosted task and project tracking protocol** (Andy Jassy operational discipline / Joe Ucuzoglu workflow traceability) leveraging TaskView's native Docker MCP integration.

---

## 🎯 When to Use

* **Private Backlog & Sprint Management:** Maintaining project boards on local/private infrastructure without cloud subscription overhead.
* **Autonomous Task Tracking:** Allowing coding agents to read current backlog requirements, claim tasks, and transition cards to "Review" or "Done".
* **Git-to-Card Traceability:** Attaching commits, PR links, and test results directly to cards for forensic audit trails.
* **Blocker Triage:** Querying high-friction bottlenecks and stalled issues in active engineering sprints.

---

## 🧭 The 4-Step Sprint Execution Flow

```
1. Backlog Query ──► 2. Task Claim & Branch Anchor ──► 3. Progress Update ──► 4. Verification & Close
```

### Step 1: Backlog Query
- Fetch high-priority cards from the board backlog.
- Parse acceptance criteria and dependent tasks.

### Step 2: Task Claim & Branch Anchor
- Shift card status to `in_progress`.
- Anchor work to a dedicated git feature branch linked to the task ID.

### Step 3: Progress Update
- Record milestone progress notes with commit hashes.
- Escalate any detected architecture blockers immediately.

### Step 4: Verification & Close
- Run test suites and verify that acceptance criteria are met.
- Shift card status to `review` or `completed` with verification summary notes.

---

## 🛡️ Operational Guardrails

- [ ] **Patched Version Verification:** Ensure TaskView instance runs version 1.56.0 or higher to mitigate legacy auth bypass CVEs.
- [ ] **Scoped API Tokens:** Use least-privilege API tokens scoped strictly to the current workspace board.
- [ ] **No Silent Abandonment:** Any task shifted to `in_progress` must be completed, blocked with explicit rationale, or reset cleanly.
