---
name: whatsapp-conversational-agent
description: Production-grade conversational WhatsApp AI agent architecture based on WhatsApp AgentKit. Features Meta Cloud API and Zernio webhook verification (HMAC-SHA256), idempotency & event deduplication, per-client session memory, and business tool integration. Activate when designing, testing, or deploying conversational WhatsApp assistants in Spanish for LATAM businesses.
metadata:
  origin: Antigravity-Core
---

# 💬 WhatsApp Conversational Agent Architecture

This skill provides the architectural blueprint for deploying production-grade conversational AI agents on WhatsApp, derived from **WhatsApp AgentKit**. It resolves the critical 90% of development—the "plumbing" of webhooks, cryptographic signatures, duplicate event filtering, and client memory—so you can focus purely on business logic.

---

## 🎯 When to Use

* Deploying an automated customer service, quotation, or ordering assistant on WhatsApp for More Paper, More Design, or allied enterprises.
* Integrating WhatsApp business numbers via **Meta Cloud API** (official) or **Zernio** (rapid onboarding).
* Implementing robust webhook receivers in FastAPI or Express that withstand network retries without double-answering clients.
* Equipping the WhatsApp bot with custom business tools (pricing calculator, inventory check, human agent escalation).

---

## 🏗️ Modular Architecture Blueprint

```
whatsapp-agent/
├── main.py              # Webhook server (Verification & Inbound router)
├── brain.py             # LLM orchestration, system persona & tool executor
├── memory.py            # Client conversation history + message deduplication (TTL)
├── tools.py             # Domain-specific tools (quote_order, check_stock, transfer_to_human)
└── providers/           # Provider abstraction layer
    ├── base.py          # Unified messaging interface
    ├── meta.py          # Official Meta Graph Cloud API provider
    └── zernio.py        # Zernio API provider
```

---

## 🔒 Security & Webhook Hardening Protocol

### 1. Webhook Handshake Verification (`GET /webhook`)
Meta verifies ownership by sending a challenge:
```python
@app.get("/webhook")
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge")
):
    if hub_mode == "subscribe" and hub_token == os.getenv("WHATSAPP_VERIFY_TOKEN"):
        return Response(content=hub_challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Verification token mismatch")
```

### 2. Cryptographic Payload Signature Verification (`POST /webhook`)
Every inbound payload must be authenticated using the application secret (`APP_SECRET`):
```python
import hmac
import hashlib

def verify_signature(payload_bytes: bytes, signature_header: str, app_secret: str) -> bool:
    if not signature_header or not signature_header.startswith("sha256="):
        return False
    expected_hash = hmac.new(
        app_secret.encode("utf-8"),
        payload_bytes,
        hashlib.sha256
    ).hexdigest()
    incoming_hash = signature_header.split("sha256=")[1]
    return hmac.compare_digest(expected_hash, incoming_hash)
```

### 3. Idempotency & Deduplication
WhatsApp routinely re-sends webhooks if your server doesn't respond with `200 OK` within 3 seconds.
* **Rule:** Cache `message_id` in Redis or an in-memory TTL set. If `message_id` was processed in the last 120 seconds, immediately return `200 OK` and drop the duplicate.

---

## 🛠️ Business Tool Integration (`tools.py`)

Equip the WhatsApp agent with high-value operational tools:

* `calculate_custom_quote`: Calculates prices based on paper type, dimensions, finishings (foil, deboss), and quantity.
* `check_inventory_status`: Queries current warehouse availability.
* `escalate_to_human_advisor`: Generates an instant push notification or Slack/email alert to human sales staff when a client requires bespoke consulting.

---

## 🏆 Persona & Brand Protection (Bernard Arnault & Jeff Bezos Standard)

* **Tone:** Professional, warm, courteous, and articulate in Spanish.
* **No Speculation:** If a price or delivery date cannot be calculated with certainty by a tool, the agent must say: *"Permíteme confirmarlo con nuestro equipo de taller y te daremos respuesta en unos momentos"*, rather than inventing numbers.
