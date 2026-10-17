# 💬 Wechaty Conversational RPA MCP Registry Spec

> **Source:** [wechaty/wechaty](https://github.com/wechaty/wechaty)  
> **License:** Apache-2.0  
> **Domain:** Conversational RPA SDK for Chatbot Makers, Multi-Platform Instant Messaging Automation (WeChat, WhatsApp, Lark, Gitter, Teams), Room Management, Message Disinfection.

---

## 🎯 Visión Arquitectónica

Wechaty es el SDK de automatización de mensajería conversacional más maduro del ecosistema abierto. Permite a los agentes interactuar no solo con usuarios individuales sino con salas de chat grupales, administrando respuestas, eventos y flujos de trabajo de atención al cliente:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Conversational Agent          │
└──────────────────────────────┬──────────────────────────────┘
                               │ Puppet Gateway Protocol
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       Wechaty Core                          │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Room & Contact Mgr    │       │ Message Dispatcher    │  │
│  │ (Groups / Mentions)   │       │ (Text, Mini-Card, Doc)│  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Event Bus: OnMessage, OnRoomJoin, OnFriendship        │  │
│  │ Multi-Puppet Bridge: WhatsApp, WeChat, Lark, Slack    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `wechaty_send_message`
Envía un mensaje formateado (texto, tarjeta interactiva, imagen o documento PDF) a un contacto o sala:

```json
{
  "name": "wechaty_send_message",
  "description": "Sends a message to an authorized recipient (individual contact or group chat room) across connected instant messaging networks.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "recipient_id": { "type": "string", "description": "Contact ID or Room ID" },
      "message_content": { "type": "string" },
      "media_type": { "type": "string", "enum": ["text", "image", "document", "url_link"], "default": "text" },
      "media_url": { "type": "string" }
    },
    "required": ["recipient_id", "message_content"]
  }
}
```

### 2. `wechaty_room_broadcast`
Envía una circular, alerta médica o reporte contable a múltiples salas de trabajo de forma controlada:

```json
{
  "name": "wechaty_room_broadcast",
  "description": "Broadcasts a verified notice or document link to a list of designated group chat rooms with rate limiting to prevent spam flagging.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "room_ids": { "type": "array", "items": { "type": "string" } },
      "announcement_text": { "type": "string" },
      "delay_between_rooms_ms": { "type": "integer", "default": 1500 }
    },
    "required": ["room_ids", "announcement_text"]
  }
}
```

### 3. `wechaty_room_members_query`
Consulta la lista de participantes activos en una sala de trabajo para verificación de identidad y roles:

```json
{
  "name": "wechaty_room_members_query",
  "description": "Queries the member list, alias names, and permissions of a specified group chat room.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "room_id": { "type": "string" }
    },
    "required": ["room_id"]
  }
}
```

---

## 🔒 Directivas de Seguridad y Antispam

1. **Cumplimiento de Políticas de Mensajería:** Enfriamiento (*cooldown*) obligatorio entre envíos masivos para prevenir suspensiones de cuenta.
2. **Sanitización de Entradas:** Filtrado de caracteres especiales y scripts embebidos en respuestas automáticas.
3. **Control de Permisos de Sala:** Respuestas en grupos activadas únicamente ante menciones directas (`@bot`).
