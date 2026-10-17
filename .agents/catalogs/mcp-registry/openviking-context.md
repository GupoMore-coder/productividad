# 🗄️ OpenViking Self-Evolving Context Database MCP Registry Spec

> **Source:** [volcengine/OpenViking](https://github.com/volcengine/OpenViking) (ByteDance)  
> **License:** AGPL-3.0 / Open Source  
> **Domain:** Self-Evolving Context Database for AI Agents, Virtual Filesystem Paradigm (`viking://` URIs), Hierarchical Tree Organization for Memory, Skills & RAG Knowledge, Session-End Pattern Extraction, Transparent Vectorless/Hybrid Context Traversal.

---

## 🎯 Visión Arquitectónica

OpenViking reemplaza las bases de datos vectoriales opacas tipo "caja negra" con un paradigma de sistema de archivos virtual (`viking://`). La memoria del agente, el conocimiento documental (RAG) y las habilidades operativas se organizan en directorios jerárquicos transparentes y navegables que evolucionan y se refinan de forma autónoma al concluir cada sesión:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Agent                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Virtual URI Context / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    OpenViking Context Core                  │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Virtual Filesystem    │       │ Self-Evolving Engine  │  │
│  │ (viking://path/to/res)│◄─────►│ (Session Memory Dist) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Structured Namespace Hierarchy:                       │  │
│  │  viking://memory/     (Session experiences & state)   │  │
│  │  viking://knowledge/  (RAG docs, specs, domain data)  │  │
│  │  viking://skills/     (Synthesized agent procedures)  │  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `openviking_read_uri`
Lee un artefacto o rama de conocimiento a través de su ruta virtual estructurada:

```json
{
  "name": "openviking_read_uri",
  "description": "Retrieves context objects, memories, or skills using the virtual viking:// URI hierarchy.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "uri": { "type": "string" },
      "recursive": { "type": "boolean", "default": false }
    },
    "required": ["uri"]
  }
}
```

### 2. `openviking_persist_memory_tree`
Escribe y versiona memorias de sesión o aprendizajes evolutivos en el sistema de archivos virtual:

```json
{
  "name": "openviking_persist_memory_tree",
  "description": "Commits synthesized session memory, patterns, or skills into the hierarchical OpenViking filesystem.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "target_uri": { "type": "string" },
      "content": { "type": "string" },
      "metadata": { "type": "object" }
    },
    "required": ["target_uri", "content"]
  }
}
```

### 3. `openviking_query_semantic_directory`
Navega y filtra directorios semánticos para descubrir habilidades o documentos relacionados:

```json
{
  "name": "openviking_query_semantic_directory",
  "description": "Discovers related knowledge branches or skills within a viking:// namespace using hybrid semantic directory ranking.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "namespace": { "type": "string", "enum": ["memory", "knowledge", "skills"] },
      "query": { "type": "string" },
      "limit": { "type": "integer", "default": 5 }
    },
    "required": ["namespace", "query"]
  }
}
```

---

## 🏛️ Gobernanza y Transparencia de Memoria (Satya Nadella)

1. **Mentalidad de Crecimiento y Contexto Evolutivo (Satya Nadella):** Los agentes no deben empezar desde cero en cada sesión; el conocimiento debe acumularse y destilarse continuamente en activos reutilizables.
2. **Auditabilidad y Desmitificación:** Eliminar el misterio de las bases vectoriales densas; toda memoria debe ser visible, editable e inspeccionable como un archivo de texto en el árbol `viking://`.
