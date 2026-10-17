# 📈 Overmind AI Agent Continuous Optimization MCP Spec

> **Source:** [overmind-core/overmind](https://github.com/overmind-core/overmind)  
> **License:** Apache-2.0 / MIT  
> **Domain:** Continuous Optimization Platform for AI Agents, Production Trace to Evaluation Dataset Pipeline, Specialized Model Fine-Tuning, Agent Regression Benchmarking.

---

## 🎯 Visión Arquitectónica

Overmind es una plataforma de ingeniería diseñada para el refinamiento continuo de agentes autónomos. Captura trazas reales de ejecución en producción (llamadas a herramientas, razonamiento intermedio, errores de sintaxis), las convierte en conjuntos de evaluación (*gold standard datasets*) y permite evaluar si nuevas versiones de prompts o modelos especializados mejoran o degradan el desempeño del agente:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Specialist               │
└──────────────────────────────┬──────────────────────────────┘
                               │ Overmind Trace Protocol / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Overmind Platform                       │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Trace Ingestion       │       │ Benchmark Engine      │  │
│  │ (Tool Calls & Errors) │◄─────►│ (Eval Datasets)       │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Continuous Evaluation: Success Rate, Token Cost, Regr │  │
│  │ Model Fine-Tuning Pipeline: Distilled Agent Models    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `overmind_record_trace`
Registra la traza completa de un paso agéntico (herramienta invocada, argumentos, respuesta y éxito/fallo):

```json
{
  "name": "overmind_record_trace",
  "description": "Records an execution trace step from an agent session into the evaluation dataset for benchmarking.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "session_id": { "type": "string" },
      "task_name": { "type": "string" },
      "tool_name": { "type": "string" },
      "input_payload": { "type": "object" },
      "output_payload": { "type": "object" },
      "success": { "type": "boolean" },
      "latency_ms": { "type": "number" }
    },
    "required": ["session_id", "task_name", "tool_name", "success"]
  }
}
```

### 2. `overmind_run_benchmark`
Ejecuta una evaluación automatizada del agente contra un dataset de pruebas establecido:

```json
{
  "name": "overmind_run_benchmark",
  "description": "Runs regression evaluation over a gold-standard dataset, outputting success rate, hallucination rate, and execution speed metrics.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "dataset_name": { "type": "string" },
      "candidate_model": { "type": "string" }
    },
    "required": ["dataset_name"]
  }
}
```

---

## 🏛️ Gobernanza y Rigor Forense

1. **Evaluación Basada en Datos (Mohamed Kande / Demis Hassabis):** Ningún prompt de sistema o configuración de agente debe considerarse "mejorado" sin métricas objetivas de benchmarking que demuestren reducción de fallos.
2. **Control de Regresiones (Janet Truncale):** Asegurar que las correcciones de casos particulares no degraden el rendimiento en tareas generales previamente validadas.
