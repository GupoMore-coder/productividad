---
name: mitre-cybersecurity-playbooks
description: Enterprise cybersecurity defense and threat modeling playbooks based on Anthropic Cybersecurity Skills standard. Maps security auditing, vulnerability triage, and incident response directly to MITRE ATT&CK, NIST CSF 2.0, D3FEND, and NIST AI RMF frameworks. Enforces mandatory security verification gates and Shannon pentesting standards under George Kurtz and Nikesh Arora doctrines. Activate when auditing application security, assessing cloud configurations, writing incident playbooks, or hardening API boundaries.
metadata:
  origin: Antigravity-Core
---

# 🛡️ MITRE Cybersecurity Playbooks (Anthropic Security Standard)

This skill formalizes the **threat modeling, vulnerability defense, and incident response framework** (George Kurtz zero-trust posture / Nikesh Arora continuous defense) using 800+ playbooks mapped to global security matrices.

---

## 🎯 When to Use

* **Mandatory Security Verification Gate:** Auditing code against BOLA, injection, auth bypass, data leaks, and SSRF before shipping.
* **Threat Modeling:** Identifying adversary tactics (MITRE ATT&CK) and mapping corresponding D3FEND mitigations.
* **Incident Response Runbooks:** Generating step-by-step containment protocols during security alerts.
* **AI & LLM Hardening:** Assessing agent workflows against MITRE ATLAS and NIST AI RMF for prompt injection and model jailbreaks.

---

## 🧭 The 4-Stage Security Verification Loop

```
1. Threat Scope Identification ──► 2. TTP & Framework Mapping ──► 3. Deep Code/Config Audit ──► 4. Hardening & Verification
```

### Stage 1: Threat Scope Identification
- Define trust boundaries, exposed network endpoints, and data classification levels.
- Identify sensitive assets (tokens, database connections, PII, financial ledgers).

### Stage 2: TTP & Framework Mapping
- Map identified risks to MITRE ATT&CK technique IDs (e.g., T1190 Exploit Public-Facing App).
- Select defensive controls from NIST CSF 2.0 and D3FEND countermeasures.

### Stage 3: Deep Code & Configuration Audit
- Statically scan for raw SQL queries, missing tenant isolation filters, unauthenticated endpoints, and exposed secrets.
- Verify CORS, Content Security Policy (CSP), and secure cookie attributes.

### Stage 4: Hardening & Verification
- Apply parameterized queries, schema validations, and rate-limiting middleware.
- Execute automated regression tests to verify that the vulnerability cannot be reproduced.

---

## 🛡️ Shannon Verification Gate Checklist

- [ ] **BOLA / IDOR:** Resource ownership verified on every route.
- [ ] **Authentication & Sessions:** Secure tokens, HttpOnly/SameSite cookies, zero secret leaks.
- [ ] **Injection:** Parameterized SQL/NoSQL calls and strict schema validation.
- [ ] **Sensitive Data & SSRF:** No hardcoded credentials; external URLs sanitized against private IPs.
- [ ] **Client Hardening:** Strict CSP, CORS whitelist, context-aware HTML escaping.
