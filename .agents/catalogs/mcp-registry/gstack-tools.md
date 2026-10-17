# 🏛️ Garry Tan GStack MCP Registry & Opinionated Roles Spec

> **Source:** [garrytan/gstack](https://github.com/garrytan/gstack) | Garry Tan (Y Combinator CEO)  
> **License:** MIT  
> **Domain:** 23 Opinionated Executive & Engineering Agent Tools: CEO Strategic Alignment, Engineering Management, Release Management, Documentation Engineering, and Rigorous QA.

---

## 🎯 Visión Arquitectónica

GStack estructura el comportamiento de los asistentes de código bajo lentes de liderazgo corporativo probados en el ecosistema Y Combinator. Impide que el agente actúe como un programador aislado y lo obliga a evaluar el impacto holístico de cada cambio:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / LLM Client                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Invocación de Roles GStack
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       GStack Suite                          │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ 1. CEO Lens           │       │ 2. Eng Manager Lens   │  │
│  │ Strategic Value & PMF │       │ Blast Radius & Debt   │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ 3. Release Manager    │       │ 4. Doc & QA Lenses    │  │
│  │ Changelog & Rollbacks │       │ Edge Cases & Freshness│  │
│  └───────────────────────┘       └───────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `gstack_ceo_eval`
Audita una propuesta técnica o funcionalidad desde la perspectiva del CEO (retorno de inversión, propuesta de valor central, experiencia del cliente):

```json
{
  "name": "gstack_ceo_eval",
  "description": "Evaluates a proposed feature, architectural decision, or refactoring through the YC CEO lens: customer value, leverage, product-market fit, and radical simplicity.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "proposal_summary": { "type": "string", "description": "Overview of the technical or product change" },
      "target_audience": { "type": "string", "description": "End user persona (e.g. orthopedic surgeons, internal accounting)" }
    },
    "required": ["proposal_summary"]
  }
}
```

### 2. `gstack_eng_manager_review`
Calcula el radio de explosión (*blast radius*), la deuda técnica introducida y la complejidad de mantenimiento:

```json
{
  "name": "gstack_eng_manager_review",
  "description": "Assesses blast radius, dependency coupling, and technical debt risk across the codebase before approving significant pull requests.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "diff_stat": { "type": "string", "description": "Files modified or git diff summary" },
      "critical_subsystems": { "type": "array", "items": { "type": "string" }, "description": "Subsystems touched (e.g. database, auth, billing)" }
    },
    "required": ["diff_stat"]
  }
}
```

### 3. `gstack_release_audit`
Prepara el checklist formal de despliegue a producción: notas de versión (*changelog*), versionamiento semántico y plan de contingencia (*rollback*):

```json
{
  "name": "gstack_release_audit",
  "description": "Generates deployment readiness verification: semantic version bump, migration sequencing, rollback steps, and release notes.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "version_target": { "type": "string", "description": "Target semver version" },
      "changes_list": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["version_target", "changes_list"]
  }
}
```

---

## 🔒 Filosofía de Calidad y Cero Complacencia

* **Simplicidad Radical:** Si una funcionalidad requiere más de tres niveles de abstracción para resolver un problema directo, se rechaza y se exige rediseñar.
* **Trazabilidad Total:** Todo cambio mayor debe documentarse con su impacto directo en el usuario final.
