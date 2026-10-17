---
name: agent-filesystem-openviking
description: Self-evolving agent context database and virtual filesystem protocol using ByteDance OpenViking architecture (viking:// URIs). Organizes memory, RAG knowledge, and operational skills into navigable hierarchical directories rather than opaque vector embeddings, extracting persistent learnings at session boundaries. Activate when managing long-term agent context, structuring multi-domain knowledge repositories, navigating hierarchical memory trees, or building transparent agent memory systems.
metadata:
  origin: Antigravity-Core
---

# 🗄️ Agent Filesystem OpenViking (ByteDance Architecture)

This skill formalizes the **virtual filesystem context protocol** (`viking://`) based on OpenViking (Satya Nadella continuous learning / Andy Jassy structured frugality).

---

## 🎯 When to Use

* **Long-Term Context Accumulation:** Persisting key domain decisions, codebase layouts, and user preferences across multiple sessions.
* **Transparent Knowledge Inspection:** Navigating agent memories as readable files rather than black-box embedding vectors.
* **Session End Synthesis:** Automatically extracting new procedures and skills from successful session traces.
* **Unified Workspace Hierarchy:** Organizing memory (`viking://memory/`), documentation (`viking://knowledge/`), and capabilities (`viking://skills/`) under a single URI scheme.

---

## 🧭 The 4-Step OpenViking Memory Cycle

```
1. URI Resolution ──► 2. Scoped Branch Traversal ──► 3. Contextual Injection ──► 4. Post-Session Tree Distillation
```

### Step 1: URI Resolution
- Query the resource via structured URI (e.g., `viking://knowledge/billing/pricing_rules.md`).
- Validate namespace permissions and freshness timestamps.

### Step 2: Scoped Branch Traversal
- Read only the specific sub-branch required for the task.
- Prevent loading irrelevant global namespaces into prompt context.

### Step 3: Contextual Injection
- Provide precise context pointers to the active specialist agent.
- Log reads for memory access frequency scoring.

### Step 4: Post-Session Tree Distillation
- At session boundaries, synthesize novel patterns into candidate files under `viking://skills/`.
- Prune obsolete or superseded memories to prevent context decay.

---

## 🛡️ Guardrails

- [ ] **No Unsanitized Secret Storage:** Strip credentials, tokens, and PII before writing to `viking://memory/`.
- [ ] **Deterministic Namespace Names:** Enforce lowercase, kebab-case directory names for reliable cross-platform URI resolution.
