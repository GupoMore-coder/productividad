# 🧩 Claude Code Templates & Agent Harness MCP Registry Spec

> **Source:** [davila7/claude-code-templates](https://github.com/davila7/claude-code-templates)  
> **Author:** David Avila  
> **License:** MIT / Open Source  
> **Domain:** Claude Code Configuration Management, Agent Persona Scaffolding, Custom Slash Command Workflows, System Prompt Architecture, Environment Hardening (.clauderc), Production Multi-Agent Ecosystems.

---

## 🎯 Visión Arquitectónica

El repositorio **Claude Code Templates** proporciona una colección estructurada de plantillas de configuración, perfiles de entorno, definiciones de subagentes, flujos de trabajo en slash commands y políticas de seguridad para optimizar instancias del CLI de Claude Code.

Permite a desarrolladores y equipos estandarizar la orquestación de agentes mediante plantillas reproducibles para diferentes stacks (Next.js, FastAPI, Rust, Solana, DevOps) asegurando que cada sesión cuente con los permisos de herramientas, directivas de sistema y compuertas de revisión adecuadas:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Engineering Lead              │
└──────────────────────────────┬──────────────────────────────┘
                               │ Template Discovery & Scaffolding
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Claude Code Templates Hub (davila7)             │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ .clauderc Profiles    │       │ Custom Slash Commands │  │
│  │ (Rules, Permissions) ◄──────►│ (/review, /test, /ops)│  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Specialist Agent Blueprints (System Prompts, Personas)│  │
│  │ Role Constraints, Reviewer Gates, Linting Guardrails  │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Applied Workspace Configuration
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Target Workspace Execution Runtime              │
│            (Standardized, Audited & High-Velocity)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `claude_templates_list_profiles`
Lista todas las plantillas y perfiles de configuración disponibles organizados por tecnología y rol de ingeniería:

```json
{
  "name": "claude_templates_list_profiles",
  "description": "Lists available Claude Code configuration templates categorized by tech stack and agent specialization.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "stack_filter": { "type": "string", "description": "Optional filter (e.g. react, python, rust, devops, security)." },
      "category": { "type": "string", "enum": ["rules", "workflows", "agents", "full-stack"] }
    }
  }
}
```

### 2. `claude_templates_apply_scaffold`
Aplica una plantilla seleccionada al espacio de trabajo actual, configurando reglas, scripts y comandos slash sin sobreescribir archivos existentes sin confirmación:

```json
{
  "name": "claude_templates_apply_scaffold",
  "description": "Applies a Claude Code template preset to the target project directory.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "template_id": { "type": "string", "description": "Identifier of the template profile (e.g. fastapi-production, nextjs-enterprise)." },
      "target_dir": { "type": "string", "description": "Target workspace root path." },
      "dry_run": { "type": "boolean", "default": false }
    },
    "required": ["template_id", "target_dir"]
  }
}
```

### 3. `claude_templates_validate_config`
Audita la configuración `.clauderc` y los archivos de agentes contra el esquema oficial y las mejores prácticas de seguridad de Anthropic:

```json
{
  "name": "claude_templates_validate_config",
  "description": "Validates a workspace Claude Code configuration, tool whitelist, and agent rules for security compliance.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "config_path": { "type": "string", "description": "Path to the .clauderc or agent config directory." }
    },
    "required": ["config_path"]
  }
}
```

### 4. `claude_templates_export_custom`
Empaqueta la configuración activa de agentes, reglas y comandos del proyecto actual como una plantilla reutilizable:

```json
{
  "name": "claude_templates_export_custom",
  "description": "Exports current workspace agent configurations, rules, and workflows as a portable Claude Code template.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "output_name": { "type": "string", "description": "Name of the new template bundle." },
      "export_destination": { "type": "string", "description": "Output directory path." }
    },
    "required": ["output_name", "export_destination"]
  }
}
```

---

## 🏛️ Doctrina del Consejo Asesor Global

* **Satya Nadella (Microsoft):** *Estandarización de Plataformas y Reducción de Fricción*. Para escalar el desarrollo asistido por IA en organizaciones de miles de ingenieros, es vital contar con plantillas deterministas y reproducibles. Nadie debe configurar herramientas desde cero en cada proyecto.
* **Bernard Arnault (LVMH):** *Artesanía y Precisión Invariable*. Las plantillas no deben ser atajos mediocres; deben reflejar las directrices más exigentes de calidad de código, límites de permisos y elegancia en la ejecución.
