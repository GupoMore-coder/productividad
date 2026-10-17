---
name: corpus-to-agent-skill
description: Automated synthesis of technical books, clinical manuals, and document folders into standardized, on-demand AI agent skills (SKILL.md) based on book-to-skill methodology. Extracts high-density decision trees, procedural algorithms, and domain axioms while stripping prose bloat. Activate when converting medical textbooks, legal treatises, or corporate standard operating procedures into actionable agent skills.
metadata:
  origin: Antigravity-Core
---

# 📚 Corpus to Agent Skill

This skill defines the **knowledge distillation and skill synthesis standard** (Demis Hassabis first-principles abstraction / Andy Jassy frugal zero-waste context) for converting massive texts into lean, executable agent capabilities.

---

## 🎯 When to Use

* **Medical Manual Distillation:** Converting orthopedic surgical atlases or AO surgery manuals into operational diagnostic decision trees.
* **Corporate Governance Codification:** Synthesizing financial audit guides or legal compliance manuals into executable checklists.
* **Technical Framework Ingestion:** Turning entire programming books or API specifications into concise pattern guides.
* **Zero-Context-Bloat Optimization:** Replacing repetitive 500-page document uploads with a single 60-line on-demand skill file.

---

## 🧭 The 4-Step Distillation Protocol

```
1. Structural Indexing ──► 2. Axiom & Rule Extraction ──► 3. Pattern Synthesis ──► 4. SKILL.md Packaging
```

### Step 1: Structural Indexing & Scope Boundaries
- Ingest source format (PDF, EPUB, DOCX, MD) via `rust-doc-parser-anydoc` or native parsers.
- Map the table of contents to identify the operational core and filter out historical or anecdotal chapters.

### Step 2: Axiom & Procedural Rule Extraction
- Identify *Condition-Action* rules (e.g., "If fracture classification is 33-C3, then apply distal femoral anatomical plate").
- Extract tabular criteria, thresholds, contraindicated conditions, and edge-case exceptions.

### Step 3: Pattern Synthesis & Cheatsheet Compression
- Compress verbose explanations into dense comparison tables or ASCII workflow diagrams.
- Formulate practical "When to Use" criteria and step-by-step phases.

### Step 4: Standard Packaging
- Generate valid YAML frontmatter (`name`, `description`, `metadata`).
- Include mandatory *Verification Gate / Checklist* ensuring safe and reproducible execution.
- Save to `.agents/catalogs/skills/<skill-name>/SKILL.md`.

---

## 🛡️ Synthesis Quality Rules

- [ ] **Zero Redundancy:** Discard introductions, anecdotes, and redundant filler prose.
- [ ] **High Factual Density:** Every bullet point must provide actionable guidance.
- [ ] **Standard Compliance:** Frontmatter and structure conform strictly to Antigravity Skill standards.
