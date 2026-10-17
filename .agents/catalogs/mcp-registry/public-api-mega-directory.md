# 🌐 Public API Mega-Directory & Integration Scout MCP Registry Spec

> **Source:** [cporter202/API-mega-list](https://github.com/cporter202/API-mega-list)  
> **Maintainer:** Chris Porter  
> **License:** MIT / Open Source  
> **Domain:** Public API Discovery, Third-Party Integration Scouting, Automated Client Generation (TypeScript/Python), Authentication Protocol Auditing (OAuth2, ApiKey, No-Auth), REST/GraphQL/gRPC Ecosystem Mapping.

---

## 🎯 Visión Arquitectónica

El repositorio **API-mega-list** cataloga miles de APIs públicas estructuradas por verticales de la industria (Finanzas, Inteligencia Artificial, Scraping, Geolocalización, eCommerce, Meteorología, Almacenamiento, Identidad). En Antigravity, este activo opera como un motor inteligente de prospección e integración técnica que permite a los agentes descubrir servicios externos existentes, evaluar su modelo de autenticación y generar clientes tipados sin búsquedas web exploratorias repetitivas:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Architect                │
└──────────────────────────────┬──────────────────────────────┘
                               │ API Capability & Domain Request
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Public API Scout & Directory Engine             │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Taxonomy & Domain     │       │ Auth & CORS Policy    │  │
│  │ Category Matcher      ◄──────►│ Compliance Verifier   │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Strongly-Typed API Client Scaffolder (TS / Python)    │  │
│  │ Endpoint Health, Rate Limits, and OpenAPI Ingestion   │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Automated Production Integration
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Enterprise Application Services               │
│            (Connected, Scalable, Composable APIs)           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `api_directory_search_by_category`
Busca APIs públicas disponibles por categoría temática, palabras clave o tipo de servicio:

```json
{
  "name": "api_directory_search_by_category",
  "description": "Searches the curated public API directory by domain vertical, functional category, or keywords.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "category": { "type": "string", "enum": ["ai_ml", "finance", "weather", "scraping", "geolocation", "ecommerce", "dev_tools", "social"] },
      "keyword": { "type": "string" },
      "requires_auth": { "type": "boolean", "description": "Filter by auth requirement (true for apikey/oauth, false for no-auth)." }
    },
    "required": ["category"]
  }
}
```

### 2. `api_directory_inspect_auth_model`
Inspecciona el esquema de autenticación (Bearer Token, Header API Key, OAuth2 PKCE, No-Auth), soporte HTTPS y restricciones CORS de una API seleccionada:

```json
{
  "name": "api_directory_inspect_auth_model",
  "description": "Inspects authentication specifications, rate limits, CORS compliance, and documentation links for a target API.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "api_name": { "type": "string" }
    },
    "required": ["api_name"]
  }
}
```

### 3. `api_directory_generate_client_stub`
Genera un cliente modular fuertemente tipado en TypeScript (fetch / axios) o Python (httpx) con manejo de errores y validación de esquemas (Zod / Pydantic):

```json
{
  "name": "api_directory_generate_client_stub",
  "description": "Generates a production-ready, typed client SDK stub with retry logic and environment variable injection.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "api_name": { "type": "string" },
      "language": { "type": "string", "enum": ["typescript", "python"], "default": "typescript" },
      "schema_validation": { "type": "string", "enum": ["zod", "pydantic", "none"], "default": "zod" }
    },
    "required": ["api_name"]
  }
}
```

### 4. `api_directory_verify_health`
Verifica el estado de disponibilidad del endpoint base de la API, latencia de respuesta y vigencia del certificado TLS:

```json
{
  "name": "api_directory_verify_health",
  "description": "Performs a lightweight ping and TLS audit against the target API's public health or root endpoint.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "base_url": { "type": "string" }
    },
    "required": ["base_url"]
  }
}
```

---

## 🏛️ Doctrina del Consejo Asesor Global

* **Andy Jassy (Amazon):** *Primitivas Conectadas y Arquitectura de APIs Abiertas*. La velocidad de innovación se multiplica exponencialmente cuando los equipos componen soluciones sobre primitivas y APIs existentes en lugar de duplicar esfuerzos de ingeniería innecesarios.
* **Satya Nadella (Microsoft):** *Interoperabilidad Global del Ecosistema*. La conectividad fluida entre servicios heterogéneos es el pilar de las aplicaciones modernas. Contar con un directorio estructurado acelera la capacidad de los agentes de conectar cualquier servicio externo.
