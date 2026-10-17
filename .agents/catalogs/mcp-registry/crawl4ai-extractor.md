# 🕷️ Crawl4AI LLM-Friendly Web Extractor MCP Registry Spec

> **Source:** [unclecode/crawl4ai](https://github.com/unclecode/crawl4ai)  
> **License:** Apache-2.0 / Open Source  
> **Domain:** High-Performance Asynchronous Web Crawling & Scraping, LLM-Ready Markdown & JSON Output, Playwright JavaScript Rendering, Semantic Chunking & Cosine Similarity, Media/Link Filtering, Anti-Bot Crawler Profiles.

---

## 🎯 Visión Arquitectónica

Crawl4AI transforma páginas web complejas, dinámicas y saturadas de JavaScript en flujos de Markdown y JSON concisos y optimizados para modelos de lenguaje. Elimina el ruido publicitario, etiquetas superfluas y scripts, entregando directamente contenido estructurado listo para pipelines de RAG y agentes de razonamiento:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Agent                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Async Crawl Directive / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Crawl4AI Core Engine                    │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Async Playwright Head │       │ Content Cleaner & RAG │  │
│  │ (JS Render & Scrolling│◄─────►│ Chunking (Cosine Sim) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ LLM-Ready Markdown / Structured Schema JSON           │  │
│  │ Clean Extracted Tables, Citations & Metadata          │  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `crawl4ai_crawl_url`
Ejecuta la extracción asíncrona de una URL web retornando Markdown limpio y metadatos:

```json
{
  "name": "crawl4ai_crawl_url",
  "description": "Crawls a webpage using Playwright rendering, strips boilerplate HTML, and returns clean LLM-ready markdown.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "url": { "type": "string" },
      "wait_for_selector": { "type": "string" },
      "exclude_external_links": { "type": "boolean", "default": true },
      "extract_media": { "type": "boolean", "default": false },
      "cache_mode": { "type": "string", "enum": ["enabled", "disabled", "bypass"], "default": "enabled" }
    },
    "required": ["url"]
  }
}
```

### 2. `crawl4ai_extract_structured_json`
Extrae entidades y tablas tipadas mediante un esquema de extracción guiado:

```json
{
  "name": "crawl4ai_extract_structured_json",
  "description": "Extracts structured JSON records from a webpage matching a defined extraction schema or prompt.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "url": { "type": "string" },
      "extraction_schema": { "type": "object" },
      "extraction_type": { "type": "string", "enum": ["llm", "css_xpath", "cosine_similarity"], "default": "css_xpath" }
    },
    "required": ["url", "extraction_schema"]
  }
}
```

### 3. `crawl4ai_batch_crawl_domains`
Ejecuta un rastreo concurrente con control de concurrencia y límites de tasa:

```json
{
  "name": "crawl4ai_batch_crawl_domains",
  "description": "Crawls a batch of URLs concurrently with rate limiting and polite request delays.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "urls": { "type": "array", "items": { "type": "string" } },
      "max_concurrency": { "type": "integer", "default": 5 },
      "delay_between_requests_ms": { "type": "integer", "default": 500 }
    },
    "required": ["urls"]
  }
}
```

---

## 🏛️ Frugalidad y Eficiencia (Andy Jassy)

1. **Frugalidad Radical en Tokens (Andy Jassy):** Evitar inyectar HTML crudo en la ventana de contexto. Crawl4AI filtra encabezados repetitivos, iframes y publicidad, reduciendo el tamaño del payload en más del 80%.
2. **Mitigación SSRF:** Prohibido rastrear rangos IP privados (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`).
