# 🤖 OpenJarvis Local-First Agent Framework MCP Registry Spec

> **Source:** [open-jarvis/OpenJarvis](https://github.com/open-jarvis/OpenJarvis)  
> **Author:** OpenJarvis Project  
> **License:** Apache-2.0 / Open Source  
> **Domain:** Local-First Personal AI Agent Framework, Constraint-Aware Model Evaluation (FLOPs, Energy, Latency, Cost), Multi-Backend Local Inference (Ollama, vLLM, llama.cpp, SGLang), Persistent On-Device Memory, Native Model Context Protocol (MCP) Integration.

---

## 🎯 Visión Arquitectónica

**OpenJarvis** es un marco de investigación y producción para agentes de inteligencia artificial personales que se ejecutan directamente sobre el hardware del usuario (Apple Silicon, NVIDIA, AMD, CPUs). Trata las restricciones físicas (consumo de energía, FLOPs, latencia y presupuesto económico) como parámetros de primer orden, permitiendo a los agentes auto-optimizarse y operar de forma 100% privada:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Systems Lead                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Task Request & Resource Budget
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  OpenJarvis Local Runtime                   │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Constraint Evaluator  │       │ Multi-Backend Engine  │  │
│  │ (FLOPs, Energy, Lat)  ◄──────►│ (Ollama, vLLM, GGUF)  │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Persistent Local Memory & State Ledger                │  │
│  │ Native MCP Tools, File I/O, Local Code Interpreter    │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ High-Efficiency Execution
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Local Workstation Hardware Fabric             │
│            (Zero Cloud Egress, 100% Private State)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `openjarvis_evaluate_hardware_budget`
Evalúa la capacidad de hardware local disponible y determina la cuantización y backend óptimos según el presupuesto de energía y memoria:

```json
{
  "name": "openjarvis_evaluate_hardware_budget",
  "description": "Profiles local hardware capacity (VRAM, system RAM, GPU compute) and recommends the optimal model tier and backend.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "target_task_type": { "type": "string", "enum": ["coding", "chat", "synthesis", "vision"] },
      "max_vram_gb": { "type": "number", "default": 16.0 },
      "latency_tolerance_ms": { "type": "integer", "default": 2000 }
    }
  }
}
```

### 2. `openjarvis_invoke_local_agent`
Ejecuta una tarea agéntica a través del runtime local de OpenJarvis con herramientas MCP y trazabilidad de cómputo:

```json
{
  "name": "openjarvis_invoke_local_agent",
  "description": "Invokes a local-first agent session through OpenJarvis with tool access and constraint tracking.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "prompt": { "type": "string" },
      "backend": { "type": "string", "enum": ["ollama", "vllm", "llama_cpp", "sglang"], "default": "ollama" },
      "model_name": { "type": "string" },
      "tools_whitelist": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["prompt", "model_name"]
  }
}
```

### 3. `openjarvis_manage_local_memory`
Gestiona la memoria persistente del agente en el disco local para retención de contexto entre sesiones sin depender de servidores en la nube:

```json
{
  "name": "openjarvis_manage_local_memory",
  "description": "Reads, searches, or updates persistent on-device agent memory state.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "action": { "type": "string", "enum": ["read", "write", "search", "clear"] },
      "key": { "type": "string" },
      "value": { "type": "string" }
    },
    "required": ["action"]
  }
}
```

### 4. `openjarvis_profile_inference_cost`
Genera un informe del costo computacional de la ejecución (FLOPs estimados, consumo de energía en Joules y tiempo de latencia por token):

```json
{
  "name": "openjarvis_profile_inference_cost",
  "description": "Returns hardware telemetry and computational efficiency metrics for the completed agent run.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "session_id": { "type": "string" }
    },
    "required": ["session_id"]
  }
}
```

---

## 🏛️ Doctrina del Consejo Asesor Global

* **Jensen Huang (NVIDIA):** *Eficiencia de Cómputo y Soberanía del Silicio*. La inteligencia agéntica en el borde debe maximizar cada ciclo de GPU y vCPU. Tratar los FLOPs y el consumo energético como restricciones de diseño garantiza arquitecturas sostenibles a gran escala.
* **Joe Ucuzoglu (Deloitte):** *Confidencialidad Absoluta de la Información*. Un agente personal ejecutado localmente, con memoria que nunca abandona la máquina del usuario, elimina los vectores de exposición y no requiere exenciones de cumplimiento.
