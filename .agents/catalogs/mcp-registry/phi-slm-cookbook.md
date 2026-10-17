# 🔬 Microsoft Phi SLM Edge Deployment & Inference MCP Spec

> **Source:** [microsoft/PhiCookBook](https://github.com/microsoft/PhiCookBook)  
> **License:** MIT / Open Source  
> **Domain:** Small Language Models (SLMs) Engineering, Phi-3 / Phi-4 / Phi-4-multimodal (Text, Vision, Audio), ONNX Runtime GenAI & Microsoft Olive Optimization, Fine-Tuning Recipes, Function Calling on Edge Devices.

---

## 🎯 Visión Arquitectónica

PhiCookBook es el compendio oficial de ingeniería de Microsoft para la implementación y optimización de Modelos de Lenguaje Pequeños (SLMs). Demuestra cómo modelos compactos (Phi-3 Mini/Medium, Phi-4) pueden alcanzar capacidades competitivas de razonamiento matemático, estructuración JSON y llamadas a funciones ejecutándose localmente en CPUs y GPUs comerciales mediante **ONNX Runtime GenAI**:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Architect                │
└──────────────────────────────┬──────────────────────────────┘
                               │ ONNX GenAI Runtime / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Phi Runtime Core                       │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Model Quantization    │       │ ONNX GenAI Engine     │  │
│  │ (INT4 / FP16 Olive)   │◄─────►│ (CPU, DirectML, CUDA) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Local Tool Calling: Strict JSON Schema Extraction     │  │
│  │ Multimodal Ingest: Audio/Vision Frame Processing      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `phi_run_local_inference`
Ejecuta inferencia local con un modelo Phi cuantizado (Phi-3 o Phi-4) para clasificación rápida o extracción de entidades:

```json
{
  "name": "phi_run_local_inference",
  "description": "Runs local offline inference on edge hardware using an ONNX GenAI optimized Phi SLM model.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "prompt": { "type": "string" },
      "model_type": { "type": "string", "enum": ["phi-3-mini-4k-int4", "phi-4-mini", "phi-4-multimodal"], "default": "phi-3-mini-4k-int4" },
      "temperature": { "type": "number", "default": 0.2 },
      "max_tokens": { "type": "integer", "default": 512 }
    },
    "required": ["prompt"]
  }
}
```

### 2. `phi_function_call_extract`
Fuerza al modelo pequeño local a resolver una llamada estructurada a herramientas en formato JSON estricto:

```json
{
  "name": "phi_function_call_extract",
  "description": "Uses local Phi function calling to map unstructured text into structured JSON matching a predefined tool schema.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "text": { "type": "string" },
      "tool_schema": { "type": "object" }
    },
    "required": ["text", "tool_schema"]
  }
}
```

---

## 🏛️ Gobernanza y Eficiencia en el Borde

1. **Inferencia Local de Costo Cero (Andy Jassy / Satya Nadella):** Tareas rutinarias de clasificación o formateo deben resolverse con SLMs locales antes de recurrir a modelos frontera de alto costo.
2. **Eficiencia Energética y de Silicio (Lisa Su / Jensen Huang):** Aprovechar la aceleración por hardware (ONNX DirectML en Windows / CUDA) para mantener la latencia por debajo de 50 ms por token.
