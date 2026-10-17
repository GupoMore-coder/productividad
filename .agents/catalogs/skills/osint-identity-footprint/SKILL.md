---
name: osint-identity-footprint
description: Open Source Intelligence (OSINT) username footprint auditing, multi-platform profile verification, and brand impersonation detection protocol based on arxhr007/Aliens_eye. Conducts high-speed asynchronous reconnaissance across 840+ digital platforms with ML-backed DOM inspection to eliminate false positives. Activate when auditing corporate digital exposure, monitoring executive handle security, detecting trademark squatting or social media impersonation, and compiling threat intelligence dossiers.
metadata:
  origin: Antigravity-Core
---

# 👁️ OSINT Identity Footprint Protocol

This skill codifies the **open-source identity reconnaissance and brand protection standard** (George Kurtz proactive external exposure visibility / Joe Ucuzoglu brand trust custody) using Aliens Eye.

---

## 🎯 When to Use

* **Brand Impersonation & Squatting Audits:** Scanning major platforms, code repositories, and forums to verify if company handles (e.g. `GrupoMore`, `MorePaper`, `MoreDesign`) are occupied by unauthorized third parties.
* **Executive Digital Footprint Assessment:** Auditing public exposure and forgotten accounts linked to leadership usernames to mitigate spear-phishing risks.
* **Incident Response & Threat Intelligence:** Correlating online handles and attacker aliases across global services during forensic inquiries.
* **Pre-Launch Handle Availability Scouting:** Validating availability of proposed brand or product names across 840+ platforms prior to product rollout.

---

## 🧭 The 4-Stage Footprint Audit Protocol

```
1. Target Handle Definition ──► 2. Asynchronous Multi-Scan ──► 3. ML False-Positive Check ──► 4. Dossier Compilation
```

### Stage 1: Target Handle Definition
- Establish target username, common variations, and acceptable scanning scope.
- Catalog authorized official brand profiles to serve as the baseline whitelist.

### Stage 2: Asynchronous Multi-Scan
- Dispatch asynchronous probes across the 840+ platform directory.
- Apply non-intrusive rate-limiting to prevent IP blocking by target social platforms.

### Stage 3: ML False-Positive Verification
- Evaluate DOM responses of returned hits using heuristic structure and ML validation.
- Filter out 404 landing pages, CAPTCHA walls, and generic domain parking placeholders.

### Stage 4: Dossier Compilation & Impersonation Alerting
- Correlate confirmed profiles against official corporate assets.
- Flag high-risk discrepancies (unauthorized accounts using trademarked logos or official bios).
- Export findings into a structured Markdown or JSON dossier.

---

## 🛡️ Operational Guardrails

- [ ] **Defensive & Authorization Scope:** Use exclusively for authorized brand auditing, defensive reconnaissance, and public exposure assessments.
- [ ] **Respect Rate Limits:** Enforce asynchronous concurrency throttling to avoid triggering anti-bot rate limits.
- [ ] **Data Minimization:** Do not harvest private personal data; strictly map public URL presence and profile metadata.
