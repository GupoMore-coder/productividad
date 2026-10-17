---
name: swe-automated-assessment
description: Automated software engineering assessment and pedagogical code grading based on TU Munich Artemis architecture (distinct from Google Artemis mobile automation). Evaluates source code against structured test suites, static analysis rules, and rubrics to provide deterministic grading and educational feedback. Activate when evaluating code assignments, auditing programming submissions, generating structured code feedback, or benchmarking student/junior developer implementations.
metadata:
  origin: Antigravity-Core
---

# 🎓 SWE Automated Assessment (TUM Artemis Architecture)

This skill formalizes the **automated code assessment and pedagogical evaluation protocol** (Demis Hassabis algorithmic rigor / Joe Ucuzoglu auditable governance) based on the TUM Artemis platform.

---

## 🎯 When to Use

* **Automated Code Grading:** Scoring software engineering submissions against standardized test suites and style standards.
* **Constructive Debugging Feedback:** Providing progressive hints and conceptual guidance without spoiling complete code solutions.
* **Code Quality & Style Auditing:** Enforcing static analysis guidelines (Checkstyle, ESLint, flake8) across submitted codebases.
* **Plagiarism & Clone Detection:** Identifying structural similarities and copy-paste code clones via AST analysis.

---

## 🧭 The 4-Stage Assessment Workflow

```
1. Build & Static Analysis ──► 2. Test Suite Execution ──► 3. Rubric Scoring ──► 4. Pedagogical Feedback Generation
```

### Stage 1: Build & Static Analysis
- Verify compilation without warnings.
- Run static linters to audit code conventions, cyclomatic complexity, and naming hygiene.

### Stage 2: Test Suite Execution
- Execute public and hidden verification test suites.
- Capture edge-case failures, boundary condition errors, and timeout violations.

### Stage 3: Rubric Scoring
- Apply weighted grading rubrics across functional correctness, performance, and code readability.
- Reconcile deterministic point totals.

### Stage 4: Pedagogical Feedback Generation
- Formulate actionable, empathetic feedback (Mustafa Suleyman UX principles).
- Frame hints in terms of programming concepts (e.g., "Consider boundary conditions for empty arrays") rather than revealing diffs.

---

## 🛡️ Evaluation Guardrails

- [ ] **Hermetic Sandbox Execution:** Execute test suites in isolated sandbox containers to prevent security escapes or unintended host modification.
- [ ] **Deterministic Scoring:** Ensure grading results are strictly reproducible given the same source input.
- [ ] **No Spoilers in Hints:** Ensure hints provide conceptual illumination without copying the reference answer.
