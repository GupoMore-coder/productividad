# 🏢 Paperclip MCP Registry & Workplace Agent Orchestration Spec

> **Source:** [paperclipai/paperclip](https://github.com/paperclipai/paperclip)  
> **License:** Apache-2.0  
> **Domain:** Enterprise Agent Management, Multi-Agent Swarm Orchestration, Budget/Token Cap Enforcement, Audit Trails, Human-in-the-Loop Governance.

---

## 🎯 Visión Arquitectónica

Paperclip provee el plano de control para coordinar y supervisar agentes de inteligencia artificial en entornos corporativos de producción. Impone gobernanza institucional (Andy Jassy / Joe Ucuzoglu standard) para evitar costos descontrolados, bucles infinitos de ejecución o acciones no autorizadas:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Architect                │
└──────────────────────────────┬──────────────────────────────┘
                               │ Control Plane RPC
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Paperclip Orchestrator                     │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Budget & Token Limiter│       │ Human-in-the-Loop     │  │
│  │ Hard Cap Enforcement  │       │ Escalation Gate       │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Agent Fleet Registry: Roles, Skills, Active Tasks     │  │
│  │ Telemetry Ledger: Execution Audits & Compliance Logs  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │ Delegated Workloads
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Specialized Agent Workers                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `paperclip_dispatch_task`
Despacha una tarea a un agente específico asignando un presupuesto estricto de tokens y tiempo:

```json
{
  "name": "paperclip_dispatch_task",
  "description": "Dispatches an enterprise task to a specialized agent worker with hard token limits, execution timeout, and audit metadata.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "agent_role": { "type": "string", "description": "Target agent identifier (e.g. backend-architect, medical-classifier)" },
      "task_prompt": { "type": "string", "description": "Clear instructions and acceptance criteria" },
      "max_token_budget": { "type": "integer", "default": 20000 },
      "timeout_seconds": { "type": "integer", "default": 300 }
    },
    "required": ["agent_role", "task_prompt"]
  }
}
```

### 2. `paperclip_telemetry_audit`
Consulta el historial de consumo, tasas de error y eventos de seguridad de la flota de agentes:

```json
{
  "name": "paperclip_telemetry_audit",
  "description": "Retrieves comprehensive execution metrics, token expenditures, and anomaly flags across all active agent sessions.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "time_window_hours": { "type": "integer", "default": 24 },
      "filter_by_role": { "type": "string" }
    }
  }
}
```

### 3. `paperclip_approval_gate`
Bloquea la ejecución y solicita confirmación humana ante operaciones irreversibles (Tipo 1):

```json
{
  "name": "paperclip_approval_gate",
  "description": "Halts agent execution and registers a pending human approval request before modifying production schemas, running deletions, or issuing financial transfers.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "action_type": { "type": "string", "enum": ["schema_change", "bulk_delete", "production_deploy", "credential_update"] },
      "justification": { "type": "string" },
      "proposed_payload": { "type": "string" }
    },
    "required": ["action_type", "justification"]
  }
}
```

---

## 🔒 Gobernanza y Principios Fiduciarios

1. **Límites Presupuestarios Duros:** Ningún agente puede exceder su cuota de tokens asignada sin escalamiento y autorización explícita.
2. **Separación de Funciones:** El agente ejecutor nunca aprueba sus propias solicitudes de despliegue o cambio de esquema.
3. **Pistas de Auditoría Inmutables:** Todos los comandos y respuestas se registran con firma de tiempo criptográfica.
