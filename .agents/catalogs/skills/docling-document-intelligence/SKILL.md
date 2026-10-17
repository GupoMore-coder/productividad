---
name: docling-document-intelligence
description: High-fidelity multimodal document parsing (PDF, Office, HTML, images, audio), layout analysis, hierarchical table extraction, LaTeX formula preservation, and OCR. Activate when extracting data from complex documents, manuals, whitepapers, or tables for LLM reasoning and RAG.
metadata:
  origin: Antigravity-Core
---

# 📑 Docling Document Intelligence

This skill provides production-grade document understanding and structural conversion using **Docling** (Linux Foundation AI & Data / IBM). It eliminates the loss of context typical of naive text extraction by preserving reading order, nested tables, formulas, and visual document geometry.

---

## 🎯 When to Use

* Parsing complex multi-column PDFs, academic papers, patents, or financial statements (XBRL, balance sheets).
* Extracting tabular data directly into clean GitHub-flavored Markdown or Pandas DataFrames without broken cells.
* Processing Office documents (`.docx`, `.pptx`, `.xlsx`), scanned images (`.png`, `.jpeg`, `.tiff`), and audio (`.mp3`, `.wav`) with ASR.
* Generating semantically chunked content for RAG pipelines that respects headings and section boundaries.
* Working with air-gapped, privacy-sensitive, or HIPAA/PHI documents that must not be transmitted to third-party parsing APIs.

---

## 🛠️ Execution Pathways

### 1. Fast CLI Pipeline (Zero Code Overhead)

Convert any document to GitHub-flavored Markdown directly from the terminal:

```bash
# Convert local PDF to Markdown
docling "path/to/document.pdf" --to md

# Convert and enable OCR with layout preservation
docling "path/to/scanned_document.pdf" --pipeline standard --to md

# Process a remote URL directly
docling "https://arxiv.org/pdf/2408.09869" --to md
```

### 2. Python Programmatic API (High Precision)

```python
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.datamodel.base_models import InputFormat

# 1. Configure pipeline options
pipeline_options = PdfPipelineOptions()
pipeline_options.do_ocr = True
pipeline_options.do_table_structure = True

# 2. Initialize converter with options
converter = DocumentConverter(
    format_options={
        InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
    }
)

# 3. Convert and export
doc_result = converter.convert("research_report.pdf")
markdown_output = doc_result.document.export_to_markdown()
print(markdown_output)
```

### 3. Hierarchical Semantic Chunking for RAG

Avoid arbitrary token slicing. Use Docling's layout-aware chunker:

```python
from docling.chunking import HybridChunker
from docling.document_converter import DocumentConverter

doc = DocumentConverter().convert("clinical_study.pdf").document
chunker = HybridChunker(tokenizer="sentence-transformers/all-MiniLM-L6-v2")

chunks = list(chunker.chunk(doc))
for i, chunk in enumerate(chunks[:5]):
    print(f"--- Chunk {i+1} [Heading: {chunk.meta.headings}] ---")
    print(chunk.text)
```

---

## 📊 Tabular Data Extraction Workflow

When extracting complex tables (merged cells, multi-tier headers):

1. **Detection:** Docling segments table boundaries using deep layout vision.
2. **Reconstruction:** It reconstructs the cell matrix and row/colspans.
3. **Export Formats:**
   * **Markdown Table:** For direct LLM prompting.
   * **HTML/DocTags:** For visual fidelity and semantic hierarchy.
   * **CSV / JSON:** For relational ingestion into databases or Pandas.

---

## 🔒 Security & Privacy Boundaries

* **Air-Gapped Safety:** All OCR and layout vision models run locally on CPU/GPU. No external webhooks or telemetry to external servers.
* **Sensitive Document Handling:** Complies with zero-trust local execution. Never commits extracted raw documents containing PII/PHI to public repositories.
