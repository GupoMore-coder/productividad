# 🧬 DeepSeek Harness MCP Registry & Plugin Architecture Spec

> **Source:** [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) | DeepSeek AI  
> **License:** MIT  
> **Domain:** Extensible Plugin Architecture, Chain-of-Thought (CoT) Verification, Tool-Calling Benchmarking, Open Model Reasoning Harness.

---

## 🎯 Visión Arquitectónica

DeepSeek Harness opera bajo el principio *"Everything is a Plugin"*. Permite a modelos abiertos de razonamiento (DeepSeek V3, DeepSeek R1, Llama 3) interoperar con plugins dinámicos y evaluar la rigurosidad de sus procesos deductivos:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Agent Runtime                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ Harness Lifecycle Hooks
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    DeepSeek Harness Core                    │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Plugin Registry       │       │ CoT Verification Loop │  │
│  │ (Dynamic Tool Loader) │       │ (Reasoning Integrity) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Benchmark Evaluator: Tool Calling & Complex Reasoning │  │
│  │ State Snapshotter: Deterministic Rollback on Failures │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `deepseek_harness_evaluate`
Evalúa el rendimiento de un agente o modelo sobre una batería de tareas complejas de razonamiento y llamadas a herramientas:

```json
{
  "name": "deepseek_harness_evaluate",
  "description": "Executes evaluation suites against an agent or tool-calling pipeline, scoring success rate, reasoning depth, and token efficiency.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "benchmark_suite": { "type": "string", "enum": ["tool_calling", "math_reasoning", "code_generation", "custom"] },
      "test_cases": { "type": "array", "items": { "type": "object" } }
    },
    "required": ["benchmark_suite"]
  }
}
```

### 2. `deepseek_cot_audit`
Inspecciona una traza de pensamiento (Chain of Thought) para detectar alucinaciones lógicas, saltos inductivos no demostrados o bucles infinitos:

```json
{
  "name": "deepseek_cot_audit",
  "description": "Audits step-by-step reasoning traces for logical leaps, contradictory premises, or repetitive reasoning loops.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "reasoning_trace": { "type": "string", "description": "Raw thinking or reasoning block" },
      "expected_conclusion": { "type": "string", "description": "Verification anchor or invariant" }
    },
    "required": ["reasoning_trace"]
  }
}
```

---

## 🔒 Directivas de Eficiencia y Ejecución

* **Economía de Inferencia:** Optimización del ratio tokens razonados vs tokens emitidos.
* **Cero Alucinación de Herramientas:** Todo parámetro enviado a un plugin debe corresponder estrictamente con su JSON Schema.
