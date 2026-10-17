# 📚 Karpathy LLM Wiki Knowledge Architecture MCP Registry Spec

> **Source:** [karpathy/442a6bf555914893e9891c11519de94f](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)  
> **Author:** Andrej Karpathy  
> **License:** Public / MIT Spec  
> **Domain:** LLM-Maintained Knowledge Bases, Vectorless Deterministic RAG, Plain-Text Markdown Wikis, Concept & Entity Graph Indexing, Human-Agent Collaborative Knowledge Workspaces.

---

## 🎯 Visión Arquitectónica

El paradigma **LLM Wiki** propuesto por Andrej Karpathy sustituye la opacidad y los fallos de recuperación de las bases de datos vectoriales tradicionales (RAG con chunking ciego) por una **Wiki estructurada en Markdown**, mantenida de forma colaborativa entre humanos y modelos LLM.

Cada documento es una página atómica (`concepts/`, `entities/`, `sources/`), con hipervínculos cruzados (`[Concepto](file://...)`), metadatos YAML y resúmenes estructurados. El LLM actúa como bibliotecario inteligente: digiere fuentes primarias, sintetiza conceptos atómicos, actualiza índices temáticos (`index.md`) y resuelve contradicciones documentales con total trazabilidad.

```
┌─────────────────────────────────────────────────────────────┐
│                 Raw Sources & Research Feeds                │
│             (Papers, Articles, Transcripts, Notes)          │
└──────────────────────────────┬──────────────────────────────┘
                               │ Ingestion & Entity Extraction
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Karpathy LLM Wiki Engine                   │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ atomic-concepts/      │       │ entities-and-actors/  │  │
│  │ (Definitions & Logic) ◄──────►│ (People, Projects, DB)│  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Deterministic Markdown Graph Index (index.md / TOC)   │  │
│  │ Backlinks, Cross-References, Source Provenance Audits │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Direct File-Reading Navigation
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Antigravity Agents & Human Researchers          │
│               (Zero Opaque Chunks, 100% Verifiable)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `karpathy_wiki_ingest_source`
Ingesta un documento fuente (artículo, transcripción, paper), extrae hechos relevantes y sugiere la creación o actualización de páginas conceptuales:

```json
{
  "name": "karpathy_wiki_ingest_source",
  "description": "Ingests a raw source document, archives it in sources/, and extracts atomic entities and concepts for the wiki.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "source_path": { "type": "string", "description": "Path to the raw source file or markdown text." },
      "source_title": { "type": "string", "description": "Descriptive title of the source." },
      "tags": { "type": "array", "items": { "type": "string" }, "description": "Taxonomy tags." }
    },
    "required": ["source_path", "source_title"]
  }
}
```

### 2. `karpathy_wiki_update_concept`
Crea o actualiza incrementalmente una página de concepto atómico, manteniendo hipervínculos bidireccionales y citas precisas a fuentes primarias:

```json
{
  "name": "karpathy_wiki_update_concept",
  "description": "Synthesizes or amends an atomic concept markdown page with definitions, relationships, and citations.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "concept_name": { "type": "string", "description": "Unique identifier / filename for the concept (e.g. self-attention)." },
      "category": { "type": "string", "enum": ["concept", "entity", "synthesis", "methodology"] },
      "content_markdown": { "type": "string", "description": "Structured markdown content with backlinks." },
      "related_concepts": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["concept_name", "category", "content_markdown"]
  }
}
```

### 3. `karpathy_wiki_reindex_catalogs`
Regenera los índices temáticos maestros (`index.md`, mapas de conocimiento y grafo de backlinks) para garantizar navegación directa sin saltos ciegos:

```json
{
  "name": "karpathy_wiki_reindex_catalogs",
  "description": "Rebuilds the master index.md, category tables, and backlink graph for the entire wiki repository.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "wiki_root_path": { "type": "string", "description": "Path to the wiki directory." },
      "generate_visual_graph": { "type": "boolean", "default": false }
    },
    "required": ["wiki_root_path"]
  }
}
```

### 4. `karpathy_wiki_query_graph`
Ejecuta búsquedas de grafo deterministas rastreando conceptos conectados y fuentes asociadas sin requerir bases de datos vectoriales pesadas:

```json
{
  "name": "karpathy_wiki_query_graph",
  "description": "Traverses the markdown wiki graph to resolve complex multi-hop queries using exact file navigation.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "entry_concept": { "type": "string", "description": "Initial concept page to anchor the graph traversal." },
      "max_depth": { "type": "integer", "default": 2 },
      "target_query": { "type": "string", "description": "Information need or research question to resolve." }
    },
    "required": ["entry_concept", "target_query"]
  }
}
```

---

## 🏛️ Doctrina del Consejo Asesor Global

* **Warren Buffett (Berkshire Hathaway):** *Preservación del Conocimiento Real*. Las bases de datos vectoriales opacas son "cajas negras" con riesgo de alucinación e indexación inauditable. La Wiki en texto plano Markdown es el balance contable transparente del conocimiento: cada afirmación tiene un enlace verificable a su fuente original.
* **Andy Jassy (Amazon):** *Primitivas Claras y Estructura Desacoplada*. Markdown y Git son primitivas universales a prueba del tiempo. Al desacoplar el conocimiento del runtime del modelo, la organización mantiene propiedad soberana sobre sus activos de inteligencia.
