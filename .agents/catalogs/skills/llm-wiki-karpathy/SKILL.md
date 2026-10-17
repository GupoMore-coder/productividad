---
name: llm-wiki-karpathy
description: LLM-maintained personal and organizational markdown wiki protocol based on Andrej Karpathy's vectorless knowledge architecture. Replaces opaque vector database RAG with an interlinked, plain-text Markdown wiki maintained collaboratively by agents and humans with structured concepts, entity indices, and verifiable source citations. Activate when designing persistent knowledge repositories, curating long-term research notes, avoiding vector hallucination pitfalls, or building auditable agent memory vaults.
metadata:
  origin: Antigravity-Core
---

# 📚 LLM Wiki Karpathy Knowledge Architecture

This skill formalizes the **transparent, deterministic knowledge base standard** (Warren Buffett auditable owner earnings / Andy Jassy durable primitive architecture) based on Andrej Karpathy's LLM Wiki paradigm.

---

## 🎯 When to Use

* **Auditable Knowledge Curation:** Documenting complex engineering, business, or scientific domains where every claim must point to verifiable primary sources.
* **Vectorless High-Precision Retrieval:** Providing agents with deterministic, transparent navigation through interlinked markdown pages instead of lossy vector embeddings.
* **Continuous Knowledge Synthesis:** Ingesting transcripts, research papers, and technical memos, updating existing concept pages incrementally without bloat.
* **Team & Agent Knowledge Alignment:** Sharing a common plain-text repository in Git that both humans and AI agents can read, review, and edit using pull requests.

---

## 🧭 The 4-Step Karpathy Wiki Workflow

```
1. Source Archival ──► 2. Atomic Extraction ──► 3. Cross-Linking & Indexing ──► 4. Graph Navigation
```

### Step 1: Source Archival
- Place immutable source documents into `wiki/sources/<YYYY-MM-DD>-<slug>.md`.
- Extract source metadata (author, URL, publication date, primary topics).

### Step 2: Atomic Concept Extraction
- Identify novel entities, algorithms, systems, and mental models from the source.
- Create or update atomic pages in `wiki/concepts/<concept-slug>.md` using standardized structure:
  - Definition & Core Thesis
  - Key Principles / Mechanics
  - Related Concepts (`[Concept Name](file://...)`)
  - Primary Citations & Source Links

### Step 3: Cross-Linking & Indexing
- Add forward links and reciprocal backlinks across interconnected concepts.
- Update `wiki/index.md` and domain indices to maintain a global Table of Contents.
- Ensure no orphaned pages exist in the wiki graph.

### Step 4: Graph Navigation
- Agents traverse the wiki using standard filesystem tools (`view_file`, `grep_search`).
- Synthesize answers by quoting atomic concepts and their primary sources directly.

---

## 🛡️ Operational Guardrails

- [ ] **Zero Vector Black Boxes:** Never rely on uninspected vector embeddings when exact factual provenance is required.
- [ ] **Git-Backed Integrity:** Every modification to the wiki must be committable as clean, human-readable markdown diffs.
- [ ] **Strict Link Hygiene:** All concept references must use valid markdown links with consistent slugs.
