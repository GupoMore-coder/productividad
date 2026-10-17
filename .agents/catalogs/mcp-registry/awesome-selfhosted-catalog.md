# 🌐 Awesome-Selfhosted Software Catalog & SaaS Migration MCP Registry Spec

> **Source:** [awesome-selfhosted/awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted)  
> **Maintainers:** Awesome-Selfhosted Community  
> **License:** CC-BY-SA-3.0 / Open Source  
> **Domain:** Self-Hosted Software Discovery, Open-Source SaaS Alternatives, Cloud Cost Reduction, Sovereign Infrastructure Architecture, Docker Compose Scaffolding, License & Maintenance Auditing.

---

## 🎯 Visión Arquitectónica

**Awesome-Selfhosted** es el compendio mundial de referencia para aplicaciones de software libre y código abierto que pueden alojarse en infraestructura propia. En la arquitectura de Antigravity, este catálogo se convierte en un motor activo de recomendación, auditoría de costos de suscripción y andamiaje de sustitución soberana:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Architect                │
└──────────────────────────────┬──────────────────────────────┘
                               │ SaaS Migration / Cost Optimization Request
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Awesome-Selfhosted Advisor Engine               │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ SaaS Alternative      │       │ License & Maintenance │  │
│  │ Taxonomy Matcher      ◄──────►│ Health Verifier       │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Production Docker Compose & Helm Scaffolder           │  │
│  │ Database, Reverse Proxy (Traefik/Caddy) & TLS Wiring  │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Sovereign Self-Hosted Deployment
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Enterprise Private Infrastructure             │
│            (Zero SaaS Rent, 100% Operational Margin)        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `selfhosted_find_saas_alternative`
Encuentra alternativas de código abierto auto-hospedadas para cualquier servicio SaaS comercial (e.g. Jira, Slack, Trello, Zapier, Retool, Google Analytics):

```json
{
  "name": "selfhosted_find_saas_alternative",
  "description": "Finds self-hosted, open-source alternatives to commercial SaaS products categorized by maturity, license, and stack.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "commercial_service": { "type": "string", "description": "Name of the proprietary SaaS to replace (e.g. Jira, Zapier, Notion)." },
      "category": { "type": "string", "enum": ["project_management", "automation", "communication", "analytics", "storage", "crm"] }
    },
    "required": ["commercial_service"]
  }
}
```

### 2. `selfhosted_inspect_license_stack`
Audita los requisitos de licencia (AGPL, MIT, Apache-2.0, BSL), dependencias de bases de datos y salud del mantenimiento del repositorio:

```json
{
  "name": "selfhosted_inspect_license_stack",
  "description": "Inspects license compatibility, active maintenance status, and backend database requirements for a self-hosted package.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "package_name": { "type": "string" }
    },
    "required": ["package_name"]
  }
}
```

### 3. `selfhosted_generate_compose_scaffold`
Genera un archivo `docker-compose.yml` de grado productivo con base de datos, volúmenes persistentes y proxy inverso TLS (Caddy/Traefik) pre-configurados:

```json
{
  "name": "selfhosted_generate_compose_scaffold",
  "description": "Generates production-ready Docker Compose configurations with persistent volumes, network isolation, and reverse proxy.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "package_name": { "type": "string" },
      "domain_name": { "type": "string" },
      "database_type": { "type": "string", "enum": ["postgres", "mysql", "sqlite", "internal"], "default": "postgres" },
      "reverse_proxy": { "type": "string", "enum": ["caddy", "traefik", "nginx"], "default": "caddy" }
    },
    "required": ["package_name", "domain_name"]
  }
}
```

### 4. `selfhosted_compare_architectures`
Compara el costo operativo y la complejidad de mantenimiento entre la solución SaaS propietaria y la alternativa auto-hospedada:

```json
{
  "name": "selfhosted_compare_architectures",
  "description": "Produces a Total Cost of Ownership (TCO) and operational risk comparison between SaaS and self-hosted options.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "saas_monthly_cost": { "type": "number" },
      "team_size": { "type": "integer" },
      "candidate_package": { "type": "string" }
    },
    "required": ["saas_monthly_cost", "team_size", "candidate_package"]
  }
}
```

---

## 🏛️ Doctrina del Consejo Asesor Global

* **Warren Buffett (Berkshire Hathaway):** *Eliminación de Costos Recurrentes Innecesarios*. El gasto recurrente en suscripciones SaaS comerciales corroe el margen neto de una empresa año tras año. Sustituir herramientas comerciales por software libre auto-hospedado maduro protege el capital operativo.
* **Satya Nadella (Microsoft):** *Flexibilidad y Portabilidad de Infraestructura*. La verdadera soberanía tecnológica reside en la capacidad de ejecutar cargas de trabajo donde la organización decida: on-premise, nubes privadas o servidores dedicados sin ataduras a un único proveedor.
