# 🎓 Artemis SWE Automated Assessment MCP Registry Spec

> **Source:** [ls1intum/Artemis](https://github.com/ls1intum/Artemis) (Technical University of Munich)  
> **License:** MIT / Open Source  
> **Domain:** Automated Software Engineering Assessment & Interactive Feedback Platform, Test-Driven Grading Engines, Static Code Analysis, Algorithmic Verification, Pedagogical Feedback Synthesis, AST Plagiarism & Code Clone Detection. Distinct from Google Artemis mobile automation.

---

## 🎯 Visión Arquitectónica

Artemis (TUM) es la plataforma de referencia académica e industrial para la evaluación automatizada y el feedback continuo en ingeniería de software. A diferencia de un simple ejecutor de pruebas unitarias, Artemis evalúa la calidad estructural del código, el cumplimiento de especificaciones y proporciona retroalimentación formativa y pedagógica inmediata:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Evaluator                │
└──────────────────────────────┬──────────────────────────────┘
                               │ Code Assessment Request / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Artemis Evaluation Core                   │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Static Analysis Linter│       │ Test Suite Runner     │  │
│  │ (Style, AST, Clones)  │◄─────►│ (JUnit, PyTest, Jest) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Scoring Engine & Pedagogical Feedback Synthesizer     │  │
│  │ Hints, Structural Rubrics, Algorithmic Correctness    │  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `artemis_evaluate_code_submission`
Ejecuta la evaluación integral de un repositorio de código frente a una suite de pruebas y rúbricas de calidad:

```json
{
  "name": "artemis_evaluate_code_submission",
  "description": "Evaluates a code submission against unit tests, static code checkers, and defined grading criteria.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "submission_path": { "type": "string" },
      "test_suite_path": { "type": "string" },
      "language": { "type": "string", "enum": ["java", "python", "typescript", "c", "cplusplus"], "default": "typescript" },
      "rubric_id": { "type": "string" }
    },
    "required": ["submission_path", "test_suite_path"]
  }
}
```

### 2. `artemis_generate_pedagogical_feedback`
Sintetiza retroalimentación formativa y pistas de depuración sin revelar la solución completa:

```json
{
  "name": "artemis_generate_pedagogical_feedback",
  "description": "Generates constructive feedback for failed test cases and style violations, guiding the developer toward the fix.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "test_results": { "type": "object" },
      "source_excerpts": { "type": "array", "items": { "type": "string" } },
      "pedagogical_depth": { "type": "string", "enum": ["hint_only", "conceptual_explanation", "detailed_guidance"], "default": "conceptual_explanation" }
    },
    "required": ["test_results"]
  }
}
```

### 3. `artemis_audit_code_plagiarism_similarity`
Compara la estructura del AST entre múltiples soluciones para detectar duplicación o plagio:

```json
{
  "name": "artemis_audit_code_plagiarism_similarity",
  "description": "Analyzes AST structure across code submissions to detect structural plagiarism and code clones.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "target_submission_path": { "type": "string" },
      "corpus_path": { "type": "string" },
      "similarity_threshold": { "type": "number", "default": 0.8 }
    },
    "required": ["target_submission_path", "corpus_path"]
  }
}
```

---

## 🏛️ Rigor Académico y Algorítmico (Demis Hassabis & Ucuzoglu)

1. **Razonamiento desde Primeros Principios (Demis Hassabis):** Evaluar no solo si el código compila y pasa pruebas básicas, sino si la solución exhibe eficiencia algorítmica y modularidad óptima.
2. **Gobernanza y Transparencia de Evaluación (Joe Ucuzoglu / Deloitte):** Toda puntuación o feedback emitido debe sustentarse en criterios objetivos, trazables y auditables.
