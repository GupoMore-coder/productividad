# 🤖 .agent Specification & Stateful Memory Architecture

> **Sources:** [letta-ai/letta](https://github.com/letta-ai/letta) | [cpacker/MemGPT](https://github.com/cpacker/MemGPT)
> **Domain:** Standardized agent serialization format (`.agent`), hierarchical multi-tier stateful memory (Core, Recall, Archival), and self-editing memory schemas.

---

## 🎯 Architectural Overview

The `.agent` file format and memory hierarchy allow conversational and specialist AI agents to retain long-term state, persona instructions, user profile constraints, and persistent tool attachments across sessions and model backends.

```
┌────────────────────────────────────────────────────────┐
│                   Context Window LLM                   │
│  ┌────────────────────────┐  ┌───────────────────────┐ │
│  │   Persona Core Block   │  │   Human Core Block    │ │
│  │ (Directives/Specialty) │  │ (Profile/Constraints) │ │
│  └───────────┬────────────┘  └───────────┬───────────┘ │
└──────────────┼───────────────────────────┼─────────────┘
               │ Dynamic Self-Editing Calls│
               ▼                           ▼
┌───────────────────────────┐  ┌─────────────────────────┐
│     Recall Memory         │  │     Archival Memory     │
│ (FIFO Chat History / DB)  │  │ (Vector Store Embeddings)│
└───────────────────────────┘  └─────────────────────────┘
```

### 1. Memory Tiers
1. **Core Memory (In-Context):**
   * `persona`: Static or dynamically updated agent behavior, ethics, and surgical/clinical directives.
   * `human`: Key facts, preferences, credentials, and constraints about the user/clinician.
   * *Operations:* `core_memory_append(name, content)`, `core_memory_replace(name, old_content, new_content)`.
2. **Recall Memory:** Complete chronological event logs and tool invocation records stored in local SQLite / Postgres.
3. **Archival Memory:** Unbounded vector database storing clinical cases, literature summaries, and historical diagnoses queried via semantic search (`archival_memory_search(query, page)`).

---

## 📄 Standard `.agent` JSON Schema

```json
{
  "$schema": "https://letta.ai/schemas/agent.json",
  "version": "1.0.0",
  "name": "orthopedic-surgical-planner",
  "description": "Stateful biomechanical and surgical planning agent",
  "system_prompt": "You are a specialized surgical planning assistant enforcing AO Foundation principles.",
  "memory": {
    "blocks": [
      {
        "name": "persona",
        "value": "Orthopedic surgery consultant specialized in pelvic ring fractures and 3D implant contouring.",
        "limit": 2000
      },
      {
        "name": "human",
        "value": "Attending Orthopedic Surgeon. Hospital: General Hospital. Pre-op DICOM workflow active.",
        "limit": 2000
      }
    ]
  },
  "tools": [
    "execute_blender_code",
    "calculate_creatinine_clearance",
    "opensim_run_inverse_dynamics"
  ],
  "llm_config": {
    "model": "gemini-2.5-pro",
    "context_window": 1000000,
    "temperature": 0.2
  }
}
```

---

## 🔒 Security & Privacy Enforcement
* **No PHI in Core Memory:** Personal Health Identifiers (Patient Names, MRNs) MUST NEVER be committed into persistent `.agent` files or Core Persona blocks.
* **Ephemeral Case Flushing:** Patient-specific parameters must remain in session scope and be expunged upon session termination.
