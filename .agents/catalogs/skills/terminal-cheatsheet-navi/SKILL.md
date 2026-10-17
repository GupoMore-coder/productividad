---
name: terminal-cheatsheet-navi
description: Interactive command-line cheatsheet authoring and execution based on Navi architecture. Formats complex shell commands (Git, Docker, Kubernetes, GCP CLI) into structured .cheat files with dynamic argument suggestions and fuzzy-finder auto-completion. Activate when documenting recurrent terminal procedures, automating multi-step CLI operations, or creating self-explanatory command cheatsheets.
metadata:
  origin: Antigravity-Core
---

# 🧭 Terminal Cheatsheet Navi

This skill defines the **interactive CLI cheatsheet and executable recipe standard** (Andy Jassy operational speed / George Kurtz command error prevention) for documenting and executing terminal workflows.

---

## 🎯 When to Use

* **Complex Multi-Step CLI Invocations:** Documenting difficult command flags for `docker run`, `gcloud`, `bq query`, or `kubectl port-forward`.
* **Dynamic Argument Auto-Suggestion:** Providing autocomplete lists for variables (e.g. suggesting current git branch names or container IDs).
* **Cross-Shell Knowledge Sharing:** Creating reusable `.cheat` files that work consistently across Bash, Zsh, and PowerShell.
* **Onboarding & SOP Automation:** Giving team members instant command execution without copy-pasting from outdated wikis.

---

## 🧭 The `.cheat` Recipe Structure

A standard Navi cheatsheet file follows this structure:

```markdown
% git, sync, branch

# Rebase current branch on main and push safely
git fetch origin main && git rebase origin/main && git push --force-with-lease origin <branch>

$ branch: git branch --show-current
```

### Key Elements:
1. `% tag1, tag2`: Categorizes the commands for fuzzy filtering.
2. `# Description`: Explains what the command does in plain human language.
3. `<command>`: The template command with placeholders enclosed in `<variable>`.
4. `$ variable: <script>`: Command that dynamically generates the options for the placeholder.

---

## 🛡️ Execution Safety Gates

- [ ] **Dangerous Flag Warnings:** Commands with destructive flags must include `# CAUTION:` warning tags.
- [ ] **Sanitized Variable Interpolation:** Ensure dynamic variable scripts cannot trigger unintended command injection.
