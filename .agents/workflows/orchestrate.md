---
description: Inspect which specialist agents, skills, and quality rules Antigravity automatically resolves for a given prompt or task.
---

# 🧭 Orchestrate Workflow

Inspect the automatic intent-matching engine and preview which specialized agents, pattern skills, and quality rules are activated for any technical task.

## Usage

```bash
/orchestrate <task or prompt>
```

### Examples

```bash
/orchestrate Diseña un modal reactivo accesible con animaciones
/orchestrate Optimiza una consulta PostgreSQL lenta con joins complejos
/orchestrate Audita la seguridad de un endpoint JWT y permisos RBAC
/orchestrate Configura una estrategia de despliegue canary en Kubernetes
```

---

## Instructions for the Assistant

When the user runs `/orchestrate <query>`:

1. **Scan Intent:** Match `<query>` against the 9 technical domains defined in `.agents/MASTER_CAPABILITY_MATRIX.md`.
2. **Display the Triad Breakdown:**
   Output a formatted card showing:
   * **🎯 Dominio Detectado:** Title and domain identifier.
   * **👤 Especialista Lead:** The primary agent profile from `.agents/agency/` or flagship skills.
   * **📚 Skills de Apoyo:** Relevant patterns and engineering guidelines.
   * **🛡️ Reglas y Compuertas:** Specific coding style, security rules, and verification gates.
3. **Execution Ready:** Ask the user if they would like to proceed with the execution under this specialized triad.
