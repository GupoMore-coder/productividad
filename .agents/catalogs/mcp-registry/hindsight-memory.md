# 🧠 Hindsight Adaptive Agent Memory MCP Registry Spec

> **Source:** [vectorize-io/hindsight](https://github.com/vectorize-io/hindsight)  
> **License:** Apache-2.0 / Open Source  
> **Domain:** Long-Term Agentic Memory, #1 on LongMemEval Benchmark, Cognitive Tripartite Architecture (`retain`, `recall`, `reflect`), Cross-Session Fact Consolidation, Temporal Decay Mitigation, Native MCP Server.

---

## 🎯 Visión Arquitectónica

Hindsight es una arquitectura de memoria a largo plazo diseñada para agentes autónomos que supera las limitaciones de ventanas de contexto estáticas y RAG ingenuo. Implementa un ciclo cognitivo continuo de tres operaciones fundamentales: **Retain** (ingesta selectiva y extracción de hechos episódicos), **Recall** (recuperación contextual con ordenación por relevancia temporal y semántica) y **Reflect** (consolidación analítica de conocimientos y abstracción de patrones):

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Specialist               │
└──────────────────────────────┬──────────────────────────────┘
                               │ Hindsight Memory Protocol / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Hindsight Engine                       │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Retain (Episodic)     │       │ Recall (Semantic)     │  │
│  │ Fact Extraction & Time│◄─────►│ Temporal Decay Weight │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Reflect: Cross-Session Synthesis & Behavioral Rules   │  │
│  │ Memory Graph: Deduplication, Reinforcement, Pruning   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `hindsight_retain`
Extrae y almacena hechos clave, decisiones del usuario, directivas operativas o restricciones de contexto de una interacción:

```json
{
  "name": "hindsight_retain",
  "description": "Extracts atomic facts, user preferences, and project decisions from conversation turns and stores them into the persistent episodic memory store.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "content": { "type": "string", "description": "Raw dialogue turn or statement to analyze and retain." },
      "category": { "type": "string", "enum": ["preference", "decision", "technical_fact", "business_rule", "medical_rule"], "default": "technical_fact" },
      "source_session_id": { "type": "string" },
      "confidence": { "type": "number", "default": 1.0 }
    },
    "required": ["content"]
  }
}
```

### 2. `hindsight_recall`
Recupera memorias pasadas relevantes ponderando la similitud semántica y la proximidad/recencia temporal:

```json
{
  "name": "hindsight_recall",
  "description": "Queries the agent memory graph for relevant prior knowledge, user habits, and established project patterns matching a current query.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Current user prompt or problem context." },
      "limit": { "type": "integer", "default": 5 },
      "min_relevance": { "type": "number", "default": 0.7 },
      "decay_halflife_days": { "type": "number", "default": 30 }
    },
    "required": ["query"]
  }
}
```

### 3. `hindsight_reflect`
Consolida memorias episódicas dispersas en axiomas de alto nivel, identificando contradicciones o patrones recurrentes:

```json
{
  "name": "hindsight_reflect",
  "description": "Performs background cognitive reflection over retained memories, consolidating disparate observations into high-order principles and resolving contradictions.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "topic": { "type": "string", "description": "Target topic or system domain to reflect upon." },
      "consolidate_duplicates": { "type": "boolean", "default": true }
    },
    "required": ["topic"]
  }
}
```

---

## 🏛️ Directivas Cognitivas y de Calidad

1. **Memoria como Activo Compuesto (Warren Buffett):** La memoria persistente no debe ser un volcado caótico de texto, sino un activo de conocimiento refinado que acumula valor con cada interacción.
2. **Alineación Constitucional y Cero Alucinación (Dario Amodei):** Los hechos memorizados deben contar con trazabilidad de origen y no sobreescribir las reglas maestras de seguridad.
3. **Poda Automática y Frugalidad (Andy Jassy):** Hechos efímeros o desactualizados deben pasar por ciclos de atenuación (*decay*) y poda programada para no saturar el espacio de búsqueda.
