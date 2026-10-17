# 🧮 Medical Risk Calculators & Clinical Equations (Medical-Calc MCP)

> **Source:** [u9401066/medical-calc-mcp](https://github.com/u9401066/medical-calc-mcp)
> **Domain:** Model Context Protocol (MCP) server for clinical decision support, validated medical formulas, laboratory unit conversions.

---

## 🎯 Core Mathematical & Clinical Equations

Provides deterministic execution of clinically validated scoring tools:

### 1. Renal Function: Cockcroft-Gault CrCl
Calculates estimated creatinine clearance:
$$\text{CrCl (male)} = \frac{(140 - \text{Age}) \times \text{Weight (kg)}}{72 \times \text{Serum Creatinine (mg/dL)}}$$
$$\text{CrCl (female)} = \text{CrCl (male)} \times 0.85$$

### 2. Thromboembolic Risk: Wells Criteria for DVT / PE
* **Deep Vein Thrombosis (DVT) Scoring:** Active cancer (+1), paralysis/immobilization (+1), bedridden >3 days or major surgery (+1), localized tenderness (+1), entire leg swollen (+1), calf swelling >3cm (+1), pitting edema (+1), collateral veins (+1), alternative diagnosis likely (-2).
* **Score Interpretation:** High risk ($\ge 3$), Moderate (1-2), Low ($\le 0$).

### 3. Liver Disease Severity: MELD-Na Score
Used to prioritize liver allocations and evaluate end-stage liver disease:
$$\text{MELD-Na} = \text{MELD} - \text{Na} - [0.025 \times \text{MELD} \times (140 - \text{Na})] + 140$$
(Where $\text{Na}$ is bounded between 125 and 140 mEq/L).

---

## 🔌 MCP Tool Interface Specification

```json
{
  "name": "calculate_creatinine_clearance",
  "description": "Calculates creatinine clearance using the Cockcroft-Gault formula for renal drug dosing.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "age": { "type": "number", "description": "Patient age in years" },
      "weight_kg": { "type": "number", "description": "Patient weight in kilograms" },
      "serum_creatinine_mg_dl": { "type": "number", "description": "Serum creatinine in mg/dL" },
      "is_female": { "type": "boolean", "description": "True if female, False if male" }
    },
    "required": ["age", "weight_kg", "serum_creatinine_mg_dl", "is_female"]
  }
}
```
