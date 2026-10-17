# 🚢 Osmantic Deployment System (ODS) Private AI MCP Registry Spec

> **Source:** [Osmantic/ODS](https://github.com/Osmantic/ODS) (formerly DreamServer)  
> **License:** Apache-2.0 / Open Source  
> **Domain:** Turnkey Private AI Server Stack via Docker, Local Inference (llama-server, LiteLLM), Private Web UI (Open WebUI), Private RAG & Search (Qdrant, SearXNG, Perplexica), Local Voice & Creative (Whisper, Kokoro, ComfyUI), Hardware Detection & GPU Monitoring.

---

## 🎯 Visión Arquitectónica

ODS automatiza la conversión de cualquier estación de trabajo o servidor local en una nube de IA privada, soberana y completa con un solo comando. Gestiona la orquestación en Docker de todos los servicios necesarios (inferencia de modelos abiertos, RAG documental, búsqueda web privada, síntesis y transcripción de voz) eliminando costes recurrentes y garantizando privacidad absoluta de datos:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / DevOps SRE                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Private Stack Control / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Osmantic Deployment System                 │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ LiteLLM Proxy / llama │       │ Open WebUI & RAG Core │  │
│  │ (Hardware GPU Detect) │◄─────►│ (Qdrant, SearXNG)     │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Local Multimedia Microservices:                       │  │
│  │  - Whisper (STT)       - Kokoro (TTS)                 │  │
│  │  - ComfyUI (Generative)- Privacy Metrics Dashboard    │  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `ods_inspect_services_status`
Supervisa el estado de salud, uso de VRAM de GPU y latencia de los microservicios locales:

```json
{
  "name": "ods_inspect_services_status",
  "description": "Inspects operational health, container state, and GPU memory consumption across private AI services.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "include_metrics": { "type": "boolean", "default": true }
    }
  }
}
```

### 2. `ods_deploy_private_stack`
Despliega o actualiza la infraestructura privada de contenedores según el perfil de hardware:

```json
{
  "name": "ods_deploy_private_stack",
  "description": "Configures and deploys private AI services using Docker Compose with detected GPU acceleration.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "profile": { "type": "string", "enum": ["minimal_inference", "full_rag_stack", "multimedia_complete"], "default": "full_rag_stack" },
      "gpu_acceleration": { "type": "string", "enum": ["cuda", "rocm", "metal", "cpu"], "default": "cuda" }
    },
    "required": ["profile"]
  }
}
```

### 3. `ods_configure_inference_routing`
Configura los puntos de enlace locales de LiteLLM para enrutar peticiones de agentes hacia modelos locales:

```json
{
  "name": "ods_configure_inference_routing",
  "description": "Maps local model weights and open-source models to standardized OpenAI-compatible LiteLLM endpoints.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "model_name": { "type": "string" },
      "quantization": { "type": "string", "default": "Q4_K_M" },
      "context_window": { "type": "integer", "default": 32768 }
    },
    "required": ["model_name"]
  }
}
```

---

## 🏛️ Soberanía de Datos y Frugalidad (Kurtz & Jassy)

1. **Soberanía y Aislamiento de Red (George Kurtz):** Cero fuga de datos hacia nubes públicas; todo el procesamiento de datos sensibles y RAG permanece en el perímetro controlado.
2. **Cero Suscripciones Recurrentes (Andy Jassy):** Eliminación total de costes de API por token para tareas repetitivas o de procesamiento intensivo de datos.
