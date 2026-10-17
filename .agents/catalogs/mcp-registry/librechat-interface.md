# 🖥️ LibreChat Universal Multimodal MCP Interface Spec

> **Source:** [LibreChat-AI/LibreChat](https://github.com/LibreChat-AI/LibreChat)  
> **License:** MIT  
> **Domain:** Universal AI Chat UI, Multimodal Model Hub (Anthropic, OpenAI, DeepSeek, Local Ollama), Model Context Protocol (MCP) Client, Interactive Code Artifacts, Preset & Agent Management, Enterprise RBAC & OAuth2.

---

## 🎯 Visión Arquitectónica

LibreChat es la plataforma de interfaz unificada de código abierto líder para interactuar con modelos de lenguaje y visión frontera. Integra soporte nativo para el Model Context Protocol (MCP), renderizado de artefactos dinámicos (HTML/JS/React/Mermaid), gestión de archivos con búsqueda multimodal y control de acceso basado en roles (RBAC):

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / User Experience               │
└──────────────────────────────┬──────────────────────────────┘
                               │ LibreChat API / Web Client
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      LibreChat Gateway                      │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Multimodal Multi-Model│       │ Universal MCP Client  │  │
│  │ (Claude/GPT/DeepSeek) │◄─────►│ (Connects to all MCPs)│  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Artifacts Renderer: React, SVG, HTML, Mermaid         │  │
│  │ Enterprise Security: OAuth2, OpenID, Strict RBAC      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `librechat_list_agents`
Enumera los agentes y presets configurados con sus modelos, instrucciones de sistema y herramientas asociadas:

```json
{
  "name": "librechat_list_agents",
  "description": "Lists all available agent presets, custom endpoints, and system prompt configurations active in LibreChat.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "category": { "type": "string", "enum": ["all", "code", "finance", "medical", "rpa"], "default": "all" }
    }
  }
}
```

### 2. `librechat_create_preset`
Registra un nuevo agente o preset con configuración específica de herramientas MCP, parámetros de muestreo y avatar:

```json
{
  "name": "librechat_create_preset",
  "description": "Registers or updates a specialized assistant preset with designated model endpoint, system instructions, and tool bindings.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "title": { "type": "string" },
      "endpoint": { "type": "string", "description": "e.g., anthropic, openAI, ollama" },
      "model": { "type": "string" },
      "system_prompt": { "type": "string" },
      "tools": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["title", "endpoint", "model", "system_prompt"]
  }
}
```

### 3. `librechat_render_artifact`
Envía un bloque de código ejecutable o componente visual para renderizado dinámico en el panel de artefactos del usuario:

```json
{
  "name": "librechat_render_artifact",
  "description": "Prepares and renders an interactive code artifact (HTML/CSS/JS, React component, or Mermaid diagram) in the LibreChat UI panel.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "artifact_id": { "type": "string" },
      "title": { "type": "string" },
      "artifact_type": { "type": "string", "enum": ["html", "react", "mermaid", "svg", "markdown"] },
      "content": { "type": "string" }
    },
    "required": ["artifact_id", "title", "artifact_type", "content"]
  }
}
```

---

## 🏛️ Gobernanza y Directivas de Experiencia

1. **Estética y Usabilidad Premium (Mustafa Suleyman / Bernard Arnault):** LibreChat debe ofrecer una experiencia visual fluida, libre de fricción y con soporte instantáneo para renderizado de gráficos y tablas interactivas.
2. **Soberanía y Privacidad de Datos (Meredith Whittaker / Andy Yen):** Credenciales de API y conversaciones almacenadas con cifrado local; soporte total para inferencia privada vía modelos locales (Ollama/vLLM).
