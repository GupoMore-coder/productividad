# 📈 Content Cheat Growth Engine MCP Registry Spec

> **Source:** [XBuilderLAB/cheat-on-content](https://github.com/XBuilderLAB/cheat-on-content)  
> **License:** MIT  
> **Domain:** Algorithmic Content Experimentation, Viral Hook Calibration, Blind-Predict Audience Scoring, Retrospective Evolution, Data-Driven Growth.

---

## 🎯 Visión Arquitectónica

Cheat-on-Content reemplaza la intuición descalibrada en marketing por un método científico riguroso (Philip Kotler / Bernard Arnault standard): trata cada publicación comercial o técnica como un experimento calibrado (Puntuación previa, predicción a ciegas, retro-análisis tras publicación y evolución continua del patrón ganador):

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Marketing Lead                │
└──────────────────────────────┬──────────────────────────────┘
                               │ Experiment Formulation
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Content Cheat Growth Engine                 │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Blind-Predict Scorer  │       │ Hook Calibrator       │  │
│  │ (Friction & Curvature)│       │ (First 3 Seconds)     │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Retrospective Engine: Post-Mortem of Real Metrics     │  │
│  │ Pattern Evolver: Extract Winning Angles for Brands    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `content_blind_predict`
Evalúa un borrador de copy, publicación en redes o propuesta de valor antes de publicarlo:

```json
{
  "name": "content_blind_predict",
  "description": "Scores a draft post or marketing copy against 5 viral vectors: curiosity gap, emotional resonance, cognitive ease, status signaling, and immediate call-to-value.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "draft_text": { "type": "string" },
      "target_platform": { "type": "string", "enum": ["x_twitter", "linkedin", "instagram", "newsletter", "whatsapp"] },
      "brand_identity": { "type": "string", "description": "e.g. More Paper (luxury artisanal), More Design (avant-garde architecture)" }
    },
    "required": ["draft_text", "target_platform"]
  }
}
```

### 2. `content_hook_calibrate`
Genera múltiples variaciones de gancho inicial (*hook*) optimizadas para retención extrema de atención:

```json
{
  "name": "content_hook_calibrate",
  "description": "Generates 5 distinct hook angles (contrarian, question-driven, curiosity cliff, data proof, storytelling) for a given premise.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "core_premise": { "type": "string" },
      "audience_persona": { "type": "string" }
    },
    "required": ["core_premise"]
  }
}
```

### 3. `content_retro_evolve`
Analiza los resultados de rendimiento de publicaciones anteriores para actualizar la guía de estilo de la marca:

```json
{
  "name": "content_retro_evolve",
  "description": "Performs retrospective analysis on published posts (views, saves, shares, replies) to identify which narrative structures outperformed expectations.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "post_content": { "type": "string" },
      "metrics": {
        "type": "object",
        "properties": {
          "impressions": { "type": "integer" },
          "engagements": { "type": "integer" },
          "conversion_actions": { "type": "integer" }
        }
      }
    },
    "required": ["post_content", "metrics"]
  }
}
```

---

## 🔒 Doctrina de Marca y Posicionamiento Premium

* **Anti-Commodity:** Prohibido generar contenido genérico o de bajo valor; todo mensaje para More Paper o More Design debe reflejar prestigio, diseño exclusivo y autoridad técnica.
* **Medición sin Vanidad:** El éxito no se mide únicamente en visualizaciones vacías, sino en retención de marca y conversión efectiva.
