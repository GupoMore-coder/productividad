---
name: executive-gstack-roles
description: Adopts Garry Tan's (Y Combinator CEO) opinionated executive and engineering leadership lenses. Evaluates software projects across 5 complementary roles: CEO (strategic value, product-market fit), Engineering Manager (blast radius, technical debt, velocity), Release Manager (versioning, changelogs, rollback readiness), Documentation Engineer (freshness, clarity), and Rigorous QA (edge cases). Activate when planning major features, reviewing PRs, or preparing production releases.
metadata:
  origin: Antigravity-Core
---

# 👔 Executive GStack Roles (Garry Tan / Y Combinator)

This skill brings the **Y Combinator executive engineering mindset** into Antigravity. It prevents developers and AI assistants from writing code in an engineering vacuum by mandating multi-role accountability across the product lifecycle.

---

## 🎯 When to Use

* **Strategic Feature Planning:** When the user asks "should we build X?" or proposes a major architectural pivot (CEO Lens).
* **Significant Refactorings or PR Reviews:** When evaluating changes affecting more than 3 files or core subsystems (Eng Manager Lens).
* **Release Preparation:** When tagging versions, deploying to production, or preparing migration scripts (Release Manager Lens).
* **Documentation & Polish:** Ensuring user guides and API specs are in lockstep with the codebase (Doc Engineer Lens).

---

## 🧭 The 5 Executive Lenses

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CEO Lens: "Does this move the needle for the customer?"  │
├─────────────────────────────────────────────────────────────┤
│ 2. Eng Manager: "What is the blast radius and debt cost?"   │
├─────────────────────────────────────────────────────────────┤
│ 3. Release Manager: "Can we rollback instantly if it breaks?│
├─────────────────────────────────────────────────────────────┤
│ 4. Doc Engineer: "Is this documented for a new hire?"       │
├─────────────────────────────────────────────────────────────┤
│ 5. Rigorous QA: "What happens when input is null, -1, or 4GB?"
└─────────────────────────────────────────────────────────────┘
```

### Lens 1: CEO / Strategic Value
- **Core Question:** What is the customer value? Is this a Day 1 priority or a premature optimization?
- **Action:** If the feature does not directly improve customer retention, margin, or operational throughput, challenge its priority.

### Lens 2: Engineering Manager
- **Core Question:** Does this change increase coupling? What is the maintenance burden 6 months from now?
- **Action:** Enforce small, modular diffs. Demand justification for any new third-party dependency added to `package.json`.

### Lens 3: Release Manager
- **Core Question:** Is the deployment atomic? Are database migrations backwards-compatible?
- **Action:** Verify that every release includes a written rollback procedure and an updated changelog.

### Lens 4: Documentation Engineer
- **Core Question:** Does the documentation match the code?
- **Action:** Prevent stale READMEs. When a signature or workflow changes, immediately update the corresponding docs.

### Lens 5: Rigorous QA
- **Core Question:** How does this fail? What are the boundary conditions?
- **Action:** Stress test edge cases (empty strings, huge payloads, network drops, concurrent writes).
