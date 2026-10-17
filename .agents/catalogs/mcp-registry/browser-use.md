# 🌐 Browser-Use AI Web Automation MCP Registry Spec

> **Source:** [browser-use/browser-use](https://github.com/browser-use/browser-use)  
> **License:** MIT / Open Source  
> **Domain:** Chromium Web Browser Automation via Chrome DevTools Protocol (CDP), Vision-Augmented DOM Parsing, Multimodal Agent Action Planning, Form Fillers, Dynamic Single-Page App Traversal, Session State Management.

---

## 🎯 Visión Arquitectónica

Browser-Use proporciona a los agentes autónomos la capacidad de controlar instancias de navegadores Chromium como si fueran operadores humanos avanzados, combinando análisis estructural del DOM con coordenadas visuales multimodales:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Agent                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Browser Action Planning / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Browser-Use Engine                       │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Multimodal Vision/DOM │       │ CDP Controller Loop   │  │
│  │ (Interactive Elements)│◄─────►│ (Click, Type, Scroll) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Chromium DevTools Protocol (CDP) / Playwright Core    │  │
│  │ Cookies, LocalStorage, Context Isolation, Screenshots  │  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `browser_use_navigate`
Navega a una URL con configuración de viewport y control de cookies seguras:

```json
{
  "name": "browser_use_navigate",
  "description": "Navigates the browser to a specific URL and waits for network idle or DOM ready.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "url": { "type": "string" },
      "wait_until": { "type": "string", "enum": ["load", "domcontentloaded", "networkidle"], "default": "networkidle" },
      "viewport": {
        "type": "object",
        "properties": {
          "width": { "type": "integer", "default": 1280 },
          "height": { "type": "integer", "default": 800 }
        }
      }
    },
    "required": ["url"]
  }
}
```

### 2. `browser_use_action_step`
Ejecuta un paso de interacción multimodal (clic, escritura, scroll, selección):

```json
{
  "name": "browser_use_action_step",
  "description": "Executes an interaction step on the active browser page.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "action": { "type": "string", "enum": ["click", "type", "scroll", "select", "press_key", "hover"] },
      "index_or_selector": { "type": "string" },
      "text": { "type": "string" },
      "coordinates": {
        "type": "object",
        "properties": {
          "x": { "type": "number" },
          "y": { "type": "number" }
        }
      }
    },
    "required": ["action"]
  }
}
```

### 3. `browser_use_extract_dom_state`
Extrae el árbol de accesibilidad y elementos interactivos indexados para toma de decisiones rápida con bajo consumo de tokens:

```json
{
  "name": "browser_use_extract_dom_state",
  "description": "Extracts filtered interactive DOM elements with assigned numeric indices for precise agent targeting.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "include_invisible": { "type": "boolean", "default": false },
      "max_elements": { "type": "integer", "default": 100 }
    }
  }
}
```

### 4. `browser_use_screenshot_viewport`
Captura una captura de pantalla del viewport activo para verificación visual o análisis multimodal:

```json
{
  "name": "browser_use_screenshot_viewport",
  "description": "Takes a screenshot of the current page viewport or full document.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "full_page": { "type": "boolean", "default": false },
      "encoding": { "type": "string", "enum": ["base64", "filepath"], "default": "filepath" }
    }
  }
}
```

---

## 🏛️ Gobernanza y Seguridad Shannon

1. **Aislamiento de Red y Mitigación SSRF:** Prohibido navegar a direcciones IP privadas o de bucle de retorno (`127.0.0.1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`) a menos que el usuario lo autorice explícitamente para pruebas locales controladas.
2. **Segregación de Credenciales:** Prohibido hardcodear contraseñas bancarias o tokens en scripts de navegación; utilizar inyección segura de variables de entorno o almacenes de secretos locales.
3. **Ergonomía de Interacción (Mustafa Suleyman):** Diseñado para una navegación empática, respetuosa con límites de tasa de peticiones y detección anti-bloqueo responsable.
