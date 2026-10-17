---
name: unified-push-apprise
description: Universal multi-channel push notification routing and alerting based on Apprise architecture. Dispatches structured messages across 80+ notification services (Telegram, Slack, Discord, Microsoft Teams, WhatsApp, Pushover, Email, Webhooks) using unified URL schema endpoints. Activate when designing automated alert dispatchers, sending CI/CD build notifications, alerting on medical threshold breaches, or broadcasting business metrics.
metadata:
  origin: Antigravity-Core
---

# 📲 Unified Push Apprise

This skill defines the **universal multi-channel alerting standard** (Jay Chaudhry Zero-Trust delivery / Ken Xie secure egress / Andy Jassy resilient automation) for dispatching critical notices across heterogeneous messaging systems with zero vendor lock-in.

---

## 🎯 When to Use

* **CI/CD & Build Alerts:** Notifying developer channels in Discord/Slack upon test completion, build failure, or deployment success.
* **Financial & Auditing Reports:** Broadcasting automated daily cash-flow digests to executive Telegram groups or corporate emails.
* **Clinical Threshold Warnings:** Triggering high-priority SMS or Pushover alarms when orthopedic biomechanical metrics or sensor values breach safe limits.
* **Multi-Target Broadcasting:** Emitting an operational announcement to five distinct communication networks simultaneously using a single payload.

---

## 🧭 The 4-Step Notification Dispatch Loop

```
1. Target Resolution ──► 2. Payload Formatting ──► 3. Encrypted Dispatch ──► 4. Status Triage
```

### Step 1: Target Resolution & Schema Parsing
- Resolve target URLs from secure environment configuration (e.g., `tgram://bot_id/chat_id`, `discord://webhook_id/token`).
- Validate URL schema against Apprise service catalog.

### Step 2: Payload Formatting & Urgency Tagging
- Structure payload with clear title, concise markdown body, and notification severity:
  - `info`: Regular progress or daily digest.
  - `success`: Build green, sync complete.
  - `warning`: Degradation or near-capacity threshold.
  - `failure`: System crash, security alarm, unhandled exception.

### Step 3: Encrypted Dispatch with Backoff
- Send request over outbound HTTPS/TLS with TLS 1.3 encryption.
- Apply exponential backoff with jitter on transient 429 (rate-limit) or 503 HTTP responses.

### Step 4: Status Triage & Delivery Confirmation
- Capture delivery response codes from destination gateways.
- Log dispatch timestamp and destination hash (masking credentials) for audit compliance.

---

## 🛡️ Security & Privacy Guardrails

- [ ] **No Secret Logging:** Service URLs stripped of tokens and passwords before writing to execution logs.
- [ ] **Strict Egress Validation:** Outbound URLs must use HTTPS; plaintext HTTP webhooks prohibited in production.
- [ ] **Anti-Spam Throttling:** Non-critical notifications throttled to prevent channel flooding.
