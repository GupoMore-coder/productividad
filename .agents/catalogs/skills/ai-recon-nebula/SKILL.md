---
name: ai-recon-nebula
description: AI-assisted ethical reconnaissance and security engagement management based on BerylliumSec Nebula. Automates attack surface discovery, port and service fingerprinting, CVE correlation, and structured engagement note-taking with visual asset tracking under Janet Truncale forensic standards and George Kurtz perimeter defense principles. Activate when performing asset reconnaissance, tracking authorized testing engagements, auditing perimeter exposure, or compiling security workpapers.
metadata:
  origin: Antigravity-Core
---

# 🌌 AI Reconnaissance Nebula

This skill formalizes the **automated attack surface reconnaissance and engagement logging protocol** (Janet Truncale forensic auditability / George Kurtz proactive threat surface mapping) using Nebula.

---

## 🎯 When to Use

* **External Attack Surface Discovery:** Auditing public subdomains, DNS records, and exposed web headers across authorized company assets.
* **Service Fingerprinting & CVE Lookup:** Identifying outdated software versions running on open ports and mapping them to public CVE advisories.
* **Engagement Workpapers:** Maintaining timestamped, chronological notes and observations during security reviews.
* **Asset Exposure Audits:** Generating executive summaries of exposed services for compliance and risk committees.

---

## 🧭 The 4-Step Reconnaissance & Audit Workflow

```
1. Scope & Target Setup ──► 2. Multi-Vector Fingerprinting ──► 3. CVE Advisory Correlation ──► 4. Workpaper Export
```

### Step 1: Scope & Target Setup
- Validate that the target domain/IP is within the authorized assessment charter.
- Initialize the structured engagement log.

### Step 2: Multi-Vector Fingerprinting
- Query public DNS records (A, MX, TXT, CNAME) and certificate transparency logs.
- Probe open ports non-destructively to retrieve service banners.

### Step 3: CVE Advisory Correlation
- Match discovered daemon and library versions against the National Vulnerability Database (NVD).
- Calculate severity rankings using CVSS v3.1 scores.

### Step 4: Workpaper Export
- Generate clean Markdown workpapers with clear asset inventories, findings, and remediation roadmaps.
- Archive records for regulatory compliance reviews.

---

## 🛡️ Guardrails

- [ ] **Non-Destructive Scanning:** Use only non-disruptive banner grabbing; do not send denial-of-service payloads.
- [ ] **Audit Trail Integrity:** Ensure all reconnaissance actions are logged with timestamps and execution hashes.
- [ ] **Data Handling:** Mask internal IP layouts and sensitive banners before sharing reports across non-security teams.
