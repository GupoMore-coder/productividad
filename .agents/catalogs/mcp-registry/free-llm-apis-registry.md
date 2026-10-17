# ⚡ Free LLM APIs Registry & Zero-Cost Model Router MCP Registry Spec

> **Source:** [mnfst/awesome-free-llm-apis](https://github.com/mnfst/awesome-free-llm-apis)  
> **Maintainer:** Manifest Community  
> **License:** MIT / Open Source  
> **Domain:** Permanent Free-Tier LLM APIs, Zero-Cost Inference Quota Orchestration, OpenAI-Compatible Fallback Pools, Rate-Limit Auditing (RPM/RPD), Multi-Provider Failover Routing.

---

## 🎯 Visión Arquitectónica

**awesome-free-llm-apis** cataloga exhaustivamente los proveedores de modelos de lenguaje con **niveles gratuitos permanentes** (sin tarjetas de crédito requeridas ni períodos de prueba efímeros que expiran tras pocos días). En la arquitectura de Antigravity, este activo alimenta el enrutador multi-modelo de bajo coste, permitiendo desviar tareas auxiliares (clasificación de intents, summarization ligera, generación de tags, tests unitarios) hacia cuotas gratuitas permanentes de alto rendimiento (Groq, Cerebras, Google Gemini Free, Mistral Free, Cloudflare Workers AI, OpenRouter Free):

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Architect                │
└──────────────────────────────┬──────────────────────────────┘
                               │ Task Complexity & Tier Selection
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Free-Tier LLM Router & Registry Engine          │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Provider Quota Ledger │       │ Model Latency & RPM   │  │
│  │ (Gemini, Groq, Cereb) ◄──────►│ Benchmark Tracker     │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ OpenAI-Compatible Base URL & Key Failover Pool        │  │
│  │ Automatic Fallback on HTTP 429 (Rate Limit Breaches)  │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Zero-Cost Text Inference
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             High-Throughput Agentic Task Pipelines          │
│          (Zero Marginal Token Cost, Maximized Margin)       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `free_llm_list_providers`
Lista los proveedores activos con niveles gratuitos permanentes filtrados por arquitectura de modelo, soporte de contexto y proveedor oficial vs hoster:

```json
{
  "name": "free_llm_list_providers",
  "description": "Lists verified permanent free-tier LLM providers, available open-weight models, and sign-up requirements.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "provider_type": { "type": "string", "enum": ["official_creator", "inference_hoster", "all"], "default": "all" },
      "min_context_window": { "type": "integer", "default": 8192 }
    }
  }
}
```

### 2. `free_llm_inspect_quotas_rpm`
Inspecciona las cuotas de tasa asignadas por proveedor (solicitudes por minuto RPM, solicitudes por día RPD y tokens por minuto TPM):

```json
{
  "name": "free_llm_inspect_quotas_rpm",
  "description": "Queries RPM, RPD, and TPM rate limits for a specific free-tier LLM provider (e.g. Groq, Cerebras, Gemini, Cloudflare).",
  "inputSchema": {
    "type": "object",
    "properties": {
      "provider_name": { "type": "string", "enum": ["gemini_free", "groq", "cerebras", "mistral_free", "openrouter_free", "cloudflare_workers_ai", "nvidia_nim"] }
    },
    "required": ["provider_name"]
  }
}
```

### 3. `free_llm_generate_openai_endpoint_config`
Genera la configuración del cliente compatible con el SDK de OpenAI (`baseURL`, `apiKey` env var, `defaultHeaders`) para un proveedor gratuito seleccionado:

```json
{
  "name": "free_llm_generate_openai_endpoint_config",
  "description": "Outputs standard OpenAI SDK client initialization code targeting the chosen free provider endpoint.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "provider_name": { "type": "string" },
      "model_identifier": { "type": "string" },
      "language": { "type": "string", "enum": ["typescript", "python"], "default": "typescript" }
    },
    "required": ["provider_name", "model_identifier"]
  }
}
```

### 4. `free_llm_route_optimal_free_tier`
Evalúa una tarea pendiente y selecciona el proveedor gratuito óptimo combinando velocidad de respuesta (e.g. Cerebras/Groq para baja latencia) o tamaño de contexto (e.g. Gemini Free para 1M+ tokens):

```json
{
  "name": "free_llm_route_optimal_free_tier",
  "description": "Determines the optimal free provider and model based on prompt token count, latency requirements, and remaining daily quota.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_type": { "type": "string", "enum": ["code_generation", "classification", "summarization", "json_extraction"] },
      "estimated_tokens": { "type": "integer" }
    },
    "required": ["task_type", "estimated_tokens"]
  }
}
```

---

## 🏛️ Doctrina del Consejo Asesor Global

* **Warren Buffett (Berkshire Hathaway):** *Margen de Seguridad y Arbitraje de Costes Operativos*. Todo token ahorrado en tareas rutinarias es beneficio neto directo retenido por la empresa. Arbitrar las cuotas gratuitas permanentes de múltiples proveedores antes de incurrir en gasto variable pago es disciplina financiera elemental.
* **Jamie Dimon (JPMorgan Chase):** *Diversificación de Contrapartes y Mitigación de Concentración*. Ninguna operación crítica debe depender de un único proveedor de IA. Disponer de un pool de proveedores compatibles con el SDK estándar garantiza resiliencia total y conmutación transparente en caso de incidentes o saturación.
