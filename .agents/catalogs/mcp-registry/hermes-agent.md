# 🏛️ Hermes Agent MCP Registry & Omnichannel Architecture Spec

> **Source:** [NousResearch/hermes-agent](https://github.com/nousresearch/hermes-agent) | [Hermes Agent Web](https://hermes-agent.nousresearch.com/)  
> **License:** MIT (Open Source, Self-Hosted)  
> **Domain:** Omnichannel Messaging Gateway, Persistent Dialectic Memory (Honcho), Subagent Delegation, Sandboxed Execution, Autonomous Skill Synthesis.

---

## 🎯 Visión Arquitectónica

Hermes Agent es un entorno de agentes autónomos diseñado por Nous Research para operar de forma desatendida y persistente a través de múltiples canales de mensajería y entornos de ejecución aislados:

```
┌─────────────────────────────────────────────────────────────┐
│                 Omnichannel Messaging Gateway               │
│  Telegram · WhatsApp · Discord · Slack · Signal · CLI · Mail│
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Hermes Agent Core                      │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │   Persistent Memory   │       │ Autonomous Skill      │  │
│  │  (Honcho Integration) │       │ Synthesis Engine      │  │
│  │  Dialectic Cognition  │       │ (Learns from success) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Subagent Delegation: Isolated subprocesses & RPC     │  │
│  │ Sandboxed Execution: Local, Docker, SSH, Modal       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `hermes_delegate_subagent`
Lanza un subagente con su propio hilo conversacional, sandbox de ejecución y terminal dedicada, evitando el desbordamiento de contexto del agente principal:

```json
{
  "name": "hermes_delegate_subagent",
  "description": "Delegates a complex, compute-heavy, or long-running task to an isolated subagent with its own context window and execution sandbox.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_name": { "type": "string", "description": "Short identifier for the task" },
      "task_prompt": { "type": "string", "description": "Complete instructions and acceptance criteria for the subagent" },
      "sandbox_type": { "type": "string", "enum": ["local", "docker", "ssh", "modal"], "default": "local" },
      "timeout_seconds": { "type": "integer", "default": 300 }
    },
    "required": ["task_name", "task_prompt"]
  }
}
```

### 2. `hermes_skill_synthesize`
Analiza una interacción o solución técnica exitosa y destila automáticamente una habilidad reutilizable bajo el estándar `SKILL.md`:

```json
{
  "name": "hermes_skill_synthesize",
  "description": "Analyzes successful execution trajectories, bug fixes, or integration workflows and generates a standard on-demand SKILL.md asset.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "skill_name": { "type": "string", "description": "Kebab-case name of the skill" },
      "trigger_domains": { "type": "array", "items": { "type": "string" }, "description": "Keywords and domains that activate this skill" },
      "pattern_description": { "type": "string", "description": "Problem solved, architectural pattern, and verification checklist" },
      "code_examples": { "type": "string", "description": "Reference implementations and snippets" }
    },
    "required": ["skill_name", "trigger_domains", "pattern_description"]
  }
}
```

### 3. `hermes_gateway_dispatch`
Enruta mensajes, alertas financieras o reportes de estado hacia canales de mensajería externos de forma segura:

```json
{
  "name": "hermes_gateway_dispatch",
  "description": "Dispatches notifications, briefings, or conversational replies across supported messaging gateways (Telegram, WhatsApp, Slack, Discord).",
  "inputSchema": {
    "type": "object",
    "properties": {
      "channel": { "type": "string", "enum": ["telegram", "whatsapp", "slack", "discord", "signal", "email"] },
      "recipient_id": { "type": "string", "description": "User or group target identifier" },
      "message": { "type": "string", "description": "Formatted markdown or plain-text payload" },
      "priority": { "type": "string", "enum": ["low", "normal", "urgent"], "default": "normal" }
    },
    "required": ["channel", "recipient_id", "message"]
  }
}
```

### 4. `hermes_honcho_memory_sync`
Sincroniza hechos clave, preferencias operativas y modelos cognitivos del usuario en memoria dialéctica a largo plazo:

```json
{
  "name": "hermes_honcho_memory_sync",
  "description": "Stores user preferences, cognitive profiles, and project decision records into long-term dialectic memory via Honcho protocol.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "topic_key": { "type": "string", "description": "Namespace or entity identifier (e.g. more_paper_pricing, dev_preferences)" },
      "insight": { "type": "string", "description": "Extracted rule, preference, or historical context" },
      "confidence": { "type": "number", "minimum": 0.0, "maximum": 1.0, "default": 0.9 }
    },
    "required": ["topic_key", "insight"]
  }
}
```

---

## 🔒 Directivas de Seguridad y Blindaje

1. **Principio de Menor Privilegio en Subagentes:** Los subagentes delegados no heredan permisos para modificar archivos de configuración del sistema (`GEMINI.md`, `mcp_config.json`) ni claves de API globales.
2. **Validación Criptográfica de Webhooks:** Toda pasarela de mensajería entrante (WhatsApp, Slack, Telegram) debe validar las firmas HMAC o tokens secretos antes de procesar el payload.
3. **Aislamiento de Entornos:** Las ejecuciones en sandbox (Docker/SSH) deben montar volúmenes en modo de solo lectura para bibliotecas compartidas del sistema.
