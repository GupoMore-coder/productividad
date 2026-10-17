# ⚡ LazyCodex Agent Harness & TDD Orchestrator MCP Registry Spec

> **Source:** [code-yeongyu/lazycodex](https://github.com/code-yeongyu/lazycodex)  
> **Author:** Yeongyu Code (Sisyphus Labs / OmO Project)  
> **License:** MIT / Open Source  
> **Domain:** Autonomous Coding Agent Harness, Test-Driven Agent Orchestration, Interactive Planning Verification Gates, Persistent Execution Ledger, AST Syntax Guards, State Checkpointing & Rollback Safety.

---

## 🎯 Visión Arquitectónica

**LazyCodex** es un arnés de ingeniería para agentes de codificación autónomos diseñado para resolver el problema de la deriva no determinista ("agent hallucination & runaway execution"). En lugar de permitir que los agentes modifiquen archivos de manera descontrolada, LazyCodex impone un ciclo cerrado de retroalimentación gobernado por pruebas automatizadas (TDD) y validación de árboles de sintaxis abstracta (AST):

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Architect                │
└──────────────────────────────┬──────────────────────────────┘
                               │ Structured Task Execution
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   LazyCodex Agent Harness                   │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Interactive Planning  │       │ AST Syntax Guard      │  │
│  │ Gate (Validation)     ◄──────►│ (Pre-commit Linters)  │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Autonomous TDD Execution Loop: Red ──► Green ──► Clean │  │
│  │ Persistent Ledger, State Snapshot & Auto-Rollback     │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Safe, Verified Code Commits
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Target Production Codebase                    │
│             (Zero Regressions, 100% Green Tests)            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `lazycodex_plan_verify`
Valida un plan de implementación contra las restricciones arquitectónicas del proyecto, dependencias y reglas de seguridad antes de autorizar la escritura de código:

```json
{
  "name": "lazycodex_plan_verify",
  "description": "Verifies that an agent's implementation plan contains required validation steps, test assertions, and risk mitigations.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "plan_content": { "type": "string", "description": "Markdown implementation plan." },
      "target_modules": { "type": "array", "items": { "type": "string" } },
      "strict_tdd_required": { "type": "boolean", "default": true }
    },
    "required": ["plan_content", "target_modules"]
  }
}
```

### 2. `lazycodex_run_test_loop`
Ejecuta el ciclo de desarrollo guiado por pruebas: ejecuta tests iniciales (Red), asiste en la implementación mínima y repite la prueba hasta alcanzar éxito (Green):

```json
{
  "name": "lazycodex_run_test_loop",
  "description": "Runs a bounded test-driven iteration loop, capturing failing assertions and verifying green completion.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "test_command": { "type": "string", "description": "CLI command to run relevant tests (e.g. pytest, npm test, cargo test)." },
      "max_iterations": { "type": "integer", "default": 5 },
      "working_directory": { "type": "string" }
    },
    "required": ["test_command"]
  }
}
```

### 3. `lazycodex_ast_guard`
Analiza los archivos modificados mediante AST antes de confirmar cambios para detectar errores de sintaxis, variables no declaradas o importaciones rotas:

```json
{
  "name": "lazycodex_ast_guard",
  "description": "Performs fast AST parsing and type checks on staged file edits to block broken syntax before disk write.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "file_path": { "type": "string" },
      "proposed_content": { "type": "string" },
      "language": { "type": "string", "enum": ["typescript", "javascript", "python", "go", "rust"] }
    },
    "required": ["file_path", "proposed_content"]
  }
}
```

### 4. `lazycodex_state_snapshot`
Crea puntos de restauración instantáneos del estado del repositorio para posibilitar reversiones atómicas si un bucle de agente falla:

```json
{
  "name": "lazycodex_state_snapshot",
  "description": "Creates or restores lightweight Git worktree/stash snapshots during autonomous agent execution.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "action": { "type": "string", "enum": ["create", "restore", "discard"] },
      "snapshot_label": { "type": "string" }
    },
    "required": ["action", "snapshot_label"]
  }
}
```

---

## 🏛️ Doctrina del Consejo Asesor Global

* **Jamie Dimon (JPMorgan Chase):** *Disciplina de Balance y Contención de Riesgo*. Nunca se debe permitir a un proceso autónomo mutar activos en producción sin puntos de control y capacidad de reversión inmediata. LazyCodex representa la disciplina bancaria aplicada a la ejecución de agentes.
* **Jensen Huang (NVIDIA):** *Aceleración mediante Bucles Cerrados de Retroalimentación*. La velocidad de la computación agéntica depende de acortar el tiempo entre la hipótesis de código y la señal de fallo del compilador/test.
