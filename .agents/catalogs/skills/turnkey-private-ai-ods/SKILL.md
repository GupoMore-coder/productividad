---
name: turnkey-private-ai-ods
description: Turnkey private AI server deployment and infrastructure management based on Osmantic Deployment System (ODS). Provisions and orchestrates an air-gapped, zero-subscription local AI stack via Docker (llama-server, LiteLLM, Open WebUI, Qdrant, SearXNG, Whisper, Kokoro, ComfyUI) with automatic GPU acceleration under Andy Jassy frugality and George Kurtz data sovereignty doctrines. Activate when deploying on-premises private AI servers, configuring local inference gateways, establishing air-gapped RAG pipelines, or monitoring self-hosted model resources.
metadata:
  origin: Antigravity-Core
---

# 🚢 Turnkey Private AI Server (Osmantic ODS)

This skill formalizes the **private AI server orchestration and deployment standard** (George Kurtz data sovereignty / Andy Jassy infrastructure cost elimination) using the Osmantic Deployment System.

---

## 🎯 When to Use

* **Air-Gapped AI Deployments:** Running local LLMs and RAG pipelines for regulated environments with strict zero-data-leakage mandates.
* **Turnkey Local Stack Provisioning:** Bootstrapping a complete AI server (chat, RAG, speech, images) in Docker with a single command.
* **Unified Inference Gateway:** Configuring LiteLLM proxies to serve open-weight models (Llama, DeepSeek, Qwen) as OpenAI-compatible endpoints.
* **Hardware & GPU Optimization:** Detecting available CUDA/ROCm/Metal resources and allocating optimal tensor offloading.

---

## 🧭 The 4-Step Private AI Deployment Loop

```
1. Hardware Audit ──► 2. Profile Selection ──► 3. Docker Provisioning ──► 4. Health & Proxy Verification
```

### Step 1: Hardware Audit
- Detect host GPUs, available VRAM, system RAM, and storage headroom.
- Identify optimal quantization levels (e.g., GGUF Q4_K_M vs Q8_0).

### Step 2: Profile Selection
- Choose stack configuration:
  - `minimal_inference`: LiteLLM + llama-server.
  - `full_rag_stack`: Inference + Qdrant vector DB + SearXNG + Open WebUI.
  - `multimedia_complete`: Full RAG + Whisper STT + Kokoro TTS + ComfyUI.

### Step 3: Docker Provisioning
- Generate and deploy the unified Docker Compose topology.
- Establish internal bridge networking with isolated external exposure.

### Step 4: Health & Proxy Verification
- Poll health check endpoints (`/health`, `/v1/models`).
- Verify agent connectivity to local LiteLLM proxy before routing production workloads.

---

## 🛡️ Infrastructure Guardrails

- [ ] **Data Sovereignty:** Ensure external egress is blocked for confidential datasets.
- [ ] **Memory Protection:** Prevent out-of-memory (OOM) host crashes by configuring strict memory limits per container.
- [ ] **Authentication Gate:** Enforce strong API key authentication on the local LiteLLM gateway.
