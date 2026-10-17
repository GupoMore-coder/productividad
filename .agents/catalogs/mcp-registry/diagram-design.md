# 📐 Editorial Technical Diagram Design MCP Registry Spec

> **Source:** [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design)  
> **License:** MIT / Open Source  
> **Domain:** Editorial-Quality Architecture & Technical Diagramming, 40+ Diagram Archetypes (System Topologies, State Machines, Sequence Diagrams, ERDs, Timelines), Self-Contained SVG & Responsive HTML, Bespoke Brand Token Engine, Anti-Slop Visual Standards.

---

## 🎯 Visión Arquitectónica

Diagram-Design erradica la estética genérica e ilegible comúnmente asociada a generadores automáticos ("Mermaid-slop"). Proporciona una suite de diseño editorial que compila arquitecturas de software complejas en representaciones visuales de alto calibre artesanal, autocompletas en SVG o HTML interactivo con soporte de modo claro y oscuro:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Designer                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ Diagram Generation Request
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Diagram-Design Engine                    │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ 40+ Archetype Models  │       │ Custom Brand Tokens   │  │
│  │ (Arch, State, Seq)    │◄─────►│ (Ink, Paper, Accents) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Self-Contained Pure SVG / Responsive HTML Output      │  │
│  │ Zero External Dependencies, Zero Fragile CDN Scripts  │  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `diagram_generate_editorial_svg`
Genera un diagrama vectorial SVG puro de calidad editorial:

```json
{
  "name": "diagram_generate_editorial_svg",
  "description": "Generates a publication-grade, self-contained SVG diagram for architecture, flows, or system sequences.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "diagram_type": { "type": "string", "enum": ["architecture", "flowchart", "sequence", "state_machine", "erd", "timeline", "component_tree"] },
      "nodes_and_edges": { "type": "object" },
      "theme_variant": { "type": "string", "enum": ["minimal_light", "minimal_dark", "full_editorial"], "default": "full_editorial" },
      "output_path": { "type": "string" }
    },
    "required": ["diagram_type", "nodes_and_edges", "output_path"]
  }
}
```

### 2. `diagram_render_responsive_html`
Genera un canvas interactivo HTML responsivo con navegación y alternancia de temas:

```json
{
  "name": "diagram_render_responsive_html",
  "description": "Renders an interactive HTML diagram document with zoom, pan, and embedded dark/light mode toggle.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "title": { "type": "string" },
      "spec": { "type": "object" },
      "output_path": { "type": "string" }
    },
    "required": ["title", "spec", "output_path"]
  }
}
```

### 3. `diagram_convert_mermaid_to_editorial`
Convierte una definición Mermaid existente en un diagrama editorial de alta sofisticación:

```json
{
  "name": "diagram_convert_mermaid_to_editorial",
  "description": "Parses a standard Mermaid code block and re-renders it into an editorial SVG/HTML design asset.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "mermaid_source": { "type": "string" },
      "output_path": { "type": "string" }
    },
    "required": ["mermaid_source", "output_path"]
  }
}
```

---

## 🏛️ Doctrina de Lujo y Artesanía (Bernard Arnault)

1. **Anti-Slop y Artesanía Superior (Bernard Arnault):** Protección absoluta de la identidad visual. Ningún artefacto presentado a la dirección o a clientes debe verse como una plantilla genérica descuidada.
2. **Claridad Arquitectónica Inmediata (Jeff Bezos):** La diagramación debe transmitir con precisión matemática los flujos de datos y responsabilidades de cada componente.
