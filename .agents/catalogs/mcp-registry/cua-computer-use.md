# 🖥️ Cua Computer-Use 2.0 Infrastructure MCP Registry Spec

> **Source:** [trycua/cua](https://github.com/trycua/cua)  
> **License:** Apache-2.0 / MIT  
> **Domain:** Computer-Use 2.0 Infrastructure, Non-Intrusive Background Desktop Automation via Model Context Protocol (MCP), Accessibility Tree Inspection, Virtualized Agent Desktops (Cua Spaces / Lume), Human-Agent Simultaneous Coexistence (Zero Physical Mouse Hijacking).

---

## 🎯 Visión Arquitectónica

Cua resuelve el principal cuello de botella de la automatización de escritorio por IA: el secuestro del ratón y teclado del usuario. Mediante el controlador **Cua Driver** y la capa de virtualización **Lume**, los agentes operan en escritorios virtuales aislados (*Cua Spaces*) o interactúan con aplicaciones en segundo plano inspeccionando árboles de accesibilidad nativos y sintetizando eventos del sistema operativo sin bloquear la pantalla del desarrollador:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Specialist               │
└──────────────────────────────┬──────────────────────────────┘
                               │ Cua Driver MCP Protocol
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                        Cua Runtime                          │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ UI Accessibility Tree │       │ Isolated Cua Spaces   │  │
│  │ (Direct DOM/OS Nodes) │◄─────►│ (Lume VM / Sandbox)   │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Background Event Synth: Click, Type, Drag, Scroll     │  │
│  │ Human-Agent Coexistence: Dual Independent Cursors     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `cua_inspect_ui_tree`
Inspecciona la jerarquía semántica de accesibilidad de una ventana o escritorio en lugar de analizar píxeles ciegos:

```json
{
  "name": "cua_inspect_ui_tree",
  "description": "Inspects the active application or window accessibility hierarchy, returning interactive nodes, button IDs, text inputs, and exact coordinate bounding boxes.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "target_app": { "type": "string", "description": "Application name or process ID (optional, defaults to focused window)." },
      "space_id": { "type": "string", "description": "Optional isolated Cua Space ID." }
    }
  }
}
```

### 2. `cua_dispatch_action`
Ejecuta una acción de interfaz (clic, tipeo de texto, scroll o atajo) en segundo plano sin mover el cursor físico:

```json
{
  "name": "cua_dispatch_action",
  "description": "Dispatches a synthetic mouse click, keyboard input, or scroll event to a target UI node in the background.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "action": { "type": "string", "enum": ["click", "double_click", "type", "press_key", "scroll", "drag"] },
      "target_node_id": { "type": "string" },
      "input_value": { "type": "string" },
      "coordinates": { "type": "object", "properties": { "x": { "type": "number" }, "y": { "type": "number" } } }
    },
    "required": ["action"]
  }
}
```

### 3. `cua_spawn_space`
Crea un entorno de escritorio virtualizado aislado (macOS VM o contenedor Linux con display virtual X11/Wayland):

```json
{
  "name": "cua_spawn_space",
  "description": "Spawns an isolated desktop sandbox (Cua Space) where the agent can run and test GUI applications without touching the host operating system.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "os_type": { "type": "string", "enum": ["linux_gui", "macos_lume"], "default": "linux_gui" },
      "resolution": { "type": "string", "default": "1920x1080" },
      "timeout_minutes": { "type": "integer", "default": 60 }
    }
  }
}
```

---

## 🏛️ Gobernanza y Seguridad de Contención

1. **Aislamiento en Sandbox (George Kurtz / Ken Xie):** Ninguna tarea automatizada que manipule navegadores con credenciales o software administrativo puede ejecutarse fuera de un *Cua Space* virtualizado con firewall estricto.
2. **Coexistencia No Invasiva (Mustafa Suleyman):** Prohibido interferir con el puntero del desarrollador; la interacción debe ocurrir en espacios dedicados o mediante canales de accesibilidad en segundo plano.
