---
name: adaptive-memory-hindsight
description: Long-term adaptive agentic memory architecture based on Hindsight (#1 on LongMemEval benchmark). Implements the cognitive tripartite loop (retain, recall, reflect), temporal memory decay modeling, cross-session fact extraction, and contradiction resolution. Activate when designing persistent agent memory systems, preventing context loss across sessions, or consolidating multi-agent knowledge graphs.
metadata:
  origin: Antigravity-Core
---

# 🧠 Adaptive Memory Hindsight

This skill defines the **long-term cognitive agent memory standard** (Demis Hassabis cognitive architectures / Dario Amodei constitutional grounding / Warren Buffett compounding capital knowledge) for retaining, retrieving, and reflecting upon knowledge across unbounded time horizons.

---

## 🎯 When to Use

* **Cross-Session Memory Preservation:** Retaining explicit user decisions, architectural preferences, and workspace rules across independent conversation sessions.
* **Preventing Context Rot:** Replacing brute-force massive prompt stuffing with precision, semantically indexed memory recall.
* **Autonomous Fact Reflection:** Running periodic reflection loops that synthesize hundreds of atomic actions into generalized behavioral axioms.
* **Contradiction Resolution:** Detecting when new user instructions update or supersede previous conventions and updating the memory graph cleanly.

---

## 🧭 The Tripartite Cognitive Architecture

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   RETAIN    │ ───►  │   REFLECT   │ ◄───  │   RECALL    │
│  (Extract)  │       │(Consolidate)│       │ (Retrieve)  │
└─────────────┘       └─────────────┘       └─────────────┘
```

### 1. Retain (Episodic Fact Extraction)
- Parse incoming user interactions for decisions, preferences, and system states.
- Extract atomic facts in Subject-Predicate-Object format with timestamp metadata.
- Assign an initial confidence score and category (preference, rule, architecture).

### 2. Recall (Recency & Relevance Scoring)
- When a new task begins, calculate a dual scoring function:
  $$\text{Score} = (\text{Cosine Similarity}) \times e^{-\lambda \cdot \Delta t}$$
- Return only high-confidence memories ($>0.70$) relevant to the active user prompt.
- Inject recalled memories into working context without bloat.

### 3. Reflect (Consolidation & Axiom Derivation)
- Group episodic memories around related topics (e.g., "Deployment Protocols", "Brand Voice").
- Merge redundant observations and resolve temporal contradictions (newer verified rules supersede older ones).
- Produce durable, high-order knowledge nodes for long-term guidance.

---

## 🛡️ Memory Governance Safeguards

- [ ] **No Secret Retention:** Never memorize plain-text API keys, passwords, or PII.
- [ ] **Deterministic Precedence:** Recalled memories can NEVER override explicit instructions in [`GEMINI.md`](file:///c:/Users/ferna/Documents/Antigravity%20Project/GEMINI.md).
- [ ] **Auditability:** Every recalled fact maintains a pointer to its originating conversation or document.
