---
name: local-agent-os-avibe
description: Local-first Agent Operating System architecture based on Avibe. Unifies multi-surface interaction (desktop Workbench and chat surfaces like Slack, Discord, Telegram, and WeChat) with a durable workflow harness for background execution, file watchers, and cross-session state persistence. Keeps API keys, code, and session memory strictly on the host machine. Activate when orchestrating local agent runtimes, deploying cross-surface bots, or configuring persistent background harnesses.
metadata:
  origin: Antigravity-Core
---

# 🤖 Local Agent OS Avibe

This skill defines the **local-first agent operating system standard** (Jay Chaudhry data sovereignty / Andy Jassy operational persistence / Mustafa Suleyman multi-surface natural interaction) for hosting autonomous agents on developer hardware.

---

## 🎯 When to Use

* **Cross-Surface Agent Access:** Interacting with local coding agents via mobile chat (Telegram, Slack, Discord) while working away from the keyboard.
* **Durable Background Workflows:** Running long-lived file watchers, test loops, or mailbox monitors that survive terminal window closures.
* **Air-Gapped & Sovereign Execution:** Ensuring codebases, credentials, and conversation transcripts never leave local hardware.
* **Unified CLI Harness:** Bridging Claude Code, Codex, and custom AI agents through a centralized local daemon.

---

## 🧭 The 4-Pillar Local Agent OS Lifecycle

```
1. Daemon Boot & State Recovery ──► 2. Surface Routing ──► 3. Durable Harness Exec ──► 4. Journaling & Shutdown
```

### Pillar 1: Daemon Boot & State Recovery
- Launch local runtime daemon and attach to local SQLite database.
- Recover in-flight tasks and verify connectivity to local filesystems.

### Pillar 2: Multi-Surface Routing
- Listen for inbound messages from registered surfaces (Slack bot, Telegram bot, local socket).
- Authenticate incoming sender against local user whitelist (`authorized_users`).
- Dispatch approved prompts to the active agent execution pipeline.

### Pillar 3: Durable Harness Execution
- Manage background daemon tasks (e.g. continuous test watchers, database synchronizers).
- Maintain monotonic execution counters and checkpoint state periodically.

### Pillar 4: Journaling & Clean State Management
- Log actions to append-only local journal.
- Enforce memory caps and rotate logs to prevent disk saturation.

---

## 🛡️ Security & Privacy Checklist

- [ ] **Strict Access Whitelist:** Only pre-approved user IDs can trigger commands via chat surfaces.
- [ ] **Local-Only Storage:** API tokens stored in OS-level credential managers (Windows Credential Manager / Mac Keychain).
- [ ] **Sandboxed Subshell:** Remote execution commands validated against injection attacks before running.
