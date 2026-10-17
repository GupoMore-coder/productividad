# 📈 TradingAgents Multi-Agent Financial Simulation MCP Registry Spec

> **Source:** [TauricResearch/TradingAgents](https://github.com/TauricResearch/TradingAgents)  
> **License:** Apache-2.0 / Open Source Research  
> **Domain:** Multi-Agent Financial Market Research, Simulated Trading Floor Orchestration, LangGraph Multi-Role Decision Graphs, Fundamental & Technical Analysts, Sentiment Modeling, Adversarial Bull/Bear Debates, Fortress Risk Management & Execution Routing.

---

## 🎯 Visión Arquitectónica

TradingAgents modela la dinámica colaborativa y dialéctica de una firma de corretaje y fondos de inversión de grado institucional. Mediante una jerarquía coordinada de agentes especializados de LLM, sintetiza análisis fundamentales, indicadores técnicos y sentimiento de mercado bajo la estricta supervisión de un gestor de riesgo independiente:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Financial Lead                │
└──────────────────────────────┬──────────────────────────────┘
                               │ Market Analysis Request / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   TradingAgents Core Engine                 │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Fundamental Analyst   │       │ Technical Analyst     │  │
│  │ (Owner Earnings/Moat) │       │ (Momentum, RSI, Trend)│  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              │                               │              │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Bull vs. Bear Adversarial Debate Room (LangGraph)     │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Fortress Risk Manager (Jamie Dimon / Warren Buffett)  │  │
│  │ Position Sizing, VaR Caps, Liquidity Stress Testing   │  │
│  └───────────────────────────┬───────────────────────────┘  │
│                              ▼                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Execution Trader: Actionable Orders (BUY, HOLD, SELL) │  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `tradingagents_run_simulation`
Ejecuta un ciclo completo de investigación colegiada para un activo o canasta financiera:

```json
{
  "name": "tradingagents_run_simulation",
  "description": "Runs a collaborative multi-agent market analysis for an asset, conducting fundamental, technical, and sentiment evaluations.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "ticker": { "type": "string" },
      "time_horizon": { "type": "string", "enum": ["intraday", "swing", "medium_term", "long_term"], "default": "medium_term" },
      "include_sentiment": { "type": "boolean", "default": true }
    },
    "required": ["ticker"]
  }
}
```

### 2. `tradingagents_debate_bull_bear`
Ejecuta un debate dialéctico adversarial entre el analista alcista (Bull) y bajista (Bear) para revelar riesgos ocultos:

```json
{
  "name": "tradingagents_debate_bull_bear",
  "description": "Orchestrates an adversarial debate between Bull and Bear researcher agents to expose downside catalysts and valuation risks.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "ticker": { "type": "string" },
      "fundamental_context": { "type": "string" },
      "rounds": { "type": "integer", "default": 3 }
    },
    "required": ["ticker"]
  }
}
```

### 3. `tradingagents_evaluate_risk_limits`
Aplica pruebas de estrés y límites de asignación bajo la doctrina del balance fortificado:

```json
{
  "name": "tradingagents_evaluate_risk_limits",
  "description": "Assesses portfolio risk metrics (VaR, maximum drawdown, sector concentration, cash buffers) before approving execution.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "portfolio_id": { "type": "string" },
      "proposed_allocation_usd": { "type": "number" },
      "max_drawdown_tolerance_percent": { "type": "number", "default": 10.0 }
    },
    "required": ["portfolio_id", "proposed_allocation_usd"]
  }
}
```

### 4. `tradingagents_generate_investment_thesis`
Compila un memo ejecutivo institucional con tesis de inversión, foso económico y ratio de Sharpe proyectado:

```json
{
  "name": "tradingagents_generate_investment_thesis",
  "description": "Synthesizes agent outputs into an institutional investment committee memo.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "ticker": { "type": "string" },
      "consensus_decision": { "type": "string", "enum": ["STRONG_BUY", "BUY", "HOLD", "REDUCE", "SELL"] },
      "target_price": { "type": "number" },
      "stop_loss": { "type": "number" }
    },
    "required": ["ticker", "consensus_decision"]
  }
}
```

---

## 🏛️ Doctrina del Consejo Asesor Financiero

1. **Fortaleza de Liquidez (Jamie Dimon):** Cero complacencia crediticia. Ninguna posición puede comprometer la liquidez operativa ni arriesgar llamadas de margen.
2. **Preservación de Capital (Warren Buffett):** Regla #1: Nunca perder dinero; Regla #2: Nunca olvidar la regla #1. Evaluar las ganancias reales del propietario (*Owner Earnings*) por encima de métricas vanidosas.
3. **Custodia Fiduciaria (Larry Fink):** Evaluar resiliencia de gobernanza y asignación de capital a largo plazo frente a shocks macroeconómicos.
