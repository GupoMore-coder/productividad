# 🐼 PandasAI Conversational Tabular Analytics MCP Registry Spec

> **Source:** [sinaptik-ai/pandas-ai](https://github.com/sinaptik-ai/pandas-ai)  
> **License:** MIT / Open Source  
> **Domain:** Conversational Generative AI over Pandas DataFrames, SQL Databases & CSV/Parquet Files, Natural Language Queries to Transformations, Automated Chart Generation, Data Profiling & Statistical Insight Synthesis.

---

## 🎯 Visión Arquitectónica

PandasAI transforma conjuntos de datos tabulares estáticos en fuentes de conocimiento conversacionales e interactivas. Los agentes formulan preguntas analíticas en lenguaje natural ("¿Cuál es el margen operativo promedio por categoría de producto?") y PandasAI genera, valida y ejecuta código determinista de Pandas en un entorno seguro, retornando tablas, métricas o gráficos:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Data Analyst                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Natural Language Data Query
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      PandasAI Engine                        │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Semantic Query Parser │       │ Pandas Code Generator │  │
│  │ (Intent & Schema Map) │◄─────►│ (Deterministic Python)│  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Safe Execution Sandbox (DataFrames / SQLite / DuckDB) │  │
│  │ Matplotlib / Seaborn Visualizer & Statistical Profiler│  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `pandasai_query_dataframe`
Ejecuta una consulta en lenguaje natural sobre un conjunto de datos tabular:

```json
{
  "name": "pandasai_query_dataframe",
  "description": "Executes a natural language question against a tabular dataset, returning calculated metrics, filtered rows, or summary tables.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string" },
      "data_source_path": { "type": "string" },
      "source_format": { "type": "string", "enum": ["csv", "parquet", "json", "sqlite", "excel"], "default": "csv" }
    },
    "required": ["query", "data_source_path"]
  }
}
```

### 2. `pandasai_generate_chart`
Genera gráficos analíticos basados en instrucciones conversacionales:

```json
{
  "name": "pandasai_generate_chart",
  "description": "Generates a dynamic statistical visualization (bar, line, scatter, histogram, boxplot) and exports to SVG or PNG.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "data_source_path": { "type": "string" },
      "visualization_prompt": { "type": "string" },
      "chart_type": { "type": "string", "enum": ["bar", "line", "scatter", "histogram", "pie", "heatmap"], "default": "bar" },
      "output_path": { "type": "string" }
    },
    "required": ["data_source_path", "visualization_prompt", "output_path"]
  }
}
```

### 3. `pandasai_explain_dataset`
Genera un perfil estadístico forense completo (valores atípicos, dispersión, correlaciones, datos faltantes):

```json
{
  "name": "pandasai_explain_dataset",
  "description": "Performs comprehensive forensic data profiling on a dataset, identifying null ratios, skewness, and key summary statistics.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "data_source_path": { "type": "string" },
      "detect_outliers": { "type": "boolean", "default": true }
    },
    "required": ["data_source_path"]
  }
}
```

---

## 🏛️ Gobernanza y Rigor de Auditoría (Big-4 & Bezos)

1. **Obsesión por la Verdad de los Datos (Jeff Bezos):** Evitar métricas vanidosas. Los cálculos deben ser deterministas y auditables línea por línea.
2. **Rigor Forense y Reconciliación (Mohamed Kande / Janet Truncale):** Asegurar que las transformaciones tabulares mantengan consistencia contable y no introduzcan distorsiones por valores nulos no controlados.
3. **Sandboxing Seguro:** El código Python generado por LLM debe ejecutarse en un entorno acotado sin acceso a llamadas de red no autorizadas ni escritura arbitraria en el sistema operativo.
