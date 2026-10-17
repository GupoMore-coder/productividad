---
name: rust-doc-parser-anydoc
description: High-performance local document parsing based on Anydoc (Rust-powered, sub-5ms latency). Converts 14 common office and text formats (DOCX, PPTX, XLSX, ODT, RTF, EPUB, CSV, PDF) directly into clean GitHub-Flavored Markdown without requiring external cloud APIs, OCR overhead, or GPU resources. Activate when parsing batches of office documents, extracting tables from spreadsheets, or preparing local knowledge bases for RAG pipelines.
metadata:
  origin: Antigravity-Core
---

# ⚡ Rust Document Parser Anydoc

This skill defines the **high-speed local document ingestion and parsing standard** (Jeff Dean systems performance / Meredith Whittaker air-gapped data sovereignty) for turning heterogeneous office documents into structured Markdown in milliseconds.

---

## 🎯 When to Use

* **High-Throughput Local Document Ingestion:** Parsing batches of medical reports, financial spreadsheets, or legal contracts without cloud latency.
* **Cost-Free RAG Preparation:** Converting Word (DOCX), PowerPoint (PPTX), and OpenDocument (ODT) files to Markdown before feeding into vector search (Dify / Hindsight).
* **Excel Tabular Extraction:** Rapidly parsing XLSX files into cleanly formatted Markdown or CSV matrices for accounting analysis.
* **Zero-Exfiltration Workflows:** Processing confidential medical records (HIPAA) or corporate proprietary documents on air-gapped or local systems.

---

## 🧭 The 4-Stage Parsing & Conversion Pipeline

```
1. Format Validation ──► 2. Pure Rust Unpacking ──► 3. Structural AST Extraction ──► 4. Clean Markdown Output
```

### Stage 1: Format Validation & Integrity Check
- Inspect file magic bytes to verify genuine file type (prevent renamed extension mismatches).
- Check file size bounds before memory allocation.

### Stage 2: Pure Rust Unpacking & Streaming
- Decompress ZIP/XML containers (DOCX, XLSX, PPTX) in memory streams without disk thrashing.
- Bypass heavy rendering engines (no LibreOffice daemon, no headless browser required).

### Stage 3: AST Extraction & Layout Hierarchy
- Map document headings (Heading 1, 2, 3) to standard Markdown `#`, `##`, `###`.
- Convert tabular rows and cells into aligned Markdown tables with column headers.
- Extract bulleted, numbered, and nested lists cleanly.

### Stage 4: Sanitization & Markdown Delivery
- Strip non-semantic formatting noise (font sizes, inline styling tags, arbitrary colors).
- Ensure output is valid GitHub-Flavored Markdown ready for indexing or LLM consumption.

---

## 🛡️ Inviolable Execution Gates

- [ ] **Local-Only Boundary:** Zero outbound network traffic allowed during parsing.
- [ ] **Table Preservation:** Tabular data must retain column and row alignment without truncated cells.
- [ ] **Fallback Handling:** If a PDF is image-only/scanned, immediately flag for OCR engine (`docling-document-intelligence`) rather than silent failure.
