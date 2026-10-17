# 🔄 Dify Agentic Workflow & RAG Pipeline MCP Registry Spec

> **Source:** [langgenius/dify](https://github.com/langgenius/dify)  
> **License:** Apache-2.0  
> **Domain:** Agentic Workflow Orchestration, Enterprise RAG Pipeline (Chunking, Vector + Keyword Hybrid Search, Multi-Stage Reranking), Prompt Studio, LLMOps, Multi-Agent Collaboration.

---

## 🎯 Visión Arquitectónica

Dify es una plataforma de ingeniería agéntica de grado empresarial que unifica la construcción de flujos de trabajo visuales basados en grafos dirigidos acíclicos (DAGs) con motores de Retrieval-Augmented Generation (RAG) de alta precisión. Facilita la ingesta documental, segmentación inteligente y despliegue de agentes autónomos con control granular de memoria:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Architect                │
└──────────────────────────────┬──────────────────────────────┘
                               │ Dify Open API / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                         Dify Core                           │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Workflow DAG Engine   │       │ Enterprise RAG Engine │  │
│  │ (Branching, Loops)    │◄─────►│ (Hybrid Search & Rerank)│
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Knowledge Bases: PDF, Word, Markdown, Web Crawler     │  │
│  │ Agent Tools: API Call, Code Node (Python/Node), SQL   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `dify_run_workflow`
Ejecuta un flujo de trabajo agéntico parametrizado (DAG) con soporte de streaming de pasos intermedios:

```json
{
  "name": "dify_run_workflow",
  "description": "Executes a published Dify visual workflow DAG with custom input variables and returns intermediate node outputs.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "workflow_id": { "type": "string" },
      "inputs": { "type": "object", "description": "Key-value input payload expected by the start node." },
      "response_mode": { "type": "string", "enum": ["streaming", "blocking"], "default": "blocking" }
    },
    "required": ["workflow_id", "inputs"]
  }
}
```

### 2. `dify_retrieve_knowledge`
Ejecuta una búsqueda semántica híbrida (vectorial densa + BM25 léxica + reranker) sobre colecciones documentales:

```json
{
  "name": "dify_retrieve_knowledge",
  "description": "Performs enterprise hybrid retrieval over a Dify dataset using dense embeddings, BM25 keyword matching, and cross-encoder reranking.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "dataset_id": { "type": "string" },
      "query": { "type": "string" },
      "top_k": { "type": "integer", "default": 5 },
      "score_threshold": { "type": "number", "default": 0.6 },
      "reranking_enable": { "type": "boolean", "default": true }
    },
    "required": ["dataset_id", "query"]
  }
}
```

### 3. `dify_sync_document`
Ingesta, segmenta y vectoriza nuevos documentos (PDFs contables, historias clínicas anonimizadas, manuales técnicos):

```json
{
  "name": "dify_sync_document",
  "description": "Uploads and indexes raw documents into a target Dify knowledge base with automated semantic chunking.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "dataset_id": { "type": "string" },
      "file_path": { "type": "string" },
      "indexing_technique": { "type": "string", "enum": ["high_quality", "economy"], "default": "high_quality" },
      "chunk_size": { "type": "integer", "default": 500 }
    },
    "required": ["dataset_id", "file_path"]
  }
}
```

---

## 🏛️ Gobernanza y Criterio Ejecutivo

- **Calidad de Respuestas y Trazabilidad (Mohamed Kande / PwC):** Toda respuesta generada mediante RAG debe citar explícitamente los fragmentos y documentos fuentes recuperados.
- **Eficiencia de Costos de Inferencia (Andy Jassy / Larry Fink):** Utilizar modelos ligeros para pasos intermedios de enrutamiento y clasificación; reservar modelos frontera para síntesis final.
