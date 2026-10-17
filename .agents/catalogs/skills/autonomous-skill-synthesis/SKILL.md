---
name: autonomous-skill-synthesis
description: Autonomous distillation of successful execution workflows, bug remediations, and complex integration patterns into structured, reusable SKILL.md assets. Prevents repeated engineering effort, captures implicit system constraints, and enriches the on-demand capability matrix. Activate after solving complex, non-obvious technical challenges, when the user requests persisting a workflow, or when executing /learn.
metadata:
  origin: Antigravity-Core
---

# 🧬 Autonomous Skill Synthesis

This skill embodies the **Nous Research / Demis Hassabis continual learning paradigm**: an intelligent agent should never solve the exact same non-trivial challenge twice from scratch. When a novel bug, architectural edge case, or integration pattern is solved, this skill autonomously distills the solution into an immutable, on-demand `SKILL.md` document.

---

## 🎯 When to Use

* **Post-Incident Resolution:** After diagnosing and fixing a tricky system defect (e.g. MCP proxy pipe drop, process collisions, SSRF/BOLA edge case).
* **Novel Third-Party Integration:** When successfully wiring a new library, webhook protocol, or AI service with non-obvious configurations.
* **User Directive:** Whenever the user states "remember how to do this", "aprende este patrón", or triggers `/learn`.
* **Workflow Optimization:** When a multi-step routine is repeatedly requested and can be standardized into a deterministic recipe.

---

## 🧭 The 4-Stage Synthesis Lifecycle

```
1. Forensic Trajectory Review ──► 2. Pattern Abstraction ──► 3. De-duplication Check ──► 4. Structured SKILL.md Generation
```

### Stage 1: Forensic Trajectory Review
- Extract the core friction point: What failed? Why was the default approach insufficient?
- Identify the exact sequence of commands, configuration flags, or code patches that achieved a green state.
- Discard trial-and-error noise, transient errors, and verbose logs.

### Stage 2: Pattern Abstraction
- Strip workspace-specific secrets, ephemeral tokens, or absolute user paths (`C:\Users\username\...` -> `$env:USERPROFILE\...` or relative paths).
- Formulate the pattern as a generalized engineering recipe:
  - **Context & Pre-conditions:** When does this apply?
  - **Action Steps:** Numbered, reproducible instructions with code blocks.
  - **Verification Gate:** How to verify that the pattern executed correctly.

### Stage 3: De-duplication Check
- Inspect `.agents/MASTER_CAPABILITY_MATRIX.md` and `.agents/catalogs/skills/`.
- Ensure a duplicate or overlapping skill does not already exist. If an existing skill covers 80% of the domain, propose an incremental update rather than a redundant asset.

### Stage 4: Structured SKILL.md Generation
Write the output file following the standard Antigravity specification:

```markdown
---
name: <kebab-case-name>
description: <Concise third-person description. Include specific triggers and keywords for auto-dispatch.>
metadata:
  origin: Antigravity-Core
---

# 📌 <Human Readable Title>

<Executive context & design rationale: 1-2 paragraphs citing engineering philosophy>

---

## 🎯 When to Use
- Trigger condition 1
- Trigger condition 2

---

## 🧭 Step-by-Step Execution Workflow
1. Step description...
```

---

## 🛡️ Non-Destructive Storage Policy

1. **Zero Workspace Bloat:** New on-demand skills MUST be written to `.agents/catalogs/skills/<skill-name>/SKILL.md` so they remain strictly on-demand without consuming permanent context.
2. **Catalog Registration:** Immediately update `.agents/MASTER_CAPABILITY_MATRIX.md` to index the new skill under its appropriate domain.
3. **No Unaudited Code Injection:** The skill describes *patterns and instructions*; it never commits unverified code to the application codebase.
