# 📚 EdgeEver MCP Registry & AI-Native Knowledge Base Spec

> **Source:** [tianma-if/edgeever](https://github.com/tianma-if/edgeever)  
> **License:** AGPL-3.0  
> **Domain:** Open-Source AI-Native Knowledge Base, Evernote Alternative, Native Model Context Protocol (MCP) Server, Zero-Cost Cloudflare/Docker Deployments.

---

## 🎯 Visión Arquitectónica

EdgeEver transforma la gestión documental y de notas en una base de conocimiento semántica accesible directamente para agentes de IA mediante el protocolo MCP. Ofrece almacenamiento distribuido a costo cero utilizando Cloudflare Workers, D1 y Vectorize, o auto-alojado en Docker:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Agent Client                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON-RPC (MCP Nativo)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   EdgeEver Knowledge Server                 │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Semantic Search Engine│       │ Markdown Note Storage │  │
│  │ (Embeddings / Vector) │       │ (Bidirectional Links) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ MCP Tool Router: Query Notes, Append, Sync Knowledge  │  │
│  │ Zero-Cost Edge Storage: Cloudflare D1 / Local SQLite  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `edgeever_search_notes`
Realiza búsquedas semánticas y por palabras clave sobre notas, transcripciones y documentos:

```json
{
  "name": "edgeever_search_notes",
  "description": "Performs hybrid full-text and semantic vector search across personal and enterprise notes stored in EdgeEver.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Search prompt or keyword" },
      "tags": { "type": "array", "items": { "type": "string" } },
      "limit": { "type": "integer", "default": 5 }
    },
    "required": ["query"]
  }
}
```

### 2. `edgeever_create_note`
Crea o actualiza una nota estructurada en Markdown con etiquetas y enlaces bidireccionales:

```json
{
  "name": "edgeever_create_note",
  "description": "Creates or updates an AI-indexed Markdown note in EdgeEver with metadata tags and cross-references.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "title": { "type": "string" },
      "content": { "type": "string", "description": "Markdown body of the note" },
      "tags": { "type": "array", "items": { "type": "string" } },
      "notebook": { "type": "string", "default": "General" }
    },
    "required": ["title", "content"]
  }
}
```

### 3. `edgeever_sync_knowledge`
Sincroniza la base de conocimiento local con el repositorio en el borde (Cloudflare/Docker):

```json
{
  "name": "edgeever_sync_knowledge",
  "description": "Triggers bidirectional synchronization between the local workspace cache and the remote EdgeEver knowledge backend.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "force_resync": { "type": "boolean", "default": false }
    }
  }
}
```

---

## 🔒 Privacidad y Gobernanza de Datos

1. **Cifrado de Acceso Cero:** Notas personales y confidenciales cifradas en reposo con claves derivadas del usuario.
2. **Soberanía de Datos:** Compatibilidad con SQLite local para evitar dependencia de proveedores de nube externos.
