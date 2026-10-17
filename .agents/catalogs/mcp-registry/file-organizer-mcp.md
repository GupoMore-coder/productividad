# 🗂️ File Organizer MCP Server (Atomic & Rollback-Safe)

> **Source:** [kridaydave/File-Organizer-MCP](https://github.com/kridaydave/File-Organizer-MCP) | `npx -y file-organizer-mcp`  
> **Domain:** Atomic Filesystem Organization, Content-Hash (SHA-256) Deduplication, EXIF/ID3 Extraction, Dry-run Preview, and One-Click Rollback.

---

## 🎯 Visión Arquitectónica

File Organizer MCP resuelve el problema del alto costo de tokens y fallos parciales al organizar directorios complejos. En lugar de forzar al agente a ejecutar 50 llamadas individuales de lectura, creación y movimiento, expone operaciones atómicas con transacción reversible:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / LLM Client                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ 1 Single Atomic Tool Call
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  File-Organizer-MCP (Node.js)               │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Path Traversal Guard  │       │ SHA-256 Deduplicator  │  │
│  │ (TOCTOU & Boundary)   │       │ (Content-based hash)  │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           Rollback Journal & Atomic Mover             │  │
│  │  (Executes atomic move, preserves state in journal)   │  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               ▼
            [Clean Taxonomy & Undo Protection]
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `file_organizer_scan_directory`
Escanea un directorio con métricas detalladas por tipo, tamaño y metadatos:

```json
{
  "name": "file_organizer_scan_directory",
  "description": "Deeply inspects a directory and returns counts, sizes, file types, and proposed organizational taxonomy.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "directory": { "type": "string", "description": "Absolute path to target directory" },
      "include_subdirs": { "type": "boolean", "default": false, "description": "Recursively scan subdirectories" }
    },
    "required": ["directory"]
  }
}
```

### 2. `file_organizer_organize`
Ejecuta la reorganización atómica en una sola llamada, con soporte para dry-run:

```json
{
  "name": "file_organizer_organize",
  "description": "Organizes files into smart categorized folders in a single atomic transaction.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "directory": { "type": "string", "description": "Target directory" },
      "strategy": {
        "type": "string",
        "enum": ["by_extension", "by_date", "by_content_type", "smart_custom"],
        "default": "smart_custom"
      },
      "dry_run": { "type": "boolean", "default": true, "description": "Simulates changes and returns preview before moving" }
    },
    "required": ["directory"]
  }
}
```

### 3. `file_organizer_find_duplicates`
Detecta archivos idénticos calculando el hash criptográfico SHA-256 del contenido:

```json
{
  "name": "file_organizer_find_duplicates",
  "description": "Finds duplicate files based on content hash (SHA-256) regardless of filenames.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "directory": { "type": "string", "description": "Path to inspect" }
    },
    "required": ["directory"]
  }
}
```

### 4. `file_organizer_undo_last_operation`
Revierte instantáneamente la última operación registrada en el diario transaccional:

```json
{
  "name": "file_organizer_undo_last_operation",
  "description": "Reverses the most recent organization operation, restoring all moved files to their original paths.",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

---

## ⚡ Configuración On-Demand

Para habilitar este servidor en Antigravity bajo demanda, se agrega a `mcp_config.json`:

```json
{
  "mcpServers": {
    "file-organizer": {
      "command": "npx",
      "args": ["-y", "file-organizer-mcp"]
    }
  }
}
```

---

## 🔒 Auditoría de Seguridad & Mitigación de Riesgos

* **Regla Inviolable:** Siempre ejecutar primero con `dry_run: true` para obtener la confirmación explícita del usuario.
* **Control contra Path Traversal:** No permite operaciones que intenten escapar del directorio raíz especificado (`..` o enlaces simbólicos peligrosos).
* **Mitigación TOCTOU:** Verificación de estado de archivo en tiempo de ejecución atómico.
