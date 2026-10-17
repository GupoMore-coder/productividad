# 🦉 Coucou Ambient Agent Monitor MCP Registry Spec

> **Source:** [Louis-CFM/coucou](https://github.com/Louis-CFM/coucou)  
> **License:** MIT / Open Source  
> **Domain:** Ambient Desktop & Mobile Status Monitor for AI Coding Agents, Screen Edge & Notch Presence, Human-in-the-Loop Permission Approvals without Window Switching, Zero-Telemetry Local Keychain Security, Cross-Device Companion (macOS, Windows, iOS Dynamic Island).

---

## 🎯 Visión Arquitectónica

Coucou es un monitor ambiental de telemetría y presencia para asistentes de codificación (Claude Code, Gemini CLI, Antigravity, Cursor). Elimina la constante necesidad de alternar ventanas (*Alt+Tab fatigue*) para ver qué comando está ejecutando el agente o si está esperando una aprobación de permisos. Presenta un indicador visual sutil en el borde de la pantalla o *notch*, permitiendo aprobar o rechazar acciones críticas con un solo toque desde el escritorio o el móvil:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Coding Agent                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Ambient Telemetry / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       Coucou Monitor                        │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Ambient Status Widget │       │ Out-of-Window Gate    │  │
│  │ (Screen Notch / Tray) │◄─────►│ (Approve / Deny Box)  │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Local Socket Bridge (Zero Telemetry, Keychain Storage)│  │
│  │ Mobile Push Companion (iOS Lock Screen / Island)      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `coucou_emit_status`
Emite el estado actual de la sesión agéntica para visualización ambiental sutil (pensando, editando, corriendo pruebas, inactivo):

```json
{
  "name": "coucou_emit_status",
  "description": "Updates the ambient desktop monitor widget with the current agent activity status (idle, thinking, editing, testing, awaiting_approval).",
  "inputSchema": {
    "type": "object",
    "properties": {
      "status": { "type": "string", "enum": ["idle", "thinking", "editing", "testing", "awaiting_approval", "error", "done"] },
      "detail": { "type": "string", "description": "Short 1-line description of the active step." },
      "progress_percent": { "type": "number", "default": 0 }
    },
    "required": ["status", "detail"]
  }
}
```

### 2. `coucou_request_approval`
Solicita autorización humana interactiva fuera de la ventana para una acción de alto impacto (ej. comando bash destructivo o commit):

```json
{
  "name": "coucou_request_approval",
  "description": "Displays a high-priority ambient permission prompt on the user's screen notch or mobile companion to approve or deny an operation.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "action_type": { "type": "string", "enum": ["command_exec", "file_delete", "git_push", "deploy"] },
      "command": { "type": "string" },
      "rationale": { "type": "string" },
      "timeout_seconds": { "type": "integer", "default": 60 }
    },
    "required": ["action_type", "command", "rationale"]
  }
}
```

---

## 🏛️ Gobernanza y Ergonomía Visual

1. **Ergonomía sin Distracciones (Mustafa Suleyman):** La presencia visual debe ser mínima y no intrusiva; solo llamar la atención activa cuando se requiera una decisión humana indispensable.
2. **Control Fiduciario y Verificación Humana (Joe Ucuzoglu / Janet Truncale):** Ningún comando con impacto en infraestructura de producción o modificación irreversible puede saltarse la compuerta de aprobación explícita.
