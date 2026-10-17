---
name: mcp-edgeever-knowledge
description: Semantic knowledge management and note querying using EdgeEver's native Model Context Protocol (MCP) server. Manages bidirectional links, performs hybrid vector/full-text search over markdown notes, organizes notebooks, and syncs knowledge graphs without cloud costs. Activate when indexing project documentation, searching past clinical notes, or persisting research memos.
metadata:
  origin: Antigravity-Core
---

# 📚 MCP EdgeEver Knowledge Management

This skill formalizes the **AI-native personal and enterprise knowledge base protocol** (Clément Delangue / Arthur Mensch open data standard). It connects Antigravity directly to EdgeEver via native MCP for bidirectional note-linking, semantic recall, and fast document ingestion.

---

## 🎯 When to Use

* **Long-Term Note Retrieval:** Searching across hundreds of technical memos, design guides, or research notes.
* **Creating Structured Knowledge Assets:** Storing architectural decision records (ADRs), post-mortems, or user interview summaries.
* **Zero-Cost Knowledge Sync:** Storing vector embeddings on SQLite or Cloudflare D1 without paying high recurring SaaS database fees.

---

## 🧭 The 4-Stage Knowledge Workflow

```
1. Knowledge Ingestion & Chunking ──► 2. Tagging & Cross-Linking ──► 3. Semantic Vector Storage ──► 4. MCP Agent Recall
```

### Stage 1: Ingestion & Chunking
- Ingest Markdown documents, meeting notes, or clinical summaries.
- Break long documents into semantic chunks with preservation of headings and context.

### Stage 2: Bidirectional Linking & Tagging
- Assign taxonomic tags (`#more-paper`, `#ortho-surgery`, `#architecture`).
- Establish cross-references using standard wiki-links (`[[Related Note Title]]`).

### Stage 3: Semantic Indexing
- Compute dense embeddings for hybrid vector + keyword retrieval.
- Store locally in SQLite or deploy to Cloudflare Vectorize.

### Stage 4: MCP Agent Recall
- Agent queries `edgeever_search_notes` with natural language prompts to inject relevant context on-demand into the current task.

---

## 🛡️ Data Privacy Guardrails

- [ ] **No Unencrypted Cloud Exfiltration:** Sensitive financial or clinical data kept within local SQLite instances.
- [ ] **Data Ownership:** Markdown files remain portable, human-readable, and free from proprietary lock-in.
