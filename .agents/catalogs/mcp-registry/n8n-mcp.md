# ⚡ n8n-MCP Server & Enterprise Workflow Automation

> **Source:** [czlonkowski/n8n-mcp](https://github.com/czlonkowski/n8n-mcp) | `npx -y n8n-mcp`  
> **Domain:** Enterprise Workflow Automation, 2,864 Node Schemas (Core & Community), Workflow Validation, Template Search (2,352 Templates), and Execution Orchestration.

---

## 🎯 Visión Arquitectónica

n8n-MCP actúa como el puente de alta fidelidad entre los modelos de lenguaje en Antigravity y la plataforma de automatización de flujos de trabajo n8n. Permite al agente diseñar, auditar, validar y ejecutar pipelines complejos sin memorizar manualmente miles de esquemas de nodos:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / LLM Client                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON-RPC (stdio / SSE)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    n8n-MCP Server                           │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Node Schema Engine    │       │ Workflow Validator    │  │
│  │ (2,864 n8n Nodes)     │       │ (Pre-execution check) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Template Library (2,352 Production Workflows)         │  │
│  └───────────────────────────┬───────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────┘
                               │ REST API / Webhooks (TLS + Zero Trust)
                               ▼
            [Instancia n8n Local o Cloud / Docker]
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `n8n_list_nodes`
Explora y busca nodos entre los 836 nodos core y 2,028 nodos de la comunidad:

```json
{
  "name": "n8n_list_nodes",
  "description": "Searches available n8n integration nodes by category, provider, or keyword.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Search keyword, e.g. 'whatsapp', 'postgres', 'shopify', 'stripe'" },
      "category": { "type": "string", "description": "Optional category filter" },
      "limit": { "type": "integer", "default": 10 }
    },
    "required": ["query"]
  }
}
```

### 2. `n8n_get_node_properties`
Obtiene las propiedades, operaciones y tipos de datos exactos requeridos por un nodo:

```json
{
  "name": "n8n_get_node_properties",
  "description": "Retrieves the exact JSON parameter schema and available operations for an n8n node.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "node_type": { "type": "string", "description": "Full node type name, e.g. 'n8n-nodes-base.httpRequest'" }
    },
    "required": ["node_type"]
  }
}
```

### 3. `n8n_validate_workflow`
Valida un archivo JSON de flujo de trabajo antes de guardarlo o ejecutarlo:

```json
{
  "name": "n8n_validate_workflow",
  "description": "Statically validates an n8n workflow structure, detecting broken connections, missing parameters, and type mismatches.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "workflow_json": { "type": "string", "description": "Serialized workflow JSON to audit" }
    },
    "required": ["workflow_json"]
  }
}
```

### 4. `n8n_search_templates`
Recupera plantillas de automatización comprobadas de la biblioteca comunitaria:

```json
{
  "name": "n8n_search_templates",
  "description": "Searches 2,352 ranked workflow automation templates for battle-tested implementation patterns.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "use_case": { "type": "string", "description": "Description of desired pipeline, e.g. 'sync shopify orders to crm'" }
    },
    "required": ["use_case"]
  }
}
```

---

## ⚡ Configuración On-Demand

Para activar este servidor en Antigravity bajo demanda, se añade a `mcp_config.json`:

```json
{
  "mcpServers": {
    "n8n": {
      "command": "npx",
      "args": ["-y", "n8n-mcp"],
      "env": {
        "N8N_API_URL": "http://localhost:5678",
        "N8N_API_KEY": "tu-n8n-api-key"
      }
    }
  }
}
```

*Soporte Zero Trust:* Si la instancia n8n está protegida con **Cloudflare Access**, se pueden proveer `N8N_CF_CLIENT_ID` y `N8N_CF_CLIENT_SECRET`.

---

## 🔒 Regla Inviolable de Seguridad Operativa

> **¡NUNCA EDITAR FLUJOS DE PRODUCCIÓN DIRECTAMENTE CON IA!**
> 1. Crear siempre un duplicado o rama de desarrollo del flujo.
> 2. Validar estáticamente con `n8n_validate_workflow` antes de guardar.
> 3. Mantener un respaldo en formato JSON exportado antes de cualquier actualización.
