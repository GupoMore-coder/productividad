---
name: semantic-grep-jevgrep
description: High-efficiency semantic intent code search and retrieval layer based on jevgrep (jg). Identifies relevant source files, declaration leads, and verbatim code excerpts from natural language queries instead of literal text patterns, reducing context token overhead by 30-40% across TypeScript, Python, Go, and Rust codebases. Activate when navigating large unfamiliar codebases, locating architectural logic without knowing exact symbol names, or optimizing token budgets during deep refactoring.
metadata:
  origin: Antigravity-Core
---

# 🔍 Semantic Grep Jevgrep

This skill formalizes the **semantic code search and context pruning standard** (Andy Jassy frugal engineering / Jeff Dean low-latency retrieval) using AST declaration extraction to slash token consumption while boosting recall accuracy.

---

## 🎯 When to Use

* **Unfamiliar Large Codebases:** Finding where a specific domain concept is implemented (e.g., "Where are auth tokens refreshed?") without knowing function names.
* **Token Budget Optimization:** Reducing agent prompt bloat by retrieving only relevant declaration leads instead of dumping thousand-line files.
* **Cross-Language Navigation:** Tracing architecture across mixed codebases (TypeScript frontends, Python APIs, Rust microservices).
* **Architectural Refactoring:** Discovering all consumers of a conceptual pattern across the workspace.

---

## 🧭 The 3-Step Semantic Search Protocol

```
1. Intent Formulation ──► 2. AST Scoped Retrieval ──► 3. Minimal Lead Injection
```

### Step 1: Intent Formulation
- Formulate the query as a concrete architectural intention rather than single words (e.g., "session expiration and refresh token rotation logic").
- Scope to relevant directories or file extensions when possible.

### Step 2: AST Scoped Retrieval
- Query the semantic AST index via `jg`.
- Filter candidates by relevance score, isolating function heads, type signatures, and docstrings.

### Step 3: Minimal Lead Injection
- Inject only the verified lines of interest into the agent context window.
- Preserve context budget for reasoning and code synthesis rather than raw file payload.

---

## 🛡️ Efficiency Guardrails

- [ ] **No Monolithic Dumps:** Never read entire multi-thousand-line modules when AST declaration leads suffice.
- [ ] **Cache Utilization:** Maintain AST indices incrementally during active development sessions.
