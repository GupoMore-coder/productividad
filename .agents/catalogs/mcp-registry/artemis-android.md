# 📱 Google Artemis MCP Registry & Android Automation Spec

> **Source:** [google/artemis](https://github.com/google/artemis) | Google Research  
> **License:** Apache-2.0  
> **Domain:** Natural Language Android Automation, Mobile E2E Testing, Logcat Forensics, AndroidWorld Benchmark (99%+ Success Rate).  
> **Native Integration:** Certified compatibility with **Antigravity**, Codex, and Claude Code.

---

## 🎯 Visión Arquitectónica

Google Artemis convierte instrucciones en lenguaje natural en secuencias determinísticas de acciones sobre dispositivos y emuladores Android. Diseñado para interactuar directamente con asistentes de codificación con IA:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Coding Assistant              │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON-RPC / CLI Protocol
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Google Artemis Core                      │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Multi-Modal Vision    │       │ Hierarchy Inspector   │  │
│  │ & UI Tree Parser      │       │ (Accessibility / ADB) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Action Executor: Tap, Swipe, Text Input, App Launch   │  │
│  │ Telemetry Engine: Logcat, Screenshot, Failure Capture │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │ ADB / gRPC
                               ▼
┌─────────────────────────────────────────────────────────────┐
│           Android Device / Emulator / AndroidWorld           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `artemis_execute_task`
Ejecuta una instrucción de automatización móvil en lenguaje natural de extremo a extremo:

```json
{
  "name": "artemis_execute_task",
  "description": "Executes a natural-language mobile automation task on an active Android device or emulator, verifying state transitions and reporting completion.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_instruction": { "type": "string", "description": "Natural language instruction (e.g. 'Open WhatsApp, search for Dr. Perez, and confirm last invoice PDF')" },
      "package_name": { "type": "string", "description": "Optional Android target package (e.g. com.whatsapp)" },
      "timeout_seconds": { "type": "integer", "default": 180 },
      "capture_artifacts": { "type": "boolean", "default": true }
    },
    "required": ["task_instruction"]
  }
}
```

### 2. `artemis_device_state`
Captura una instantánea forense del estado actual del dispositivo móvil:

```json
{
  "name": "artemis_device_state",
  "description": "Captures device screen, UI accessibility node hierarchy, active activity name, and recent logcat crash traces.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "include_screenshot": { "type": "boolean", "default": true },
      "include_accessibility_tree": { "type": "boolean", "default": true },
      "logcat_lines": { "type": "integer", "default": 100 }
    }
  }
}
```

### 3. `artemis_step_action`
Ejecuta una acción atómica de interfaz táctil directamente sobre coordenadas o identificadores de vista:

```json
{
  "name": "artemis_step_action",
  "description": "Performs an atomic interaction step: tap, swipe, long_press, type_text, press_key, or back_button.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "action_type": { "type": "string", "enum": ["tap", "swipe", "long_press", "type_text", "press_key", "back"] },
      "target_element": { "type": "string", "description": "Resource ID, text label, or [x, y] coordinates" },
      "input_value": { "type": "string", "description": "Text to enter if action_type is type_text" }
    },
    "required": ["action_type"]
  }
}
```

---

## 🔒 Directivas de Seguridad y Blindaje Móvil

1. **Aislamiento de Credenciales:** Prohibido ingresar contraseñas maestras o credenciales bancarias en texto plano; Artemis debe utilizar keystores seguros o perfiles de prueba de depuración.
2. **Restricción de Permisos Sensibles:** Operaciones que requieran permisos de administrador de dispositivo o accesibilidad a nivel de sistema deben contar con autorización expresa del usuario.
3. **Sandbox de Datos de Prueba:** Pruebas automatizadas deben ejecutarse preferentemente en emuladores o entornos con datos ficticios para evitar fugas de información personal.
