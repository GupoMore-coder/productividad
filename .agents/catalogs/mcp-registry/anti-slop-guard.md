# 🎨 Anti-Slop Aesthetic & Craftsmanship Guard MCP Registry Spec

> **Source:** [miqdadbadjuber/anti-slop](https://github.com/miqdadbadjuber/anti-slop)  
> **License:** MIT  
> **Domain:** AI Output Quality Guardrail, Eradication of Generic "AI Slop", High-Contrast Typography, Intentional UI Design (Anti-Bento Cliché, Anti-Purple Gradient), Authentic Human Copywriting, Opinionated Code Craftsmanship.

---

## 🎯 Visión Arquitectónica

`anti-slop` es una compuerta de aseguramiento de calidad estética, editorial y de código. Los modelos de lenguaje tienden por defecto a generar interfaces clichés (gradientes violetas sobre fondos oscuros, rejillas bento sin propósito, tipografías débiles) y prosa robótica llena de lugares comunes ("unleash", "delve", "testament"). Esta especificación impone filtros determinísticos para elevar el trabajo del agente al nivel de artesanía de lujo y software de autor:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Designer                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ Craftsmanship Audit / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Anti-Slop Guardrail                     │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ UI & Visual Linter    │       │ Prose & Copy Linter   │  │
│  │ (Color, Space, Type)  │◄─────►│ (Clichés, Jargon)     │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Code Integrity: Anti-Bloat, Meaningful Comments       │  │
│  │ Output: Pass / Rejected with Remediation Directives   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `antislop_audit_ui`
Audita un componente visual o archivo CSS contra patrones genéricos de IA:

```json
{
  "name": "antislop_audit_ui",
  "description": "Inspects frontend HTML/CSS/React code to detect generic AI design clichés (overused violet gradients, unstyled bento boxes, low-contrast text, missing focus states) and suggests bespoke palettes and intentional layouts.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "file_path": { "type": "string" },
      "brand_identity": { "type": "string", "enum": ["more_paper_luxury", "more_design_creative", "medical_ortho_clean", "terminal_sleek"], "default": "more_paper_luxury" }
    },
    "required": ["file_path"]
  }
}
```

### 2. `antislop_audit_copy`
Audita textos de interfaces, emails y documentación eliminando clichés robóticos:

```json
{
  "name": "antislop_audit_copy",
  "description": "Audits textual copy to purge robotic AI idioms ('delve', 'tapestry', 'testament', 'revolutionize') and enforces natural, direct, and authoritative human tone.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "text_content": { "type": "string" }
    },
    "required": ["text_content"]
  }
}
```

---

## 🏛️ Filosofía y Doctrina del Consejo

1. **Anti-Commodity y Lujo Artesanal (Bernard Arnault):** Si una interfaz o documento luce como una plantilla genérica generada por un bot promedio, ha fracasado. El diseño debe respirar exclusividad, atención obsesiva al detalle y personalidad propia.
2. **Claridad Radical (Jeff Bezos / Warren Buffett):** Prohibido el relleno verbal. La comunicación técnica y ejecutiva debe ser directa, cuantificada y respetuosa del tiempo del lector.
