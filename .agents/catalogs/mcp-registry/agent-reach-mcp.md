# 👁️ Agent Reach MCP Server & Social Web Intelligence

> **Source:** [Panniantong/agent-reach](https://github.com/Panniantong/agent-reach)  
> **Domain:** Multi-Platform Social Web Extraction, High-Density Information Gathering (X/Twitter, Reddit, YouTube, GitHub, Bilibili), Zero-API Cost Architecture.

---

## 🎯 Visión Arquitectónica

Agent Reach dota a los agentes de IA de acceso universal a plataformas de alta densidad de información social y comunitaria donde las APIs oficiales son prohibitivas ($200+/mes) o bloquean IPs de servidores:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / LLM Client                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON-RPC (stdio)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Agent Reach MCP Server                     │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Anti-Blocking Routing │       │ Content Normalizer    │  │
│  │ (Stealth / Anti-403)  │       │ (Markdown Extraction) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Platform Connectors (X, Reddit, YouTube, Bilibili)   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `reach_search_social`
Búsqueda de debates, publicaciones y opiniones en redes sociales especializadas:

```json
{
  "name": "reach_search_social",
  "description": "Searches discussions, threads, and real-time community sentiment across Reddit, X (Twitter), and GitHub.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "platform": { "type": "string", "enum": ["reddit", "twitter", "github", "youtube", "all"], "default": "all" },
      "query": { "type": "string", "description": "Search query or hashtag" },
      "limit": { "type": "integer", "default": 10 }
    },
    "required": ["query"]
  }
}
```

### 2. `reach_extract_thread`
Extrae el hilo completo de una publicación, respuestas y comentarios estructurados:

```json
{
  "name": "reach_extract_thread",
  "description": "Extracts the full text, author metadata, and nested comment tree from a given URL.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "url": { "type": "string", "description": "Post or video URL" },
      "include_comments": { "type": "boolean", "default": true }
    },
    "required": ["url"]
  }
}
```

### 3. `reach_analyze_sentiment`
Sintetiza la postura comunitaria y el consenso sobre un producto, tecnología o incidente:

```json
{
  "name": "reach_analyze_sentiment",
  "description": "Aggregates social signals to return sentiment distribution, key objections, and consensus summary.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "topic": { "type": "string" },
      "timeframe": { "type": "string", "enum": ["24h", "7d", "30d", "all"], "default": "7d" }
    },
    "required": ["topic"]
  }
}
```

---

## 🔒 Seguridad & Límites Éticos

* **Cero Almacenamiento de Credenciales:** No requiere ingresar credenciales personales de redes sociales en servidores no controlados.
* **Respeto a la Privacidad:** Solo extrae contenido público. Filtra datos personales identificables (PII) en los comentarios antes de ingresarlos a la ventana de contexto.
