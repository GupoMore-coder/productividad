---
name: voice-studio-cloning
description: High-fidelity voice cloning, voice design, timed video dubbing, and localized speech synthesis based on VoiceStudio architecture. Generates natural spoken audio across 646 languages using local neural engines (OmniVoice, Kokoro, Whisper) with local MCP server tool bindings. Activate when designing custom brand voices, creating voiceovers for training materials, dubbing instructional videos, or deploying privacy-preserving voice synthesis.
metadata:
  origin: Antigravity-Core
---

# 🎙️ Voice Studio Cloning & Synthesis

This skill defines the **local voice synthesis, cloning, and media dubbing standard** (Mustafa Suleyman conversational cadence / Meredith Whittaker biometric privacy / Bernard Arnault brand timbre) for generating spoken audio without recurring cloud API fees.

---

## 🎯 When to Use

* **Custom Brand Voice Creation:** Designing a dedicated, consistent voice personality for More Paper, More Design, or clinical medical education.
* **Instructional Video Dubbing:** Translating and dubbing surgical videos or corporate tutorials into multiple languages with timed alignment.
* **Privacy-Preserving Audio Generation:** Synthesizing speech for confidential internal documents without streaming data to cloud TTS providers.
* **Agent Speech Output:** Giving AI coding agents and automated workflows a clear, audible local voice via MCP.

---

## 🧭 The 4-Stage Voice Studio Pipeline

```
1. Sample Ingestion & Cleaning ──► 2. Embedding Extraction ──► 3. Cadence & Synthesis ──► 4. Output Normalization
```

### Stage 1: Sample Ingestion & Acoustic Cleaning
- Ingest high-SNR (Signal-to-Noise Ratio) audio snippet (5-10 seconds, 24kHz/48kHz WAV).
- Apply high-pass filter and noise gate to remove room reverberation and background hiss.

### Stage 2: Speaker Embedding Extraction
- Extract neural speaker embeddings capturing vocal tract resonance, pitch baseline, and formant distribution.
- Save profile descriptor locally in the secure agent audio vault.

### Stage 3: Cadence, Emotion & Synthesis
- Map text into phoneme sequences with proper stress and punctuation pauses.
- Adjust speaking rate (0.9x for dense medical concepts, 1.05x for rapid technical status updates).
- Generate audio waveform using local neural vocoder.

### Stage 4: Output Normalization & Delivery
- Normalize loudness to standard EBU R128 (-16 LUFS for podcasts/tutorials).
- Export in desired format (WAV for production, MP3/Opus for lightweight streaming).

---

## 🛡️ Voice Ethics & Compliance Gates

- [ ] **Authorized Voice Models Only:** Strictly forbidden to clone third-party voices without explicit written consent.
- [ ] **Watermarking & Disclosure:** Spoken materials generated for public release must declare AI-assisted synthesis.
- [ ] **Zero Cloud Egress:** All acoustic model weights and reference samples remain strictly local.
