# 📚 Book-to-Skill Knowledge Synthesis MCP Registry Spec

> **Source:** [virgiliojr94/book-to-skill](https://github.com/virgiliojr94/book-to-skill)  
> **License:** MIT  
> **Domain:** Technical Book & Corpus to Unified Agent Skill Compiler, Multi-Format Ingestion (PDF, EPUB, DOCX, MD, HTML, RTF, MOBI), Automated Synthesis into Standard `SKILL.md` with Cheatsheets, Key Patterns, and Reference Indexes for Claude Code, Antigravity, and Hermes Agent.

---

## 🎯 Visión Arquitectónica

`book-to-skill` es un compilador de conocimiento diseñado para transformar grandes volúmenes de literatura técnica, manuales médicos o carpetas de documentación en habilidades agénticas compactas y operativas (`SKILL.md`). En lugar de forzar a un modelo a leer libros enteros en cada consulta (saturando contexto y generando alucinaciones), extrae axiomas, reglas prácticas y tablas de decisión:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Knowledge Architect           │
└──────────────────────────────┬──────────────────────────────┘
                               │ Corpus Synthesis Pipeline / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Book-to-Skill Compiler                    │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Multi-Format Ingest   │       │ Semantic Synthesizer  │  │
│  │ (PDF/EPUB/DOCX/MOBI)  │◄─────►│ (Rules & Cheatsheets) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Standard Output: .agents/catalogs/skills/<name>/SKILL.md│
│  │ YAML Frontmatter, Decision Tables, Verification Gates │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `book_to_skill_synthesize`
Transforma un libro técnico o directorio de documentos en una habilidad operativa estándar `SKILL.md`:

```json
{
  "name": "book_to_skill_synthesize",
  "description": "Synthesizes a technical book, clinical manual, or document folder (PDF/EPUB/DOCX/MD) into a compact, standardized agent skill (SKILL.md) with YAML frontmatter, execution workflows, and decision tables.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "source_path": { "type": "string", "description": "Path to the book file or directory of source documents." },
      "skill_name": { "type": "string", "description": "Target skill identifier (kebab-case, e.g., ortho-ao-classification)." },
      "domain_focus": { "type": "string", "description": "Specific analytical lens (e.g., surgical technique, financial risk, code patterns)." },
      "output_dir": { "type": "string", "default": ".agents/catalogs/skills" }
    },
    "required": ["source_path", "skill_name"]
  }
}
```

### 2. `book_to_skill_extract_cheatsheet`
Genera una tabla de referencia rápida o cheatsheet conciso a partir de un texto extenso:

```json
{
  "name": "book_to_skill_extract_cheatsheet",
  "description": "Extracts high-density decision trees, diagnostic criteria, or command matrices from technical source texts into a Markdown cheatsheet.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "document_path": { "type": "string" },
      "max_entries": { "type": "integer", "default": 20 }
    },
    "required": ["document_path"]
  }
}
```

---

## 🏛️ Directivas de Síntesis y Calidad

1. **Destilación sin Relleno (Andy Jassy / Warren Buffett):** Eliminar narrativa superflua; retener únicamente axiomas aplicables, advertencias de falla y tablas de decisión determinísticas.
2. **Estructura Estándar Antigravity (Antigravity Senior Architect):** Toda habilidad producida debe respetar el formato oficial con metadatos YAML (`name`, `description`, `origin`), sección *When to Use*, *Pillars/Stages* y compuerta *Verification Gate*.
