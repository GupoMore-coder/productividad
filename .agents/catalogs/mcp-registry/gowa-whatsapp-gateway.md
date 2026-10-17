# 📱 GOWA Sovereign WhatsApp Web & MCP Gateway Spec

> **Source:** [aldinokemal/go-whatsapp-web-multidevice](https://github.com/aldinokemal/go-whatsapp-web-multidevice)  
> **Author:** Aldino Kemal  
> **License:** MIT / Open Source  
> **Domain:** Sovereign WhatsApp Messaging Gateway, High-Throughput Go REST API (whatsmeow), Native Model Context Protocol (MCP) Server, Multi-Device QR Pairing, Real-Time Webhooks, Zero-Cost Enterprise Communication.

---

## 🎯 Visión Arquitectónica

**GOWA** (Go WhatsApp Web Multi-Device) proporciona un gateway soberano de mensajería para WhatsApp compilado en Go nativo utilizando la biblioteca `whatsmeow`. A diferencia de las soluciones dependientes de la API Cloud de Meta o servicios de pago por mensaje, GOWA opera como un microservicio auto-hospedado de bajo consumo de memoria que expone una API REST completa y un **servidor MCP nativo** directamente a los agentes de IA:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Agency Agents                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ Native MCP Tool Invocations
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               GOWA Core Engine (Golang + whatsmeow)         │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Multi-Device Session  │       │ Real-Time Webhook Bus │  │
│  │ Manager (QR Pairing)  ◄──────►│ (Inbound Event PubSub)│  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Native MCP Server & REST API Endpoints                │  │
│  │ Text, Media, Documents, Chatwoot CRM Bridge           │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ End-to-End Encrypted Wire
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 WhatsApp Network / Clients                  │
│         (Direct Multi-Device Protocol, Zero Transit Tax)    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `gowa_start_session`
Inicializa una nueva sesión de dispositivo WhatsApp generando un código QR en terminal o endpoint web para emparejamiento:

```json
{
  "name": "gowa_start_session",
  "description": "Initializes a WhatsApp multi-device session and returns the QR pairing code or connection status.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "session_id": { "type": "string", "description": "Unique identifier for this WhatsApp device profile." },
      "output_format": { "type": "string", "enum": ["qr_terminal", "qr_base64", "status"], "default": "status" }
    },
    "required": ["session_id"]
  }
}
```

### 2. `gowa_send_message`
Envía mensajes de texto, medios, ubicaciones o documentos a un número de teléfono o grupo de WhatsApp a través del gateway:

```json
{
  "name": "gowa_send_message",
  "description": "Sends a message (text, image, document) to a specified WhatsApp recipient phone number.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "session_id": { "type": "string" },
      "recipient_phone": { "type": "string", "description": "Phone number with international country code (e.g. 521XXXXXXXXXX)." },
      "message": { "type": "string" },
      "media_url": { "type": "string", "description": "Optional URL or local path to media attachment." }
    },
    "required": ["session_id", "recipient_phone", "message"]
  }
}
```

### 3. `gowa_inspect_webhooks`
Consulta el registro de eventos entrantes (mensajes recibidos, acuses de entrega, cambios de estado de conexión):

```json
{
  "name": "gowa_inspect_webhooks",
  "description": "Inspects incoming webhook message stream and connection telemetry.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "session_id": { "type": "string" },
      "limit": { "type": "integer", "default": 20 }
    },
    "required": ["session_id"]
  }
}
```

### 4. `gowa_manage_devices`
Lista, reconecta o revoca sesiones activas de WhatsApp emparejadas en el microservicio:

```json
{
  "name": "gowa_manage_devices",
  "description": "Lists active device sessions, verifies connection health, or disconnects obsolete profiles.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "action": { "type": "string", "enum": ["list", "status", "reconnect", "logout"] },
      "session_id": { "type": "string" }
    },
    "required": ["action"]
  }
}
```

---

## 🏛️ Doctrina del Consejo Asesor Global

* **Andy Jassy (Amazon):** *Primitivas Desacopladas de Alto Rendimiento*. Microservicios compilados en Go con bajo consumo de memoria representan la mejor arquitectura para flujos de mensajería masivos. Evitar la dependencia de intermediarios costosos optimiza los márgenes operativos de la empresa.
* **Carlos Slim (América Móvil):** *Alcance Omnicanal y Soberanía en Telecomunicaciones*. En América Latina, WhatsApp es la infraestructura de facto para negocios y clientes. Controlar el gateway de mensajería sin pagar peajes por mensaje preserva el valor económico directamente en el negocio.
