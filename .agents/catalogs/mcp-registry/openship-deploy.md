# 🚢 Openship Self-Hosted Deployment & CI/CD MCP Registry Spec

> **Source:** [oblien/openship](https://github.com/oblien/openship)  
> **License:** Apache-2.0 / Open Source  
> **Domain:** Self-Hostable Application Deployment Platform, Built-in Git-Driven CI/CD, Automatic Reverse Proxy Routing & TLS Termination, Multi-Interface Management (CLI, Desktop, Web).

---

## 🎯 Visión Arquitectónica

Openship es una plataforma de despliegue auto-hospedada y alternativa abierta a servicios cerrados como Vercel o Render. Permite apuntar a un repositorio de Git, compilar la aplicación, generar contenedores o ejecutables, enrutar dominios con certificados SSL/TLS automáticos y supervisar la salud del servicio sin costos mensuales por despliegue:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / DevOps Specialist             │
└──────────────────────────────┬──────────────────────────────┘
                               │ Deployment API / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       Openship Platform                     │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Build & CI/CD Pipeline│       │ TLS Reverse Proxy     │  │
│  │ (Docker / Static web) │◄─────►│ (Auto Let's Encrypt)  │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Service Health Telemetry & Rollback Management        │  │
│  │ Self-Hosted Bare Metal / VPS Independence             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `openship_deploy_service`
Despliega un servicio o aplicación web desde un repositorio Git o directorio local:

```json
{
  "name": "openship_deploy_service",
  "description": "Triggers automated build, containerization, and TLS routing for a web service or static site.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "service_name": { "type": "string" },
      "repo_url": { "type": "string" },
      "domain_name": { "type": "string" },
      "env_vars": { "type": "object" },
      "build_command": { "type": "string" }
    },
    "required": ["service_name", "domain_name"]
  }
}
```

### 2. `openship_check_status`
Consulta métricas de disponibilidad, estado de certificados SSL y uso de memoria del despliegue:

```json
{
  "name": "openship_check_status",
  "description": "Returns health check results, TLS status, and container uptime metrics for a deployed service.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "service_name": { "type": "string" }
    },
    "required": ["service_name"]
  }
}
```

---

## 🏛️ Gobernanza e Infraestructura Frugal

1. **Soberanía y Frugalidad de Infraestructura (Andy Jassy / Warren Buffett):** Reducir dependencias de PaaS costosos de terceros alojando herramientas internas en servidores propios con cero sobrecosto por usuario.
2. **Seguridad y Cifrado Obligatorio (Nikesh Arora / Ken Xie):** Ningún servicio puede exponerse sin terminación TLS/SSL estricta y headers de seguridad HTTP reforzados.
