---
name: agency-auto-orchestrator
description: Automatic intent detection, domain classification, and precision asset resolution across the 878 tools, skills, rules, and agents in Antigravity.
---

# 🧠 Agency Auto-Orchestrator

The **Agency Auto-Orchestrator** is the intelligence engine that bridges raw user requests to the highest-precision assets available in the workspace without context budget penalty.

---

## 🎯 How It Operates

When any prompt is received:

1. **Classify the Intent:**
   Matches keywords and semantic objectives against the 9 core domains in [`.agents/MASTER_CAPABILITY_MATRIX.md`](file:///c:/Users/ferna/Documents/Antigravity%20Project/.agents/MASTER_CAPABILITY_MATRIX.md).

2. **Assemble the Optimal Triad:**
   * **Lead Specialist Agent:** (e.g. `engineering-database-optimizer`, `agency-software-architect`, `marketing-growth-hacker`).
   * **Supporting Skills & Patterns:** (e.g. `postgres-patterns`, `contract-first`, `frontend-a11y`).
   * **Quality Rules & Reviewers:** (e.g. `common-security.md`, `react-coding-style.md`, `tdd-workflow`).

3. **In-Flight Injection:**
   Reads the exact profiles needed via `view_file` to keep the persistent context footprint minimal while providing state-of-the-art precision:
   * **Skills:** `.agents/catalogs/skills/<skill-name>/SKILL.md`
   * **Specialists:** `.agents/agency/<division>/<agent-name>.md`
   * **Rules & Reviewers:** `.agents/rules/<rule-name>.md` and `.agents/agents/<reviewer-name>.md`

---

## 🛠️ Tracing & Manual Verification

You can inspect the full classification matrix at [`.agents/MASTER_CAPABILITY_MATRIX.md`](file:///c:/Users/ferna/Documents/Antigravity%20Project/.agents/MASTER_CAPABILITY_MATRIX.md) or use `/orchestrate <query>` to preview which triad would be activated for a hypothetical task.
