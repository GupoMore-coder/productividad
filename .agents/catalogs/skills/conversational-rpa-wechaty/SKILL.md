---
name: conversational-rpa-wechaty
description: Conversational Robotic Process Automation (RPA) across multi-platform instant messaging networks (WeChat, WhatsApp, Lark, Teams) using Wechaty SDK. Manages group chat rooms, handles contact friendship events, routes rich multimedia messages, and executes automated customer service workflows. Activate when designing multi-platform customer support bots, automating group communications, or building conversational RPA flows.
metadata:
  origin: Antigravity-Core
---

# 💬 Conversational RPA Wechaty

This skill defines the **multi-platform conversational RPA standard** (Mustafa Suleyman empathetic agent / Ngozi Okonjo-Iweala operational coordination standard) for managing customer interactions and team collaboration across instant messaging networks.

---

## 🎯 When to Use

* **Enterprise Chatbot Automation:** Automating responses to customer inquiries regarding product orders, status updates, or catalog inquiries.
* **Group Room Moderation:** Handling room announcements, membership verifications, and automated administrative digests.
* **Multi-Platform Puppet Routing:** Connecting bot logic to heterogeneous messaging backends (WhatsApp, WeChat, Lark, Slack) with a unified event loop.

---

## 🧭 The 4-Pillar Conversational RPA Flow

```
1. Event Ingestion (OnMessage/OnRoom) ──► 2. Intent Classification ──► 3. Business Logic Execution ──► 4. Rate-Limited Dispatch
```

### Pillar 1: Event Ingestion
Listen for inbound message events:
- Distinguish between personal direct messages (1-on-1) and group room discussions.
- In group rooms, enforce strict trigger conditions (only reply if `@bot` is mentioned or specific command prefix is detected).

### Pillar 2: Intent Classification & Entity Extraction
- Extract customer intent (e.g. "order_status", "quote_request", "technical_support").
- Map customer phone numbers or handle names to internal records in `Agentic CRM Ledger`.

### Pillar 3: Business Logic Execution
- Query the database or Sheets backend (`fase1_google_sheets_core.js` or Supabase).
- Generate a contextual, professional reply aligned with brand identity.

### Pillar 4: Rate-Limited Outbound Dispatch
- Format the response with markdown, image attachments, or interactive URL cards.
- Respect anti-ban rate limits (e.g., minimum 1.5s delay between consecutive message dispatches).

---

## 🛡️ Anti-Spam and Privacy Safeguards

- [ ] **Cooldown Enforcement:** No repetitive message bursts allowed.
- [ ] **Opt-Out Compliance:** Respect customer requests to stop automated communications immediately.
- [ ] **No Leakage of Private Group Data:** Group chat transcripts sanitized before model ingestion.
