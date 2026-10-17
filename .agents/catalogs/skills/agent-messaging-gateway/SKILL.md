---
name: agent-messaging-gateway
description: Architectural design, cryptographic verification, and operational routing for multi-channel agent communication (WhatsApp Cloud API, Telegram Bot API, Slack Bolt, Discord Webhooks, Signal, and Email). Enforces zero-trust payload verification, HMAC signature validation, rate limiting, and context-preserving session management. Activate when configuring webhooks, building conversational bridges, or routing notifications.
metadata:
  origin: Antigravity-Core
---

# 📡 Agent Messaging Gateway

This skill defines the **enterprise communication fabric** (Sam Altman / Andy Yen / Meredith Whittaker standard) connecting Antigravity and autonomous agents to conversational messaging platforms: **WhatsApp, Telegram, Slack, Discord, Signal, and transactional Email**.

---

## 🎯 When to Use

* **Setting Up Inbound Webhooks:** Integrating WhatsApp Cloud API (`fase3_whatsapp_webhook.js`), Telegram bots, or Slack Events API.
* **Outbound Multi-Channel Dispatch:** Broadcasting financial digests, system health alerts, or customer CRM updates to designated channels.
* **Webhook Hardening & Security Audits:** Ensuring cryptographic signature validation (`X-Hub-Signature-256`, Telegram bot token hashing, Slack secret signing).
* **Multi-Platform Payload Normalization:** Translating Markdown, buttons, media attachments, and interactive menus across heterogeneous messaging formats.

---

## 🧭 The 4-Pillar Gateway Architecture

```
1. Inbound Ingestion & HMAC Verification ──► 2. Channel Normalization ──► 3. Core Agent Brain ──► 4. Formatted Outbound Dispatch
```

### Pillar 1: Inbound Cryptographic Verification (Zero Trust)
Every inbound webhook request must be authenticated before parsing:
- **WhatsApp Cloud API:** Validate `sha256` HMAC signature in `x-hub-signature-256` using the Meta App Secret. Verify webhook challenge (`hub.challenge`) on subscription verification.
- **Telegram Bot API:** Verify `X-Telegram-Bot-Api-Secret-Token` configured during `setWebhook`.
- **Slack Events API:** Verify `X-Slack-Signature` computed using the Slack Signing Secret and request timestamp (`X-Slack-Request-Timestamp`). Reject requests older than 300 seconds (anti-replay).

```javascript
// Example: WhatsApp HMAC-SHA256 Verification Pattern
const crypto = require('crypto');
function verifyMetaSignature(rawBody, signatureHeader, appSecret) {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;
  const signature = signatureHeader.substring(7);
  const expectedHash = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expectedHash, 'utf8'));
}
```

### Pillar 2: Channel Normalization
Map disparate incoming payloads into a unified `AgentInboundMessage` contract:
```typescript
interface AgentInboundMessage {
  channel: 'whatsapp' | 'telegram' | 'slack' | 'discord' | 'signal' | 'email';
  senderId: string;
  senderName?: string;
  timestamp: number;
  messageType: 'text' | 'audio' | 'image' | 'document' | 'interactive';
  textPayload?: string;
  mediaUrl?: string;
  mediaMimeType?: string;
  sessionContextId: string;
}
```

### Pillar 3: Context-Preserving Session Management
- Maintain an ephemeral conversation buffer with sliding window expiration (e.g. 24-hour customer service window for WhatsApp).
- Correlate phone numbers or platform user IDs with internal CRM entities (`Agentic CRM Ledger` / `fase1_google_sheets_core.js`).

### Pillar 4: Platform-Aware Outbound Formatting
Format responses to suit the target platform's rendering limits:
- **WhatsApp:** `*bold*`, `_italics_`, `~strikethrough~`, ` ```code``` `. Maximum message length: 4096 characters. Interactive list messages or quick-reply buttons when options are <= 3.
- **Telegram:** MarkdownV2 or HTML mode. Escaping special characters (`_`, `*`, `[`, `]`, `(`, `)`, `~`, `>`) to avoid parsing 400 Bad Request errors.
- **Slack:** Block Kit structure for cards, sections, buttons, and divider elements.

---

## 🛡️ Security Verification Checklist

- [ ] **Timing-Safe Comparison:** Signatures verified with `crypto.timingSafeEqual` to eliminate timing attacks.
- [ ] **No Hardcoded Secrets:** Platform tokens and webhook secrets sourced strictly from environment variables (`.env`).
- [ ] **Rate Limiting & Throttling:** Anti-DDoS rate limiter (e.g. 10 requests/minute per sender ID) preventing API exhaustion.
- [ ] **Data Minimization:** No raw audio recordings or sensitive financial details persisted in plain text outside secured directories.
