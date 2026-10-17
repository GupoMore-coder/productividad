---
name: agentic-crm-ledger
description: Agentic-first CRM operations with an immutable evidentiary ledger based on Comp AI CRM. Enforces zero-hallucination data entry (no model confidence scores; only observed factual evidence), autonomous account research, and structured customer contact profiles. Activate when managing customer interactions, auditing leads, enriching business accounts, or syncing sales intelligence.
metadata:
  origin: Antigravity-Core
---

# 📑 Agentic CRM Ledger & Factual Enrichment

This skill establishes the operational standard for autonomous CRM management pioneered by **Comp AI CRM**. It rejects the traditional paradigm of bolting a chat interface onto a static database; instead, **the CRM is where the AI agent maintains its verified operating notes**.

---

## 🎯 The Anti-Hallucination Doctrine

> **"Nothing about a person or company is ever guessed."**
> 
> Asking an LLM to rate its own certainty is fundamentally flawed—models routinely assign high confidence to plausible hallucinations. A confidently false fact in a customer profile is far more toxic than an empty field, because nobody questions it until a deal is lost.

### The Evidentiary Pricing Model:
1. **Tools report observations, never beliefs:** A tool does not state "Phone is probably +57 300 1234567 (95% confident)". It states `observed: invoice_signature_block` or `observed: colombia_dian_rut_registry`.
2. **The Ledger Evaluates Evidence:**
   * **Strong Evidentiary Source:** Official tax registry (RUT/DIAN), corporate email DKIM signature, signed bank receipt, or direct WhatsApp message from the client. $\rightarrow$ **Automatically written to the canonical record.**
   * **Weak Evidentiary Source:** Mentions on secondary blogs, fuzzy social search, or web scraper snippets. $\rightarrow$ **Flagged as a human-reviewable suggestion.** Never written as confirmed fact without manual confirmation.

---

## 🧭 Core CRM Workflows

```
1. Observe & Ingest Evidence ──► 2. Ledger Evaluation ──► 3. Canonical Account Update ──► 4. Executive Briefing
```

### 1. Contact Identity Matching (`identify_contact`)
* Before creating duplicate leads, correlate inbound signals across:
  * Tax ID (NIT / RUT in Colombia).
  * Canonical corporate email domain.
  * Verified WhatsApp international phone format (`+57...`).

### 2. Fact Ledger Entry (`record_fact`)
When recording client preferences, agreements, or requirements:
```json
{
  "account_id": "acc_more_paper_019",
  "fact_type": "material_preference",
  "value": "Eco-friendly cotton rag paper, 300 GSM, debossed gold foil finish",
  "evidence_source": "whatsapp_client_audio_transcript_msg_8849",
  "evidence_weight": "STRONG",
  "verified_at": "2026-09-29T12:00:00Z"
}
```

### 3. Executive Account Briefing (`writing-a-brief`)
Before an executive or sales director contacts the client, generate a 60-second synthesized brief:
* **Account Standing:** Active quotations, historical order volume, gross margin.
* **Firm Preferences:** Verified material, delivery, and billing constraints.
* **Open Contradictions:** Any conflicting signals flagged for clarification during the call.

---

## 🔒 Data Boundaries & Privacy (Zero-Trust)

* **Habeas Data & Compliance:** In Colombia and LATAM, adheres strictly to **Ley 1581 de 2012** (Protección de Datos Personales). Never store sensitive biometric or financial credentials in plaintext notes.
* **Egress Control:** The CRM agent operates in a sandboxed runtime with strict API allowlisting. Customer records are never transmitted to external unverified endpoints.
