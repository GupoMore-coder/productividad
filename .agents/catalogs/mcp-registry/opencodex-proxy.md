# 🔄 OpenCodex Universal LLM Provider Proxy MCP Registry Spec

> **Source:** [lidge-jun/opencodex](https://github.com/lidge-jun/opencodex)  
> **License:** MIT / Open Source  
> **Domain:** Universal Provider Proxy for AI Coding Assistants (Codex CLI, Claude Code), Multi-Provider Account Pooling, Quota-Aware Load Balancing, Session Affinity, Seamless Translation between OpenAI/Anthropic/DeepSeek/Ollama Schemas.

---

## 🎯 Visión Arquitectónica

OpenCodex actúa como una pasarela y proxy universal que permite a herramientas CLI y entornos de desarrollo conectarse indistintamente a múltiples proveedores de modelos de lenguaje (Claude, Gemini, Grok, DeepSeek, Ollama) simulando endpoints estándar de OpenAI o Anthropic. Gestiona pools de cuentas con distribución consciente de cuotas y afinidad de sesión:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Coding Agent                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ OpenAI / Claude API Emulation
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      OpenCodex Gateway                      │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Provider Pool Manager │       │ Protocol Translator   │  │
│  │ (Quota-Aware Routing) │◄─────►│ (OpenAI ◄► Anthropic) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Providers: DeepSeek, Gemini, Claude, Grok, Local vLLM │  │
│  │ Session Affinity Store (Preserves Long Task Context)  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `opencodex_route_query`
Enruta una llamada de inferencia al proveedor disponible óptimo respetando afinidad y cuotas restantes:

```json
{
  "name": "opencodex_route_query",
  "description": "Routes an LLM inference call through the OpenCodex proxy pool, selecting the best available account and translating message formats.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "model_alias": { "type": "string", "description": "Logical model name (e.g. 'code-fast', 'code-reasoning')." },
      "messages": { "type": "array", "items": { "type": "object" } },
      "session_key": { "type": "string", "description": "Session identifier for sticky routing." }
    },
    "required": ["model_alias", "messages"]
  }
}
```

### 2. `opencodex_get_pool_health`
Consulta las cuotas activas, latencias medias y balance de cuentas en el pool configurado:

```json
{
  "name": "opencodex_get_pool_health",
  "description": "Returns status, quota exhaustion indicators, and active account distribution across configured providers.",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

---

## 🏛️ Gobernanza y Continuidad Operativa

1. **Alta Disponibilidad sin Interrupciones (Andy Jassy / Jeff Dean):** El proxy debe conmutar automáticamente (*failover*) a un proveedor alternativo en caso de errores 429 (rate-limit) o caídas temporales del proveedor primario.
2. **Cero Fuga de Credenciales (George Kurtz):** Las llaves de API de cada cuenta del pool se gestionan en un almacén seguro local cifrado.
