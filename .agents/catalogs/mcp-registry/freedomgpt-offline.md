# 🔒 FreedomGPT Offline Inference & Private AI Vault MCP Registry Spec

> **Source:** [ohmplatform/FreedomGPT](https://github.com/ohmplatform/FreedomGPT)  
> **Author:** Ohm Platform  
> **License:** MIT / Open Source  
> **Domain:** 100% Offline Local LLM Inference, Air-Gapped Privacy Architecture, Uncensored Open-Weight Execution, Zero Telemetry Data Vaults, Edge Hardware Acceleration (Vulkan, Metal, CUDA).

---

## 🎯 Visión Arquitectónica

**FreedomGPT** es un entorno de ejecución de modelos de lenguaje diseñado para la privacidad absoluta y la soberanía de datos. Permite ejecutar modelos de pesos abiertos (Llama, Mistral, Gemma, Phi) directamente en el hardware local (CPU/GPU) sin conexión a Internet, sin telemetría hacia servidores de terceros y sin filtros corporativos externos.

Dentro de Antigravity, FreedomGPT funciona como el motor de inferencia de respaldo para casos de uso estrictamente confidenciales (auditorías financieras internas, expedientes médicos, análisis de vulnerabilidades zero-day o propiedad intelectual sensible) donde ninguna llamada de API externa está autorizada:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Privacy Lead                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Air-Gapped Inference Request
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 FreedomGPT Local Core Engine                │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Local Weight Manager  │       │ Hardware Offload Bus  │  │
│  │ (GGUF / Safetensors)  ◄──────►│ (CUDA / Vulkan / CPU) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Zero-Telemetry Encryption Sandbox                     │  │
│  │ Encrypted Local Vault, Strict Air-Gap Socket          │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Private Synthesis
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Confidential Enterprise Artifacts              │
│            (100% Sovereign, Zero Data Leakage)              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `freedomgpt_load_model`
Carga pesos de modelo cuantitizados locales (GGUF, safetensors) en memoria VRAM/RAM configurando capas de descarga de hardware:

```json
{
  "name": "freedomgpt_load_model",
  "description": "Loads a local open-weight model into memory using specified GPU/CPU layer allocation.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "model_path": { "type": "string", "description": "Absolute path to local GGUF or model weights file." },
      "gpu_layers": { "type": "integer", "default": -1, "description": "-1 offloads all layers to GPU." },
      "context_window": { "type": "integer", "default": 8192 }
    },
    "required": ["model_path"]
  }
}
```

### 2. `freedomgpt_generate_offline`
Ejecuta inferencia de texto estrictamente local garantizando cero llamadas de red y sin filtración de contexto:

```json
{
  "name": "freedomgpt_generate_offline",
  "description": "Generates text completions locally via offline model execution with guaranteed zero cloud egress.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "prompt": { "type": "string" },
      "max_tokens": { "type": "integer", "default": 1024 },
      "temperature": { "type": "number", "default": 0.7 },
      "stop_sequences": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["prompt"]
  }
}
```

### 3. `freedomgpt_inspect_runtime`
Consulta la telemetría de hardware local (uso de VRAM, RAM, velocidad en tokens/segundo y estado térmico):

```json
{
  "name": "freedomgpt_inspect_runtime",
  "description": "Inspects local inference runtime performance, memory consumption, and hardware offload metrics.",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

### 4. `freedomgpt_manage_vault`
Indexa y consulta documentos locales cifrados en una bóveda air-gapped para preguntas y respuestas privadas:

```json
{
  "name": "freedomgpt_manage_vault",
  "description": "Manages an encrypted local document vault for completely offline document analysis.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "vault_path": { "type": "string" },
      "action": { "type": "string", "enum": ["index", "query", "status"] },
      "query_text": { "type": "string" }
    },
    "required": ["vault_path", "action"]
  }
}
```

---

## 🏛️ Doctrina del Consejo Asesor Global

* **Joe Ucuzoglu (Deloitte):** *Gobernanza Innegociable y Cumplimiento Regulatorio*. En sectores regulados (auditoría, salud, banca central), procesar información clasificada a través de APIs de nubes públicas acarrea riesgos legales y fiduciarios extremos. La capacidad de inferencia local 100% aislada es un requisito soberano.
* **Kristalina Georgieva (FMI):** *Resiliencia Institucional en Desconexión*. Las organizaciones deben ser capaces de operar y analizar datos críticos aun en escenarios de desconexión de red o restricciones geopolíticas.
