# 🎯 Kaneo Project Management MCP Registry Spec

> **Source:** [usekaneo/kaneo](https://github.com/usekaneo/kaneo)  
> **License:** AGPL-3.0 / Open Source  
> **Domain:** Lean Project Management, Developer-Centric Issue Tracking, Sprint Burndown, Milestone Management, Zero-Bloat Agility.

---

## 🎯 Visión Arquitectónica

Kaneo proporciona un sistema de gestión de tareas e incidencias diseñado con la filosofía *"All you need. Nothing you don't"*. Elimina la burocracia de suites corporativas pesadas (Jira/ClickUp) y permite a agentes y desarrolladores gestionar el ciclo de vida del software con mínima fricción:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Developer                │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST / JSON-RPC
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Kaneo Engine Core                       │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Task & Issue Tracker  │       │ Milestone & Sprint    │  │
│  │ (Kanban / Backlog)    │       │ Progress Ledger       │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Dependency Mapping: Blockers, Epics & Child Tasks    │  │
│  │ Fast Triage API: Status Bumps, Labels, Assignees      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `kaneo_create_task`
Registra una nueva tarea, bug o historia técnica en el backlog del proyecto:

```json
{
  "name": "kaneo_create_task",
  "description": "Creates a structured engineering task in Kaneo with title, acceptance criteria, priority, and epic association.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "title": { "type": "string" },
      "description": { "type": "string", "description": "Markdown formatted requirements and testing criteria" },
      "priority": { "type": "string", "enum": ["low", "medium", "high", "urgent"], "default": "medium" },
      "epic_id": { "type": "string" }
    },
    "required": ["title", "description"]
  }
}
```

### 2. `kaneo_sprint_status`
Consulta el estado de avance, tareas bloqueadas y porcentaje de cumplimiento del sprint activo:

```json
{
  "name": "kaneo_sprint_status",
  "description": "Retrieves the current sprint metrics: total tasks, completed, in-progress, and identified blocking dependencies.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "project_slug": { "type": "string", "default": "antigravity-core" }
    }
  }
}
```

### 3. `kaneo_update_task_status`
Avanza el estado de una tarea tras la verificación exitosa de pruebas:

```json
{
  "name": "kaneo_update_task_status",
  "description": "Transitions a task through the workflow: backlog -> todo -> in_progress -> in_review -> done.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_id": { "type": "string" },
      "new_status": { "type": "string", "enum": ["backlog", "todo", "in_progress", "in_review", "done"] },
      "resolution_note": { "type": "string" }
    },
    "required": ["task_id", "new_status"]
  }
}
```

---

## 🔒 Filosofía de Desarrollo Ágil Radical

* **Cero Tareas Huérfanas:** Toda tarea debe tener criterios de aceptación verificables antes de marcarse como `done`.
* **Visibilidad en Tiempo Real:** El estado de avance se actualiza inmediatamente al completar cada bloque de código.
