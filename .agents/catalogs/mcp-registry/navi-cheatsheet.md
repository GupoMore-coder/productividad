# 🧭 Navi Interactive CLI Cheatsheet MCP Registry Spec

> **Source:** [denisidoro/navi](https://github.com/denisidoro/navi)  
> **License:** Apache-2.0 / MIT  
> **Domain:** Interactive Terminal Cheatsheet & Command Runner, Dynamic Parameter Auto-Completion, `.cheat` Syntax Specification, Cross-Platform Shell Productivity (PowerShell, Bash, Zsh).

---

## 🎯 Visión Arquitectónica

Navi es una herramienta interactiva para la línea de comandos que permite buscar y ejecutar comandos complejos sin necesidad de memorizarlos ni consultar documentación extensa. A través de archivos de sintaxis concisa (`.cheat`), define descripciones operativas, etiquetas y listas de sugerencias dinámicas para cada argumento:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Specialist               │
└──────────────────────────────┬──────────────────────────────┘
                               │ Cheatsheet Engine / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                         Navi Engine                         │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ .cheat Syntax Parser  │       │ Dynamic Auto-Complete │  │
│  │ (Tags, Commands, Args)│◄─────►│ (Branch lists, PIDs)  │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Interactive FZF Fuzzy Finder / Direct Shell Execution │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `navi_search_cheatsheet`
Busca comandos sugeridos por etiqueta, descripción o palabra clave:

```json
{
  "name": "navi_search_cheatsheet",
  "description": "Searches the repository of .cheat command recipes matching a specific operation query.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string" },
      "category_tag": { "type": "string", "description": "e.g., git, docker, bq, pwsh" }
    },
    "required": ["query"]
  }
}
```

### 2. `navi_render_cheat_recipe`
Genera un archivo o snippet `.cheat` formalmente validado para documentar comandos recurrentes:

```json
{
  "name": "navi_render_cheat_recipe",
  "description": "Compiles structured command descriptions into Navi .cheat format with argument definitions.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "title": { "type": "string" },
      "tags": { "type": "array", "items": { "type": "string" } },
      "command_template": { "type": "string" },
      "argument_mappings": { "type": "object" }
    },
    "required": ["title", "command_template"]
  }
}
```

---

## 🏛️ Directivas de Seguridad y Automatización

1. **Prevención de Errores Críticos (George Kurtz / Joe Ucuzoglu):** Los comandos destructivos en recetas `.cheat` (ej. `git push --force`, `rm -rf`, `DROP TABLE`) deben incluir advertencias explícitas de confirmación obligatoria.
2. **Eficiencia Operativa Radical (Andy Jassy):** Eliminar tiempo muerto buscando comandos sintácticos en manuales web; acceder al snippet exacto en milisegundos.
