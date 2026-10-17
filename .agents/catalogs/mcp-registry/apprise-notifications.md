# 📲 Apprise Universal Push Notification Gateway MCP Registry Spec

> **Source:** [caronc/apprise](https://github.com/caronc/apprise)  
> **License:** BSD-2-Clause / MIT  
> **Domain:** Universal Push Notification Gateway & CLI, 80+ Supported Alert Services (Telegram, Slack, Discord, Microsoft Teams, WhatsApp, Pushover, SMS via Twilio, Email, Generic Webhooks), Normalized URL Schema Syntax (`tgram://`, `discord://`, `mailto://`), Stateless & Secure.

---

## 🎯 Visión Arquitectónica

Apprise es la biblioteca y estándar de facto para el despacho de alertas y notificaciones push hacia prácticamente cualquier servicio del mundo mediante una sintaxis unificada de URLs. Elimina la necesidad de programar clientes específicos para cada red social o webhook, permitiendo a los agentes enviar avisos de compilación, alertas de seguridad o reportes contables con un solo endpoint parametrizado:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Specialist               │
└──────────────────────────────┬──────────────────────────────┘
                               │ Notification Dispatch / MCP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       Apprise Engine                        │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ URL Schema Parser     │       │ Multi-Target Router   │  │
│  │ (tgram://, discord://)│◄─────►│ (80+ Native Services) │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Rate-Limit Management & Retry Logic                   │  │
│  │ Egress: Encrypted TLS Dispatch to Target Endpoints    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `apprise_notify`
Envía una notificación enriquecida (título, cuerpo, formato Markdown o HTML, nivel de alerta) a uno o múltiples destinos:

```json
{
  "name": "apprise_notify",
  "description": "Dispatches an alert notification to one or more endpoints using Apprise normalized service URLs (Telegram, Discord, Slack, SMS, Email, etc.).",
  "inputSchema": {
    "type": "object",
    "properties": {
      "urls": { "type": "array", "items": { "type": "string" }, "description": "List of Apprise service URLs (e.g. ['tgram://bot_token/chat_id', 'discord://webhook_id/webhook_token'])." },
      "title": { "type": "string" },
      "body": { "type": "string" },
      "notify_type": { "type": "string", "enum": ["info", "success", "warning", "failure"], "default": "info" },
      "body_format": { "type": "string", "enum": ["text", "markdown", "html"], "default": "markdown" }
    },
    "required": ["urls", "body"]
  }
}
```

### 2. `apprise_test_url`
Verifica la validez y conectividad de una URL de notificación sin emitir un mensaje de producción:

```json
{
  "name": "apprise_test_url",
  "description": "Tests syntax and connectivity for an Apprise target URL schema, confirming credentials and reachability.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "url": { "type": "string" }
    },
    "required": ["url"]
  }
}
```

---

## 🏛️ Directivas de Seguridad y Red

1. **Cero Exposición de Credenciales (Ken Xie / Jay Chaudhry):** Las URLs de Apprise que contienen tokens de bot (Telegram bot tokens, Slack webhooks) deben almacenarse en variables de entorno cifradas (`APPRISE_TARGET_URLS`) y jamás registrarse en texto plano en repositorios públicos.
2. **Resiliencia Operativa Frugal (Andy Jassy):** Reintentos exponenciales automáticos ante fallas transitorias de red para asegurar que alertas críticas de compilación o auditoría no se pierdan.
