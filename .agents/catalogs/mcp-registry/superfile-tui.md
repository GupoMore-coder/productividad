# 📂 Superfile Modern Terminal File Manager (TUI) MCP Registry Spec

> **Source:** [yorukot/superfile](https://github.com/yorukot/superfile)  
> **License:** MIT / Open Source  
> **Domain:** Modern Terminal User Interface (TUI) File Manager in Go (Bubble Tea), Multi-Pane Directory Navigation, Vim-Style Keyboard Bindings, In-Terminal File Previews, High-Aesthetic Theme Engine.

---

## 🎯 Visión Arquitectónica

Superfile es un gestor de archivos para la terminal moderno y visualmente atractivo escrito en Go utilizando el framework Bubble Tea. Proporciona una interfaz multi-panel para explorar, previsualizar y reorganizar árboles de directorios complejos sin salir del entorno de la consola:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Specialist               │
└──────────────────────────────┬──────────────────────────────┘
                               │ TUI File Operations / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Superfile Engine                       │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Multi-Pane View (TUI) │       │ Fast File Previewer   │  │
│  │ (Bubble Tea / LipGloss│◄─────►│ (Code Syntax & Diffs) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Keyboard Navigation: Vim Motions (h, j, k, l)         │  │
│  │ High-Performance Native Go File System Operations     │  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `superfile_inspect_directory_tree`
Genera una estructura de árbol multi-panel optimizada con previsualizaciones de tamaño y tipos MIME:

```json
{
  "name": "superfile_inspect_directory_tree",
  "description": "Inspects directory structures with file previews, size indicators, and git status annotations.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "directory_path": { "type": "string" },
      "depth": { "type": "integer", "default": 3 },
      "show_hidden": { "type": "boolean", "default": false }
    },
    "required": ["directory_path"]
  }
}
```

---

## 🏛️ Gobernanza y Ergonomía

1. **Ergonomía de Terminal (Jeff Dean / Steve Jobs):** Ofrecer una navegación limpia y veloz sin fricción gráfica pesada para el desarrollador de consola.
2. **Protección Contra Pérdida de Datos (Accidental Data Loss Prevention):** Toda operación de archivo debe respetar las reglas de prevención de eliminación destructiva accidental del proyecto.
