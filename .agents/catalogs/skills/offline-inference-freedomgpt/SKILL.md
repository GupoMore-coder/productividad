---
name: offline-inference-freedomgpt
description: Air-gapped, zero-telemetry local LLM inference and private document vault protocol based on FreedomGPT. Orchestrates open-weight model execution (Llama, Mistral, Gemma, Phi) entirely on local workstation CPU/GPU silicon with zero external network connectivity. Activate when auditing sensitive legal or financial data, working under air-gapped security mandates, performing private security research, or operating in zero-egress environments.
metadata:
  origin: Antigravity-Core
---

# 🔒 Offline Inference FreedomGPT Protocol

This skill codifies the **sovereign air-gapped local inference standard** (Joe Ucuzoglu compliance fiduciary / Kristalina Georgieva institutional resilience) using FreedomGPT.

---

## 🎯 When to Use

* **Classified & Confidential Data Processing:** Analyzing internal financial audits, trade secrets, clinical records, or private credentials without third-party API exposure.
* **Air-Gapped & Offline Scenarios:** Running assistant capabilities when network access is severed or prohibited by organizational policy.
* **Uncensored Security Research:** Evaluating novel offensive security payloads, penetration testing scripts, and exploit payloads without cloud content filters blocking legitimate research.
* **Zero Telemetry Mandates:** Ensuring no prompts, completions, or operational telemetry leave the local device boundary.

---

## 🧭 The 4-Stage Air-Gap Protocol

```
1. Egress Block ──► 2. Hardware Allocation ──► 3. Local Model Ingestion ──► 4. Sovereign Synthesis
```

### Stage 1: Egress Block & Isolation
- Confirm network socket binding is restricted to localhost (`127.0.0.1`) or completely disconnected.
- Verify no remote telemetry agents or third-party webhooks are active.

### Stage 2: Hardware Allocation & Layer Offload
- Assess available VRAM and system RAM.
- Allocate compute layers to GPU (CUDA/Vulkan) and host RAM to maximize throughput without Out-Of-Memory (OOM) faults.

### Stage 3: Local Model Ingestion
- Load verified, checksummed open-weight models (GGUF/safetensors) from local disk.
- Initialize context window and system prompt instructions.

### Stage 4: Sovereign Synthesis & Clean Up
- Execute generation task.
- Clear temporary prompt buffers and scratch caches from memory upon task completion.

---

## 🛡️ Operational Guardrails

- [ ] **Strict Network Isolation:** Audit network interfaces to verify zero outbound packets during inference.
- [ ] **Memory Hygiene:** Purge sensitive prompts and raw intermediate activations from memory buffers after execution.
- [ ] **Weight Verification:** Only load models from verified local cryptographic hashes (SHA-256) to prevent weight poisoning.
