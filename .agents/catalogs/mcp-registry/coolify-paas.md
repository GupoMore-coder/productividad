# 🚀 Coolify Self-Hosted PaaS MCP Registry Spec

> **Source:** [coollabsio/coolify](https://github.com/coollabsio/coolify)  
> **License:** Apache-2.0 / Open Source  
> **Domain:** Self-Hosted Platform-as-a-Service (Heroku/Vercel/Netlify Alternative), Multi-Server SSH Fleet Management, Push-to-Deploy Git Workflows, Automated Let's Encrypt TLS/SSL, 280+ One-Click Applications & Databases, Docker/Nixpacks Build Engine, Scoped API Automation.

---

## 🎯 Visión Arquitectónica

Coolify transforma cualquier servidor Linux estándar (VPS, bare-metal o nube) en una plataforma PaaS autosuficiente y soberana. Permite a los equipos de desarrollo y agentes automatizados desplegar aplicaciones full-stack, gestionar flotas de servidores vía SSH y aprovisionar bases de datos con copias de seguridad automatizadas, sin tarifas recurrentes por usuario ni márgenes ocultos de computación en la nube:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / DevOps Lead                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ PaaS Deployment Request / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Coolify Core Control                    │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Multi-Server Manager  │       │ Nixpacks / Dockerfile │  │
│  │ (SSH / Traefik Proxy) │◄─────►│ Build Pipeline Engine │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Automated Let's Encrypt TLS / DNS Mapping             │  │
│  │ Managed DBs (Postgres, MySQL, Redis, MongoDB) + S3 BU │  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `coolify_deploy_application`
Dispara la compilación y despliegue de una aplicación desde un repositorio Git o Dockerfile:

```json
{
  "name": "coolify_deploy_application",
  "description": "Deploys a full-stack application to a Coolify-managed server with auto-configured reverse proxy and TLS.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "application_id": { "type": "string" },
      "git_branch": { "type": "string", "default": "main" },
      "commit_hash": { "type": "string" },
      "force_rebuild": { "type": "boolean", "default": false }
    },
    "required": ["application_id"]
  }
}
```

### 2. `coolify_provision_database`
Aprovisiona una base de datos gestionada con política de respaldo automático:

```json
{
  "name": "coolify_provision_database",
  "description": "Provisions a managed database container (PostgreSQL, MySQL, Redis, MongoDB) on target infrastructure.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "server_id": { "type": "string" },
      "db_type": { "type": "string", "enum": ["postgresql", "mysql", "redis", "mongodb", "mariadb", "clickhouse"] },
      "db_name": { "type": "string" },
      "backup_cron": { "type": "string", "default": "0 2 * * *" }
    },
    "required": ["server_id", "db_type", "db_name"]
  }
}
```

### 3. `coolify_inspect_server_health`
Inspecciona telemetría de servidores (CPU, RAM, estado de Traefik, certificados SSL):

```json
{
  "name": "coolify_inspect_server_health",
  "description": "Inspects CPU load, RAM allocation, Docker container statuses, and certificate health on a managed server.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "server_id": { "type": "string" }
    },
    "required": ["server_id"]
  }
}
```

### 4. `coolify_manage_environment_secrets`
Lee o actualiza variables de entorno cifradas para una aplicación:

```json
{
  "name": "coolify_manage_environment_secrets",
  "description": "Securely manages environment variables and secret tokens for target application deployments.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "application_id": { "type": "string" },
      "action": { "type": "string", "enum": ["set", "get_names", "delete"] },
      "key": { "type": "string" },
      "value": { "type": "string" },
      "is_build_time": { "type": "boolean", "default": false }
    },
    "required": ["application_id", "action"]
  }
}
```

---

## 🏛️ Disciplina Financiera y Soberanía (Jassy & Kurtz)

1. **Frugalidad Operativa Radical (Andy Jassy):** Reducir los gastos de desarrollo y hosting a costo puro de computación en VPS o metal propio, eliminando las tarifas infladas de las plataformas SaaS comerciales.
2. **Aislamiento Criptográfico de Secretos (George Kurtz):** Toda clave de entorno debe permanecer cifrada en reposo y rotarse de forma programática.
