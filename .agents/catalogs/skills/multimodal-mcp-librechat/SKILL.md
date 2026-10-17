---
name: multimodal-mcp-librechat
description: Universal Multimodal User Experience and MCP Client orchestration based on LibreChat architecture. Manages multi-provider model routing, interactive visual code artifacts (React, HTML, Mermaid), agent preset configurations, and secure multi-user collaboration. Activate when building chat interfaces, configuring multi-model agent frontends, or integrating client-side MCP tool execution.
metadata:
  origin: Antigravity-Core
---

# 🖥️ Multimodal MCP LibreChat

This skill defines the **universal multi-model interface and interactive artifact standard** (Mustafa Suleyman empathetic UX / Sam Altman frontier scale / Andy Yen privacy by design) for providing responsive, tool-augmented AI workspaces.

---

## 🎯 When to Use

* **Unified AI Frontend:** Providing a single, centralized web chat interface for accessing multiple LLM backends (Claude 3.7, GPT-4o, DeepSeek-R1, Local Ollama).
* **Interactive Code & UI Artifacts:** Rendering interactive React dashboards, SVG graphics, financial tables, and Mermaid architecture diagrams directly beside the chat stream.
* **Client-Side MCP Tool Integration:** Connecting frontends to local or remote MCP servers for real-time filesystem, browser, and database interaction.
* **Agent Presets & Role Specialization:** Managing pre-configured system prompts, toolsets, and temperature parameters for specialized corporate roles.

---

## 🧭 The 4-Layer LibreChat Architecture

```
1. Client Presentation (React UI) ──► 2. Gateway Router ──► 3. MCP Tool Hub ──► 4. Execution Sandbox
```

### Layer 1: Client Presentation & Artifacts
- Render conversational turns with syntax highlighting and rich markdown.
- Detect code artifacts (HTML/React/Mermaid) and project them into an isolated sandbox viewer.

### Layer 2: Model Gateway & Provider Routing
- Route user queries to optimal model providers based on cost, speed, and reasoning requirements.
- Standardize token streaming, cancellation signals, and multi-turn message history.

### Layer 3: MCP Tool Hub & Discovery
- Discover available MCP servers and tools dynamically.
- Format tool schemas into the model's native function calling interface.
- Route tool call requests and parse responses cleanly into the context window.

### Layer 4: Enterprise Access Control & Encryption
- Enforce Role-Based Access Control (RBAC) across workspaces and presets.
- Secure API keys in encrypted vaults with zero server-side credential leaking.

---

## 🛡️ Experience & Security Verification

- [ ] **Artifact Sandbox Isolation:** All rendered HTML/JS executes within an `iframe` with `sandbox="allow-scripts"` to prevent parent window DOM access.
- [ ] **Zero Token Leakage:** Sensitive session tokens and user credentials never passed in LLM prompts.
- [ ] **Responsive Fluidity:** UI must remain fully responsive and non-blocking during heavy streaming and tool execution.
