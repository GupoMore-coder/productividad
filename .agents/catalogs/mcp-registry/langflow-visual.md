# 🔀 Langflow Visual AI Workflow MCP Registry Spec

> **Source:** [langflow-ai/langflow](https://github.com/langflow-ai/langflow)  
> **License:** MIT / Open Source  
> **Domain:** Visual Low-Code AI Agent & Workflow Builder, Modular Node-Based Directed Acyclic Graph (DAG) Engine, Multi-Agent Swarm Orchestration, Custom Python Component Sandboxing, Vector Index Integration, Standalone REST API Generation.

---

## 🎯 Visión Arquitectónica

Langflow proporciona una plataforma visual e interactiva para orquestar flujos de agentes y pipelines de RAG manteniendo Python puro bajo el capó. A diferencia de las interfaces no-code rígidas, Langflow permite editar directamente el código de cada nodo, encadenar modelos de lenguaje con almacenes vectoriales y exponer los gráficos como endpoints REST reproducibles:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Architect                │
└──────────────────────────────┬──────────────────────────────┘
                               │ Visual Graph Directive / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Langflow Graph Core                     │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Node DAG Compiler     │       │ Custom Python Sandbox │  │
│  │ (LLMs, Tools, RAG)    │◄─────►│ (Dynamic Node Logic)  │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Standalone FastAPI Endpoint Generator                 │  │
│  │ Streaming Output, Memory Buffer, Multi-Model Swarms   │  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `langflow_compile_flow_spec`
Valida la integridad de las conexiones del grafo visual y compila una definición JSON en código ejecutable:

```json
{
  "name": "langflow_compile_flow_spec",
  "description": "Validates and compiles a visual node-based JSON flow into an executable graph specification.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "flow_json": { "type": "object" },
      "strict_type_checking": { "type": "boolean", "default": true }
    },
    "required": ["flow_json"]
  }
}
```

### 2. `langflow_execute_flow_run`
Ejecuta una petición de entrada a través de un flujo compilado y retorna los pasos intermedios y el resultado final:

```json
{
  "name": "langflow_execute_flow_run",
  "description": "Executes an input payload through a compiled Langflow graph with intermediate telemetry traces.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "flow_id": { "type": "string" },
      "inputs": { "type": "object" },
      "session_id": { "type": "string" },
      "stream_output": { "type": "boolean", "default": false }
    },
    "required": ["flow_id", "inputs"]
  }
}
```

### 3. `langflow_export_api_component`
Exporta un gráfico probado como un microservicio FastAPI o endpoint independiente:

```json
{
  "name": "langflow_export_api_component",
  "description": "Generates a standalone, authenticated Python FastAPI microservice from a Langflow graph.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "flow_id": { "type": "string" },
      "output_path": { "type": "string" },
      "include_dockerfile": { "type": "boolean", "default": true }
    },
    "required": ["flow_id", "output_path"]
  }
}
```

---

## 🏛️ Desacoplamiento y Modularidad (Nadella & Bezos)

1. **Ecosistemas Modulares y Democratización (Satya Nadella):** Permitir a desarrolladores y analistas colaborar visualmente sobre la misma lógica de IA que corre en producción.
2. **Alta Velocidad de Iteración (Jeff Bezos):** Cambiar de modelo base, probar nuevas estrategias de prompt o alterar el almacén vectorial sin reescribir la aplicación cliente.
