---
name: agent-workplace-governance
description: Enterprise governance, budget capping, audit logging, and human-in-the-loop policies for multi-agent workflows. Implements Paperclip-style agent supervision, enforcing strict token/cost limits, preventing infinite task loops, verifying permissions before sensitive operations, and ensuring audit compliance. Activate when configuring agent swarms, managing background tasks, auditing LLM spending, or setting approval gates.
metadata:
  origin: Antigravity-Core
---

# 🏢 Agent Workplace Governance (Paperclip Standard)

This skill operationalizes **institutional agent governance** (Andy Jassy / Joe Ucuzoglu / Jamie Dimon fiduciary standard). It prevents autonomous agents from causing financial leakage, infinite execution loops, or unreviewed production changes.

---

## 🎯 When to Use

* **Budget & Cost Tracking:** Establishing hard token or financial caps on background scripts and subagents.
* **Supervising Multi-Agent Workflows:** Managing agent swarms where tasks are delegated across multiple specialized roles.
* **Human-in-the-Loop Triggers:** Halting execution before irreversible operations (Type 1 decisions: migrations, drops, mass renames, deployments).
* **Forensic Audit Compliance:** Reviewing telemetry logs to identify rogue or degraded agent runs.

---

## 🧭 The 4-Pillar Governance Protocol

```
1. Resource Allocation & Cap Setting ──► 2. Boundary Verification ──► 3. Approval Gating ──► 4. Forensic Telemetry
```

### Pillar 1: Resource Allocation & Cap Setting
Before launching any autonomous agent or background task:
- Define `max_iterations` (e.g. 5 loops max) and `timeout_seconds`.
- Set an explicit token budget (e.g. 30,000 tokens).
- If the budget is exhausted before completion, the agent MUST pause and request permission to proceed.

### Pillar 2: Boundary Verification
- Restrict file write permissions to the declared scope (never touch `.env`, `mcp_config.json`, or `.git` unless explicitly authorized).
- Verify that network calls only hit whitelisted APIs or approved endpoints.

### Pillar 3: Approval Gating (Type 1 vs Type 2)
- **Type 2 (Reversible):** Creating scratch scripts, generating local docs, reading files -> proceed autonomously.
- **Type 1 (Irreversible):** Running `DROP TABLE`, deploying to production, moving/deleting hundreds of files -> STOP and demand explicit human approval.

### Pillar 4: Forensic Telemetry
- Maintain structured logs of task ID, start time, token usage, exit status, and artifacts created.
- Review error spikes or anomalous runtimes immediately.

---

## 🛡️ Fiduciary Compliance Checklist

- [ ] **Hard Token Budget Configured:** No unbounded loops or indefinite retries.
- [ ] **No Secret Logging:** Authorization headers and secrets scrubbed from audit traces.
- [ ] **Segregation of Duties:** The agent that drafts changes is not the sole authority that deploys them to production.
