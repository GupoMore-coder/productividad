# 📋 TaskView Self-Hosted Project Management MCP Registry Spec

> **Source:** [Gimanh/taskview-community](https://github.com/Gimanh/taskview-community)  
> **License:** Open Source  
> **Domain:** Self-Hosted Project & Task Management Platform, Docker Native MCP Server, Kanban Boards, Custom Workflow Statuses, Git Commit & Milestone Synchronization, Team Velocity Metrics, Scoped API Tokens.

---

## 🎯 Visión Arquitectónica

TaskView proporciona una alternativa auto-hospedada, privada y transparente a los gestores de proyectos SaaS centralizados. Integra de forma nativa un servidor MCP en Docker que permite a los agentes de codificación consultar el backlog, crear tarjetas de trabajo, actualizar el progreso de sprints y vincular commits de Git sin salir del IDE:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Scrum Master                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Task Operations / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   TaskView Community Server                 │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Kanban Board Core     │       │ Native Docker MCP     │  │
│  │ (Backlog, WIP, Done)  │◄─────►│ Integration Server    │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Git Synchronization (GitLab, Gitea, GitHub Webhooks)  │  │
│  │ Scoped Auth Tokens, Real-Time WebSockets & Audit Logs │  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `taskview_manage_board_tasks`
Crea, actualiza o mueve tarjetas entre las columnas del tablero Kanban:

```json
{
  "name": "taskview_manage_board_tasks",
  "description": "Creates, updates, or shifts task items across board status columns.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "action": { "type": "string", "enum": ["create", "update", "move", "close"] },
      "board_id": { "type": "string" },
      "task_title": { "type": "string" },
      "description": { "type": "string" },
      "target_column": { "type": "string", "enum": ["backlog", "in_progress", "review", "completed"] },
      "priority": { "type": "string", "enum": ["low", "medium", "high", "urgent"], "default": "medium" }
    },
    "required": ["action", "board_id"]
  }
}
```

### 2. `taskview_sync_git_milestone`
Vincula un commit o pull request con una tarjeta de tarea específica:

```json
{
  "name": "taskview_sync_git_milestone",
  "description": "Links a git commit hash or branch name to a TaskView task, updating status annotations.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_id": { "type": "string" },
      "commit_hash": { "type": "string" },
      "branch_name": { "type": "string" },
      "comment": { "type": "string" }
    },
    "required": ["task_id", "commit_hash"]
  }
}
```

### 3. `taskview_query_sprint_velocity`
Obtiene las métricas de rendimiento, cuellos de botella y ciclo de desarrollo:

```json
{
  "name": "taskview_query_sprint_velocity",
  "description": "Retrieves sprint throughput, cycle time averages, and identifies blocked tasks.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "board_id": { "type": "string" },
      "include_blockers": { "type": "boolean", "default": true }
    },
    "required": ["board_id"]
  }
}
```

---

## 🏛️ Disciplina Operativa y Seguridad (Jassy & Kurtz)

1. **Frugalidad y Cero Fricción (Andy Jassy):** Control total de datos y costos de infraestructura eliminando tarifas mensuales por usuario en plataformas SaaS cerradas.
2. **Mitigación CVE y Autenticación Estricta:** Requerir siempre versiones parcheadas (>= 1.56.0) con autenticación estricta basada en tokens con alcances mínimos y rotación periódica.
