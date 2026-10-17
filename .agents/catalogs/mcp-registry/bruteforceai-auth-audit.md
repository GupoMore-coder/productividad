# 🛡️ BruteForceAI Authentication Resilience & Rate-Limit Audit MCP Registry Spec

> **Source:** [MorDavid/BruteForceAI](https://github.com/MorDavid/BruteForceAI)  
> **Author:** David Mor  
> **License:** MIT / Open Source  
> **Domain:** Defensive Authentication Security Auditing, Credential Stuffing Resilience Verification, Account Lockout & WAF Rate-Limiting Testing, Form Selector Discovery (Playwright + LLM), SARIF Compliance Reporting.

---

## 🎯 Visión Arquitectónica

**BruteForceAI** combina automatización de navegadores (Playwright) con modelos de lenguaje para inspeccionar formularios de inicio de sesión y evaluar la resiliencia de los mecanismos de autenticación. En la arquitectura de Antigravity, opera estrictamente como un **arnés de verificación defensiva y compuerta de aseguramiento ASVS (OWASP V2 - Authentication)**:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Security Lead                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ Authorized Target Scope & Policy
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             BruteForceAI Auth Resilience Engine             │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Form Inspector        │       │ Baseline Behavior     │  │
│  │ (Playwright + LLM)    ◄──────►│ Profiler (Dummy Auth) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Rate-Limit & Lockout Threshold Stress Evaluator       │  │
│  │ CAPTCHA Triggering Verification, WAF Anomaly Checks   │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ SARIF Risk Findings & Fix Recommendations
                               ▼
┌─────────────────────────────────────────────────────────────┐
│            Enterprise Identity & Auth Defense Gate          │
│       (Account Lockouts, Exponential Backoff, MFA Rules)    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `auth_resilience_inspect_form`
Navega de forma segura a una URL de autenticación interna en staging, extrae el DOM y utiliza LLM para catalogar los campos de entrada y selectores CSS:

```json
{
  "name": "auth_resilience_inspect_form",
  "description": "Inspects a login or auth form on an authorized test URL, mapping input selectors, CSRF tokens, and submission buttons.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "target_url": { "type": "string", "description": "Authorized target login URL (staging/test environment)." },
      "headless": { "type": "boolean", "default": true }
    },
    "required": ["target_url"]
  }
}
```

### 2. `auth_resilience_simulate_spray`
Simula ráfagas controladas de intentos de autenticación contra un endpoint de prueba para validar que los límites de tasa (rate limiting) y bloqueos temporales operan correctamente:

```json
{
  "name": "auth_resilience_simulate_spray",
  "description": "Executes a bounded, controlled credential-spraying test to verify application rate limiting and lockout behavior.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "target_url": { "type": "string" },
      "max_attempts": { "type": "integer", "default": 5, "description": "Maximum test attempts before evaluating lockout response." },
      "delay_jitter_ms": { "type": "integer", "default": 500 }
    },
    "required": ["target_url"]
  }
}
```

### 3. `auth_resilience_verify_lockout`
Evalúa la respuesta del servidor tras alcanzar el umbral de intentos fallidos, verificando códigos HTTP (429 Too Many Requests), headers `Retry-After` y activación de CAPTCHA:

```json
{
  "name": "auth_resilience_verify_lockout",
  "description": "Verifies whether account lockout, delay backoff, or CAPTCHA triggers occurred as required by security policy.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "test_session_id": { "type": "string" },
      "expected_policy": { "type": "string", "enum": ["rate_limit_429", "account_lockout", "captcha_challenge", "exponential_backoff"] }
    },
    "required": ["test_session_id", "expected_policy"]
  }
}
```

### 4. `auth_resilience_generate_sarif`
Compila los hallazgos de resiliencia de autenticación en un informe estándar SARIF y Markdown con recomendaciones de mitigación (OWASP ASVS V2):

```json
{
  "name": "auth_resilience_generate_sarif",
  "description": "Exports authentication security evaluation findings into standard SARIF format for CI/CD pipeline integration.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "test_session_id": { "type": "string" },
      "output_path": { "type": "string" }
    },
    "required": ["test_session_id", "output_path"]
  }
}
```

---

## 🏛️ Doctrina del Consejo Asesor Global

* **George Kurtz (CrowdStrike):** *Validación Continua de los Límites de Identidad*. Los ataques de relleno de credenciales representan más del 80% de las brechas de acceso inicial. Probar sistemáticamente que los formularios de login bloquean ráfagas automatizadas antes del pase a producción es un control defensivo esencial.
* **Jamie Dimon (JPMorgan Chase):** *Tolerancia Cero a Mecanismos de Acceso Frágiles*. Cualquier portal expuesto debe implementar backoff exponencial, bloqueo de IP/cuenta y monitoreo de telemetría de fallos sin excepción.
