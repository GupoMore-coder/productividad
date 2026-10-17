# 🌐 Obscura Headless Browser MCP Registry & Stealth Web Spec

> **Source:** [h4ckf0r0day/obscura](https://github.com/h4ckf0r0day/obscura)  
> **License:** MIT  
> **Domain:** Stealth Headless Browser for AI Agents, Anti-Bot & WAF Evasion, JavaScript-Heavy DOM Extraction, Token-Dense Markdown Conversion.

---

## 🎯 Visión Arquitectónica

Obscura es un motor de navegación headless de ultra-baja latencia diseñado para agentes de IA que necesitan interactuar con páginas dinámicas, Single Page Applications (SPAs) y sitios web protegidos por firewalls de aplicaciones (Cloudflare, Akamai, PerimeterX) sin ser detectados:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Web Subagent                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON-RPC
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Obscura Headless Engine                     │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Anti-Fingerprinting   │       │ Dynamic JS Renderer   │  │
│  │ TLS / Canvas Stealth  │       │ (Chromium / CDP Core) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Semantic Cleaner: DOM to Markdown with Token Savings  │  │
│  │ Interactive Driver: Click, Type, Wait for Selectors   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `obscura_browse`
Carga una página web dinámica simulando huellas de hardware reales y devuelve el contenido limpio en Markdown:

```json
{
  "name": "obscura_browse",
  "description": "Loads a JavaScript-rendered URL with stealth anti-fingerprinting and extracts structured Markdown with image and link preservation.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "url": { "type": "string", "description": "Target web page URL" },
      "wait_for_selector": { "type": "string", "description": "CSS selector to wait for before extracting content" },
      "timeout_ms": { "type": "integer", "default": 20000 }
    },
    "required": ["url"]
  }
}
```

### 2. `obscura_interact`
Ejecuta secuencias de navegación complejas (iniciar sesión, paginación, desplazar scroll, filtros dinámicos):

```json
{
  "name": "obscura_interact",
  "description": "Executes interactive actions on a loaded session: click, type into fields, trigger infinite scroll, or take full-page screenshots.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "session_id": { "type": "string" },
      "actions": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "type": { "type": "string", "enum": ["click", "type", "scroll", "wait", "screenshot"] },
            "selector": { "type": "string" },
            "value": { "type": "string" }
          },
          "required": ["type"]
        }
      }
    },
    "required": ["session_id", "actions"]
  }
}
```

---

## 🔒 Estándares Éticos y de Ciberseguridad

1. **Uso Estrictamente Defensivo y de Investigación:** Obscura debe utilizarse únicamente para la extracción legítima de información pública, auditoría de interfaces propias o investigación bibliográfica.
2. **Cero Retención de Sesiones Inseguras:** Cookies y almacenamiento local se purgan al finalizar cada sesión de extracción.
3. **Respeto a Cuotas y Rate Limits:** Respetar los tiempos de cortesía entre peticiones para no saturar servidores de destino.
