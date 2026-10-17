---
name: claude-templates-davila
description: Configuration scaffolding and agent template ecosystem based on davila7/claude-code-templates. Implements production-ready presets, .clauderc environments, custom slash commands, specialized subagent system prompts, and tool permissions tailored to specific engineering stacks. Activate when bootstrapping new Claude Code projects, modularizing agent personas, creating reproducible team rules, or standardizing CLI agent workflows.
metadata:
  origin: Antigravity-Core
---

# 🧩 Claude Templates Davila Scaffolding Protocol

This skill establishes the **standardized agent environment scaffolding protocol** (Satya Nadella platform velocity / Bernard Arnault tooling craftsmanship) using the templates from davila7/claude-code-templates.

---

## 🎯 When to Use

* **Project Bootstrapping:** Setting up a brand-new project with hardened `.clauderc` settings, stack-specific coding rules, and slash command shortcuts.
* **Specialized Agent Scaffolding:** Equipping workspaces with pre-configured subagent personas (e.g. security reviewer, database optimizer, QA lead).
* **Cross-Team Configuration Sharing:** Exporting golden standard workspace configurations into reproducible templates for team-wide adoption.
* **CLI Hardening & Permissions:** Restricting shell tool invocations and whitelisting trusted commands per engineering stack.

---

## 🧭 The 4-Step Scaffolding Protocol

```
1. Stack Audit ──► 2. Template Resolution ──► 3. Dry-Run Injection ──► 4. Runtime Verification
```

### Step 1: Stack Audit
- Identify target stack (Next.js, Python, Go, Rust, Solidity) and dependencies.
- Inspect current workspace config for existing rules or `.clauderc` files to prevent overwriting.

### Step 2: Template Resolution
- Select optimal template profile matching language, framework, and organizational security tier.
- Review system prompts and tool whitelists in the template blueprint.

### Step 3: Dry-Run Injection
- Perform dry-run evaluation to preview modified or generated configuration files.
- Merge template rules with project-specific overrides.

### Step 4: Runtime Verification
- Validate syntax and schema compatibility against Claude Code CLI requirements.
- Verify custom slash commands and reviewer gates respond correctly.

---

## 🛡️ Operational Guardrails

- [ ] **No Destructive Overwrites:** Never overwrite user customizations in existing config files without explicit dry-run diffs.
- [ ] **Least-Privilege Tooling:** Ensure template configurations do not expose unrestricted arbitrary command execution unless explicitly gated.
- [ ] **Consistent Schema:** Adhere strictly to Anthropic's official Claude Code configuration schema.
