# 🎙️ VoiceStudio Local Voice Cloning & Dubbing MCP Registry Spec

> **Source:** [debpalash/VoiceStudio](https://github.com/debpalash/VoiceStudio)  
> **License:** AGPL-3.0  
> **Domain:** Open-Source High-Fidelity Voice Cloning, Voice Design, Timed Video Dubbing, Speech Dictation, Audio Transcription across 646 Languages, Native Local HTTP API & Agent Model Context Protocol (MCP) Server.

---

## 🎯 Visión Arquitectónica

VoiceStudio es un estudio de audio y clonación de voz local-first que permite a los agentes de software sintetizar habla con timbres de voz personalizados, doblar piezas audiovisuales con sincronización métrica y transcribir grabaciones sin depender de APIs en la nube (como ElevenLabs o PlayHT). Opera mediante motores locales (OmniVoice, Kokoro, Whisper) y expone herramientas MCP directas:

```
┌─────────────────────────────────────────────────────────────┐
│                 Antigravity / Lead Specialist               │
└──────────────────────────────┬──────────────────────────────┘
                               │ Local Audio MCP Bridge
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     VoiceStudio Engine                      │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │ Voice Cloning & Design│       │ Timed Dubbing Engine  │  │
│  │ (Reference Audio Spec)│◄─────►│ (Lip-Sync & Subtitles)│  │
│  └───────────┬───────────┘       └───────────┬───────────┘  │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Speech Models: OmniVoice, Kokoro, Fast-Whisper        │  │
│  │ Multi-Lingual Matrix: 646 Supported Idioms & Dialects │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Especificación de Herramientas MCP

### 1. `voicestudio_clone_voice`
Registra un nuevo perfil vocal a partir de una muestra de audio de referencia limpia (3 a 10 segundos):

```json
{
  "name": "voicestudio_clone_voice",
  "description": "Registers a custom cloned voice profile from a local reference audio WAV/MP3 sample for high-fidelity speech synthesis.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "profile_name": { "type": "string", "description": "Unique identifier for the cloned voice." },
      "reference_audio_path": { "type": "string", "description": "Absolute path to clean voice audio sample." },
      "language_code": { "type": "string", "default": "es" }
    },
    "required": ["profile_name", "reference_audio_path"]
  }
}
```

### 2. `voicestudio_synthesize_speech`
Sintetiza texto en habla utilizando un perfil clonado o predefinido, guardando el archivo de audio localmente:

```json
{
  "name": "voicestudio_synthesize_speech",
  "description": "Generates natural speech audio from text using a designated voice profile with speed, pitch, and emotional cadence controls.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "text": { "type": "string", "description": "Text script to speak." },
      "voice_profile": { "type": "string", "default": "default" },
      "output_path": { "type": "string", "description": "Target destination WAV/MP3 path." },
      "speed": { "type": "number", "default": 1.0 },
      "language_code": { "type": "string", "default": "es" }
    },
    "required": ["text", "output_path"]
  }
}
```

### 3. `voicestudio_dub_media`
Genera un doblaje sincronizado en tiempo para un archivo de video o pista de audio existente:

```json
{
  "name": "voicestudio_dub_media",
  "description": "Takes a video or audio track, translates/transcribes the dialogue, and dubs it with timed synthesized speech in a target language.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "input_media_path": { "type": "string" },
      "target_language": { "type": "string", "default": "es" },
      "output_media_path": { "type": "string" }
    },
    "required": ["input_media_path", "output_media_path"]
  }
}
```

---

## 🏛️ Gobernanza y Ética Biométrica Vocal

1. **Privacidad de Biometría de Voz (Meredith Whittaker / Andy Yen):** Ningún vector o muestra de voz clonada puede salir del entorno local ni transmitirse a servidores externos no autorizados.
2. **Consentimiento Expreso (Bernard Arnault / Joe Ucuzoglu):** Toda clonación vocal para material institucional de More Paper o explicaciones clínicas ortopédicas debe contar con autorización expresa del titular de la voz.
