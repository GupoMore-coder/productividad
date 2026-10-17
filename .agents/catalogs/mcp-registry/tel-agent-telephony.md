# 📞 Tel-Agent AI Telephony & Voice MCP Registry Spec

> **Source:** [Dpro-at/Tel-Agent](https://github.com/Dpro-at/Tel-Agent)  
> **License:** Apache-2.0 / Open Source  
> **Domain:** AI Phone Assistant, SIP / Asterisk / Twilio / FreeSWITCH / WebRTC Integration, Bidirectional Real-Time Audio Streaming, Speech-to-Speech Latency Optimization, Automated IVR, Voice Call Dispatch & Transcription.

---

## 🎯 Visión Arquitectónica

Tel-Agent es una solución de telefonía agéntica en tiempo real que conecta modelos de lenguaje grandes (LLMs) y sintetizadores de voz neurales directamente a redes telefónicas públicas (PSTN) y troncales SIP corporativas. Permite gestionar llamadas entrantes y salientes automatizadas para confirmación de citas médicas, atención a clientes de More Paper / More Design y notificaciones de cobranza o logística:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Voice Orchestrator            │
└──────────────────────────────┬──────────────────────────────┘
                               │ Audio Stream WebSocket / SIP
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Tel-Agent Gateway                      │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ SIP/WebRTC Bridge     │       │ Audio Pipeline (VAD)  │  │
│  │ (Twilio / Asterisk)   │◄─────►│ (Whisper STT / TTS)   │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Dialog State Machine & Interrupt Handling (Barge-In)  │  │
│  │ Call Recording & Sanitized Redaction Vault            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `telagent_initiate_call`
Realiza una llamada telefónica saliente hacia un número verificado con un guion agéntico e instrucciones contextuales:

```json
{
  "name": "telagent_initiate_call",
  "description": "Places an outbound phone call over a configured SIP/Twilio trunk to an authorized contact, attaching a system prompt and conversation goals.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "to_phone_number": { "type": "string", "description": "E.164 formatted telephone number (e.g. +573001234567)." },
      "caller_id": { "type": "string", "description": "Verified caller ID." },
      "voice_profile": { "type": "string", "default": "neutral_professional" },
      "system_prompt": { "type": "string", "description": "Agent dialogue instructions and objective." },
      "max_duration_seconds": { "type": "integer", "default": 300 }
    },
    "required": ["to_phone_number", "system_prompt"]
  }
}
```

### 2. `telagent_stream_audio_session`
Monitorea la telemetría y transcripción en vivo de una llamada en curso con soporte para detección de interrupciones (*barge-in*):

```json
{
  "name": "telagent_stream_audio_session",
  "description": "Streams real-time transcript turns and voice activity detection (VAD) events from an active telephone call session.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "call_sid": { "type": "string" },
      "enable_barge_in": { "type": "boolean", "default": true }
    },
    "required": ["call_sid"]
  }
}
```

### 3. `telagent_hangup_call`
Termina la conexión telefónica y genera el reporte forense final con resumen de conversación y métricas de audio:

```json
{
  "name": "telagent_hangup_call",
  "description": "Gracefully terminates a phone call session, returns the final audio duration, full transcription, and sentiment outcome.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "call_sid": { "type": "string" },
      "reason": { "type": "string", "enum": ["goal_completed", "user_requested", "timeout", "error"], "default": "goal_completed" }
    },
    "required": ["call_sid"]
  }
}
```

---

## 🏛️ Gobernanza y Privacidad Telefónica

1. **Privacidad de Voz y Consentimiento (Meredith Whittaker / Andy Yen):** Se debe notificar al usuario al inicio de la llamada que la sesión está siendo asistida por inteligencia artificial con fines de calidad y servicio.
2. **Latencia Ultra-Baja y Empatía (Mustafa Suleyman):** El tiempo de respuesta auditivo entre la pausa del usuario y la emisión de voz debe mantenerse por debajo de 800 ms mediante Voice Activity Detection (VAD) optimizado.
3. **Prestigio y Tono de Marca (Bernard Arnault):** El tono de voz sintetizado debe reflejar cortesía impecable, dicción pulcra y cero agresividad en recordatorios comerciales.
