# 🛡️ OneTerm Bastion MCP Registry & Zero-Trust Infrastructure Spec

> **Source:** [veops/oneterm](https://github.com/veops/oneterm)  
> **License:** Apache-2.0  
> **Domain:** Zero-Trust Infrastructure Gateway, Web Terminal, Multi-Protocol Bastion (SSH, RDP, Kubernetes, SQL/NoSQL Databases), Session Recording, Guardrail Filtering.

---

## 🎯 Visión Arquitectónica

OneTerm centraliza el acceso de agentes y desarrolladores a infraestructura distribuida (servidores Linux, clústeres Kubernetes, instancias Cloud SQL). Impone la doctrina de Ciberseguridad Zero Trust (Jay Chaudhry / Ken Xie standard): nunca confiar, siempre verificar, inspeccionar cada comando antes de su ejecución:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / SRE Agent                     │
└──────────────────────────────┬──────────────────────────────┘
                               │ Audited Terminal Tunnel
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   OneTerm Bastion Gateway                   │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Zero-Trust Auth       │       │ Command Filter        │  │
│  │ Ephemeral Credentials │       │ (Anti-Destructive)    │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Session Recorder: Replay logs, Audit Keystrokes       │  │
│  │ Protocol Adapters: SSH · Kube-API · RDP · MySQL/PG   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                               │ Microsegmented Egress
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Production Infrastructure Fleet                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `oneterm_exec_command`
Ejecuta un comando en un host o contenedor remoto pasando por el filtro de seguridad preventivo:

```json
{
  "name": "oneterm_exec_command",
  "description": "Executes an audited command on a target infrastructure node (SSH/Kubernetes) through the OneTerm Zero-Trust proxy, verifying compliance against blacklisted operations.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "target_node": { "type": "string", "description": "Hostname, IP, or Kubernetes Pod identifier" },
      "command": { "type": "string", "description": "Shell command line to execute" },
      "timeout_seconds": { "type": "integer", "default": 60 }
    },
    "required": ["target_node", "command"]
  }
}
```

### 2. `oneterm_inventory_list`
Lista los nodos, clusters y recursos de infraestructura autorizados para la sesión actual:

```json
{
  "name": "oneterm_inventory_list",
  "description": "Lists verified infrastructure targets available to the agent, including health status, environment tier (dev/staging/prod), and access protocols.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "environment": { "type": "string", "enum": ["development", "staging", "production", "all"], "default": "development" }
    }
  }
}
```

### 3. `oneterm_query_database`
Ejecuta consultas de solo lectura o migraciones planificadas sobre bases de datos corporativas con enmascaramiento de datos sensibles:

```json
{
  "name": "oneterm_query_database",
  "description": "Executes an audited SQL query against target PostgreSQL, MySQL, or ClickHouse instances with automatic PII masking.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "database_id": { "type": "string" },
      "sql_query": { "type": "string" },
      "read_only": { "type": "boolean", "default": true }
    },
    "required": ["database_id", "sql_query"]
  }
}
```

---

## 🔒 Filtros Preventivos y Compuertas de Seguridad

- **Comandos Prohibidos (Drop Inmediato):** `rm -rf /`, `mkfs`, `dd if=/dev/zero`, `DROP DATABASE`, `TRUNCATE TABLE` sin confirmación de doble factor.
- **Credenciales Efímeras:** Las sesiones SSH utilizan certificados temporales con validez no superior a 30 minutos.
- **Grabación Continua:** Toda pulsación de tecla y salida estándar se archiva para trazabilidad forense.
