---
name: local-agent-openjarvis
description: Local-first personal AI agent protocol and constraint-aware execution harness based on open-jarvis/OpenJarvis. Optimizes agent workflows directly on workstation hardware (Apple Silicon, NVIDIA, AMD, CPU) with multi-backend orchestration (Ollama, vLLM, llama.cpp, SGLang), persistent local memory, and strict profiling of compute constraints (FLOPs, energy, latency, cost). Activate when deploying private on-device assistants, designing hardware-budgeted agent pipelines, or running autonomous agents with zero cloud egress.
metadata:
  origin: Antigravity-Core
---

# 🤖 Local Agent OpenJarvis Protocol

This skill codifies the **local-first, constraint-aware agent standard** (Jensen Huang silicon compute efficiency / Joe Ucuzoglu on-device privacy fiduciary) using OpenJarvis.

---

## 🎯 When to Use

* **Private Personal Assistant Workflows:** Running conversational and autonomous agent tasks with zero cloud API dependencies.
* **Hardware-Constrained Agent Deployments:** Sizing model weights and quantization (Q4_K_M, Q8, FP16) to fit within workstation VRAM and thermal limits.
* **Multi-Backend Local Orchestration:** Switching dynamically between Ollama, llama.cpp, and vLLM depending on batch size and throughput requirements.
* **Persistent Local Agent State:** Maintaining local disk-backed vector and key-value memory across development sessions.

---

## 🧭 The 4-Stage Local Agent Workflow

```
1. Silicon Budgeting ──► 2. Backend Selection ──► 3. Tool & Memory Harness ──► 4. Execution & Telemetry
```

### Stage 1: Silicon Budgeting
- Profile host machine: VRAM size, compute capability, available RAM, and power envelope.
- Determine maximum allowable model parameter size and context window.

### Stage 2: Backend Selection
- Route execution to optimal runtime:
  - *Ollama:* Rapid generalist workflows, simple desktop integration.
  - *llama.cpp:* Fine-grained quantization and CPU/Metal optimization.
  - *vLLM / SGLang:* High-throughput batched inference on NVIDIA hardware.

### Stage 3: Tool & Memory Harness
- Initialize local filesystem and MCP tool interfaces with strict permission boundaries.
- Load persistent memory records from local storage.

### Stage 4: Execution & Telemetry
- Execute the task autonomously.
- Collect efficiency metrics (tokens/sec, estimated FLOPs, memory footprint) to continuously optimize agent resource consumption.

---

## 🛡️ Operational Guardrails

- [ ] **Thermal & Memory Safety:** Enforce context size caps to prevent VRAM thrashing or system crashes.
- [ ] **Strict Air-Gap Verification:** Ensure no background telemetry or unapproved outbound webhooks are triggered.
- [ ] **Tool Sandboxing:** Sandbox shell and filesystem operations to authorized project directories.
