---
name: auth-resilience-bruteforceai
description: Defensive authentication resilience, rate-limiting, and credential stuffing verification protocol based on MorDavid/BruteForceAI. Employs Playwright and LLM-assisted form analysis in authorized staging environments to stress-test account lockout thresholds, exponential backoff, WAF rate-limiting, and CAPTCHA challenge triggers (OWASP ASVS V2). Activate when auditing authentication security, validating login rate limiters, preparing for production penetration tests, or generating SARIF compliance reports for identity flows.
metadata:
  origin: Antigravity-Core
---

# 🛡️ Auth Resilience BruteForceAI Protocol

This skill enforces the **defensive authentication hardening and rate-limiting audit standard** (George Kurtz proactive identity boundary protection / Jamie Dimon zero-tolerance access control) based on BruteForceAI.

---

## 🎯 When to Use

* **Authentication Endpoint Hardening:** Verifying that login endpoints return HTTP 429 Too Many Requests or lock accounts after consecutive failed attempts.
* **Credential Stuffing Defense:** Simulating automated multi-user credential sprays against staging environments to ensure WAF and IP rate limiters trigger reliably.
* **Form Structure & CSRF Auditing:** Discovering input selectors, hidden tokens, and submission buttons using automated Playwright navigation.
* **CI/CD Security Gate Enforcement:** Exporting machine-readable SARIF reports to block releases if authentication rate-limiting is missing.

---

## 🧭 The 4-Stage Authentication Audit Protocol

```
1. Scope & Auth Check ──► 2. Form & Baseline Mapping ──► 3. Bounded Threshold Test ──► 4. Policy Audit & SARIF
```

### Stage 1: Scope & Authorization Check
- Verify that the target URL belongs to an authorized staging, testing, or local environment.
- Confirm testing window, authorized credentials pool, and target lockout thresholds.

### Stage 2: Form & Baseline Mapping
- Launch headless Playwright session to inspect target authentication page.
- Catalog username, password, CSRF token, and submit button selectors.
- Send baseline invalid credentials to profile error messages and response times.

### Stage 3: Bounded Threshold Testing
- Execute controlled spray test (maximum 5-10 attempts with randomized delay jitter).
- Monitor server responses: observe response latency, HTTP status codes, and header changes (`Retry-After`).

### Stage 4: Policy Audit & SARIF Report
- Verify whether defensive mechanisms triggered as mandated:
  - Account temporary lock after N failed attempts.
  - IP-based rate limiting (HTTP 429).
  - CAPTCHA or secondary challenge presentation.
- Export findings to SARIF format and document remediation requirements.

---

## 🛡️ Operational Guardrails

- [ ] **Strict Authorization Scope:** Never execute scans against third-party or production systems without explicit written consent.
- [ ] **Bounded Test Limits:** Enforce strict low ceilings on test attempts (max 10) to prevent denial of service (DoS).
- [ ] **Defensive Redirection:** All discoveries must directly generate defensive code fixes (rate limiters, Redis sliding windows, lockout tables).
