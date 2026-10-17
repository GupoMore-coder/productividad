# 🧠 Engram MCP Server & Persistent Agentic Memory

> **Source:** [Gentleman-Programming/engram](https://github.com/Gentleman-Programming/engram) | [Engram Docs](https://engram.gentlemanprogramming.com/)  
> **Domain:** Persistent Cross-Session Memory, Curated Knowledge Base, SQLite + FTS5 Full-Text Search, Agent-Agnostic Single Binary.

---

## 🎯 Visión Arquitectónica

Engram proporciona una memoria persistente real para agentes de codificación e IA sin dependencias de Node.js, Python o Docker. Funciona como un binario nativo en Go con un almacén SQLite FTS5 ultra-eficiente (`~/.engram/engram.db`):

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / LLM Client                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON-RPC (stdio)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Engram Server (Single Go Binary)           │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │   Context Engine      │       │   FTS5 Search Engine  │  │
│  │  (Project Resolution) │       │ (Full-Text Retrieval) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               SQLite + FTS5 Storage Engine            │  │
│  │                (~/.engram/engram.db)                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `mem_current_project`
Identifica el proyecto activo y su ámbito en la memoria:

```json
{
  "name": "mem_current_project",
  "description": "Returns the resolved project key and configuration context to orient the agent at session start.",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

### 2. `mem_context`
Recupera el historial relevante, decisiones clave y el último estado consolidado:

```json
{
  "name": "mem_context",
  "description": "Retrieves recent project context, active conventions, and previous session handoffs.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "limit": { "type": "integer", "default": 5 }
    }
  }
}
```

### 3. `mem_search`
Búsqueda de texto completo indexada (FTS5) sobre decisiones, patrones y correcciones pasadas:

```json
{
  "name": "mem_search",
  "description": "Performs fast FTS5 search across curated memories, bugfixes, and architecture decisions.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Search terms or concept" },
      "limit": { "type": "integer", "default": 5 }
    },
    "required": ["query"]
  }
}
```

### 4. `mem_save`
Guarda de forma deliberada una decisión, regla, patrón o solución de error:

```json
{
  "name": "mem_save",
  "description": "Persists a significant architectural decision, bug fix, or user constraint with a stable topic key.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "topic_key": { "type": "string", "description": "Stable identifier, e.g. 'architecture/auth' or 'rules/database'" },
      "content": { "type": "string", "description": "Structured explanation, rationale, and code pattern" }
    },
    "required": ["topic_key", "content"]
  }
}
```

### 5. `mem_session_summary`
Registra el handoff formal al finalizar la sesión de trabajo:

```json
{
  "name": "mem_session_summary",
  "description": "Saves an end-of-session summary containing goals, accomplished work, next steps, and modified files.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "goal": { "type": "string" },
      "accomplished": { "type": "string" },
      "next_steps": { "type": "string" },
      "files_touched": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["goal", "accomplished", "next_steps"]
  }
}
```

---

## ⚡ Contrato Operativo para el Agente (Protocolo Inviolable)

1. **Orientación al Inicio:** Iniciar siempre con `mem_current_project` y `mem_context`.
2. **Buscar Antes de Preguntar:** Consultar `mem_search` antes de rehacer decisiones arquitectónicas o repetir preguntas al usuario.
3. **Claves de Tópico Estables:** Utilizar `topic_key` consistentes para actualizar conocimientos en lugar de crear recuerdos fragmentados y contradictorios.
4. **Handoff al Cerrar:** Ejecutar `mem_session_summary` al completar un hito para que la siguiente sesión continúe sin pérdida de contexto.

---

## 🔒 Configuración On-Demand en `mcp_config.json`

```json
{
  "mcpServers": {
    "engram": {
      "command": "engram",
      "args": ["mcp"]
    }
  }
}
```
