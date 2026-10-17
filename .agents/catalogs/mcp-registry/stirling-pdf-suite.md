# 📄 Stirling-PDF Sovereign Document Suite MCP Registry Spec

> **Source:** [Stirling-Tools/Stirling-PDF](https://github.com/Stirling-Tools/Stirling-PDF)  
> **License:** GPL-3.0 / Open Source  
> **Domain:** Sovereign On-Premises PDF Document Manipulation, 50+ Local Operations (Merge, Split, OCR, Redact, Convert, Sign, Compress, Encrypt), Zero External Network Egress, Air-Gapped Compliance, HIPAA/GDPR Document Security.

---

## 🎯 Visión Arquitectónica

Stirling-PDF proporciona una suite integral y soberana de procesamiento de documentos PDF alojada localmente. A diferencia de las utilidades web SaaS que exponen contratos, registros médicos o estados financieros a servidores de terceros, Stirling-PDF ejecuta todas las operaciones en memoria local o contenedores aislados:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Agent                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Local PDF Operation / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Stirling-PDF Local Engine                 │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Local Tesseract OCR   │       │ Permanent Redaction   │  │
│  │ (Multi-Language Scans)│◄─────►│ (PII / PHI Sanitizer) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 50+ Modular PDF Tools:                                │  │
│  │  - Merge / Split / Rotate   - PDF/A Archival Convert  │  │
│  │  - Digital Signatures       - AES-256 Encryption      │  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `stirling_ocr_document`
Ejecuta reconocimiento óptico de caracteres (OCR) multilingüe local sobre documentos escaneados:

```json
{
  "name": "stirling_ocr_document",
  "description": "Performs high-accuracy local OCR on scanned PDF files, generating searchable PDF/A documents.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "file_path": { "type": "string" },
      "languages": { "type": "array", "items": { "type": "string" }, "default": ["eng", "spa"] },
      "output_path": { "type": "string" }
    },
    "required": ["file_path", "output_path"]
  }
}
```

### 2. `stirling_merge_or_split_pdf`
Fusiona múltiples archivos PDF o divide páginas específicas en documentos independientes:

```json
{
  "name": "stirling_merge_or_split_pdf",
  "description": "Merges multiple PDF files in sequence or splits designated page ranges into separate files.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "operation": { "type": "string", "enum": ["merge", "split"] },
      "input_paths": { "type": "array", "items": { "type": "string" } },
      "page_ranges": { "type": "string" },
      "output_path": { "type": "string" }
    },
    "required": ["operation", "input_paths", "output_path"]
  }
}
```

### 3. `stirling_redact_sensitive_text`
Elimina de forma irreversible información confidencial (PHI, PII, saldos, contraseñas) de todas las capas del PDF:

```json
{
  "name": "stirling_redact_sensitive_text",
  "description": "Permanently redacts sensitive text patterns, keywords, or coordinate bounding boxes from PDF layers.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "file_path": { "type": "string" },
      "keywords_or_regex": { "type": "array", "items": { "type": "string" } },
      "output_path": { "type": "string" }
    },
    "required": ["file_path", "keywords_or_regex", "output_path"]
  }
}
```

### 4. `stirling_convert_document`
Convierte entre formatos PDF, imágenes, Markdown y archivos de oficina preservando fidelidad:

```json
{
  "name": "stirling_convert_document",
  "description": "Converts PDF documents to images, Markdown, HTML, or Office formats locally.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "input_path": { "type": "string" },
      "target_format": { "type": "string", "enum": ["png", "jpeg", "markdown", "docx", "pdfa"] },
      "output_path": { "type": "string" }
    },
    "required": ["input_path", "target_format", "output_path"]
  }
}
```

---

## 🏛️ Soberanía y Cumplimiento Forense (Ortho Specialist, Ucuzoglu, Kurtz)

1. **Cumplimiento HIPAA y Privacidad Médica (Specialized Medical Specialist):** Los historiales clínicos, consentimientos informados y estudios de imágenes nunca deben ser transmitidos a servidores en la nube externos.
2. **Auditabilidad y Validez Legal (Joe Ucuzoglu / Deloitte):** Las conversiones a PDF/A y las firmas digitales deben mantener la integridad y validez jurídica requerida en auditorías forenses.
3. **Cero Fuga de Datos (George Kurtz):** Procesamiento estrictamente air-gapped; las operaciones de red están deshabilitadas durante la manipulación de documentos clasificados.
