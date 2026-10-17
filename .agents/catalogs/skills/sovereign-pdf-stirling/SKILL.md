---
name: sovereign-pdf-stirling
description: Sovereign, locally-hosted PDF document manipulation and forensic processing based on Stirling-PDF. Provides 50+ privacy-preserving operations including local multi-language OCR, permanent redaction of PII/PHI, document merging/splitting, conversion, and digital signing with zero external data egress. Activate when processing sensitive medical records, redacting confidential contracts, converting scanned archives, or automating document pipelines.
metadata:
  origin: Antigravity-Core
---

# 📄 Sovereign PDF Stirling (Stirling-Tools Architecture)

This skill formalizes the **sovereign, local-first document manipulation standard** (Specialized Medical HIPAA compliance / Joe Ucuzoglu legal forensic auditability / George Kurtz zero-egress data protection) using Stirling-PDF.

---

## 🎯 When to Use

* **HIPAA/GDPR Medical Document Handling:** Processing surgical reports, clinical trials, or patient charts without cloud leakage.
* **Irreversible Redaction:** Sanitizing corporate financial statements, banking credentials, or personal identifiers before public release.
* **Local Multi-Language OCR:** Converting non-searchable scanned PDFs or image archives into structured, searchable text.
* **Archival Compliance (PDF/A):** Standardizing long-term digital preservation formats for legal and regulatory audits.

---

## 🧭 The 4-Step Sovereign Document Workflow

```
1. Ingestion & Security Check ──► 2. Local Processing (OCR/Redact) ──► 3. Structural Transformation ──► 4. Archival Output
```

### Step 1: Ingestion & Security Check
- Verify that document processing occurs locally without outbound network calls.
- Inspect original PDF permissions, encryption layers, and metadata.

### Step 2: Local Processing & Redaction
- Apply local Tesseract OCR engine for scanned pages.
- Execute irreversible redaction on sensitive keywords or coordinate bounding boxes (erasing text from underlying content streams, not just drawing black rectangles).

### Step 3: Structural Transformation
- Merge chapters, split annexes, or reorder pages according to business specifications.
- Compress raster assets using lossless algorithms to reduce archival footprint.

### Step 4: Archival Output & Verification
- Export to standardized PDF/A-2b or searchable PDF formats.
- Verify hash integrity and ensure all temporary processing buffers are purged from disk.

---

## 🛡️ Document Guardrails

- [ ] **Zero Cloud Leaks:** Never transmit unredacted confidential documents to third-party conversion APIs.
- [ ] **True Layer Redaction:** Ensure redacted content cannot be recovered by copying underlying text layers.
- [ ] **Cryptographic Verification:** Generate SHA-256 checksums before and after processing for auditable chain of custody.
