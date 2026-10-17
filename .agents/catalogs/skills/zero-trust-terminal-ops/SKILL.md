---
name: zero-trust-terminal-ops
description: Secure, audited terminal operations and bastion access across remote servers, Kubernetes clusters, and cloud databases using Zero-Trust principles (OneTerm standard). Enforces pre-command safety filtering, prevents destructive shell execution, mandates ephemeral credentials, and archives keystroke session logs. Activate when connecting to remote servers, executing bastion shell commands, managing Kubernetes clusters, or running database queries.
metadata:
  origin: Antigravity-Core
---

# 🛡️ Zero-Trust Terminal Operations (OneTerm Bastion)

This skill defines the **Zero-Trust infrastructure operations protocol** (Jay Chaudhry / Ken Xie / George Kurtz cybersecurity standard). It guarantees that all agent and terminal interactions with servers, containers, and databases are strictly audited, non-destructive, and authenticated with short-lived tokens.

---

## 🎯 When to Use

* **Executing Shell Commands on Remote Hosts:** SSH tunnels, remote server management, and bastion jump-hosts.
* **Managing Kubernetes Clusters:** Running `kubectl` operations against staging or production pods.
* **Database Maintenance:** Executing monitored SQL queries or running schema migrations on cloud databases.
* **Pre-Execution Command Audits:** Filtering commands to catch destructive flags (`-rf`, `--force`, `DROP`, `TRUNCATE`) before shell dispatch.

---

## 🧭 The 4-Pillar Zero-Trust Terminal Flow

```
1. Policy & Syntax Validation ──► 2. Ephemeral Auth Binding ──► 3. Monitored Execution ──► 4. Forensic Log Archival
```

### Pillar 1: Pre-Execution Safety Inspection
Before running any shell command through a terminal tool or bastion:
- Cross-reference against the blacklist of prohibited patterns:
  - Destructive filesystem writes (`rm -rf /`, `mkfs`, overwrite redirects `> /etc/...`).
  - Dangerous database commands without `WHERE` clauses or transactions.
- If a command is flagged as high-risk, abort execution and report the risk to the user.

### Pillar 2: Ephemeral Auth Binding
- Never store permanent SSH private keys or root passwords in configuration files.
- Use short-lived certificates, SSH agent forwarding, or temporary session tokens with automatic TTL expiration.

### Pillar 3: Monitored Execution
- Run commands with explicit timeouts to prevent hung processes.
- Stream stdout/stderr through sanitized buffers that mask API keys, database passwords, and personal identity data (PII).

### Pillar 4: Forensic Log Archival
- Every executed command, exit code, timestamp, and target IP must be appended to the local audit ledger.

---

## 🛡️ Zero-Trust Security Gate

- [ ] **No Hardcoded Root Credentials:** Passwords or long-lived private keys strictly forbidden in scripts.
- [ ] **Pre-Command Filter Active:** High-risk shell commands blocked prior to shell invocation.
- [ ] **PII & Secret Masking:** Database query outputs scrubbed of sensitive customer identifiers and credentials.
