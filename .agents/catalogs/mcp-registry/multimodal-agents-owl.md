# 🦉 Multimodal Agent Orchestration & MCP Bridges (OWL, MCPO, Unbody, MCPTools)

> **Sources:** [camel-ai/owl](https://github.com/camel-ai/owl) | [open-webui/mcpo](https://github.com/open-webui/mcpo) | [f/mcptools](https://github.com/f/mcptools) | [unbody-io/unbody](https://github.com/unbody-io/unbody)
> **Domain:** Multimodal vision-agent task execution, OpenAPI-to-MCP protocol bridges, CLI tool inspection, and headless multimodal data vectorization.

---

## 🎯 Architecture & Synergies

Integrates multimodal perception with tool-calling infrastructure and automated vectorization pipelines:

```
┌─────────────────────────────────────────────────────────────┐
│                    Unbody Multimodal Engine                 │
│ (Raw DICOM / CT / PDF Reports / Surgical Video / Audio Memos)│
└──────────────────────────────┬──────────────────────────────┘
                               │ Structured Vector & Graph API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       CAMEL OWL Engine                      │
│ (Multimodal Visual Planner: Visual Grounding, GUI Actions)  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Standard Protocol Execution
                               ▼
┌──────────────────────────────┴──────────────────────────────┐
│           MCPTools CLI & Open-WebUI MCPO Proxy              │
│ (Transforms MCP Tools ◄──► OpenAI Function Calling Specs)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Key Components & Operational Patterns

### 1. CAMEL OWL (Optimized Workforce Learning)
* **Visual Grounding:** Uses vision LLMs (Gemini Pro Vision / GPT-4o) with bounding box coordinate prediction to interact with medical software GUIs (3D Slicer, OpenSim, PACS viewers).
* **Multi-Agent Collaboration:** Divides surgical case analysis into Coordinator, Medical Vision Analyst, and Biomechanics Verifier.
* **Environment Execution:** Takes screenshot observations, proposes normalized mouse clicks `[x, y]` and keystrokes, and verifies state changes visually.

### 2. Open-WebUI MCPO (MCP-to-OpenAPI Proxy)
* Translates between Model Context Protocol (JSON-RPC over stdio/SSE) and standard OpenAPI/REST tool specs.
* Enables any standard web client (Open-WebUI, LibreChat) to discover and call registered Antigravity MCP servers without modifying frontend clients.

```bash
# Run MCPO server bridging stdio MCP to HTTP REST endpoint
mcpo --port 8000 --config ./mcp_servers.json
```

### 3. MCPTools CLI (`f/mcptools`)
* Inspects registered MCP servers, prints schemas, and tests tool calls directly from terminal:
```bash
# Inspect available tools on medical-calc
mcptools inspect --server medical-calc

# Invoke tool via command line
mcptools call --server medical-calc --tool calculate_creatinine_clearance '{"age": 65, "weight_kg": 70, "serum_creatinine_mg_dl": 1.2, "is_female": false}'
```

### 4. Unbody Headless Multimodal Pipeline
* Ingests heterogeneous medical case files (PDF surgical reports, pathology images, consultation recordings).
* Automatically extracts text, generates embeddings, extracts visual features, and builds a unified GraphQL endpoint for zero-latency retrieval.

---

## 🔒 Security Gate Integration
* **Local Proxy Isolation:** MCPO proxies must bind to `127.0.0.1` and require API key authentication to avoid unauthorized intranet access.
* **Visual PII Masking:** Any screen capture fed into CAMEL OWL or Unbody must run through a pre-processing bounding filter to blur patient MRN/names in DICOM viewport overlays.
