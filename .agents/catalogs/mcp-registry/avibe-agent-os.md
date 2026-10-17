# 🤖 Avibe Local-First Agent OS MCP Registry Spec

> **Source:** [avibe-bot/avibe](https://github.com/avibe-bot/avibe)  
> **License:** Apache-2.0 / MIT  
> **Domain:** Local-First Agent Operating System, Multi-Surface Interface (Desktop Workbench + Slack, Discord, Telegram, WeChat, Lark), Durable Workflow Harness (Stateful Long-Running Tasks & Watchers), Unified Agent CLI Runtime (Claude Code, OpenCode, Codex).

---

## 🎯 Visión Arquitectónica

Avibe es un sistema operativo agéntico local-first diseñado para alojar agentes de inteligencia artificial directamente en la máquina del usuario. Proporciona una interfaz unificada que permite interactuar con los agentes tanto desde un Workbench de escritorio como desde plataformas de mensajería empresarial (Slack, Discord, Telegram, WeChat), integrando un motor de persistencia (*Harness*) para tareas duraderas que sobreviven a reinicios de sesión:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Specialist               │
└──────────────────────────────┬──────────────────────────────┘
                               │ Avibe Agent OS Bridge / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        Avibe Core                           │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Multi-Surface Router  │       │ Durable Task Harness  │  │
│  │ (Workbench / Slack)   │◄─────►│ (File/CI Watchers)    │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Local State Store (SQLite & Session Journal)          │  │
│  │ Zero Cloud Egress: Keys and Code Remain on Machine    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `avibe_register_surface`
Vincula una nueva superficie de interacción (canal de Slack, bot de Telegram o ventana de escritorio) al bus de eventos de Avibe:

```json
{
  "name": "avibe_register_surface",
  "description": "Binds a messaging or desktop communication surface to Avibe, allowing users to interact with local agents from chat channels.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "surface_type": { "type": "string", "enum": ["slack", "discord", "telegram", "wechat", "workbench"] },
      "channel_id": { "type": "string" },
      "authorized_users": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["surface_type", "channel_id"]
  }
}
```

### 2. `avibe_start_durable_harness`
Inicia un workflow en segundo plano con persistencia de estado duradera (por ejemplo, monitor de tests o vigía de buzones):

```json
{
  "name": "avibe_start_durable_harness",
  "description": "Registers a persistent, durable background workflow that monitors files, processes events, and maintains execution state across restarts.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "workflow_name": { "type": "string" },
      "trigger_event": { "type": "string", "enum": ["file_changed", "interval", "webhook", "ci_status"] },
      "command": { "type": "string" }
    },
    "required": ["workflow_name", "trigger_event", "command"]
  }
}
```

### 3. `avibe_get_os_state`
Consulta el estado de salud, procesos activos y recursos consumidos por el sistema operativo agéntico local:

```json
{
  "name": "avibe_get_os_state",
  "description": "Returns active durable harnesses, connected messaging surfaces, memory utilization, and uptime telemetry.",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

---

## 🏛️ Gobernanza y Soberanía Local

1. **Soberanía Absoluta de Datos (Jay Chaudhry / Andy Yen):** Todas las llaves de API, código fuente y bitácoras de conversación permanecen cifradas en la máquina local; cero telemetría externa forzada.
2. **Resiliencia de Procesos (Andy Jassy):** Las tareas del *Harness* deben ejecutarse con cuotas fijas de CPU y memoria para evitar congelar el sistema anfitrión.
