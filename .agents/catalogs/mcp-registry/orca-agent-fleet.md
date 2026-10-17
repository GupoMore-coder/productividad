# 🐋 Orca Agent Fleet Development Environment (ADE) MCP Spec

> **Source:** [stablyai/orca](https://github.com/stablyai/orca)  
> **License:** MIT / Open Source  
> **Domain:** Agent Development Environment (ADE), Multi-Agent Fleet Orchestration, Strict Worktree Git Isolation (Zero Merge Collision), Multi-Runtime Supervision (Desktop/Mobile/SSH), Linear/GitHub Issue Synchronization.

---

## 🎯 Visión Arquitectónica

Orca es un entorno de desarrollo para agentes (ADE) diseñado para coordinar flotas de asistentes de codificación trabajando en paralelo sobre el mismo repositorio. En lugar de permitir que múltiples agentes sobreescriban archivos en el mismo directorio de trabajo, Orca crea de forma determinística **Git Worktrees** independientes para cada tarea, permitiendo a los desarrolladores supervisar agentes simultáneos sin colisiones de ramas ni corrupción de código:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Fleet Commander               │
└──────────────────────────────┬──────────────────────────────┘
                               │ ADE Fleet Coordinator / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       Orca ADE Core                         │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Fleet Manager         │       │ Git Worktree Matrix   │  │
│  │ (Agent Tasks / Queue) │◄─────►│ (wt-auth, wt-billing) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Multi-Runtime Monitors: Desktop, Mobile Companion, SSH│  │
│  │ Automated Git Rebase & Non-Conflicting PR Synthesis   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `orca_spawn_worktree_agent`
Lanza un agente autónomo sobre un `git worktree` aislado dedicado a un issue o feature específico:

```json
{
  "name": "orca_spawn_worktree_agent",
  "description": "Initializes a separate git worktree directory for a designated task, launching an isolated AI agent session without branch contention.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_title": { "type": "string" },
      "branch_name": { "type": "string" },
      "issue_id": { "type": "string" },
      "instruction": { "type": "string" }
    },
    "required": ["task_title", "branch_name", "instruction"]
  }
}
```

### 2. `orca_list_fleet_status`
Lista el estado en vivo de todos los agentes y worktrees en ejecución:

```json
{
  "name": "orca_list_fleet_status",
  "description": "Returns active worktrees, agent execution states (running, paused, completed, failed), diff summaries, and test pass/fail metrics.",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

### 3. `orca_merge_completed_worktree`
Ejecuta la validación final, corre las pruebas y fusiona la rama del worktree en la rama principal:

```json
{
  "name": "orca_merge_completed_worktree",
  "description": "Validates that all tests in the worktree pass, closes the worktree session, and merges the task branch cleanly into main/develop.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "branch_name": { "type": "string" },
      "target_branch": { "type": "string", "default": "main" }
    },
    "required": ["branch_name"]
  }
}
```

---

## 🏛️ Gobernanza y Eficiencia de Flota

1. **Aislamiento Frugal y Cero Colisiones (Jeff Dean / Andy Jassy):** Ningún agente puede modificar archivos en la rama principal sin pasar por un worktree aislado y validación limpia de pruebas automáticas.
2. **Supervisión Continua de Recursos (Larry Fink):** Cada worktree debe limitar su consumo de CPU y memoria, limpiando temporales al finalizar la tarea.
