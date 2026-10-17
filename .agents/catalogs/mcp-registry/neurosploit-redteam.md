# 🎯 NeuroSploit Adversarial LLM & Agent Red-Teaming MCP Registry Spec

> **Source:** [JoasASantos/NeuroSploit](https://github.com/JoasASantos/NeuroSploit)  
> **Author:** Joas Antonio Santos  
> **License:** GPL-3.0 / Open Source  
> **Domain:** Adversarial AI Red-Teaming, Prompt Injection Vulnerability Scanning, Jailbreak Boundary Evaluation, Agent Tool-Call Hijacking Assessment, Cognitive Evasion Testing, Defensive Guardrail Hardening.

---

## 🎯 Visión Arquitectónica

**NeuroSploit** es un marco de ciberseguridad ofensiva y red-teaming diseñado específicamente para evaluar la robustez y los límites de seguridad de modelos de lenguaje (LLMs), arquitecturas multi-agente e interfaces de chat. Permite a los equipos de seguridad probar de forma sistemática y reproducible si un agente es susceptible a inyecciones de prompts directas o indirectas, jailbreaks de rol, fuga de directivas de sistema o ejecución no autorizada de herramientas:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Red-Team Lead                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ Adversarial Evaluation Suite
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    NeuroSploit Framework                    │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Jailbreak & Evasion   │       │ Indirect Prompt       │  │
│  │ Payload Generator     ◄──────►│ Injection Auditor     │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Agent Tool Hijacking & Privilege Escalation Engine    │  │
│  │ System Prompt Extraction & Cognitive Boundary Tests   │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ SARIF Risk Assessment & Mitigations
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                Hardened Agent Defense Layer                 │
│         (Input Sanitization, System Guardrails, WAF)        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `neurosploit_audit_prompts`
Ejecuta una batería de pruebas de inyección y extracción contra las plantillas de prompts del sistema o agentes:

```json
{
  "name": "neurosploit_audit_prompts",
  "description": "Audits prompt templates against common prompt extraction and delimiter-bypass techniques.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "target_system_prompt": { "type": "string" },
      "test_categories": { "type": "array", "items": { "type": "string" }, "description": "e.g. system_leakage, delimiter_override, persona_hijack" }
    },
    "required": ["target_system_prompt"]
  }
}
```

### 2. `neurosploit_test_jailbreak`
Evalúa la resistencia del modelo contra técnicas avanzadas de evasión cognitiva y jailbreaks sintácticos:

```json
{
  "name": "neurosploit_test_jailbreak",
  "description": "Tests an LLM endpoint or agent against standardized red-team adversarial jailbreak vectors.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "model_endpoint": { "type": "string" },
      "vector_depth": { "type": "string", "enum": ["standard", "aggressive", "adaptive"] },
      "safety_boundaries": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["model_endpoint"]
  }
}
```

### 3. `neurosploit_tool_injection_scan`
Verifica si el agente es vulnerable a la inyección indirecta a través de entradas externas no confiables (ej. páginas web raspadas, correos electrónicos o documentos subidos):

```json
{
  "name": "neurosploit_tool_injection_scan",
  "description": "Simulates indirect prompt injection payloads inside data sources to verify agent tool execution guardrails.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "data_payload": { "type": "string" },
      "available_tools": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["data_payload", "available_tools"]
  }
}
```

### 4. `neurosploit_generate_threat_report`
Genera un informe consolidado en formato SARIF y Markdown con las vulnerabilidades detectadas y directivas de mitigación:

```json
{
  "name": "neurosploit_generate_threat_report",
  "description": "Generates a comprehensive adversarial security report with remediation recommendations.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "audit_id": { "type": "string" },
      "format": { "type": "string", "enum": ["markdown", "sarif", "json"], "default": "markdown" }
    },
    "required": ["audit_id"]
  }
}
```

---

## 🏛️ Doctrina del Consejo Asesor Global

* **George Kurtz (CrowdStrike):** *Defensa Adversaria Proactiva*. La única forma de garantizar la resiliencia de un sistema de IA es someterlo continuamente a los mismos vectores de ataque sofisticados que utilizarán los adversarios del mundo real antes del despliegue en producción.
* **Jamie Dimon (JPMorgan Chase):** *Pruebas de Estrés Sin Concesiones*. Las defensas de una entidad financiera o tecnológica deben soportar el escenario más hostil concebible. NeuroSploit aporta esa severidad a la auditoría de agentes.
