---
name: react-pdf-generator-pdfcn
description: Modular, component-driven PDF generation in React and TypeScript based on pdfcn architecture (shadcn/ui copy-paste pattern, Takumi/Forme engines). Builds pixel-perfect invoices, surgical discharge summaries, and financial statements without external SaaS dependencies. Activate when designing print-ready PDF templates, automating corporate report generation, or structuring complex PDF documents with React components.
metadata:
  origin: Antigravity-Core
---

# 📄 React PDF Generator pdfcn

This skill defines the **component-driven enterprise PDF generation standard** (Bernard Arnault luxury print aesthetics / Mohamed Kande auditable reporting / Jeff Dean low-latency rendering) for compiling structured JSON data into high-fidelity PDF documents.

---

## 🎯 When to Use

* **Commercial Invoices & Orders:** Generating branded invoices for More Paper and More Design with itemized totals, tax breakdowns, and payment QR codes.
* **Clinical & Surgical Reports:** Creating orthopedic patient reports, biomechanical assessments, and discharge documentation with strict page budgets.
* **Financial & Audit Statements:** Producing multi-page accounting statements compliant with Big-4 presentation standards.
* **Self-Hosted, SaaS-Free PDF Rendering:** Replacing expensive third-party PDF cloud APIs with local, deterministic React component compilation.

---

## 🧭 The 4-Pillar PDF Composition Loop

```
1. Schema & Component Composition ──► 2. Layout & Page Budgeting ──► 3. Engine Compilation ──► 4. Output Verification
```

### Pillar 1: Schema & Component Composition
- Define a strict TypeScript interface / Zod schema for the incoming document payload.
- Assemble the document using modular primitives (`<Document>`, `<Page>`, `<Header>`, `<Table>`, `<SignatureBlock>`).

### Pillar 2: Layout & Page Budgeting
- Set standard print dimensions (A4: `210mm x 297mm`, margin: `12mm-15mm`).
- Prevent awkward page breaks across table rows using CSS `break-inside: avoid`.
- Include dynamic page counter in running footer (`Page {pageNumber} of {totalPages}`).

### Pillar 3: Engine Compilation (Takumi / Forme)
- Compile React tree directly into vector PDF instructions.
- Embed web fonts (e.g. *Plus Jakarta Sans*, *JetBrains Mono* for figures) natively.
- Render SVG vector barcodes and QR codes without raster blur.

### Pillar 4: Output Verification
- Verify file generation size and check that layout does not overflow intended page limits.
- Confirm total calculation accuracy against database records.

---

## 🛡️ Enterprise Rigor Checklist

- [ ] **No SaaS Dependency:** PDFs compile 100% locally on the host server.
- [ ] **Zero Layout Clipping:** Text and tabular columns verified against edge boundaries.
- [ ] **Audit Metadata:** Generated PDF embeds creator ID, generation timestamp, and document UUID in PDF metadata dictionary.
