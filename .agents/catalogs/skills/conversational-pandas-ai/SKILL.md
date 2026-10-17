---
name: conversational-pandas-ai
description: Conversational data analysis and visualization engine using PandasAI. Translates natural language questions into secure Pandas transformations, statistical summaries, and dynamic charts directly from CSV, Parquet, and SQL sources without manual boilerplate code. Activate when interrogating tabular datasets, generating ad-hoc data charts, discovering correlations, or automating business intelligence explorations.
metadata:
  origin: Antigravity-Core
---

# 🐼 Conversational PandasAI Analytics

This skill provides a **conversational intelligence layer for tabular datasets** (Jeff Bezos data-driven rigor / Mohamed Kande auditable analytics) using PandasAI to turn raw data into insights and charts.

---

## 🎯 When to Use

* **Interactive Dataset Interrogation:** Answering business questions (e.g., "What was the year-over-year revenue growth per region?") in natural language.
* **Instant Chart Creation:** Generating publication-quality charts (bar, line, scatter, box plots) without writing Matplotlib/Seaborn scripts manually.
* **Data Quality Profiling:** Detecting anomalous outliers, skewed distributions, and null values in financial or operational tables.
* **Rapid Feature Prototyping:** Exploring relationship hypotheses between variables prior to formal ML modeling.

---

## 🧭 The 4-Step Conversational Analytics Loop

```
1. Schema & Profile Inspection ──► 2. Intent Parsing ──► 3. Safe Code Generation & Run ──► 4. Forensic Output Audit
```

### Step 1: Schema & Profile Inspection
- Read columns, data types, and initial row distributions.
- Validate categorical encodings and date-time format consistency.

### Step 2: Intent Parsing
- Translate the user's analytical query into unambiguous aggregations (sum, mean, median, group by).
- Guard against ambiguity in time windows or metric definitions.

### Step 3: Safe Code Generation & Run
- Generate concise, idiomatic Pandas/DuckDB transformations.
- Execute within an isolated environment, preventing unintended file mutations.

### Step 4: Forensic Output Audit (Big-4 Standard)
- Reconcile computed totals against original row counts.
- Present findings with clear statistical context, confidence intervals, and visualization artifacts.

---

## 🛡️ Data Integrity Guardrails

- [ ] **No Destructive Overwrite:** Never mutate original data files in place; output to new derived frames or files.
- [ ] **Deterministic Aggregation:** Verify groupby groupings to ensure no silent dropped rows due to NaN keys.
- [ ] **Zero Execution Escape:** Reject any queries generating external network calls or unauthorized shell invocations.
