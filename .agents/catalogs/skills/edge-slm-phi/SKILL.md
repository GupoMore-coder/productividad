---
name: edge-slm-phi
description: Local edge inference, model quantization (INT4/FP16), and structured function calling using Microsoft Phi Small Language Models (Phi-3, Phi-4, Phi-4-multimodal) via ONNX Runtime GenAI and Microsoft Olive. Executes high-speed, cost-free local classification, data extraction, and tool binding directly on client hardware without cloud API dependencies. Activate when deploying local SLMs, optimizing edge device inference, or building offline AI pipelines.
metadata:
  origin: Antigravity-Core
---

# 🔬 Edge SLM Microsoft Phi

This skill defines the **Small Language Model (SLM) edge inference and local acceleration standard** (Satya Nadella AI efficiency / Lisa Su silicon optimization / Arthur Mensch compact MoE pragmatism) for deploying high-reasoning local models on edge hardware.

---

## 🎯 When to Use

* **Offline Edge Processing:** Running data categorization or text extraction in air-gapped or intermittently connected environments.
* **Deterministic Structured JSON Extraction:** Using Phi function calling to map loose conversational queries into rigid database schemas without cloud cost.
* **Cost Optimization for High-Volume Tasks:** Delegating bulk classification (e.g. sorting thousands of medical articles or inventory rows) to local SLMs.
* **Multimodal Edge Vision & Audio:** Running local image OCR or voice command interpretation using Phi-4-multimodal.

---

## 🧭 The 4-Phase Edge Deployment Loop

```
1. Model Selection & Quantization ──► 2. ONNX GenAI Setup ──► 3. Schema-Constrained Prompting ──► 4. DirectML/CUDA Eval
```

### Phase 1: Model Selection & Quantization
- Select optimal Phi model tier:
  - `Phi-3 Mini (3.8B)`: Ultra-fast text extraction and JSON output.
  - `Phi-4 (14B)`: Advanced mathematical reasoning and complex coding tasks.
  - `Phi-4-multimodal`: Integrated text, vision, and audio processing.
- Quantize weights to INT4 AWQ using Microsoft Olive for minimal RAM footprint.

### Phase 2: ONNX Runtime GenAI Execution
- Load model via `onnxruntime-genai` using appropriate Execution Provider (DirectML on Windows, CUDA on NVIDIA, CPU fallback).
- Set KV-cache bounds to avoid system memory exhaustion.

### Phase 3: Schema-Constrained Generation
- Supply strict JSON grammar or function definitions in system instructions.
- Enforce greedy decoding (`temperature=0.0`) for deterministic reproducibility.

### Phase 4: Output Validation
- Validate parsed JSON against Pydantic/Zod schemas.
- If schema validation fails, retry with explicit error feedback in prompt turn.

---

## 🛡️ Edge Security & Reliability

- [ ] **Deterministic Parsing:** Ensure JSON outputs are strictly parsed and sanitized before execution.
- [ ] **Memory Limit Protection:** Monitor RAM/VRAM usage; abort execution if host memory drops below 2GB free.
- [ ] **Air-Gapped Operation:** Local inference must never trigger unsolicited telemetry pings.
