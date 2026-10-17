---
name: multimodal-realtime-openlive
description: Real-time multimodal voice and vision orchestration based on OpenLive architecture. Enables full-duplex conversational audio with continuous live screen capture, active window perception, and dynamic interruption handling. Functions as an open-source, local-first alternative to OpenAI Realtime and Gemini Live. Activate when building real-time pair-programming copilots, screen-aware voice assistants, or interactive visual troubleshooting loops.
metadata:
  origin: Antigravity-Core
---

# 👁️ Multimodal Realtime OpenLive

This skill defines the **real-time multimodal voice and visual perception standard** (Demis Hassabis unified cognitive perception / Mustafa Suleyman natural dialogue fluidity / George Kurtz endpoint privacy) for agents that perceive and converse with developers in real time.

---

## 🎯 When to Use

* **Interactive Pair-Programming:** Explaining complex code bases while watching the developer edit files live on screen.
* **Visual GUI Debugging:** Inspecting live frontend UI bugs, misalignment issues, or console logs in real time as they appear.
* **Voice-First Development Navigation:** Answering architecture questions, reviewing diffs, and suggesting refactors through spoken audio without typing.
* **Local Realtime Sovereignty:** Replacing proprietary real-time streaming APIs with a self-hosted, air-gapped speech and vision pipeline.

---

## 🧭 The 4-Layer Realtime Perception Loop

```
1. Frame & Audio Capture ──► 2. Stream Buffer & VAD ──► 3. Multimodal Reasoning ──► 4. Low-Latency Response
```

### Layer 1: Frame & Audio Capture
- Grab display frames at adaptive intervals (1-2 fps during typing, up to 5 fps during rapid motion).
- Capture microphone stream in raw 16kHz PCM chunks.

### Layer 2: Stream Buffer & Voice Activity Detection (VAD)
- Process audio through high-speed VAD (Silero) to differentiate human voice from keyboard clicks.
- Support *Barge-In*: If the user speaks while the assistant is producing voice, immediately silence current output.

### Layer 3: Multimodal Context Fusion
- Correlate what the user is pointing at or looking at with what they are saying ("Why is this button red?").
- Maintain rolling context buffer without saturating token limits.

### Layer 4: Low-Latency Speech Generation
- Stream response tokens directly to fast neural TTS.
- Maintain overall end-to-end latency below 800 ms.

---

## 🛡️ Screen Privacy & Guardrails

- [ ] **Credential Masking:** Never capture or transmit visible terminal screens displaying `.env` files or active secrets.
- [ ] **Scoped Window Capture:** Restrict capture to the IDE or browser window rather than entire multi-monitor setup whenever possible.
- [ ] **Explicit Streaming Indicator:** Clear visual indicator on screen showing when audio/video capture is active.
