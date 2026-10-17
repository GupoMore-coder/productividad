---
name: parallel-ade-orca
description: Parallel AI agent fleet management and git worktree isolation based on Orca Agent Development Environment (ADE). Manages concurrent coding agents executing separate features or bug fixes simultaneously on isolated worktree directories, eliminating git merge collisions. Synchronizes tasks with GitHub/Linear and enforces automated test-gated branch merging. Activate when managing multi-agent teams, running parallel refactoring sprints, or preventing branch conflicts across concurrent agents.
metadata:
  origin: Antigravity-Core
---

# 🐋 Parallel ADE Orca

This skill defines the **parallel agent development and worktree isolation standard** (Jeff Dean distributed systems scaling / Andy Jassy operational throughput / Warren Buffett capital preservation) for orchestrating multiple coding agents concurrently on a single repository.

---

## 🎯 When to Use

* **Parallel Feature Development:** Assigning five independent tasks (e.g. auth overhaul, billing refactor, report exporter) to five agents concurrently.
* **Collision-Free Experimentation:** Allowing exploratory architectural spikes in temporary worktrees without polluting the main branch or dirtying uncommitted changes.
* **Automated Triage of Issue Backlogs:** Decomposing large sprint backlogs into isolated parallel worker threads.
* **Test-Gated Merging:** Ensuring each agent verifies its own code in its dedicated worktree before opening a pull request.

---

## 🧭 The 4-Stage Orca Fleet Workflow

```
1. Worktree Provisioning ──► 2. Agent Dispatch ──► 3. Health & Test Gates ──► 4. Clean Rebase & Prune
```

### Stage 1: Worktree Provisioning
- Run `git worktree add -b <feature-branch> ../worktrees/<task-slug> <base-branch>`.
- Copy relevant local configuration files (`.env.test`, dependencies) without copying heavy `.git` history.

### Stage 2: Agent Dispatch & Task Scoping
- Launch the agent inside the newly created worktree directory.
- Provide scoped instructions and acceptance criteria specific to that isolated worktree.

### Stage 3: Health & Test Gates
- Monitor parallel agent execution via central fleet status.
- Once an agent finishes, run the project test suite (`pytest`, `npm test`, `cargo test`) within that worktree.
- If tests fail, require the agent to patch defects before signaling completion.

### Stage 4: Clean Rebase & Worktree Pruning
- Rebase the feature branch onto the latest `main`.
- Merge changes or submit PR.
- Execute `git worktree remove ../worktrees/<task-slug>` and delete temporary working directories.

---

## 🛡️ Fleet Hygiene Safeguards

- [ ] **Zero Main Contention:** Agents never write directly to the primary checked-out worktree.
- [ ] **Orphan Worktree Cleanup:** Unused or abandoned worktrees pruned automatically after task completion.
- [ ] **Deterministic Lock Checking:** Ensure parallel tasks do not attempt conflicting migrations on the same shared database schema.
