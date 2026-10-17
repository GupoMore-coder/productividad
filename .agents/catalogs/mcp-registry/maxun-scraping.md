# 🤖 Maxun No-Code Web-to-API Scraping MCP Registry Spec

> **Source:** [getmaxun/maxun](https://github.com/getmaxun/maxun)  
> **License:** AGPL-3.0 / Open Source  
> **Domain:** No-Code Web Data Extraction, Web-to-API Robotic Automation, Bring Your Own Proxy (BYOP) Integration, Automatic Pagination & Infinite Scrolling, Structured Spreadsheet & JSON Export.

---

## 🎯 Visión Arquitectónica

Maxun permite construir robots de extracción que emulan el comportamiento de un usuario humano (navegación, clics, paginación, scroll infinito) sin requerir código manual para cada sitio. Convierte páginas web rebeldes y directorios no estructurados en APIs tipadas en tiempo real o exportaciones tabulares estructuradas:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Agent                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Robot Trigger Directive / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Maxun Robot Engine                     │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Visual Robot Runner   │       │ BYOP Proxy Router     │  │
│  │ (Paginated Traversal) │◄─────►│ (Anti-Bot Resilience) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Live Web-to-API Endpoint / Structured Tabular Records │  │
│  │ Automated Schedule, Change Detection & Webhook Alert  │  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `maxun_run_robot`
Dispara la ejecución de un robot de extracción con parámetros dinámicos:

```json
{
  "name": "maxun_run_robot",
  "description": "Executes a configured Maxun web extraction robot to scrape structured data from target web pages.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "robot_id": { "type": "string" },
      "custom_url": { "type": "string" },
      "max_pages": { "type": "integer", "default": 5 }
    },
    "required": ["robot_id"]
  }
}
```

### 2. `maxun_create_extraction_schema`
Configura los selectores de elementos, listas repetitivas y reglas de paginación para un nuevo robot:

```json
{
  "name": "maxun_create_extraction_schema",
  "description": "Defines an extraction robot schema with target fields, repeating list selectors, and pagination triggers.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "base_url": { "type": "string" },
      "fields": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "selector": { "type": "string" },
            "type": { "type": "string", "enum": ["text", "link", "image", "attribute"] }
          },
          "required": ["name", "selector", "type"]
        }
      },
      "pagination_selector": { "type": "string" }
    },
    "required": ["name", "base_url", "fields"]
  }
}
```

### 3. `maxun_fetch_captured_dataset`
Recupera el conjunto de datos tabulares generado por una ejecución de robot completada:

```json
{
  "name": "maxun_fetch_captured_dataset",
  "description": "Retrieves extracted tabular records in JSON or CSV format from a completed robot run.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "run_id": { "type": "string" },
      "format": { "type": "string", "enum": ["json", "csv"], "default": "json" },
      "limit": { "type": "integer", "default": 100 }
    },
    "required": ["run_id"]
  }
}
```

---

## 🏛️ Inteligencia de Mercado y Suministros (Kotler & Okonjo-Iweala)

1. **Inteligencia Comercial Sistemática (Philip Kotler):** Automatizar el rastreo de precios, ofertas de competidores y cambios de catálogo para alimentar modelos cuantitativos de fijación de precios y retención.
2. **Resiliencia de Cadena de Suministro (Ngozi Okonjo-Iweala):** Monitoreo continuo de disponibilidades de materias primas y listas de proveedores internacionales.
