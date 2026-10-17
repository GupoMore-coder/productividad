# 🧬 K-Dense Scientific Agent Skills MCP Registry Spec

> **Source:** [K-Dense-AI/scientific-agent-skills](https://github.com/K-Dense-AI/scientific-agent-skills)  
> **License:** Apache-2.0 / Open Source Standard (`agentskills.io`)  
> **Domain:** 170+ Validated Scientific Research Skills, 100+ Scientific Database Connectors (PubMed, USPTO, PDB, UniProt, ChEMBL), Systematic Literature Reviews, Hypothesis Formulation, Bioinformatics & Genomics Analysis, Pharmacology & Drug Discovery.

---

## 🎯 Visión Arquitectónica

Scientific Agent Skills equipa a los agentes con perfiles de razonamiento validados por la comunidad científica internacional. Permite automatizar la revisión sistemática de literatura médica y técnica, conectar con bases de datos moleculares y genómicas, y estructurar memorandos de investigación de rigor académico comparable a publicaciones de alto impacto:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Scientific Lead               │
└──────────────────────────────┬──────────────────────────────┘
                               │ Literature & Scientific MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              K-Dense Scientific Agent Core                  │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ 100+ Scientific DBs   │       │ Systematic Review     │  │
│  │ (PubMed, PDB, ChEMBL) │◄─────►│ Synthesis Engine      │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Bioinformatics, Molecular Biology & Patent Analysis   │  │
│  │ Evidence Tables, GRADE Ratings, Publication Memos     │  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `scientific_query_literature_databases`
Consulta bases de datos científicas y repositorios de patentes con operadores booleanos avanzados:

```json
{
  "name": "scientific_query_literature_databases",
  "description": "Searches PubMed, bioRxiv, arXiv, or USPTO for peer-reviewed papers, clinical trials, or patents.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string" },
      "database": { "type": "string", "enum": ["pubmed", "biorxiv", "arxiv", "uspto", "chembl"], "default": "pubmed" },
      "max_results": { "type": "integer", "default": 10 },
      "date_range": { "type": "string" }
    },
    "required": ["query"]
  }
}
```

### 2. `scientific_synthesize_evidence_profile`
Compila perfiles de evidencia con niveles GRADE a partir de un cuerpo de literatura médica/técnica:

```json
{
  "name": "scientific_synthesize_evidence_profile",
  "description": "Synthesizes scientific findings into an evidence profile matrix with GRADE quality scores and confidence intervals.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "topic": { "type": "string" },
      "study_pmids_or_dois": { "type": "array", "items": { "type": "string" } },
      "output_format": { "type": "string", "enum": ["markdown_table", "json_matrix", "executive_memo"], "default": "markdown_table" }
    },
    "required": ["topic", "study_pmids_or_dois"]
  }
}
```

### 3. `scientific_analyze_molecular_properties`
Inspecciona estructuras moleculares (PDB), secuencias de proteínas o propiedades fisicoquímicas:

```json
{
  "name": "scientific_analyze_molecular_properties",
  "description": "Parses molecular representations (SMILES, PDB structures) to extract binding affinities and physicochemical properties.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "identifier": { "type": "string" },
      "format": { "type": "string", "enum": ["smiles", "pdb_id", "uniprot_id"], "default": "smiles" }
    },
    "required": ["identifier"]
  }
}
```

---

## 🏛️ Rigor Científico y Medicina Basada en Evidencia (Demis Hassabis & Ortho Specialist)

1. **Rigor Científico desde Primeros Principios (Demis Hassabis):** Todo hallazgo o conclusión debe sustentarse en citas verificables, metodología reproducible y análisis estadístico robusto.
2. **Medicina Basada en Evidencia (Specialized Medical Specialist):** Distinguir rigurosamente entre ensayos clínicos aleatorizados (RCT), estudios observacionales y opiniones de expertos.
