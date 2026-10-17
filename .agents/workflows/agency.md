---
description: Consult or activate any of the 279 specialized agents from The Agency catalog.
---

# 🎭 Agency Command

Activate any specialized agent from **The Agency** (279 agents across 18 divisions) or browse the catalog directly.

## Usage

```bash
/agency list                      # Show all 18 divisions and counts
/agency list <division>           # List all agents in a division (e.g., /agency list engineering)
/agency <slug or name>            # Activate a specialist (e.g., /agency sre, /agency ui-designer)
/agency <slug> <task description> # Activate specialist directly for a task
```

### Examples

```bash
/agency sre Review our error budgets and deployment rollback thresholds
/agency database-optimizer How do we index this high-throughput events table?
/agency finops-engineer Audit AWS infrastructure for idle compute resources
/agency software-architect Review domain boundaries for this microservices split
/agency security-auditor Check this contract for reentrancy and integer underflow
/agency growth-hacker Plan our viral referral loops and onboarding funnel
```

---

## Instructions for the Assistant

When the user runs `/agency [arguments]`:

### Case 1: `/agency list`
1. Read `.agents/agency/INDEX.md` lines 10 to 32.
2. Present the 18 divisions with their agent counts and high-level focus areas.

### Case 2: `/agency list <division>`
1. Search `.agents/agency/catalog.json` for all agents where `division == <division>`.
2. Present a clean markdown table of available specialists with their slug, title, and one-sentence purpose.

### Case 3: `/agency <agent-slug-or-name> [task]`
1. Search `.agents/agency/catalog.json` or `.agents/agency/INDEX.md` for the closest matching agent slug or name.
   - Example matches:
     - `sre` $\to$ `.agents/agency/engineering/engineering-sre.md`
     - `finops` $\to$ `.agents/agency/engineering/engineering-finops-engineer.md`
     - `database-optimizer` $\to$ `.agents/agency/engineering/engineering-database-optimizer.md`
     - `frontend` $\to$ `.agents/agency/engineering/engineering-frontend-developer.md`
     - `ui-designer` $\to$ `.agents/agency/design/design-ui-designer.md`
     - `solidity` $\to$ `.agents/agency/engineering/engineering-solidity-smart-contract-engineer.md`
2. Load the agent file using `view_file` on `.agents/agency/<file>`.
3. Inform the user:
   > *"🎭 Activando **[Agent Name]** (División [Division])."*
4. Adopt the identity, specialized technical expertise, delivery processes, and quality standards described in the agent file to execute the task.
