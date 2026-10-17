# ⚡ Anydoc High-Performance Document Parser MCP Registry Spec

> **Source:** [firecrawl/anydoc](https://github.com/firecrawl/anydoc)  
> **License:** MIT  
> **Domain:** Ultra-Fast Local Document Parsing, Pure Rust Engine, Sub-5ms Median Latency, 14 Formats (DOCX, PPTX, XLSX, ODT, ODS, ODP, RTF, EPUB, CSV, TXT, PDF), Clean GitHub-Flavored Markdown Output, Zero External Cloud/ML Overhead.

---

## 🎯 Visión Arquitectónica

Anydoc es un motor de análisis sintáctico de documentos locales desarrollado en Rust que permite transformar archivos ofimáticos complejos directamente a Markdown estructurado en menos de 5 milisegundos, sin invocar modelos pesados de aprendizaje automático ni consumir cuotas de API en la nube:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Architect                │
└──────────────────────────────┬──────────────────────────────┘
                               │ Local Fast IPC / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Anydoc Rust Engine                     │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Fast Unpacker & XML   │       │ Format Decoder        │  │
│  │ (DOCX/PPTX/XLSX/ODT)  │◄─────►│ (Pure Rust Parsers)   │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Output Formatter: Clean GitHub-Flavored Markdown      │  │
│  │ Table & Metadata Preservation Engine                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `anydoc_parse_file`
Parsea un archivo local a Markdown enriquecido preservando estructura de encabezados, listas y tablas:

```json
{
  "name": "anydoc_parse_file",
  "description": "Parses an office document (DOCX, XLSX, PPTX, ODT, EPUB, RTF, PDF) into clean GitHub-Flavored Markdown locally with sub-5ms latency.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "file_path": { "type": "string", "description": "Absolute path to the document file." },
      "include_metadata": { "type": "boolean", "default": true },
      "table_mode": { "type": "string", "enum": ["markdown", "csv", "html"], "default": "markdown" }
    },
    "required": ["file_path"]
  }
}
```

### 2. `anydoc_extract_tables`
Extrae exclusivamente las tablas de cálculo de hojas Excel (XLSX) o documentos Word como matrices estructuradas:

```json
{
  "name": "anydoc_extract_tables",
  "description": "Extracts tabular data from spreadsheets and text documents into structured JSON matrices for immediate data ingestion.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "file_path": { "type": "string" },
      "sheet_names": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["file_path"]
  }
}
```

### 3. `anydoc_inspect_metadata`
Inspecciona autoría, fechas de modificación y conteo de páginas/palabras sin cargar el cuerpo completo:

```json
{
  "name": "anydoc_inspect_metadata",
  "description": "Inspects document metadata (author, created/modified dates, word count, slide count) with instant microsecond response.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "file_path": { "type": "string" }
    },
    "required": ["file_path"]
  }
}
```

---

## 🏛️ Directivas de Seguridad y Rendimiento

1. **Privacidad Hermética (Meredith Whittaker / Andy Yen):** 100% de la ejecución ocurre en memoria local; ningún fragmento documental se transmite a la red.
2. **Eficiencia de Cómputo Radical (Jeff Dean / Andy Jassy):** No requiere GPU ni modelos de visión; optimiza la ingesta masiva de la Biblioteca Médica y contratos contables reduciendo drásticamente el consumo de tokens.
