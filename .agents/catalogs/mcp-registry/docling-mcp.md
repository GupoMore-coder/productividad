# 📑 Docling MCP Server & Multimodal Document Intelligence

> **Source:** [docling-project/docling](https://github.com/docling-project/docling) | [Docling Documentation](https://docling-project.github.io/docling/)  
> **Domain:** Universal Multimodal Document Parsing, Layout Analysis, PDF Table Extraction, OCR, Audio/Video Transcripts, and Structure-Preserving Conversions.

---

## 🎯 Visión Arquitectónica

Docling (Linux Foundation AI & Data / IBM) es el estándar de grado de producción para parsing documental y comprensión estructural de documentos heterogéneos:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / LLM Client                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON-RPC (stdio / SSE)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Docling MCP Server                      │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │   Pipeline Dispatcher │       │   VLM Engine Hook     │  │
│  │  (PDF, Office, Media) │       │ (GraniteDocling/VLM)  │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           Docling Unified Document Model             │  │
│  │ (Hierarchical Layout, Reading Order, Tables, Formulas)│  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               ▼
                [Markdown | Lossless JSON | DocTags]
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `docling_convert_document`
Convierte un documento local o URL a formato estructurado preservando tablas, fórmulas y jerarquía:

```json
{
  "name": "docling_convert_document",
  "description": "Parses complex documents (PDF, DOCX, PPTX, XLSX, HTML, images) into structured Markdown or lossless JSON.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "source": { "type": "string", "description": "Absolute path or URL of the document" },
      "export_format": {
        "type": "string",
        "enum": ["markdown", "json", "doctags", "html"],
        "default": "markdown",
        "description": "Output representation format"
      },
      "enable_ocr": { "type": "boolean", "default": true, "description": "Enable OCR for scanned pages and images" },
      "vlm_enrichment": { "type": "boolean", "default": false, "description": "Use Vision-Language Model for chart & image reasoning" }
    },
    "required": ["source"]
  }
}
```

### 2. `docling_extract_tables`
Extrae tablas completas preservando el anidamiento y la tipología de celdas:

```json
{
  "name": "docling_extract_tables",
  "description": "Extracts tabular data from documents into clean structured Markdown tables or Pandas-compatible JSON.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "source": { "type": "string", "description": "Path to document" },
      "table_format": { "type": "string", "enum": ["markdown", "csv", "json"], "default": "markdown" }
    },
    "required": ["source"]
  }
}
```

### 3. `docling_chunk_document`
Genera chunks semánticos conscientes de la jerarquía de títulos y secciones para RAG:

```json
{
  "name": "docling_chunk_document",
  "description": "Chunks a document respecting its semantic structure (headers, sections, paragraphs) for high-precision RAG.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "source": { "type": "string", "description": "Path to document" },
      "max_tokens": { "type": "integer", "default": 1000 }
    },
    "required": ["source"]
  }
}
```

---

## ⚡ Modos de Ejecución (Zero Context Overhead)

1. **Vía MCP Server On-Demand:**
   * Registrado en `mcp_config.json` para invocación dinámica solo cuando el usuario lo active.
2. **Vía CLI Directo (Ultraligero):**
   ```bash
   docling <ruta-o-url> --to md
   ```
3. **Vía Python SDK:**
   ```python
   from docling.document_converter import DocumentConverter
   converter = DocumentConverter()
   result = converter.convert("archivo.pdf")
   markdown_content = result.document.export_to_markdown()
   ```

---

## 🔒 Auditoría de Seguridad & Privacidad

* **100% Local y Air-Gapped:** Todo el procesamiento ocurre en el hardware local. No hay llamadas a APIs de terceros no declaradas.
* **Protección de PHI / Documentos Sensibles:** Ideal para análisis de historias clínicas, reportes financieros y patentes protegidas sin riesgo de exfiltración.
