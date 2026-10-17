# 👁️ Aliens Eye OSINT & Identity Footprint MCP Registry Spec

> **Source:** [arxhr007/Aliens_eye](https://github.com/arxhr007/Aliens_eye)  
> **Author:** Arpit Singhal (arxhr007)  
> **License:** GPL-3.0 / Open Source  
> **Domain:** Open Source Intelligence (OSINT), Username Footprint Reconnaissance, Multi-Platform Profile Verification (840+ Services), Machine Learning False-Positive Mitigation, Brand Impersonation Auditing, Asynchronous Fast Enumeration.

---

## 🎯 Visión Arquitectónica

**Aliens Eye** es un marco de inteligencia de fuentes abiertas (OSINT) y reconocimiento de identidad digital. A diferencia de las herramientas tradicionales que dependen exclusivamente de códigos de respuesta HTTP brutos (`200 OK` vs `404 Not Found`) —generando falsos positivos debido a páginas de aterrizaje dinámicas, captchas o redirecciones—, Aliens Eye incorpora una red asíncrona de alta velocidad con un clasificador ML integrado que inspecciona la estructura del DOM para confirmar la presencia real de un perfil en más de 840 plataformas en línea:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Security Lead                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ Target Username or Brand Handle
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Aliens Eye OSINT Engine                    │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Asynchronous Scanner  │       │ ML DOM Classifier     │  │
│  │ (840+ Endpoints)      ◄──────►│ (False-Positive Cut)  │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Brand Impersonation & Exposure Risk Analyzer          │  │
│  │ Structured JSON/Markdown Dossier Generator            │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Verified Digital Footprint Report
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Enterprise Identity Defense Gate              │
│            (Brand Protection, Anti-Phishing Alerts)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `aliens_eye_scan_username`
Ejecuta un escaneo asíncrono sobre más de 840 plataformas para identificar y verificar perfiles activos asociados a un nombre de usuario:

```json
{
  "name": "aliens_eye_scan_username",
  "description": "Performs fast asynchronous OSINT enumeration of an individual username across 840+ online platforms with ML validation.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "username": { "type": "string", "description": "Target handle or username to investigate." },
      "category_filter": { "type": "string", "enum": ["all", "social", "tech", "gaming", "finance"], "default": "all" },
      "timeout_seconds": { "type": "integer", "default": 15 }
    },
    "required": ["username"]
  }
}
```

### 2. `aliens_eye_batch_profile_search`
Permite auditar múltiples nombres de usuario simultáneamente (ej. variantes ortográficas, nombres de ejecutivos o marcas subsidiarias):

```json
{
  "name": "aliens_eye_batch_profile_search",
  "description": "Runs batch multi-handle OSINT enumeration across platforms to map an organization's collective footprint.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "usernames": { "type": "array", "items": { "type": "string" }, "description": "List of usernames to audit concurrently." }
    },
    "required": ["usernames"]
  }
}
```

### 3. `aliens_eye_verify_brand_impersonation`
Compara perfiles detectados con la lista de cuentas oficiales autorizadas para detectar posibles cuentas falsas, impostores o squatting:

```json
{
  "name": "aliens_eye_verify_brand_impersonation",
  "description": "Cross-references discovered profiles against an authorized brand registry to flag potential impersonation or squatting.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "brand_name": { "type": "string" },
      "discovered_profiles": { "type": "array", "items": { "type": "object" } },
      "whitelist_domains": { "type": "array", "items": { "type": "string" } }
    },
    "required": ["brand_name", "discovered_profiles"]
  }
}
```

### 4. `aliens_eye_export_footprint_report`
Genera un informe consolidado en formato Markdown y JSON con los enlaces verificados, métricas de exposición y recomendaciones defensivas:

```json
{
  "name": "aliens_eye_export_footprint_report",
  "description": "Exports verified OSINT findings into structured JSON or Markdown security dossiers.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "scan_id": { "type": "string" },
      "format": { "type": "string", "enum": ["markdown", "json"], "default": "markdown" },
      "output_path": { "type": "string" }
    },
    "required": ["scan_id", "output_path"]
  }
}
```

---

## 🏛️ Doctrina del Consejo Asesor Global

* **George Kurtz (CrowdStrike):** *Visibilidad Total de la Superficie de Exposición Externa*. La seguridad corporativa no puede limitarse a la infraestructura interna; los adversarios aprovechan nombres de usuario corporativos desatendidos o desprotegidos para lanzar ataques de ingeniería social e infiltraciones dirigidas.
* **Joe Ucuzoglu (Deloitte):** *Custodia Reputacional y Confianza Fiduciaria*. Detectar oportunamente cuentas no autorizadas que utilicen la identidad de la empresa salvaguarda la integridad de la marca y previene fraudes a terceros.
