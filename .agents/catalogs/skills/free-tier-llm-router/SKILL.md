---
name: free-tier-llm-router
description: Permanent free-tier LLM inference registry, quota optimization, and failover router protocol based on mnfst/awesome-free-llm-apis. Discovers and coordinates non-expiring free AI API tiers (Google Gemini, Groq, Cerebras, Mistral, OpenRouter Free, Cloudflare Workers AI, NVIDIA NIM) via OpenAI SDK-compatible endpoints. Enforces RPM/RPD rate-limit tracking, automatic failover pooling, and zero-cost model routing for classification, extraction, and unit testing tasks. Activate when minimizing token spend, building resilient multi-model failover mechanisms, or optimizing developer API budgets.
metadata:
  origin: Antigravity-Core
---

# ⚡ Free-Tier LLM Router Protocol

This skill enforces the **zero-cost inference optimization and counterparty failover standard** (Warren Buffett operational cost margin / Jamie Dimon multi-provider redundancy) using the awesome-free-llm-apis registry.

---

## 🎯 When to Use

* **Token Expense Elimination:** Offloading high-volume lightweight tasks (JSON extraction, tag generation, regex synthesis, unit test assertions) to permanent free tiers.
* **Ultra-Low Latency Routing:** Leveraging Cerebras (1800+ tokens/sec) or Groq LPU endpoints for interactive developer workflows without billing overhead.
* **Large Context Free Ingestion:** Routing massive documentation or codebase context (up to 1M+ tokens) through Google Gemini 1.5/2.0 free developer tiers.
* **Resilient Multi-Provider Failover:** Automatically shifting inference traffic across free provider pools when a single endpoint hits HTTP 429 rate limits.

---

## 🧭 The 4-Stage Zero-Cost Routing Workflow

```
1. Task Sizing ──► 2. Provider Quota Match ──► 3. Compatible Client Injection ──► 4. Rate-Limit Failover Loop
```

### Stage 1: Task Sizing & Complexity Classification
- Analyze prompt token length and desired output complexity:
  - *Ultra-fast classification / linting:* Cerebras / Groq Llama 3.3.
  - *Large-scale document analysis:* Gemini Free Tier.
  - *Edge / Serverless execution:* Cloudflare Workers AI.

### Stage 2: Provider Quota & Rate-Limit Check
- Verify that request conforms to provider RPM (Requests per Minute) and RPD (Requests per Day) caps.
- Check active health status of chosen provider endpoint.

### Stage 3: Compatible Client Injection
- Instantiate standard OpenAI client pointing to the provider's `baseURL` and secret environment variable.
- Configure request headers and temperature parameters.

### Stage 4: Rate-Limit Failover Loop
- Catch potential HTTP 429 errors gracefully.
- Fall back instantaneously to the next secondary free provider in the prioritized pool without failing user tasks.

---

## 🛡️ Operational Guardrails

- [ ] **Strict Non-Expiring Tiers Only:** Exclude promotional or credit-card trial tiers that expire after trial windows.
- [ ] **Data Privacy Verification:** Ensure chosen free tiers comply with required data-logging and retention policies.
- [ ] **Backoff & Jitter:** Enforce exponential backoff on retry attempts to prevent account bans or rate-limit saturation.
