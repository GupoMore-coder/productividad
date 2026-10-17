# 🔍 Jevgrep Semantic Code Retrieval MCP Registry Spec

> **Source:** [dzhng/jevgrep](https://github.com/dzhng/jevgrep)  
> **License:** MIT / Open Source  
> **Domain:** Semantic Intent Code Search CLI (`jg`), AST Declaration Indexing (TypeScript, JavaScript, Python, Go, Rust), High-Precision Context Pruning, Token-Cost Reduction Layer for Coding Agents.

---

## 🎯 Visión Arquitectónica

Jevgrep (`jg`) proporciona una capa de búsqueda y recuperación semántica especializada para agentes de desarrollo. A diferencia de las herramientas tradicionales de grep que buscan literales o expresiones regulares ciegas, Jevgrep evalúa la relevancia semántica de las declaraciones y funciones en el AST, reduciendo el consumo de tokens de contexto entre un 30% y un 40%:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Coding Agent                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Natural Language Intent Query
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Jevgrep Engine (jg)                    │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Fast Decision Model   │       │ Multi-Language AST    │  │
│  │ (Relevance Classifier)│◄─────►│ Parser (TS/Py/Go/Rs)  │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Token-Pruned Code Excerpts & Declaration Leads        │  │
│  │ Exact Symbol Pointers without Hallucinated Context    │  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `jevgrep_query_semantic`
Ejecuta una búsqueda de código guiada por intención en lenguaje natural:

```json
{
  "name": "jevgrep_query_semantic",
  "description": "Performs a semantic intent code query over repository files, returning targeted excerpts and declaration leads.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string" },
      "path": { "type": "string", "default": "." },
      "max_results": { "type": "integer", "default": 5 },
      "languages": {
        "type": "array",
        "items": { "type": "string" },
        "default": ["typescript", "javascript", "python", "go", "rust"]
      }
    },
    "required": ["query"]
  }
}
```

### 2. `jevgrep_index_repository`
Indexa el AST del repositorio actual para búsquedas instantáneas y determinación de dependencias:

```json
{
  "name": "jevgrep_index_repository",
  "description": "Parses and caches the AST symbol declarations across workspace source files.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "workspace_root": { "type": "string" },
      "force_reindex": { "type": "boolean", "default": false }
    },
    "required": ["workspace_root"]
  }
}
```

### 3. `jevgrep_extract_declaration_leads`
Extrae únicamente las firmas y tipos de interfaces relevantes para construir contexto mínimo:

```json
{
  "name": "jevgrep_extract_declaration_leads",
  "description": "Extracts declaration signatures and exported symbols related to a concept without full function bodies.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "symbol_or_concept": { "type": "string" },
      "file_path": { "type": "string" }
    },
    "required": ["symbol_or_concept"]
  }
}
```

---

## 🏛️ Frugalidad Operativa y Seguridad (Jassy & Kurtz)

1. **Frugalidad Operativa Radical (Andy Jassy):** Reducción disciplinada de tokens innecesarios en la ventana de contexto. Evitar cargar archivos enteros cuando extractos podados de AST son suficientes.
2. **Protección de Propiedad Intelectual (George Kurtz):** Garantizar que las solicitudes semánticas locales no filtren código sensible fuera de los límites autorizados del proyecto.
