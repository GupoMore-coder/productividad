---
name: editorial-diagram-design
description: Editorial-quality system architecture and technical diagram design based on diagram-design framework. Produces handcrafted, self-contained SVG and responsive HTML visual representations across 40+ diagram archetypes (architecture topologies, state machines, sequence flows, ERDs), avoiding generic "Mermaid-slop" in favor of bespoke craftsmanship under Bernard Arnault standards. Activate when creating technical documentation, designing architecture blueprints, presenting system workflows, or upgrading low-aesthetic diagrams.
metadata:
  origin: Antigravity-Core
---

# 📐 Editorial Diagram Design (Diagram-Design Architecture)

This skill formalizes the **editorial-grade technical diagramming standard** (Bernard Arnault luxury craftsmanship / Jeff Bezos architectural clarity). It replaces generic boilerplate diagrams with bespoke visual assets.

---

## 🎯 When to Use

* **Architecture Blueprints:** Communicating distributed system topologies, microservices, and network boundaries.
* **Executive & Board Memos:** Presenting clean, publication-ready diagrams to investors and leadership councils.
* **Complex State Machines:** Modeling state transitions, distributed saga patterns, and lifecycle flows.
* **Database & Entity Relationship Models:** Documenting schemas, relationships, and foreign keys cleanly.

---

## 🧭 The 4-Step Editorial Diagramming Process

```
1. Typology Selection ──► 2. Palette & Token Definition ──► 3. Semantic Graph Layout ──► 4. Standalone Output Export
```

### Step 1: Typology Selection
- Select the archetype from 40+ available models (e.g., container architecture, sequence flow, state machine, pipeline graph).
- Define visual hierarchy: primary nodes, secondary services, edge relationships, and data directions.

### Step 2: Palette & Token Definition
- Configure brand tokens (Paper: background tones; Ink: typography and borders; Accents: highlight colors).
- Select presentation variant: `minimal_light`, `minimal_dark`, or `full_editorial`.

### Step 3: Semantic Graph Layout
- Group logical subsystems into clear bounding clusters.
- Label connections with descriptive protocol tags (e.g., "gRPC / Protobuf", "PostgreSQL Wire").

### Step 4: Standalone Output Export
- Export to pure SVG or self-contained HTML.
- Ensure zero external network calls or fragile CDN font requirements.

---

## 🛡️ Aesthetic & Integrity Guardrails

- [ ] **No Generic Slop:** Avoid raw, unstyled default Mermaid shapes with harsh saturated primary colors.
- [ ] **High Contrast Accessibility:** Ensure text-to-background contrast ratios strictly meet WCAG AA standards.
- [ ] **Responsive Scaling:** Ensure SVGs include clean `viewBox` attributes for seamless responsive embedding.
