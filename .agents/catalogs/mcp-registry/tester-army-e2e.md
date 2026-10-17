# 🧪 Tester-Army E2E Hybrid Agent Testing MCP Registry Spec

> **Source:** [tester-army/e2e](https://github.com/tester-army/e2e)  
> **License:** Open Source / Y Combinator Backed  
> **Domain:** Next-Generation End-to-End (E2E) Testing, Blended Natural Language Agent Reasoners with Deterministic Playwright Locators, Web & Mobile Flow Automation, Self-Healing Selectors, Regression Assertion Pipelines.

---

## 🎯 Visión Arquitectónica

Tester-Army E2E revoluciona las pruebas funcionales al fusionar la flexibilidad del razonamiento de agentes de IA con la rigidez matemática y determinista de Playwright. Permite a los equipos describir flujos complejos en lenguaje natural mientras mantiene aserciones estrictas sobre selectores y respuestas de API:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Testing Lead                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ E2E Hybrid Test Protocol / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Tester-Army E2E Engine                     │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ AI Agent Reasoner     │       │ Playwright Locator    │  │
│  │ (Autonomous UI Flow)  │◄─────►│ Engine (Deterministic)│  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Self-Healing Selector Engine & Trace Recorder         │  │
│  │ Web & Mobile Test Assertions, HAR & Video Artifacts   │  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `e2e_execute_agent_scenario`
Ejecuta un escenario E2E autónomo combinando objetivos de negocio con pasos guiados:

```json
{
  "name": "e2e_execute_agent_scenario",
  "description": "Executes an end-to-end user journey using hybrid AI agent navigation and deterministic Playwright actions.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "scenario_name": { "type": "string" },
      "target_url": { "type": "string" },
      "steps": {
        "type": "array",
        "items": { "type": "string" }
      },
      "timeout_seconds": { "type": "integer", "default": 60 }
    },
    "required": ["scenario_name", "target_url", "steps"]
  }
}
```

### 2. `e2e_verify_locator_assertions`
Verifica aserciones deterministas sobre el estado del DOM o respuestas de red:

```json
{
  "name": "e2e_verify_locator_assertions",
  "description": "Validates deterministic assertions against DOM elements, text content, and HTTP status codes.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "selector": { "type": "string" },
      "assertion_type": { "type": "string", "enum": ["to_be_visible", "to_have_text", "to_contain_value", "to_be_disabled"] },
      "expected_value": { "type": "string" }
    },
    "required": ["selector", "assertion_type"]
  }
}
```

### 3. `e2e_generate_regression_suite`
Genera una suite de pruebas TypeScript reproducible y tipada a partir de los pasos ejecutados con éxito:

```json
{
  "name": "e2e_generate_regression_suite",
  "description": "Compiles recorded agent steps and verified assertions into a permanent TypeScript Playwright test spec.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "suite_name": { "type": "string" },
      "output_path": { "type": "string" },
      "framework": { "type": "string", "enum": ["playwright", "cypress", "webdriverio"], "default": "playwright" }
    },
    "required": ["suite_name", "output_path"]
  }
}
```

---

## 🏛️ Rigor Forense y Calidad (Big-4 & DeepMind)

1. **Rigor Forense en Pruebas (Janet Truncale / EY):** Cero tolerancia a pruebas intermitentes o "flaky tests". Toda prueba debe registrar trazas completas, capturas de pantalla de error y telemetría de red auditable.
2. **Determinismo Científico (Demis Hassabis):** Combinar la flexibilidad exploratoria de los modelos con validaciones de aserción matemáticas y comprobables en el DOM.
