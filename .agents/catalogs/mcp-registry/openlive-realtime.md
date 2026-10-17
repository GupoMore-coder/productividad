# 👁️ OpenLive Realtime Multimodal Voice & Vision MCP Registry Spec

> **Source:** [katipally/openlive](https://github.com/katipally/openlive)  
> **License:** Apache-2.0  
> **Domain:** Open Realtime Voice and Vision Layer for AI Agents ("Ears, Mouth, and Eyes"), Local Screen & Webcam Frame Streaming, Low-Latency Realtime Audio Loop, Open-Source Alternative to ElevenLabs Agents, Gemini Live, and OpenAI Realtime API.

---

## 🎯 Visión Arquitectónica

OpenLive proporciona una capa unificada y abierta para que los agentes agénticos vean la pantalla del desarrollador y escuchen su voz en tiempo real con latencia inferior a un segundo, ejecutando el bucle conversacional en la máquina local sin intermediarios de pago ni filtración de datos de pantalla:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Specialist               │
└──────────────────────────────┬──────────────────────────────┘
                               │ Realtime WebSocket / MCP Stream
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      OpenLive Gateway                       │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Vision Streamer       │       │ Audio Full-Duplex     │  │
│  │ (Screen/Window/Camera)│◄─────►│ (Live VAD + STT/TTS)  │  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Local State Machine: Multimodal Event Loop & Context  │  │
│  │ Output: Interruption-Aware Realtime Audio Response    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `openlive_start_session`
Inicia una sesión interactiva multimodal continua conectando micrófono y captura de pantalla:

```json
{
  "name": "openlive_start_session",
  "description": "Initializes a real-time full-duplex multimodal session enabling continuous audio listening and live screen visual perception.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "capture_mode": { "type": "string", "enum": ["screen", "active_window", "audio_only"], "default": "active_window" },
      "frame_rate_fps": { "type": "number", "default": 1.0 },
      "model_endpoint": { "type": "string", "default": "local" }
    }
  }
}
```

### 2. `openlive_capture_viewport`
Captura un cuadro visual de alta definición del área de trabajo para resolver dudas visuales inmediatas:

```json
{
  "name": "openlive_capture_viewport",
  "description": "Captures a high-resolution snapshot of the user's active window or desktop monitor for instant visual grounding.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "region": { "type": "string", "enum": ["full_screen", "focused_window", "selection"], "default": "focused_window" }
    }
  }
}
```

### 3. `openlive_stop_session`
Detiene la sesión en vivo y libera dispositivos de captura de audio y video:

```json
{
  "name": "openlive_stop_session",
  "description": "Terminates the active real-time multimodal stream, safely releasing microphone and screen capture handles.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "session_id": { "type": "string" }
    }
  }
}
```

---

## 🏛️ Directivas de Seguridad Visual y Rendimiento

1. **Defensa de Pantalla y Privacidad (George Kurtz / Eva Chen):** La captura de pantalla debe enmascarar automáticamente regiones que contengan contraseñas, tokens de API o registros médicos protegidos (PHI).
2. **Percepción Multimodal desde Primeros Principios (Demis Hassabis):** Integrar visión y audio en una representación espacial coherente para asistir al usuario como un copiloto presencial.
