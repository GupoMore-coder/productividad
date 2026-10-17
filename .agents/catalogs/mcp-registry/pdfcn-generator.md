# 📄 pdfcn Modular React PDF Generator MCP Registry Spec

> **Source:** [shadcn-labs/pdfcn](https://github.com/shadcn-labs/pdfcn)  
> **License:** MIT / Open Source  
> **Domain:** Component-Driven PDF Generation in React/TypeScript, Copy-and-Paste Registry Pattern (`shadcn/ui` style), Takumi & Forme Native Rendering Engines, High-Fidelity Invoices, Medical Discharge Summaries, Audit Reports, Zero Cloud SaaS Dependency.

---

## 🎯 Visión Arquitectónica

`pdfcn` traslada el paradigma moderno de componentes de interfaz reutilizables (`shadcn/ui`) a la generación de documentos PDF. En lugar de escribir cadenas HTML toscas o depender de costosas APIs en la nube (como DocRaptor o PDFShift), permite componer documentos con componentes React fuertemente tipados y compilarlos a PDF con fidelidad tipográfica de nivel de imprenta:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Architect                │
└──────────────────────────────┬──────────────────────────────┘
                               │ Template Binding / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      pdfcn Engine                           │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ React Document Tree   │       │ Renderer Backend      │  │
│  │ (Invoices, Receipts)  │◄─────►│ (Takumi / Forme Core) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Vector Print Engine: A4/Letter Paging, Fonts, Tables  │  │
│  │ Output: Binary PDF Buffer / Base64 / Local File       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `pdfcn_render_document`
Renderiza un documento PDF tipado a partir de un template y datos estructurados:

```json
{
  "name": "pdfcn_render_document",
  "description": "Compiles a React/TypeScript PDF component template with provided JSON data into a print-ready vector PDF file.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "template_id": { "type": "string", "enum": ["invoice_more_paper", "medical_report_ortho", "financial_audit_deloitte", "custom"] },
      "data": { "type": "object", "description": "Structured JSON payload matching the template schema." },
      "output_path": { "type": "string", "description": "Destination file path for the generated PDF." },
      "engine": { "type": "string", "enum": ["takumi", "forme"], "default": "forme" }
    },
    "required": ["template_id", "data", "output_path"]
  }
}
```

### 2. `pdfcn_list_components`
Enumera los componentes y bloques modulares disponibles en el registro local:

```json
{
  "name": "pdfcn_list_components",
  "description": "Lists available pre-built PDF building blocks (invoices, tables, receipt headers, signature blocks, page footers).",
  "inputSchema": {
    "type": "object",
    "properties": {
      "category": { "type": "string", "enum": ["all", "finance", "medical", "typography"], "default": "all" }
    }
  }
}
```

---

## 🏛️ Gobernanza y Rigor Visual

1. **Elegancia Tipográfica y Prestigio (Bernard Arnault):** Todo documento PDF emitido para More Paper, More Design o reportes médicos de ortopedia debe contar con márgenes exactos, fuentes de alta legibilidad (*Plus Jakarta Sans*, *Inter*) y balance estético impecable.
2. **Precisión Forense y Trazabilidad (Mohamed Kande / Janet Truncale):** Los documentos financieros y médicos deben incluir numeración de páginas obligatoria (`Página X de Y`), timestamp UTC de emisión y firma criptográfica o hash verificable.
