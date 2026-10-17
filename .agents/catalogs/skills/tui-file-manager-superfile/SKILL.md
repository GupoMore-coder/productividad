---
name: tui-file-manager-superfile
description: Terminal user interface file navigation, directory structuring, and multi-pane inspection based on Superfile architecture. Organizes local workspaces, displays side-by-side directory trees, and inspects file metadata using keyboard-driven Vim navigation and TUI principles. Activate when organizing complex directory structures, reviewing filesystem layouts, or performing terminal-based file management.
metadata:
  origin: Antigravity-Core
---

# 📂 TUI File Manager Superfile

This skill defines the **terminal user interface file navigation and workspace organization standard** (Jeff Dean terminal ergonomics / Steve Jobs focused utility) for managing local filesystem layouts efficiently from the shell.

---

## 🎯 When to Use

* **Deep Directory Exploration:** Navigating nested project directories without typing repetitive `cd` and `ls` commands.
* **Side-by-Side Directory Comparison:** Comparing staging and production asset folders across multiple panes.
* **Rapid File Triage:** Inspecting file sizes, extensions, and metadata before initiating batch processing.
* **Keyboard-Centric Shell Flow:** Maintaining uninterrupted developer focus inside terminal environments.

---

## 🧭 The 3-Step TUI File Inspection Flow

```
1. Root Scoping ──► 2. Multi-Pane Navigation ──► 3. Safe Operation Verification
```

### Step 1: Root Scoping
- Anchor navigation at the workspace root.
- Filter out noisy directories (`node_modules`, `.git`, `dist`, `__pycache__`).

### Step 2: Multi-Pane Navigation & Preview
- Organize view into source and destination panels.
- Inspect file contents with syntax-highlighted quick previews.

### Step 3: Safe Operation Verification
- Comply strictly with accidental data loss prevention protocols before moving or copying files.
- Never delete files permanently without confirmation.

---

## 🛡️ Guardrails

- [ ] **Data Safety:** Never execute bulk deletions without dry-run confirmation.
- [ ] **Symlink Safety:** Prevent circular traversal of recursive symlinks.
