# 💬 Open WebUI Multi-Model AI Hub MCP Registry Spec

> **Source:** [open-webui/open-webui](https://github.com/open-webui/open-webui)  
> **License:** MIT / Open Source  
> **Domain:** Self-Hosted Multi-Model AI Chat & Workflow Interface, Native Ollama & OpenAI-Compatible Integration, Air-Gapped Offline Operation, Multi-User Role-Based Access Control (RBAC), Document Ingestion RAG, Pipelines Plugin System.

---

## 🎯 Visión Arquitectónica

Open WebUI es una plataforma de interacción conversacional de código abierto que unifica modelos locales (Ollama, vLLM, llama.cpp) y APIs en la nube bajo una interfaz unificada, soberana y privada. Aporta control granular de acceso basado en roles (RBAC), integración de documentos con búsqueda semántica local (RAG) y un sistema de plugins/pipelines en Python:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Agent                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Chat Hub Directive / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Open WebUI Core Gateway                  │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Unified Model Router  │       │ Document RAG Core     │  │
│  │ (Ollama, vLLM, Cloud) ◄─────►│ (Chroma, Hybrid Search│  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Python Pipelines & Functions System                   │  │
│  │ Enterprise RBAC, Modelfiles, WebRTC Voice Engine      │  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `openwebui_query_chat_session`
Envía prompts y recibe respuestas a través del enrutador unificado de Open WebUI:

```json
{
  "name": "openwebui_query_chat_session",
  "description": "Sends a prompt to an active Open WebUI model instance, receiving streamed or buffered completions.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "model": { "type": "string" },
      "prompt": { "type": "string" },
      "chat_id": { "type": "string" },
      "system_prompt": { "type": "string" }
    },
    "required": ["model", "prompt"]
  }
}
```

### 2. `openwebui_manage_rag_knowledge`
Gestiona colecciones de documentos para recuperación semántica contextual:

```json
{
  "name": "openwebui_manage_rag_knowledge",
  "description": "Uploads and tags documents into private RAG collections with custom chunking parameters.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "collection_name": { "type": "string" },
      "file_path": { "type": "string" },
      "chunk_size": { "type": "integer", "default": 1000 },
      "chunk_overlap": { "type": "integer", "default": 100 }
    },
    "required": ["collection_name", "file_path"]
  }
}
```

### 3. `openwebui_register_function_pipe`
Despliega una función de procesamiento o filtro en el pipeline de ejecución de Open WebUI:

```json
{
  "name": "openwebui_register_function_pipe",
  "description": "Registers a custom server-side Python function or middleware hook into the Open WebUI pipeline.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "pipe_id": { "type": "string" },
      "python_code": { "type": "string" },
      "is_active": { "type": "boolean", "default": true }
    },
    "required": ["pipe_id", "python_code"]
  }
}
```

---

## 🏛️ Gobernanza y Colaboración Empresarial (Nadella & Kurtz)

1. **Plataforma Colaborativa de IA (Satya Nadella):** Proporcionar una experiencia de usuario amigable para que toda la organización interactúe con modelos de inteligencia artificial bajo controles unificados.
2. **Aislamiento y Cero Telemetría (George Kurtz):** Operación completamente desconectada de internet (air-gapped) cuando se procesan datos confidenciales de la empresa.
