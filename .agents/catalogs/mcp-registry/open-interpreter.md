# 💻 Open Interpreter MCP Registry & Local Code Execution Spec

> **Source:** [openinterpreter/openinterpreter](https://github.com/openinterpreter/openinterpreter)  
> **License:** AGPL-3.0 / Open Source  
> **Domain:** Local-First Code Interpreter, Multi-Language Sandboxed Execution (Python, JavaScript, Shell, AppleScript), Local AI Integration (Kimi K3, GLM 5.3, Llama 3, DeepSeek), System Automation.

---

## 🎯 Visión Arquitectónica

Open Interpreter dota a los modelos de lenguaje de una interfaz interactiva de ejecución directa sobre el sistema operativo, permitiendo resolver tareas complejas mediante código generado dinámicamente y evaluado en tiempo real:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / LLM Client                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Code Blocks (JSON-RPC)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Open Interpreter Core                     │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Multi-Language Kernel │       │ Interactive Sandbox   │  │
│  │ Python · Node · Bash  │       │ (Subprocess / Docker) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ State Machine: Output Interception & Stdin Streaming │  │
│  │ Safe Execution Gate: Confirm Before Dangerous Actions│  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `interpreter_run_code`
Ejecuta un bloque de código en el lenguaje especificado dentro de un entorno aislado con captura de salida:

```json
{
  "name": "interpreter_run_code",
  "description": "Executes a snippet of code in Python, JavaScript, Bash, or PowerShell within an isolated subshell, capturing stdout, stderr, and generated visual artifacts.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "language": { "type": "string", "enum": ["python", "javascript", "bash", "powershell"] },
      "code": { "type": "string", "description": "Executable script content" },
      "timeout_seconds": { "type": "integer", "default": 60 }
    },
    "required": ["language", "code"]
  }
}
```

### 2. `interpreter_system_metrics`
Obtiene telemetría precisa del sistema operativo local (uso de CPU, GPU, RAM y versiones de compiladores):

```json
{
  "name": "interpreter_system_metrics",
  "description": "Probes local operating system metrics, active GPU compute capability, memory availability, and installed runtime compilers.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "include_gpu": { "type": "boolean", "default": true }
    }
  }
}
```

### 3. `interpreter_sandbox_reset`
Limpia el estado de variables globales, mata procesos huérfanos y reinicia el kernel de ejecución:

```json
{
  "name": "interpreter_sandbox_reset",
  "description": "Resets the interactive execution state, purging lingering memory variables, temporary scratch directories, and subshell processes.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "purge_temp_files": { "type": "boolean", "default": true }
    }
  }
}
```

---

## 🔒 Salvaguardas de Ejecución Local

1. **Aislamiento de Entorno:** Ningún script ejecutado por Open Interpreter puede modificar archivos de configuración fuera del sandbox sin confirmación expresa.
2. **Límite de Tiempo Estricto:** Procesos que excedan 120 segundos sin emitir salida estándar son terminados para prevenir bloqueos de CPU.
3. **No Persistencia de Credenciales:** Prohibido escribir claves de API o tokens temporales en el disco local sin cifrado.
