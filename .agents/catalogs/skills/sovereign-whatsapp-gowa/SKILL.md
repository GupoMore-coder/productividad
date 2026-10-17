---
name: sovereign-whatsapp-gowa
description: Sovereign WhatsApp REST API and native Model Context Protocol (MCP) gateway architecture based on aldinokemal/go-whatsapp-web-multidevice (GOWA). Deploys a memory-lean Golang microservice using whatsmeow for multi-device QR pairing, zero-cost conversational messaging, inbound webhook streaming, and direct AI agent tool invocation. Activate when building self-hosted WhatsApp chatbots, avoiding third-party Meta Cloud per-message costs, implementing customer support agent bridges, or managing multi-number WhatsApp operations.
metadata:
  origin: Antigravity-Core
---

# 📱 Sovereign WhatsApp GOWA Protocol

This skill codifies the **sovereign self-hosted WhatsApp messaging standard** (Andy Jassy decoupled microservice performance / Carlos Slim Latin American telecommunications reach) using GOWA.

---

## 🎯 When to Use

* **Zero-Cost WhatsApp Bot Operations:** Eliminating Meta Cloud API conversation fees and third-party SaaS per-message pricing.
* **Direct Agent MCP Messaging:** Allowing AI coding and agency agents to read and dispatch WhatsApp messages natively via MCP tools.
* **Multi-Account & Multi-Device Deployments:** Concurrently operating distinct customer service, sales, and notification phone numbers from a single Go binary or Docker container.
* **Local CRM & Chatwoot Integration:** Connecting WhatsApp streams directly into internal CRM backends or open-source support hubs.

---

## 🧭 The 4-Stage GOWA Deployment Workflow

```
1. Microservice Bootstrap ──► 2. Multi-Device QR Pairing ──► 3. Webhook Bus Binding ──► 4. Agent Tool Routing
```

### Stage 1: Microservice Bootstrap
- Deploy GOWA container (`aldinokemal/go-whatsapp-web-multidevice`) or compile binary via Go toolchain.
- Configure persistent SQLite/PostgreSQL storage volume for session credentials.

### Stage 2: Multi-Device QR Pairing
- Request pairing QR code via terminal or web UI (`/app/login`).
- Scan QR code using WhatsApp on primary device (Linked Devices).
- Confirm session status transitions to connected.

### Stage 3: Webhook Bus Binding
- Register application webhook endpoint (FastAPI / Express / Go).
- Configure HMAC secret and verify incoming message idempotency to prevent duplicate responses.

### Stage 4: Agent Tool Routing
- Expose GOWA native MCP server to Antigravity agents.
- Agents formulate natural language responses, format message payloads, and trigger `gowa_send_message`.

---

## 🛡️ Operational Guardrails

- [ ] **Rate-Limiting & Anti-Ban Hygiene:** Enforce human-like typing delays (1-3s) and avoid bulk cold-messaging to preserve account health.
- [ ] **Credential Security:** Store session keys and SQLite auth databases in encrypted local volumes.
- [ ] **Consent Verification:** Only communicate with users who have actively initiated contact or provided explicit opt-in.
