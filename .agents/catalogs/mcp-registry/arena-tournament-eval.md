# 🏆 Arena Multi-Agent Tournament & Evolutionary Evaluation MCP Registry Spec

> **Source:** [Jakeschincariol/arena-skill](https://github.com/Jakeschincariol/arena-skill)  
> **Author:** Jake Schincariol  
> **License:** MIT / Open Source  
> **Domain:** Multi-Agent Tournament Brackets, Evolutionary Solution Selection, Parallel Strategy Exploration, Adversarial Cross-Critique, LLM-as-a-Judge Evaluation, Pareto Frontier Optimization.

---

## 🎯 Visión Arquitectónica

**Arena Skill** es un marco de competición multi-agente diseñado para superar las limitaciones de las respuestas individuales en tareas complejas o con respuestas iniciales insatisfactorias. En lugar de iterar secuencialmente sobre un único borrador, el sistema despliega múltiples agentes en paralelo con diversas estrategias y los enfrenta en un torneo eliminatorio (bracket de doble eliminación o ronda suiza) donde critican mutuamente sus propuestas hasta que solo la solución más sólida, elegante y verificada prevalece:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Architect                │
└──────────────────────────────┬──────────────────────────────┘
                               │ Challenging Problem / Suboptimal Draft
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Arena Tournament Evaluation Engine            │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Parallel Competitors  │       │ Cross-Critique        │  │
│  │ (Diverse Strategies)  ◄──────►│ & Debate Matrix       │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Tournament Bracket Scorer (LLM-as-a-Judge Jury)       │  │
│  │ Pareto Filtering (Correctness, Brevity, Elegance)     │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Champion Solution Extraction
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Production-Ready Optimal Artifact             │
│            (Rigorously Stress-Tested & Peer-Reviewed)       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `arena_spawn_competitors`
Genera $N$ propuestas de solución en paralelo utilizando diferentes arquetipos estratégicos (conservador, modular, optimizado para rendimiento, ultra-minimalista):

```json
{
  "name": "arena_spawn_competitors",
  "description": "Generates multiple competing solution candidates in parallel using distinct problem-solving strategies.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "problem_statement": { "type": "string", "description": "The coding or architectural challenge to resolve." },
      "competitor_count": { "type": "integer", "default": 4, "minimum": 2, "maximum": 16 },
      "strategy_profiles": { "type": "array", "items": { "type": "string" }, "description": "e.g. ['performance', 'readability', 'resilience', 'lean']" }
    },
    "required": ["problem_statement"]
  }
}
```

### 2. `arena_execute_critique_round`
Ejecuta una ronda de revisión ciega cruzada donde cada agente examina las propuestas rivales para detectar vulnerabilidades, casos límite no contemplados y complejidad innecesaria:

```json
{
  "name": "arena_execute_critique_round",
  "description": "Orchestrates adversarial peer review where competitors critique each other's solutions blindly.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "tournament_id": { "type": "string" },
      "candidate_solutions": { "type": "array", "items": { "type": "object" } },
      "evaluation_criteria": { "type": "array", "items": { "type": "string" }, "default": ["correctness", "edge_case_handling", "maintainability", "efficiency"] }
    },
    "required": ["tournament_id", "candidate_solutions"]
  }
}
```

### 3. `arena_score_tournament_bracket`
Calcula las puntuaciones ponderadas de cada propuesta basándose en los veredictos del jurado y la matriz de críticas, eliminando las soluciones inferiores:

```json
{
  "name": "arena_score_tournament_bracket",
  "description": "Computes Elo/bracket rankings for competing solutions and filters out candidates that fail safety or correctness gates.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "tournament_id": { "type": "string" },
      "critique_feedbacks": { "type": "array", "items": { "type": "object" } }
    },
    "required": ["tournament_id", "critique_feedbacks"]
  }
}
```

### 4. `arena_synthesize_champion_solution`
Sintetiza la solución ganadora incorporando los mejores componentes validados de las propuestas semifinalistas y descartando cualquier defecto identificado:

```json
{
  "name": "arena_synthesize_champion_solution",
  "description": "Synthesizes the champion solution, merging superior facets of top-scoring candidates into a final verified output.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "tournament_id": { "type": "string" },
      "winner_candidate_id": { "type": "string" }
    },
    "required": ["tournament_id", "winner_candidate_id"]
  }
}
```

---

## 🏛️ Doctrina del Consejo Asesor Global

* **Charlie Munger / Warren Buffett (Berkshire Hathaway):** *Inversión, Crítica Mutua y Destrucción de Errores*. Ningún modelo o individuo debe confiar ciegamente en su primera idea. Al enfrentar múltiples tesis en un debate competitivo y adversarial, los sesgos y debilidades quedan expuestos antes de que causen daños operativos.
* **Jensen Huang (NVIDIA):** *Concurrencia Masiva y Reducción Algorítmica*. La potencia del cómputo moderno permite explorar el espacio de soluciones de forma no lineal. Generar alternativas en paralelo y reducirlas por torneo maximiza la probabilidad de hallar el óptimo global.
