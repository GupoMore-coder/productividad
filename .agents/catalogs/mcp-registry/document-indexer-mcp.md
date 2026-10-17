# 🔍 Document Indexer MCP Server (LanceDB & Local Semantic Search)

> **Source:** [yairwein/document-mcp](https://github.com/yairwein/document-mcp)  
> **Domain:** Local Vector Database (LanceDB), Real-Time Directory Monitoring, Sentence-Transformers Embeddings, and Privacy-Preserving Semantic Search.

---

## 🎯 Visión Arquitectónica

Servidor MCP optimizado para búsqueda semántica e indexación vectorial continua de documentos locales sin enviar datos a la nube:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / LLM Client                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON-RPC (stdio)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Document Indexer MCP Server                 │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │   Folder Watcher      │       │ Sentence-Transformers │  │
│  │ (Incremental Index)   │       │ (all-MiniLM-L6-v2)    │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               LanceDB Embedded Vector DB              │  │
│  │      (High-performance zero-overhead columnar store)  │  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               ▼
               [Semantic Similarity & Citations]
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `document_indexer_search`
Búsqueda vectorial en los documentos indexados con filtrado por similitud semántica:

```json
{
  "name": "document_indexer_search",
  "description": "Performs semantic vector search across indexed local documents returning text snippets and source file paths.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Natural language question or search phrase" },
      "limit": { "type": "integer", "default": 5, "description": "Max results to return" },
      "score_threshold": { "type": "number", "default": 0.65, "description": "Minimum similarity score" }
    },
    "required": ["query"]
  }
}
```

### 2. `document_indexer_index_folder`
Indexa un directorio de forma incremental:

```json
{
  "name": "document_indexer_index_folder",
  "description": "Scans and indexes all supported documents (.pdf, .docx, .txt, .md) in a target directory.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "folder_path": { "type": "string", "description": "Path to folder" },
      "force_reindex": { "type": "boolean", "default": false }
    },
    "required": ["folder_path"]
  }
}
```

---

## ⚡ Configuración On-Demand

Para habilitar este servidor cuando se requiera indexación local:

```json
{
  "mcpServers": {
    "document-indexer": {
      "command": "uv",
      "args": ["run", "python", "-m", "src.main"],
      "env": {
        "WATCH_FOLDERS": "C:\\Ruta\\A\\Tus\\Documentos",
        "LANCEDB_PATH": "C:\\Ruta\\A\\vector_index",
        "EMBEDDING_MODEL": "all-MiniLM-L6-v2"
      }
    }
  }
}
```

---

## 🔒 Consideraciones Operativas

* **Zero-Leakage:** Ni documentos ni embeddings viajan por Internet.
* **Control de Recursos:** Se ejecuta bajo demanda y no mantiene daemons permanentes si no se está consultando el índice.
