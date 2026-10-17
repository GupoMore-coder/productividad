---
name: agentic-rag-dify
description: Enterprise Agentic Workflows and multi-stage RAG pipelines based on Dify architecture. Implements DAG-based visual prompt pipelines, hybrid retrieval (dense vectors + BM25 keyword + cross-encoder rerank), automated document chunking, tool routing, and multi-tenant LLMOps. Activate when designing enterprise document retrieval systems, automating multi-step LLM workflows, or integrating knowledge bases with business logic.
metadata:
  origin: Antigravity-Core
---

# 🔄 Agentic RAG Dify

This skill defines the **enterprise retrieval-augmented generation and workflow orchestration standard** (Satya Nadella AI leverage / Mohamed Kande auditable accuracy / Arthur Mensch token efficiency) for building verifiable knowledge-driven applications.

---

## 🎯 When to Use

* **Enterprise Document RAG:** Indexing and querying internal business records (invoices, legal policies, technical catalogs, medical knowledge).
* **Multi-Step DAG Workflows:** Orchestrating complex conditional reasoning pipelines with branching, tool invocation, and validation loops.
* **Hybrid Search Strategy:** Combining semantic vector recall with lexical exact matching (BM25) and neural reranking for zero-hallucination factual grounding.
* **LLMOps and Prompt Versioning:** Managing prompt templates, dataset splits, and evaluation metrics across environments.

---

## 🧭 The 4-Stage Dify RAG Pipeline

```
1. Document Parsing & Semantic Chunking ──► 2. Hybrid Indexing ──► 3. Re-ranked Retrieval ──► 4. Grounded Synthesis
```

### Stage 1: Document Parsing & Semantic Chunking
- Clean formatting artifacts, tables, and headers.
- Chunk text along semantic boundaries (paragraphs, sections) rather than arbitrary token cuts.
- Retain parent-child hierarchical relations for document context preservation.

### Stage 2: Hybrid Indexing
- Generate dense vector embeddings for conceptual matching.
- Generate BM25 sparse indices for exact keyword and entity recall (part numbers, invoice codes, proper names).

### Stage 3: Re-ranked Retrieval
- Execute hybrid search across both dense and sparse indices.
- Pass top candidate passages to a Cross-Encoder Reranker model.
- Discard candidate passages scoring below the strict confidence threshold (`score < 0.65`).

### Stage 4: Grounded Synthesis & Citation
- Inject validated context passages into the model prompt.
- Instruct model to synthesize strictly from the retrieved context, producing verifiable citations (`[Doc: Page X]`).
- Fail-safe response if no relevant passages are discovered ("Información no encontrada en el corpus").

---

## 🛡️ Enterprise Rigor Checklist

- [ ] **Strict Citation Requirement:** All factual claims must map to indexed sources.
- [ ] **Data Isolation (RBAC):** Datasets segmented by tenant and operational domain.
- [ ] **Sanitized Inputs:** User prompts stripped of prompt-injection attempts before DAG execution.
