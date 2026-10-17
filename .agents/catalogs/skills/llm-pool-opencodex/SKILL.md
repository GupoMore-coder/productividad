---
name: llm-pool-opencodex
description: Universal LLM provider proxy, multi-account quota balancing, and protocol emulation based on OpenCodex architecture. Manages pools of AI provider accounts (Claude, Gemini, Grok, DeepSeek, Ollama), translating API schemas and ensuring sticky session affinity for long-running agent workflows. Activate when configuring model fallback chains, balancing API rate limits across accounts, or abstracting provider endpoints for coding tools.
metadata:
  origin: Antigravity-Core
---

# 🔄 LLM Pool OpenCodex

This skill defines the **universal LLM provider gateway and quota-balancing standard** (Jeff Dean high-availability distributed systems / Andy Jassy operational cost routing / Clément Delangue open multi-provider interoperability) for uninterrupted agentic operations.

---

## 🎯 When to Use

* **Rate-Limit & Quota Balancing:** Distributing high-volume test runs or code audits across multiple provider accounts to avoid HTTP 429 throttling.
* **Provider-Agnostic Coding Workflows:** Allowing coding assistants configured for OpenAI Codex or Claude Code to use DeepSeek-R1, Gemini 2.0 Flash, or local Ollama models.
* **Sticky Session Affinity:** Ensuring that a multi-turn conversation or code refactoring session maintains affinity to the same model instance to prevent cache invalidation.
* **Automatic Failover:** Seamlessly falling back to secondary models when the primary upstream endpoint experiences downtime.

---

## 🧭 The 4-Stage Proxy Routing Protocol

```
1. Request Interception ──► 2. Quota Check & Account Bind ──► 3. Protocol Translation ──► 4. Stream Relay
```

### Stage 1: Request Interception & Session Tagging
- Intercept incoming API call from CLI tool or IDE extension.
- Extract `session_id` or working directory hash to determine session stickiness.

### Stage 2: Quota Check & Account Binding
- Check remaining rate limits and tokens-per-minute (TPM) budget for pool accounts.
- Bind request to the least loaded available account.

### Stage 3: Protocol Translation
- Convert payload between standard schemas (e.g. mapping OpenAI `tools` format to Anthropic `tool_use` format or vice-versa).
- Normalize system prompts and streaming token structures.

### Stage 4: Stream Relay & Metric Logging
- Stream generated tokens back to the client application without buffering latency.
- Log latency, completion token counts, and token spending to the local metrics ledger.

---

## 🛡️ Proxy Security & Reliability

- [ ] **Encrypted Key Management:** Upstream provider API keys stored exclusively in local encrypted environment files.
- [ ] **Graceful 429 Backoff:** Auto-retry on alternate account upon encountering upstream rate-limit responses.
- [ ] **Audit Trail:** Log all routed requests with destination timestamps and masked token signatures.
