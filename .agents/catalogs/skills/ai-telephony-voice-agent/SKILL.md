---
name: ai-telephony-voice-agent
description: Autonomous AI Telephony, Voice Assistants, and Real-Time Speech Orchestration based on Tel-Agent and SIP/WebRTC architecture. Manages bidirectional audio streaming, Voice Activity Detection (VAD), barge-in handling, automated appointment hotlines, and conversational IVRs. Activate when building voice calling bots, configuring SIP telephony bridges, or automating phone customer service.
metadata:
  origin: Antigravity-Core
---

# 📞 AI Telephony Voice Agent

This skill defines the **real-time conversational voice and telephone automation standard** (Mustafa Suleyman empathetic voice UX / Meredith Whittaker audio privacy / Bernard Arnault brand elegance) for natural spoken interactions across telecom networks.

---

## 🎯 When to Use

* **Automated Voice Hotlines:** Handling inbound customer service inquiries, appointment scheduling, and order tracking over standard phone lines.
* **Outbound Voice Notifications:** Dispatching transactional voice reminders (payment confirmations, logistical delivery alerts, medical preparation notices).
* **SIP & WebRTC Bridges:** Integrating LLM speech pipelines with Asterisk PBX, FreeSWITCH, Twilio Voice, or browser-based WebRTC.
* **Low-Latency Conversational Audio:** Designing voice agents capable of natural interruptions (*barge-in*) with latency under 800 ms.

---

## 🧭 The 4-Stage Real-Time Telephony Loop

```
1. SIP Call Signaling ──► 2. Streaming VAD & STT ──► 3. LLM Dialog Turn ──► 4. Streaming TTS & Playback
```

### Stage 1: SIP Signaling & Session Setup
- Accept or dial call over SIP trunk or WebRTC gateway.
- Exchange SDP, negotiate G.711 / Opus audio codecs.
- Play initial disclosure and greeting.

### Stage 2: Streaming VAD & Speech-to-Text
- Monitor live PCM audio buffer using Silero VAD.
- Transcribe audio chunks in streaming mode using fast whisper or real-time speech API.
- Detect end-of-speech pauses with dynamic threshold (typically 400-600ms).

### Stage 3: Low-Latency Dialogue Decision
- Feed transcription tokens into streaming LLM.
- Implement *Barge-In*: If customer speaks while agent is playing audio, immediately cancel downstream TTS playback and flush buffer.
- Map customer requests to internal CRM or ERP actions.

### Stage 4: Streaming TTS & Audio Playback
- Stream generated text chunks to neural TTS engine (ElevenLabs, Cartesia, or OpenAI TTS).
- Convert incoming audio frames to SIP-compatible sample rate (8kHz or 16kHz) and stream to caller without buffering latency.

---

## 🛡️ Voice Compliance & Privacy Safeguards

- [ ] **Explicit AI Disclosure:** Every call must inform the human caller of automated AI assistance at the outset.
- [ ] **Opt-Out to Human Operator:** Provide clear DTMF key (e.g. press 0) or spoken path to transfer to human staff.
- [ ] **Audio Sanitization:** Redact credit card numbers, CVVs, and medical identifiers from recorded audio transcripts before storage.
