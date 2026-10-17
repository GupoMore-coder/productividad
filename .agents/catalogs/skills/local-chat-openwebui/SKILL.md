---
name: local-chat-openwebui
description: Self-hosted multi-model AI interaction and local chat interface orchestration based on Open WebUI. Configures unified frontends for Ollama and OpenAI-compatible gateways, manages private document collections with semantic RAG, deploys custom server-side Python function pipelines, and enforces multi-user RBAC in air-gapped environments. Activate when setting up private AI workspaces, integrating local model chat frontends, configuring document RAG collections, or managing multi-user AI portals.
metadata:
  origin: Antigravity-Core
---

# 💬 Local Chat Open WebUI

This skill formalizes the **self-hosted multi-model AI chat and knowledge interface protocol** (Satya Nadella enterprise AI collaboration / George Kurtz air-gapped zero-telemetry hosting) using Open WebUI.

---

## 🎯 When to Use

* **Private AI Workspaces:** Deploying an internal ChatGPT-style portal running entirely on local or private cloud infrastructure.
* **Local Model Serving Integration:** Unifying Ollama, vLLM, and LiteLLM models under a single interface for non-technical team members.
* **Document Knowledge Hubs:** Creating searchable semantic RAG knowledge collections with private vector storage.
* **Custom Python Function Pipelines:** Writing server-side filter hooks for moderation, logging, and dynamic data enrichment.

---

## 🧭 The 4-Step Open WebUI Setup Cycle

```
1. Model Gateway Binding ──► 2. Knowledge Collection Ingestion ──► 3. Pipeline Function Mount ──► 4. RBAC Verification
```

### Step 1: Model Gateway Binding
- Connect local model backends (Ollama running on `http://localhost:11434` or local LiteLLM gateways).
- Configure model tags, system prompts, and context window limits.

### Step 2: Knowledge Collection Ingestion
- Upload internal technical docs, specs, and policies.
- Configure chunk size and embedding models for local vector indexing.

### Step 3: Pipeline Function Mount
- Register custom Python functions or middleware hooks to intercept messages.
- Test function logic to ensure deterministic execution without latency spikes.

### Step 4: RBAC & Access Verification
- Define user roles (admin, user, read-only).
- Validate that users can only query models and knowledge bases permitted by their role.

---

## 🛡️ Guardrails

- [ ] **RBAC Enforcement:** Ensure anonymous public sign-ups are disabled in corporate environments.
- [ ] **Air-Gapped Isolation:** Block external web search features if strict data air-gapping is mandated.
- [ ] **Local Storage Pruning:** Monitor Docker volume growth to prevent unpruned chat logs from filling system storage.
